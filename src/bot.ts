import 'dotenv/config';

import moment from 'moment';
import { Scenes, session, Telegraf } from 'telegraf';
import { prisma } from '.';
import { BACK_TEXT, SCENES, TZ } from './config';
import { admMenuAction } from './controllers/admin/actions';
import { admChooseWinnerScene } from './controllers/admin/scenes/choose-winner';
import { admMailingScene } from './controllers/admin/scenes/mailing';
import { RESULTS_TEXT, updatePublicMessage } from './controllers/giveaway/helpers';
import { addSubscriptionScene } from './controllers/giveaway/scenes/add-subscription';
import { changeGwScene } from './controllers/giveaway/scenes/change-gw';
import { createGwScene } from './controllers/giveaway/scenes/create-gw';
import { deleteGwScene } from './controllers/giveaway/scenes/delete-gw';
import { solveCaptchaScene } from './controllers/giveaway/scenes/solve-captcha';
import { chooseLocationAction } from './controllers/location/actions';
import { deleteLocScene } from './controllers/location/scenes/delete-loc';
import { userInfoMiddleware } from './middlewares/user-info';
import { getIsAdmin, getLocTitle, pause, sendMenu, setWinners } from './utils';

export const bot = new Telegraf(process.env.BOT_TOKEN as string);

bot.telegram.setMyCommands([
	{ command: '/menu', description: 'Меню' },
	{ command: '/chats', description: 'Показать доступные чаты' },
]);

export let bInfo = null;
export const infoBot = bInfo ?? bot.telegram.getMe().then(r => r);

export const stage = new Scenes.Stage([
	// @ts-ignore
	createGwScene, // @ts-ignore
	solveCaptchaScene, // @ts-ignore
	changeGwScene, // @ts-ignore
	deleteGwScene, // @ts-ignore
	deleteLocScene, // @ts-ignore
	admChooseWinnerScene, // @ts-ignore
	admMailingScene, // @ts-ignore
	addSubscriptionScene, // @ts-ignore
]);

bot.use(session());
// @ts-ignore
bot.use(stage.middleware());
bot.use(userInfoMiddleware);

bot.start(async ctx => {
	try {
		const gwId = parseInt(ctx.payload);
		if (!gwId) return sendMenu(ctx, true);
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true } });
		if (!gw) return sendMenu(ctx, true);

		let participant = await prisma.userParticipant.findFirst({
			where: {
				giveawayId: gwId,
				userId: Number(ctx.session?.user.id),
			},
		});

		if (participant) return ctx.reply('🚫 Ты уже участвуешь в этом конкурсе');

		for (const chatId of gw.subscribeLocationIds) {
			try {
				const member = await ctx.telegram.getChatMember(Number(chatId), ctx.from.id);
				if (!['member', 'administrator', 'creator'].includes(member.status)) {
					return await ctx.reply('🚫 Вы не выполнили всех условий.');
				}
			} catch (error) {}
		}

		if (gw.botsProtection) {
			ctx.scene.enter(SCENES.SOLVE_CAPTCHA, { gwId });
			// console.log('капча еще не ворк');
		} else {
			participant = await prisma.userParticipant.create({ data: { giveawayId: gwId, userId: Number(ctx.session?.user.id!) } });
			ctx.reply(`✅ Теперь ты участвуешь в <b><a href="http://t.me/${gw?.location?.name}/${gw.messageId}">этом</a></b> конкурсе!`, {
				parse_mode: 'HTML',
				link_preview_options: { is_disabled: true },
			});
		}
	} catch (error) {
		console.error(error);
		sendMenu(ctx, true);
	}
});

bot.action('menu', ctx => {
	sendMenu(ctx, false);
});

bot.on('my_chat_member', async ctx => {
	try {
		const chat = ctx.update.my_chat_member.chat as { id: number; title: string; username: string; type: 'channel' | 'group' | 'supergroup' | 'private' };
		const from = ctx.update.my_chat_member.from;

		const status = ctx.update.my_chat_member.new_chat_member.status;

		if (chat.type === 'supergroup') return;

		if (!from.is_bot && chat.type === 'private') {
			if (status !== 'member') {
				await prisma.user.update({ where: { id: chat.id }, data: { botIsBlocked: true } }).catch(() => {});
			} else {
				await prisma.user.update({ where: { id: chat.id }, data: { botIsBlocked: false } }).catch(() => {});
			}
			return;
		}

		if (!from || from.is_bot) return;

		const statuses = ['kicked', 'left'];

		if (statuses.includes(status)) {
			const location = await prisma.giveawayLocation.delete({ where: { id: chat.id } });

			bot.telegram.sendMessage(String(location.userId), `✅ ${getLocTitle(location.type)} «${location.title}» успешно убран!`);
		} else {
			let location = await prisma.giveawayLocation.findUnique({ where: { id: chat.id } });
			if (!location) {
				location = await prisma.giveawayLocation.create({ data: { id: chat.id, type: chat.type, title: chat.title, userId: from.id, name: chat.username } });
			}
			bot.telegram.sendMessage(from.id, `✅ ${getLocTitle(location.type)} «${location.title}» успешно добавлен!`);
		}
	} catch (error) {
		console.error(error);
	}
});

bot.command('menu', ctx => sendMenu(ctx, true));
bot.command('chats', ctx => chooseLocationAction(ctx, true));
bot.command('adm', ctx => (getIsAdmin(ctx?.from?.id) ? admMenuAction(ctx, true) : undefined));

async function main() {
	await import('./controllers/giveaway/index');
	await import('./controllers/location/index');
	await import('./controllers/admin/index');
	bot.launch();

	updateMessages();
	winGw();
}

async function winGw() {
	while (true) {
		try {
			const agw = await prisma.giveaway.findMany({ where: { resultsIsSummarized: false, active: true }, include: { _count: { select: { participants: true } } } });
			for (let gw of agw) {
				try {
					if (!gw.resultsAt) continue;
					const rDate = moment(gw.resultsAt).tz(TZ).valueOf();
					const cTime = moment().tz(TZ).valueOf();

					if (cTime >= rDate) {
						const winners = await setWinners(gw);

						await prisma.giveaway.update({ where: { id: gw.id }, data: { resultsIsSummarized: true } });

						updatePublicMessage(gw.id);

						const msg = await bot.telegram.sendMessage(String(gw.creatorId), 'Автоматические итоги\n\n' + RESULTS_TEXT(gw, winners), {
							reply_markup: {
								inline_keyboard: [
									[
										// { text: '🔄 Реролл', callback_data: `reroll_gw:${gw.id}` },
										{ text: '❇️ Завершить', callback_data: `finish_gw:${gw.id}` },
									],
									[{ text: BACK_TEXT, callback_data: `show_gw:${gw.id}` }],
								],
							},
							parse_mode: 'HTML',
							link_preview_options: { is_disabled: true },
						});
					}
				} catch (error) {
					console.log(error);
				}
			}

			await pause(5000);
		} catch (error) {}
	}
}

async function updateMessages() {
	while (true) {
		try {
			const agw = await prisma.giveaway.findMany({ where: { active: true, resultsIsSummarized: false } });
			for (const gw of agw) {
				await updatePublicMessage(gw.id);
				await pause(1000);
			}

			await pause(10000);
		} catch (error) {}
	}
}

console.log('start');
main();
