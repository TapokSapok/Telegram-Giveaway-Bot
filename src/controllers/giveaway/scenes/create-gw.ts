import { Giveaway } from '@prisma/client';
import moment from 'moment';
import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { SCENES, TZ } from '../../../config';
import { errorReply } from '../../../utils';
import { showGwAction } from '../actions';

export const createGwScene = new Scenes.WizardScene(
	SCENES.CREATE_GW,
	//@ts-ignore
	async ctx => {
		try {
			ctx.reply('🖊 Отправьте сообщение, которое будет опубликовано как розыгрыш, можно прилагать: фото, видео, GIF с текстом или без');

			//@ts-ignore
			ctx.scene.state.locId = ctx.scene.session.state.locId as number;

			return ctx.wizard.next();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	},
	async ctx => {
		try {
			//@ts-ignore
			ctx.scene.state.gw = {
				messageText: ctx.text,
				creatorId: ctx.session!.user!.id,
				locationId: ctx.scene.state.locId,
			} as Giveaway;

			ctx.reply('🎖 Напиши количество победителей.\n👉 Максимум: 100');
			return ctx.wizard.next();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	},
	async ctx => {
		try {
			const winnerCount = parseInt(ctx.text!);
			if (!winnerCount || winnerCount > 100) return ctx.reply('❌ Неверный формат.');

			ctx.scene.state.gw.winnerCount = winnerCount;

			const gw = await prisma.giveaway.create({ data: { ...ctx.scene.state.gw, createdAt: moment(new Date()).tz(TZ).toDate() } });

			// ctx.reply('Розыгрыш создан', { reply_markup: { inline_keyboard: [[{ text: 'Продолжить', callback_data: `edit_gw:${gw.id}` }]] } });

			showGwAction(ctx, [null, gw.id], true);

			return ctx.scene.leave();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	}
);