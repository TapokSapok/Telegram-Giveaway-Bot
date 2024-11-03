import { Giveaway, GiveawayLocation } from '@prisma/client';
import moment from 'moment';
import { bot } from '../../bot';
import { BACK_TEXT, SCENES } from '../../config';
import { prisma } from '../../index';
import { parseActionArgs } from '../../utils';

const GIVEAWAY_MAIN_TEXT = (gw: Giveaway & { location: GiveawayLocation }) => {
	const createdAt = moment(gw.createdAt).format('HH:mm DD.MM.YYYY');
	const resultsAt = gw.resultsAt && moment(gw.resultsAt).format('HH:mm DD.MM.YYYY');
	const fromResults = moment(gw.resultsAt).locale('ru').fromNow(true);

	return `${gw.messageText}\n\n⬇️⬇️⬇️⬇️⬇️\n\n⏺️ Текст кнопки: ${gw.buttonText}\n\n🆔 ID розыгрыша: ${gw.id}\n👥 Участников: ${gw.participantCount}\n🎁 Победителей: ${
		gw.winnerCount
	}\n📸 Опубликован: ${!gw.publicated ? `<b><a href="http://t.me/c/${gw.location.id}/${gw.messageId}">здесь</a></b>` : `🚫`}\n\n📅 Создан: ${createdAt}\n⏳ Итоги: ${
		resultsAt ?? 'вручную'
	}${gw.resultsAt ? `\n⌚️ До итогов: ${fromResults}\n🕰 Таймзона: (Europe/Moscow)` : ''}`;
};

bot.action(/^active_gw:(\D+)/, async ctx => {
	try {
		const locationId = Number(parseActionArgs(ctx)[1]);
		const location = await prisma.giveawayLocation.findUnique({ where: { id: locationId } });
		const giveaways = await prisma.giveaway.findMany({ where: { active: true, locationId }, orderBy: { id: 'desc' } });

		if (!location) await ctx.answerCbQuery('❌ Запрос устарел');
		if (!giveaways.length) return await ctx.answerCbQuery('❌ Нет активных розыгрышей');

		return ctx.editMessageText(`Активные розыгрыши "${location?.title}"`, {
			reply_markup: {
				inline_keyboard: [
					...giveaways.map(gw => [{ text: `Розыгрыш #${gw.id}`, callback_data: `show_gw:${gw.id}` }]),
					[{ text: BACK_TEXT, callback_data: `location:${locationId}` }],
				],
			},
		});
	} catch (error) {
		console.error(error);
	}
});

bot.action(/^show_gw:(.+)/, async ctx => {
	try {
		const gwId = parseInt(parseActionArgs(ctx)[1]);
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId } });
		const loc = await prisma.giveawayLocation.findUnique({ where: { id: gw?.locationId } });
		if (!gw || !loc) return await ctx.answerCbQuery('❌ Запрос устарел');

		const isAdmin = ctx.session?.user?.isAdmin;

		return ctx.editMessageText(GIVEAWAY_MAIN_TEXT({ ...gw, location: loc }), {
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: [
					!gw.publicated ? [{ text: '✅ Опубликовать', callback_data: `publicate_gw:${gw.id}` }] : [],
					isAdmin ? [{ text: `🥇 Выбрать победител${gw.winnerCount > 1 ? 'ей' : 'я'}`, callback_data: `choose_winners:${gw.id}` }] : [],
					isAdmin ? [{ text: `📣 Разослать участникам лс`, callback_data: `mailing:${gw.id}` }] : [],
					[
						{ text: '✏️ Редактировать', callback_data: `edit_gw:${gw.id}` },
						{ text: '❌ Удалить', callback_data: `delete_gw:${gw.id}` },
					],
					[{ text: BACK_TEXT, callback_data: `active_gw:${gw.locationId}` }],
				].filter(b => b),
			},
		});
	} catch (error) {
		console.error(error);
	}
});

bot.action(/^edit_gw:(.+)/, async ctx => {
	try {
		const gwId = parseInt(parseActionArgs(ctx)[1]);
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId } });
		const loc = await prisma.giveawayLocation.findUnique({ where: { id: gw?.locationId } });
		if (!gw || !loc) return await ctx.answerCbQuery('❌ Запрос устарел');

		console.log(gw);
		return ctx.editMessageText(GIVEAWAY_MAIN_TEXT({ ...gw, location: loc }) + `\n\nРедактирование...`, {
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: [
					[{ text: '💬 Изменить текст сообщения', callback_data: `change:${gw.id}:messageText` }],
					[{ text: '📝 Изменить текст кнопки', callback_data: `change:${gw.id}:buttonText` }],
					[{ text: '🥇 Изменить кол-во победителей', callback_data: `change:${gw.id}:buttonText` }],
					[{ text: `${gw.botsProtection ? '🟢 Выключить' : '🔴 Включить'} капчу`, callback_data: `change:${gw.id}:buttonText` }],
					[{ text: `${!gw.resultsAt ? '🕕 Выбрать время итогов' : '🫶 Ручные итоги'}`, callback_data: `change:${gw.id}:resultsAt` }],
					[{ text: BACK_TEXT, callback_data: `show_gw:${gw.id}` }],
				],
			},
		});
	} catch (error) {
		console.error(error);
	}
});

bot.action(/^create_gw:(.+)/, ctx => {
	try {
		const locId = parseInt(parseActionArgs(ctx)[1]);
		ctx.scene.enter(SCENES.CREATE_GW, { locId });
	} catch (error) {
		console.error(error);
	}
});
