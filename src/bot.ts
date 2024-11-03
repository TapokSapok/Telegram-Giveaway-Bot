import 'dotenv/config';
import { Scenes, session, Telegraf } from 'telegraf';
import { prisma } from '.';
import { SCENES } from './config';
import { changeGwScene } from './controllers/giveaway/scenes/change-gw';
import { createGwScene } from './controllers/giveaway/scenes/create-giveaway';
import { solveCaptchaScene } from './controllers/giveaway/scenes/solve-captcha';
import { userInfoMiddleware } from './middlewares/user-info';
import { getLocTitle, sendMenu } from './utils';

export const bot = new Telegraf(process.env.BOT_TOKEN as string);
export const infoBot = bot.telegram.getMe().then(r => r);
// @ts-ignore
export const stage = new Scenes.Stage([createGwScene, solveCaptchaScene, changeGwScene]);

bot.use(session());
// @ts-ignore
bot.use(stage.middleware());
bot.use(userInfoMiddleware);

bot.start(async ctx => {
	try {
		const gwId = parseInt(ctx.payload);
		if (!gwId) return sendMenu(ctx);
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId } });
		if (!gw) return sendMenu(ctx);

		let play = await prisma.giveawayPlay.findUnique({
			where: {
				giveawayId: gwId,
				userId: ctx.session?.user.id,
			},
		});

		if (play) return ctx.answerCbQuery('🚫 Ты уже участвуешь в этом конкурсе');

		if (gw.botsProtection) {
			ctx.scene.enter(SCENES.SOLVE_CAPTCHA);
		} else {
			play = await prisma.giveawayPlay.create({ data: { giveawayId: gwId, userId: ctx.session?.user.id! } });
			ctx.reply('✅ Теперь ты участвуешь в этом конкурсе!');
		}
	} catch (error) {
		console.error(error);
		sendMenu(ctx);
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

		if (ctx.update.my_chat_member.new_chat_member.status === 'kicked') {
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
	await import('./controllers/giveaway/actions');
	await import('./controllers/location/actions');
	bot.launch();
}

console.log('start');
main();
