import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { SCENES } from '../../../config';
import { errorReply } from '../../../utils';
import { editGwAction, subscriptionGwAction } from '../actions';

export const addSubscriptionScene = new Scenes.WizardScene(
	SCENES.ADD_SUBSCRIPTION,
	//@ts-ignore
	async ctx => {
		try {
			ctx.editMessageText('Чтобы добавить канал для проверки подписки, отправьте айди канала.\n\n<code>Бот должен быть администратором!</code>', {
				parse_mode: 'HTML',
				reply_markup: { inline_keyboard: [[{ text: 'Отмена', callback_data: 'cancel' }]] },
			});

			return ctx.wizard.next();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	},
	async ctx => {
		try {
			const value = parseInt(ctx?.text! ?? '');
			if (!value)
				return ctx.reply('🚫 Неверный формат', {
					reply_markup: { inline_keyboard: [[{ text: 'Отмена', callback_data: 'cancel' }]] },
				});

			const location = await prisma.giveawayLocation.findUnique({ where: { id: value } });
			if (!location)
				return ctx.reply('🚫 Такой канал не найден, попробуйте добавить бота как админа', {
					reply_markup: { inline_keyboard: [[{ text: 'Отмена', callback_data: 'cancel' }]] },
				});

			const gwId = Number(ctx.scene.state.args[1]);
			let gw = await prisma.giveaway.findUnique({ where: { id: gwId } });
			if (!gw)
				return ctx.reply('🚫 Розыгрыш не найден', {
					reply_markup: { inline_keyboard: [[{ text: 'Отмена', callback_data: 'cancel' }]] },
				});
			gw = await prisma.giveaway.update({ where: { id: gwId }, data: { subscribeLocationIds: [...gw.subscribeLocationIds, value as any] } });

			ctx.scene.leave();
			await ctx.reply('✅ Канал успешно добавлен!');
			subscriptionGwAction(ctx, gwId, true);
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	}
);

// addSubscriptionScene.action(/^add/, ctx => {
// 	try {
// 	} catch (error) {
// 		console.error(error);
// 	}
// });

addSubscriptionScene.action(/^cancel/, async ctx => {
	ctx.scene.leave();
	ctx.answerCbQuery();
	//@ts-ignore
	editGwAction(ctx, Number(ctx.scene.session.state.args[1]), true);
});
