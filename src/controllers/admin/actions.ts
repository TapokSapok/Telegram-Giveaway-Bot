import { Context } from 'telegraf';
import { prisma } from '../..';
import { BACK_TEXT, SCENES } from '../../config';
import { getUserName, parseActionArgs, sendMessage } from '../../utils';

export async function admMenuAction(ctx: Context, isReply2?: boolean) {
	try {
		const args = parseActionArgs(ctx);
		const isReply = args?.length >= 1 ? args[1] === 'true' : isReply2;

		const text = 'admin menu';
		const extra = {
			reply_markup: {
				inline_keyboard: [
					[{ text: '📊 Статистика', callback_data: 'adm_stats' }],
					[{ text: '🏔 Активные розыгрышы', callback_data: 'adm_gw_list:1' }],
					[{ text: '✍️ Рассылка', callback_data: 'adm_mailing' }],
					[{ text: BACK_TEXT, callback_data: 'menu' }],
				],
			},
		} as any;

		return sendMessage(ctx, text, extra, isReply);
	} catch (error) {
		console.error(error);
	}
}

export async function admStatsAction(ctx: Context) {
	try {
		const activeUsersCount = await prisma.user.count({ where: { botIsBlocked: false } });

		const chatLocations = await prisma.giveawayLocation.count();

		return ctx.editMessageText(`Статистика:\n\nВсего активных пользователей: ${activeUsersCount}\nВсего чатов подключено: ${chatLocations}`, {
			reply_markup: { inline_keyboard: [[{ text: BACK_TEXT, callback_data: 'adm_menu' }]] },
		});
	} catch (error) {
		console.error(error);
	}
}
export async function admGwListAction(ctx: Context) {
	try {
		const activeGwCount = await prisma.giveaway.count({
			where: { active: true, publicated: true, resultsIsSummarized: false },
		});

		const page = Number(parseActionArgs(ctx)[1]);
		if (page === -1) return ctx.answerCbQuery();

		const agwCount = await prisma.giveaway.count({ where: { active: true, publicated: true } });
		const pageAgws = await prisma.giveaway.findMany({
			take: 20,
			skip: (page - 1) * 20,
			where: { active: true, publicated: true, resultsIsSummarized: false },
			include: { _count: { select: { participants: true } } },
			orderBy: { id: 'desc' },
		});

		return ctx.editMessageText(`Страница: ${page}\nВсего активных розыгрышей: ${activeGwCount}\n`, {
			reply_markup: {
				inline_keyboard: [
					...pageAgws.map(gw => {
						return [{ text: `🎁 #${gw.id} 👮‍♀️ ${gw._count.participants}`, callback_data: `show_gw:${gw.id}:${page}` }];
					}),
					[
						page > 1 ? { text: `« ${page - 1}`, callback_data: `adm_gw_list:${page - 1}` } : ([] as any),
						{ text: `· ${page} ·`, callback_data: `adm_gw_list:-1` },

						Math.ceil(agwCount / 20) > page ? { text: `» ${page + 1}`, callback_data: `adm_gw_list:${page + 1}` } : [],
					].filter(b => b.text),
					[{ text: BACK_TEXT, callback_data: 'adm_menu' }],
				],
			},
		});
	} catch (error) {
		console.error(error);
	}
}
export async function admMailingAction(ctx: Context) {
	ctx.scene.enter(SCENES.MAILING);
}

export async function admWinnerAction(ctx: Context, otherArgs?: any[], isReply?: boolean) {
	try {
		const args = otherArgs ?? parseActionArgs(ctx);
		const gwId = Number(args[1]);
		const admPage = Number(args[2]);

		const gw = await prisma.giveaway.findUnique({ where: { id: gwId }, include: { location: true, _count: { select: { participants: true } } } });
		if (!gw) return ctx.reply('Нет такого розыгрыша');

		const winners = await prisma.userParticipant.findMany({ where: { giveawayId: gwId, isWinner: true }, include: { user: true } });

		const text = `Выбранные победители:\n\n${winners
			.map(w => getUserName(w.user) + (w.winnerIndex ? ` - ${w.winnerIndex} место` : ''))
			.join('\n')}\n\nНажми на кнопки ниже, что бы добавить или убрать победителя`;
		const extra = {
			reply_markup: {
				inline_keyboard: [
					[{ text: '➕ Добавить', callback_data: `adm_choose_winner:${gwId}:${admPage}:add` }],
					[{ text: '➖ Убрать', callback_data: `adm_choose_winner:${gwId}:${admPage}:remove` }],
					[{ text: BACK_TEXT, callback_data: `show_gw:${gwId}:${admPage}` }],
				],
			},
		} as any;

		if (isReply) return ctx.reply(text, extra);
		else return ctx.editMessageText(text, extra);
	} catch (error) {
		console.error(error);
	}
}
