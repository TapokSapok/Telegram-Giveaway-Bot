import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { bot } from '../../../bot';
import { SCENES } from '../../../config';
import { errorReply } from '../../../utils';
import { admMenuAction } from '../actions';

export const admMailingScene = new Scenes.WizardScene(
	SCENES.MAILING,
	//@ts-ignore
	async ctx => {
		try {
			ctx.answerCbQuery();
			await ctx.reply('✏️ Напиши сообщение, которое будет отправлено всем пользователям бота.', cancelButton());
			return ctx.wizard.next();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	},
	async ctx => {
		try {
			//@ts-ignore
			if (!ctx.update?.message && !ctx.text) return errorReply(ctx);
			//@ts-ignore
			const photo = ctx.update?.message?.photo;
			//@ts-ignore
			const text = ctx.update.message.caption ?? ctx.text;
			//@ts-ignore
			const animation = ctx.update.message.animation;

			if (!photo && !text && !animation) return ctx.reply('ты ничего не отправил');

			const users = await prisma.user.findMany({ where: { botIsBlocked: false }, select: { id: true } });

			let sentCount = 0;
			let errCount = 0;
			let finalCount = 0;

			users.forEach(async ({ id }) => {
				try {
					if (animation) {
						await bot.telegram.sendAnimation(Number(id), animation.file_id, { caption: text, parse_mode: 'HTML' });
					} else if (photo) {
						await bot.telegram.sendPhoto(Number(id), photo[photo.length - 1].file_id, { caption: text, parse_mode: 'HTML' });
					} else {
						await bot.telegram.sendMessage(Number(id), ctx.text as string, { parse_mode: 'HTML' });
					}
					sentCount++;
				} catch (error) {
					errCount++;
				}
				finalCount++;
			});

			const msg = await ctx.reply(sendText(users, sentCount, errCount, ctx.text), { parse_mode: 'HTML' });

			ctx.scene.leave().catch(() => {});

			const interval = setInterval(() => {
				if (finalCount >= users.length) {
					clearInterval(interval);
					console.log('clear');
					bot.telegram
						.editMessageText(msg.chat.id, msg.message_id, undefined, sendText(users, sentCount, errCount, ctx.text!), {
							parse_mode: 'HTML',
							reply_markup: { inline_keyboard: [[{ text: 'В меню', callback_data: 'adm_menu' }]] },
						})
						.catch(() => {});
				} else {
					bot.telegram.editMessageText(msg.chat.id, msg.message_id, undefined, sendText(users, sentCount, errCount, ctx.text!), { parse_mode: 'HTML' }).catch(() => {});
				}
			}, 1500);
		} catch (error) {
			console.error(error);
		}
	}
);

admMailingScene.action(/^cancel/, async ctx => {
	ctx.answerCbQuery().catch(() => {});
	ctx.scene.leave();
	admMenuAction(ctx);
});

function sendText(users: { id: bigint }[], sentCount: number, errCount: number, text?: string) {
	return `${text ? text + `\n\n➖➖➖➖\n\n` : ''}⌛️ Отправка сообщений <code>${sentCount}</code>/<code>${users.length}</code>\n🚫 Ошибок: ${errCount}`;
}

function cancelButton() {
	return {
		reply_markup: { inline_keyboard: [[{ text: 'Отмена', callback_data: 'cancel' }]] },
	};
}
