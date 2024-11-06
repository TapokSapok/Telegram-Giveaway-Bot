import { Giveaway, GiveawayLocation } from '@prisma/client';
import moment from 'moment';
import { Context } from 'telegraf';
import { prisma } from '../..';
import { bot, infoBot } from '../../bot';

export const GIVEAWAY_MAIN_TEXT = (gw: Giveaway & { location: GiveawayLocation } & { _count: { participants: number } }) => {
	const createdAt = moment(gw.createdAt).format('HH:mm DD.MM.YYYY');
	const resultsAt = gw.resultsAt && moment(gw.resultsAt).format('HH:mm DD.MM.YYYY');
	const fromResults = moment(gw.resultsAt).locale('ru').fromNow(true);

	return `${gw.messageText}\n\n〰️〰️〰️〰️〰️\n\n⏺️ Текст кнопки: ${gw.buttonText}\n\n🆔 ID розыгрыша: ${gw.id}\n📌 Канал: ${gw.location.title}\n👥 Участников: ${
		gw._count.participants
	}\n🎁 Победителей: ${gw.winnerCount}\n📸 Опубликован: ${gw.publicated ? `<b><a href="http://t.me/${gw.location.name}/${gw.messageId}">здесь</a></b>` : `🚫`}\n🛡 Капча: ${
		gw.botsProtection ? '✅' : '🚫'
	}\n\n📅 Создан: ${createdAt}\n⏳ Итоги: ${resultsAt ?? 'вручную'}${gw.resultsAt ? `\n⌚️ До итогов: ${fromResults}\n🕰 Таймзона: (Europe/Moscow)` : ''}`;
};

export function RESULTS_TEXT(gw: any, winners: any[]) {
	return `💫 Итоги <b><a href="http://t.me/${gw?.location?.name}/${gw.messageId}">вашего</a></b> розыгрыша <code>#${gw.id}</code>\n\n👤 Участников: ${
		gw._count.participants
	}\n🏅 Победители: ${winners.map(w => '@' + w.user.username).join(', ')}`;
}

export async function getGwParticipants(gwId: number) {
	try {
		const participants = await prisma.userParticipant.findMany({ where: { giveawayId: gwId } });
		return participants;
	} catch (error) {
		console.error(error);
		return [];
	}
}

export function isAdmp(ctx: Context, gw: Giveaway) {
	return ctx.session?.user.isAdmin && gw.creatorId !== ctx.session.user.id;
}

export async function updatePublicMessage(gwId: number) {
	try {
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { _count: { select: { participants: true } } } });

		if (!gw) return;
		await bot.telegram.editMessageReplyMarkup(Number(gw.locationId), Number(gw.messageId), undefined, {
			inline_keyboard: !gw.resultsIsSummarized
				? [[{ text: `(${gw._count.participants}) ${gw.buttonText}`, url: `https://t.me/${(await infoBot).username}?start=${gw.id}` }]]
				: (undefined as any),
		});
	} catch (error) {}
}

export async function sendWinMessageToChat(gwId: number) {
	try {
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { _count: { select: { participants: true } } } });

		const winners = await prisma.userParticipant.findMany({
			where: {
				isWinner: true,
				giveawayId: gw!.id,
			},
			include: { user: true },
		});

		if (!gw) return;
		await bot.telegram.sendMessage(
			Number(gw.locationId),
			`🤩 Подведены итоги розыгрыша!\n\n👤 Участников: ${gw._count.participants}\n🏅 Победители: ${
				winners.length ? winners.map(w => (w.user.username ? '@' + w.user.username : w.userId)).join(', ') : 'нету'
			}`,
			{ reply_parameters: { message_id: Number(gw.messageId) } }
		);
	} catch (error) {}
}

export function parseDrawDate(input: string) {
	const timeOnlyRegex = /^(\d{2}):(\d{2})$/;
	const fullDateTimeRegex = /^(\d{2}):(\d{2})\s(\d{2})\.(\d{2})\.(\d{4})$/;

	let drawDate;

	if (timeOnlyRegex.test(input)) {
		//@ts-ignore
		const [_, hours, minutes] = input.match(timeOnlyRegex);
		drawDate = moment().hours(hours).minutes(minutes);
		if (moment().isAfter(drawDate)) {
			drawDate.add(1, 'day');
		}
	} else if (fullDateTimeRegex.test(input)) {
		const [_, hours, minutes, day, month, year] = input.match(fullDateTimeRegex);
		drawDate = moment(`${day}.${month}.${year} ${hours}:${minutes}`, 'DD.MM.YYYY HH:mm');
	} else {
		return null;
	}

	return drawDate.toDate();
}
