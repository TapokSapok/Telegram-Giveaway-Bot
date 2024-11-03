import { bot, infoBot } from '../../bot';
import { BACK_TEXT, SCENES } from '../../config';
import { prisma } from '../../index';
import { parseActionArgs } from '../../utils';
import { editGwAction, GIVEAWAY_MAIN_TEXT } from './helpers';

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
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true } });
		if (!gw) return await ctx.answerCbQuery('❌ Запрос устарел');

		const isAdmin = ctx.session?.user?.isAdmin;

		return ctx.editMessageText(GIVEAWAY_MAIN_TEXT({ ...gw }), {
			parse_mode: 'HTML',
			link_preview_options: { is_disabled: true },
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

bot.action(/^create_gw:(.+)/, ctx => {
	try {
		const locId = parseInt(parseActionArgs(ctx)[1]);
		ctx.scene.enter(SCENES.CREATE_GW, { locId });
	} catch (error) {
		console.error(error);
	}
});

bot.action(/^publicate_gw:(.+)/, async ctx => {
	try {
		const gwId = parseInt(parseActionArgs(ctx)[1]);
		let gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true } });
		if (!gw) return await ctx.answerCbQuery('❌ Запрос устарел');

		const message = await bot.telegram.sendMessage(String(gw.location.id), gw.messageText ?? 'o', {
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: [[{ text: `(${0}) ${gw.buttonText}`, callback_data: `participate_gw:${gw.id}`, url: `https://t.me/${(await infoBot).username}?start=${gw.id}` }]],
			},
		});

		console.log(message);

		gw = await prisma.giveaway.update({ where: { id: gwId }, data: { publicated: true, messageId: message.message_id }, include: { location: true } });

		return ctx.editMessageText('❇️ Розыгрыш опубликован!', { reply_markup: { inline_keyboard: [[{ text: BACK_TEXT, callback_data: `show_gw:${gw.id}` }]] } });
	} catch (error) {
		console.error(error);
	}
});

bot.action(/^edit_gw:(.+)/, async ctx => editGwAction(ctx));

bot.action(/^change_gw:(.+):(.+)/, async ctx => {
	const args = parseActionArgs(ctx);
	const key = args[2];
	const gwId = parseInt(args[1]);
	let gw = await prisma.giveaway.findUnique({ where: { id: gwId } });

	if (key === 'botsProtection') {
		gw = await prisma.giveaway.update({ where: { id: gwId }, data: { botsProtection: !gw?.botsProtection } });
		return editGwAction(ctx);
	} else {
		ctx.scene.enter(SCENES.CHANGE_GW, { key, gwId, gw });
	}
});
