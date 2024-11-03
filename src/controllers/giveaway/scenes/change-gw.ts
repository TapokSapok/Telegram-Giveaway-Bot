import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { SCENES } from '../../../config';
import { errorReply, parseActionArgs } from '../../../utils';
import { editGwAction } from '../helpers';

export const changeGwScene = new Scenes.WizardScene(
	SCENES.CHANGE_GW,
	//@ts-ignore
	async ctx => {
		try {
			//@ts-ignore
			const { gwId, key, gw } = ctx.scene.session.state as number;
			// @ts-ignore
			ctx.scene.state = { gwId, key, gw };

			let text = '';

			if (key === 'messageText') text = '✍️ Введи новый текст сообщения';
			else if (key === 'buttonText') text = '✍️ Введи новый текст кнопки';
			else if (key === 'winnerCount') text = '✍️ Введи число победителей (макс. 100)';
			else if (key === 'resultsAt')
				text = `📆 Отправь мне дату окончания розыгрыша.\nПоддерживаемые форматы:\n00:00 равноцееное 00:00 сегодня или используйте полную дату и время:\n00:00 31.01.2024
`;

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
			const { gwId, key, gw } = ctx.scene.state;

			if (!ctx.text) return;

			if (key === 'messageText' || key === 'buttonText') {
				await prisma.giveaway.update({ where: { id: gwId }, data: { [key]: ctx.text } });
			} else if (key === 'winnerCount') {
				const value = parseInt(ctx.text);
				if (!value || value > 100 || value < 1) return ctx.reply('🚫 Неверный формат');
				await prisma.giveaway.update({ where: { id: gwId }, data: { [key]: value } });
			} else if (key === 'resultsAt') {
				const [time, date] = ctx.text.split(' ');

				// if (time) {
				// 	if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.exec(time)) return ctx.reply('🚫 Неверный формат времени');
				// }
				// if (date) {
				// 	if (!/\d{1,2}\.\d{1,2}\.\d{2,4}/.exec(date)) return ctx.reply('🚫 Неверный формат даты');
				// }
				// if (!time && !date) return ctx.reply('🚫 Неверный формат всего');

				// let resultsAt = moment(`${time} ${date ?? new Date().getDate()}`);
				// console.log(resultsAt);
				// console.log([time, date]);
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
	ctx.scene.leave();
	editGwAction(ctx, gwId);
});
