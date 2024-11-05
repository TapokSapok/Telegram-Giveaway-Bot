import moment from 'moment';
import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { SCENES, TZ } from '../../../config';
import { errorReply, parseActionArgs } from '../../../utils';
import { editGwAction } from '../actions';
import { parseDrawDate, updatePublicMessage } from '../helpers';

export const changeGwScene = new Scenes.WizardScene(
	SCENES.CHANGE_GW,
	//@ts-ignore
	async ctx => {
		try {
			//@ts-ignore
			let { gwId, key, gw } = ctx.scene.session.state as number;
			// @ts-ignore
			ctx.scene.state = { gwId, key, gw };

			let text = '';

			if (key === 'messageText') text = '✍️ Введи новый текст сообщения';
			else if (key === 'buttonText') text = '✍️ Введи новый текст кнопки';
			else if (key === 'winnerCount') text = '✍️ Введи число победителей (макс. 100)';
			else if (key === 'resultsAt') {
				if (gw.resultsAt) {
					gw = await prisma.giveaway.update({ where: { id: gwId }, data: { resultsAt: null } });
					editGwAction(ctx, gwId, true);
					return ctx.scene.leave();
				} else {
					text = `📆 Отправь мне дату окончания розыгрыша.\nПоддерживаемые форматы:\n00:00 равноцееное 00:00 сегодня или используйте полную дату и время:\n00:00 31.01.2024
					`;
				}
			}

			ctx.answerCbQuery();

			await ctx.reply(text, { reply_markup: { inline_keyboard: [[{ text: 'Отмена', callback_data: `cancel:${gwId}` }]] } });

			return ctx.wizard.next();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	},
	async ctx => {
		try {
			//@ts-ignore
			let { gwId, key, gw } = ctx.scene.state;

			if (!ctx.text) return;

			if (key === 'messageText' || key === 'buttonText') {
				gw = await prisma.giveaway.update({ where: { id: gwId }, data: { [key]: ctx.text } });
				await updatePublicMessage(gwId);
			} else if (key === 'winnerCount') {
				const value = parseInt(ctx.text);
				if (!value || value > 100 || value < 1) return ctx.reply('🚫 Неверный формат');
				gw = await prisma.giveaway.update({ where: { id: gwId }, data: { [key]: value } });
			} else if (key === 'resultsAt') {
				const drawDate = parseDrawDate(ctx.text);
				if (drawDate) {
					const rDate = new Date(moment(drawDate).tz(TZ).toDate()).getTime();
					const cDate = new Date(moment(gw.createdAt).tz(TZ).toDate()).getTime();
					if (rDate <= cDate) return ctx.reply('🚫 Назад в будушее? Неверный формат');
					gw = await prisma.giveaway.update({ where: { id: gwId }, data: { resultsAt: drawDate } });
				} else {
					return ctx.reply('Неверный формат даты. Используйте "ЧЧ:ММ" или "ЧЧ:ММ ДД.ММ.ГГГГ".');
				}
			}

			editGwAction(ctx, gwId, true);
			ctx.scene.leave();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	}
);

changeGwScene.action(/^cancel:(.+)/, async ctx => {
	const gwId = parseInt(parseActionArgs(ctx)[1]);
	ctx.answerCbQuery();
	ctx.scene.leave();
	editGwAction(ctx, gwId, true);
});
