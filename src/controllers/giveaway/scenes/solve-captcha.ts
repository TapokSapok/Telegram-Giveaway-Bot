import sharp from 'sharp';
import svgCaptcha from 'svg-captcha';
import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { SCENES } from '../../../config';
import { errorReply } from '../../../utils';

export const solveCaptchaScene = new Scenes.WizardScene(
	SCENES.SOLVE_CAPTCHA,
	//@ts-ignore
	async ctx => {
		try {
			const captcha = svgCaptcha.create();
			const buffer = await sharp(Buffer.from(captcha.data)).png().toBuffer();

			ctx.scene.state.captchaText = captcha.text;

			await ctx.sendPhoto({ source: buffer }, { caption: { text: '✍️ Введите текст из капчи.', __to_nest: 'хуй' } });

			return ctx.wizard.next();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	},
	async ctx => {
		try {
			const captchaText = ctx.scene.state.captchaText as string;
			const gwId = ctx.scene.state.gwId as number;
			const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true } });
			if (!gw) return ctx.reply('розыгрыш не найден');

			if (ctx.text?.toLocaleLowerCase() !== captchaText.toLocaleLowerCase()) {
				ctx.scene.leave();
				return ctx.reply('🚫 Капча введена неверно', { reply_markup: { inline_keyboard: [[{ text: '🔄 Повторить', callback_data: `retry_captcha:${gwId}` }]] } });
			}

			await prisma.userParticipant.create({ data: { giveawayId: gwId, userId: Number(ctx.session?.user.id!) } });
			ctx.reply(`✅ Теперь ты участвуешь в <b><a href="http://t.me/${gw?.location?.name}/${gw.messageId}">этом</a></b> конкурсе!`, {
				parse_mode: 'HTML',
				link_preview_options: { is_disabled: true },
			});
			return ctx.scene.leave();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	}
);
