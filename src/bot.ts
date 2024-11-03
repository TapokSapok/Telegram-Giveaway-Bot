import 'dotenv/config';
import { Scenes, session, Telegraf } from 'telegraf';
import { prisma } from '.';
import { createGwScene } from './controllers/giveaway/scenes/create-giveaway';
import { userInfoMiddleware } from './middlewares/user-info';
import { getLocTitle } from './utils';

export const bot = new Telegraf(process.env.BOT_TOKEN as string);
// @ts-ignore
export const stage = new Scenes.Stage([createGwScene]);

bot.use(session());
// @ts-ignore
bot.use(stage.middleware());

bot.start(ctx => {
	ctx.reply(`menu`, {
		reply_markup: {
			inline_keyboard: [[{ text: 'Статистика', callback_data: 'statistics' }], [{ text: 'Управление', callback_data: 'choose_location' }]],
		},
	});
});

bot.action('menu', ctx => {
	ctx.reply(`menu`, {
		reply_markup: {
			inline_keyboard: [[{ text: 'Статистика', callback_data: 'statistics' }], [{ text: 'Управление', callback_data: 'choose_location' }]],
		},
	});
});

bot.on('my_chat_member', async ctx => {
	try {
		const chat = ctx.update.my_chat_member.chat as { id: number; title: string; username: string; type: 'channel' | 'group' | 'supergroup' | 'private' };
		const from = ctx.update.my_chat_member.from;

		console.log(ctx.update.my_chat_member);

		if (!from || from.is_bot) return;

		if (ctx.update.my_chat_member.new_chat_member.status === 'kicked') {
			const location = await prisma.giveawayLocation.delete({ where: { id: chat.id } });

			bot.telegram.sendMessage(location.userId, `✅ ${getLocTitle(location.type)} «${location.title}» успешно убран!`);
		} else {
			let location = await prisma.giveawayLocation.findUnique({ where: { id: chat.id } });
			if (!location) {
				location = await prisma.giveawayLocation.create({ data: { id: chat.id, type: chat.type, title: chat.title, userId: from.id } });
			}
			bot.telegram.sendMessage(from.id, `✅ ${getLocTitle(location.type)} «${location.title}» успешно добавлен!`);
		}
	} catch (error) {
		console.error(error);
	}
});

bot.use(userInfoMiddleware);

async function main() {
	await import('./controllers/giveaway/actions');
	await import('./controllers/location/actions');
	bot.launch();
}

console.log('start');
main();
