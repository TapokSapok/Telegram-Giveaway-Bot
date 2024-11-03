import { Giveaway, GiveawayLocation } from '@prisma/client';
import moment from 'moment';
import { Context } from 'telegraf';
import { prisma } from '../..';
import { BACK_TEXT } from '../../config';
import { parseActionArgs } from '../../utils';

export const GIVEAWAY_MAIN_TEXT = (gw: Giveaway & { location: GiveawayLocation }) => {
	const createdAt = moment(gw.createdAt).format('HH:mm DD.MM.YYYY');
	const resultsAt = gw.resultsAt && moment(gw.resultsAt).format('HH:mm DD.MM.YYYY');
	const fromResults = moment(gw.resultsAt).locale('ru').fromNow(true);

	return `${gw.messageText}\n\n⬇️⬇️⬇️⬇️⬇️\n\n⏺️ Текст кнопки: ${gw.buttonText}\n\n🆔 ID розыгрыша: ${gw.id}\n📌 Канал: ${gw.location.title}\n👥 Участников: ${
		gw.participantCount
	}\n🎁 Победителей: ${gw.winnerCount}\n📸 Опубликован: ${gw.publicated ? `<b><a href="http://t.me/${gw.location.name}/${gw.messageId}">здесь</a></b>` : `🚫`}\n🛡 Капча: ${
		gw.botsProtection ? '✅' : '🚫'
	}\n\n📅 Создан: ${createdAt}\n⏳ Итоги: ${resultsAt ?? 'вручную'}${gw.resultsAt ? `\n⌚️ До итогов: ${fromResults}\n🕰 Таймзона: (Europe/Moscow)` : ''}`;
};

export async function editGwAction(ctx: Context, gwId2?: number, isReply?: boolean) {
	try {
		const args = parseActionArgs(ctx);
		const gwId = args?.length >= 2 ? parseInt(args[1]) : gwId2;
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true } });

		if (!gw) return await ctx.answerCbQuery('❌ Запрос устарел');

		const text = GIVEAWAY_MAIN_TEXT({ ...gw }) + `\n\nРедактирование...`;
		const extra = {
			parse_mode: 'HTML',
			link_preview_options: { is_disabled: true },
			reply_markup: {
				inline_keyboard: [
					[{ text: '💬 Изменить текст сообщения', callback_data: `change_gw:${gw.id}:messageText` }],
					[{ text: '📝 Изменить текст кнопки', callback_data: `change_gw:${gw.id}:buttonText` }],
					[{ text: '🥇 Изменить кол-во победителей', callback_data: `change_gw:${gw.id}:winnerCount` }],
					[{ text: `${gw.botsProtection ? '🟢 Выключить' : '🔴 Включить'} капчу`, callback_data: `change_gw:${gw.id}:botsProtection` }],
					[{ text: `${!gw.resultsAt ? '🕕 Выбрать время итогов' : '🫶 Ручные итоги'}`, callback_data: `change_gw:${gw.id}:resultsAt` }],
					[{ text: BACK_TEXT, callback_data: `show_gw:${gw.id}` }],
				],
			},
		} as any;

		if (isReply) return ctx.reply(text, extra);
		else return ctx.editMessageText(text, extra);
	} catch (error) {
		console.error(error);
	}
}
