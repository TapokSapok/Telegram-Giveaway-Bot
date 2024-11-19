import { Giveaway } from '@prisma/client';
import moment from 'moment';
import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { SCENES } from '../../../config';
import { errorReply } from '../../../utils';
import { showGwAction } from '../actions';

export const createGwScene = new Scenes.WizardScene(
	SCENES.CREATE_GW,
	//@ts-ignore
	async ctx => {
		try {
			ctx.reply(
				'🖊 Отправьте сообщение, которое будет опубликовано как розыгрыш, можно прилагать: фото, видео, GIF с текстом или без.\n\n<a href="https://t.me/giveawaybotinfo/5">ℹ️ Инструкция по созданию конкурса</a>',
				{ parse_mode: 'HTML', link_preview_options: { is_disabled: true } }
			);

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
			if (!ctx.update?.message && !ctx.text) return errorReply(ctx);

			//@ts-ignore
			ctx.scene.state.gw = {
				//@ts-ignore
				messageText: ctx.update?.message?.caption ?? ctx?.text,
				//@ts-ignore
				animationFileId: ctx.update?.message?.animation?.file_id,
				//@ts-ignore
				photoFileId: ctx.update?.message?.photo?.length ? ctx.update?.message?.photo[ctx.update?.message?.photo.length - 1].file_id : null,
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

			const gw = await prisma.giveaway.create({ data: { ...ctx.scene.state.gw, createdAt: moment.tz('Europe/Moscow').toDate() } });

			// ctx.reply('Розыгрыш создан', { reply_markup: { inline_keyboard: [[{ text: 'Продолжить', callback_data: `edit_gw:${gw.id}` }]] } });

			showGwAction(ctx, [null, gw.id], true);

			return ctx.scene.leave();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	}
);
