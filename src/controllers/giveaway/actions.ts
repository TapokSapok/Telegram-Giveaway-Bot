import { Context } from 'telegraf';
import { bot, infoBot } from '../../bot';
import { BACK_TEXT, SCENES } from '../../config';
import { prisma } from '../../index';
import { formatWinnerPositions, isBotInChat, parseActionArgs, sendMenu, sendMessage, setWinners } from '../../utils';
import { GIVEAWAY_MAIN_TEXT, RESULTS_TEXT, sendWinMessageToChat, updatePublicMessage } from './helpers';

export async function activeGwAction(ctx: Context, locId2?: number, isReply?: boolean) {
	try {
		const args = parseActionArgs(ctx);
		const locationId = args?.length >= 2 ? parseInt(args[1]) : locId2;

		const location = await prisma.giveawayLocation.findUnique({ where: { id: locationId } });
		const giveaways = await prisma.giveaway.findMany({ where: { active: true, locationId }, orderBy: { id: 'desc' } });

		if (!location) await ctx.answerCbQuery('❌ Запрос устарел');
		if (!giveaways.length) return await ctx.answerCbQuery('❌ Нет активных розыгрышей');

		const text = `Активные розыгрыши "${location?.title}"`;
		const extra = {
			reply_markup: {
				inline_keyboard: [
					...giveaways.map(gw => [{ text: `Розыгрыш #${gw.id}`, callback_data: `show_gw:${gw.id}` }]),
					[{ text: BACK_TEXT, callback_data: `location:${locationId}` }],
				],
			},
		} as any;

		if (isReply) return ctx.reply(text, extra);
		else return ctx.editMessageText(text, extra);
	} catch (error) {
		console.error(error);
	}
}

export async function showGwAction(ctx: Context, otherArgs?: any[], isReply?: boolean) {
	try {
		const args = otherArgs ?? parseActionArgs(ctx);
		const admPage = args?.length >= 3 ? Number(args[2]) : false;
		const gwId = args?.length >= 2 ? parseInt(args[1]) : args[1];

		const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true, _count: { select: { participants: true } } } });
		if (!gw) return await ctx.answerCbQuery('❌ Запрос устарел');

		const showPublicateButton = !admPage && !gw.publicated;
		const showSumResultsButton = !admPage && gw.publicated && !gw.resultsAt && !gw.resultsIsSummarized;
		const showShowResultsButton = !!gw.resultsIsSummarized;
		const showSetWinnersButton = admPage && !gw.resultsIsSummarized;

		const text = GIVEAWAY_MAIN_TEXT({ ...gw });
		const extra = {
			parse_mode: 'HTML',
			link_preview_options: { is_disabled: true },
			reply_markup: {
				inline_keyboard: [
					showPublicateButton ? [{ text: '✅ Опубликовать', callback_data: `publicate_gw:${gw.id}` }] : [],
					showSumResultsButton ? [{ text: '💫 Подвести итоги', callback_data: `sum_gw_results:${gwId}` }] : [],
					showShowResultsButton ? [{ text: '👁 Посмотреть итоги', callback_data: `sum_gw_results:${gwId}:true${admPage ? `:${admPage}` : ''}` }] : [],
					showSetWinnersButton ? [{ text: `🥇 Выбрать победител${gw.winnerCount > 1 ? 'ей' : 'я'}`, callback_data: `adm_winners:${gw.id}:${admPage}` }] : [],

					!admPage
						? [!gw.resultsIsSummarized ? { text: '✏️ Редактировать', callback_data: `edit_gw:${gw.id}` } : {}, { text: '❌ Удалить', callback_data: `delete_gw:${gw.id}` }].filter(
								b => b.text
						  )
						: [],
					[{ text: BACK_TEXT, callback_data: admPage ? `adm_gw_list:${admPage}` : `active_gw:${gw.locationId}` }],
				].filter(b => b),
			},
		} as any;

		if (isReply) return ctx.reply(text, extra);
		else return ctx.editMessageText(text, extra);
	} catch (error) {
		console.error(error);
	}
}

export async function createGwAction(ctx: Context) {
	try {
		const locId = parseInt(parseActionArgs(ctx)[1]);
		ctx.scene.enter(SCENES.CREATE_GW, { locId });
	} catch (error) {
		console.error(error);
	}
}

export async function publicateGwAction(ctx: Context) {
	try {
		const gwId = parseInt(parseActionArgs(ctx)[1]);
		let gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true } });
		if (!gw) return await ctx.answerCbQuery('❌ Запрос устарел');

		const botFromChat = await isBotInChat(ctx, Number(gw.locationId));

		if (!botFromChat) {
			return ctx.reply('Бот не в чате');
		}

		const chatId = String(gw.location.id);

		const extra = {
			parse_mode: 'HTML',
			caption: gw.messageText,
			reply_markup: {
				inline_keyboard: [[{ text: `(${0}) ${gw.buttonText}`, url: `https://t.me/${(await infoBot).username}?start=${gw.id}` }]],
			}, //  callback_data: `participate_gw:${gw.id}`,
		} as any;

		let message = null;

		if (gw.animationFileId) {
			message = await bot.telegram.sendAnimation(chatId, gw.animationFileId, extra);
		} else if (gw.photoFileId) {
			message = await bot.telegram.sendPhoto(chatId, gw.photoFileId, extra);
		} else {
			message = await bot.telegram.sendMessage(chatId, gw.messageText as string, extra);
		}

		gw = await prisma.giveaway.update({ where: { id: gwId }, data: { publicated: true, messageId: message.message_id }, include: { location: true } });

		return showGwAction(ctx, [null, gwId]);
	} catch (error: any) {
		if (error.message.includes('bot is not a member')) {
			ctx.reply('bot is not a member').catch(() => {});
		}
		console.error(error);
	}
}

