import { Giveaway } from '@prisma/client';
import moment from 'moment-timezone';
import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { SCENES } from '../../../config';
import { errorReply } from '../../../utils';

export const solveCaptchaScene = new Scenes.WizardScene(
	SCENES.SOLVE_CAPTCHA,
	//@ts-ignore
	async ctx => {
		try {
			// const cap = new Captcha({ length: 5, width: 450, height: 200 });
			// cap.save('captcha');
			// const buffer = await sharp(cap.captcha.bitmap.data, { raw: { width: 450, height: 200, channels: 1 } })
			// 	.png()
			// 	.toBuffer();
			// ctx.sendPhoto({ source: buffer }, { caption: { text: '✍️ Введите текст из капчи.', __to_nest: 'хуй' } });
			// return ctx.wizard.next();
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

			const gw = await prisma.giveaway.create({ data: { ...ctx.scene.state.gw, createdAt: moment(new Date()).tz('Europe/Moscow').toDate() } });

			ctx.reply('Розыгрыш создан', { reply_markup: { inline_keyboard: [[{ text: 'Продолжить', callback_data: `edit_gw:${gw.id}` }]] } });
			return ctx.scene.leave();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	}
);
