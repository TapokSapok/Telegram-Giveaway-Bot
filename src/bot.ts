import 'dotenv/config';

import moment from 'moment';
import { Scenes, session, Telegraf } from 'telegraf';
import { prisma } from '.';
import { BACK_TEXT, TZ } from './config';
import { admChooseWinnerScene } from './controllers/admin/scenes/choose-winner';
import { RESULTS_TEXT, updatePublicMessage } from './controllers/giveaway/helpers';
import { changeGwScene } from './controllers/giveaway/scenes/change-gw';
import { createGwScene } from './controllers/giveaway/scenes/create-gw';
import { deleteGwScene } from './controllers/giveaway/scenes/delete-gw';
import { solveCaptchaScene } from './controllers/giveaway/scenes/solve-captcha';
import { deleteLocScene } from './controllers/location/scenes/delete-loc';
import { userInfoMiddleware } from './middlewares/user-info';
import { getLocTitle, pause, sendMenu } from './utils';

export const bot = new Telegraf(process.env.BOT_TOKEN as string);
export const infoBot = bot.telegram.getMe().then(r => r);
// @ts-ignore
export const stage = new Scenes.Stage([createGwScene, solveCaptchaScene, changeGwScene, deleteGwScene, deleteLocScene, admChooseWinnerScene]);

bot.use(session());
// @ts-ignore
bot.use(stage.middleware());
bot.use(userInfoMiddleware);

bot.start(async ctx => {
	try {
		const gwId = parseInt(ctx.payload);
		if (!gwId) return sendMenu(ctx, true);
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId } });
		if (!gw) return sendMenu(ctx, true);

		let participant = await prisma.userParticipant.findFirst({
			where: {
				giveawayId: gwId,
				userId: Number(ctx.session?.user.id),
			},
		});

		if (participant) return ctx.reply('🚫 Ты уже участвуешь в этом конкурсе');

		if (gw.botsProtection) {
			// ctx.scene.enter(SCENES.SOLVE_CAPTCHA);
			console.log('капча еще не ворк');
		} else {
			// play = await prisma.giveawayPlay.create({ data: { giveawayId: gwId, userId: ctx.session?.user.id! } });
			// ctx.reply('✅ Теперь ты участвуешь в этом конкурсе!');
		}

		participant = await prisma.userParticipant.create({ data: { giveawayId: gwId, userId: Number(ctx.session?.user.id!) } });
		ctx.reply('✅ Теперь ты участвуешь в этом конкурсе!');
	} catch (error) {
		console.error(error);
		sendMenu(ctx, true);
	}
});

bot.action('menu', ctx => {
	sendMenu(ctx);
});

bot.on('my_chat_member', async ctx => {
	try {
		const chat = ctx.update.my_chat_member.chat as { id: number; title: string; username: string; type: 'channel' | 'group' | 'supergroup' | 'private' };
		const from = ctx.update.my_chat_member.from;

		console.log(ctx.update.my_chat_member);

		if (!from || from.is_bot) return;

		const status = ['kicked', 'left'];

		if (status.includes(ctx.update.my_chat_member.new_chat_member.status)) {
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
					const rDate = new Date(moment(gw.resultsAt).tz(TZ).toDate());
					const cDate = new Date(moment(gw.createdAt).tz(TZ).toDate());

					console.log(rDate, cDate);
					if (rDate >= cDate) {
						console.log('GAME');
						let winners = await prisma.userParticipant.findMany({
							where: {
								isWinner: true,
								giveawayId: gw.id,
							},
							include: { user: true },
						});

						if (winners.length < gw.winnerCount) {
							const otherParticipants = await prisma.userParticipant.findMany({
								take: gw?.winnerCount - winners.length,
								where: { giveawayId: gw.id, isWinner: false },
								include: { user: true },
							});

							for (const p of otherParticipants) {
								await prisma.userParticipant.update({ where: { id: p.id }, data: { isWinner: true } }).catch(er => console.log(er));
							}

							winners = [...otherParticipants, ...winners];
						}

						await prisma.giveaway.update({ where: { id: gw.id }, data: { resultsIsSummarized: true } });

						updatePublicMessage(gw.id);

						const msg = await bot.telegram.sendMessage(String(gw.creatorId), 'Автоматические итоги\n\n' + RESULTS_TEXT(gw, winners), {
							reply_markup: {
								inline_keyboard: [
									[
										{ text: '🔄 Реролл', callback_data: `reroll_gw:${gw.id}` },
										{ text: '❇️ Завершить', callback_data: `finish_gw:${gw.id}` },
									],
									[{ text: BACK_TEXT, callback_data: `show_gw:${gw.id}` }],
								],
							},
							parse_mode: 'HTML',
							link_preview_options: { is_disabled: true },
						});
						console.log(msg);
					} else {
						console.log(rDate >= cDate);
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
			const agw = await prisma.giveaway.findMany({ where: { active: true } });
			for (const gw of agw) {
				await updatePublicMessage(gw.id);
			}

			await pause(10000);
		} catch (error) {}
	}
}

console.log('start');
main();