export async function editGwAction(ctx: Context, gwId2?: number, isReply?: boolean) {
	try {
		const args = parseActionArgs(ctx);
		const gwId = args?.length >= 2 ? parseInt(args[1]) : gwId2;
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true, _count: { select: { participants: true } } } });

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
					[{ text: `${gw.subscribeLocationIds.length ? '🟢' : '🔴'} Проверка подписки`, callback_data: `subscription_gw:${gw.id}` }],
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

export async function changeGwAction(ctx: Context) {
	try {
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
	} catch (error) {
		console.error(error);
	}
}

export async function sumGwResultsAction(ctx: Context) {
	try {
		const args = parseActionArgs(ctx);
		const gwId = Number(args[1]);
		const isShow = args[2] === 'true';
		const admPage = args.length >= 3 ? Number(args[3]) : false;

		const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true, _count: { select: { participants: true } } } });
		if (!gw) return ctx.reply('Нет такого розыгрыша');

		const ws = await setWinners(gw);
		const winners = formatWinnerPositions(ws);

		if (!isShow) {
			await prisma.giveaway.update({ where: { id: gwId }, data: { resultsIsSummarized: true } });

			sendWinMessageToChat(gwId);
		}

		ctx.answerCbQuery().catch(() => {});
		updatePublicMessage(gwId);

		return ctx.reply(RESULTS_TEXT(gw, winners), {
			reply_markup: {
				inline_keyboard: [
					[
						// { text: '🔄 Реролл', callback_data: `reroll_gw:${gwId}` },
						{ text: '❇️ Завершить', callback_data: `finish_gw:${gwId}` },
					],
					[{ text: BACK_TEXT, callback_data: `show_gw:${gwId}${admPage ? ':' + admPage : ''}` }],
				],
			},
			parse_mode: 'HTML',
			link_preview_options: { is_disabled: true },
		});
	} catch (error) {
		console.error(error);
	}
}

export async function finishGwAction(ctx: Context) {
	try {
		const gwId = Number(parseActionArgs(ctx)[1]);
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true, _count: { select: { participants: true } } } });

		const winners = formatWinnerPositions(
			await prisma.userParticipant.findMany({
				where: {
					isWinner: true,
					giveawayId: gwId,
				},
				include: { user: true },
			})
		);

		await prisma.giveaway.update({
			data: {
				active: false,
			},
			where: { id: gwId },
		});

		await ctx.editMessageText(RESULTS_TEXT(gw, winners), {
			parse_mode: 'HTML',
			link_preview_options: { is_disabled: true },
		});
	} catch (error) {
		console.error(error);
	}
}

export async function subscriptionGwAction(ctx: Context, gwId2?: number, isReply?: boolean) {
	try {
		const args = parseActionArgs(ctx);
		const gwId = args?.length >= 2 ? parseInt(args[1]) : gwId2;
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId } });
		if (!gw) return sendMenu(ctx);
		const locations = await prisma.giveawayLocation.findMany({ where: { OR: gw?.subscribeLocationIds.map(id => ({ id: id })) } });

		const text = 'Проверка подписки';
		const extra = {
			reply_markup: {
				inline_keyboard: [
					[{ text: '➕ Добавить канал', callback_data: `add_subscription:${gw.id}` }],
					...(locations.map(l => [{ text: '👑 ' + (l.title ?? l.name ?? l.id), callback_data: `remove_subscription:${gw.id}:${l.id}` }]) as any),
					[{ text: BACK_TEXT, callback_data: `edit_gw:${gw.id}` }],
				],
			},
		} as any;

		return sendMessage(ctx, text, extra, isReply);
	} catch (error) {
		console.error(error);
	}
}

export async function removeSubscriptionGwAction(ctx: Context) {
	try {
		const args = parseActionArgs(ctx);
		const gwId = parseInt(args[1]);
		const sId = parseInt(args[2]);
		const gw = await prisma.giveaway.findUnique({ where: { id: gwId } });
		if (!gw) return sendMenu(ctx);

		await prisma.giveaway.update({
			where: { id: gwId },
			data: {
				subscribeLocationIds: gw.subscribeLocationIds.filter(id => Number(id) !== sId),
			},
		});

		ctx.answerCbQuery(`✅ канал ${sId} убран`);

		return subscriptionGwAction(ctx, gwId);
	} catch (error) {
		console.error(error);
	}
}
