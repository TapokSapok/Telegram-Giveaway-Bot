import { Context } from 'telegraf';
import { prisma } from '../..';
import { BACK_TEXT } from '../../config';
import { parseActionArgs } from '../../utils';

export async function admMenuAction(ctx: Context) {
	try {
		return ctx.editMessageText('admin menu', {
			reply_markup: {
				inline_keyboard: [
					[{ text: '📊 Статистика', callback_data: 'adm_stats' }],
					[{ text: '🏔 Активные розыгрышы', callback_data: 'adm_gw_list:1' }],
					[{ text: '✍️ Рассылка', callback_data: 'adm_mailing' }],
					[{ text: BACK_TEXT, callback_data: 'menu' }],
				],
			},
		});
	} catch (error) {
		console.error(error);
	}
}

export async function admStatsAction(ctx: Context) {
	try {
		return ctx.editMessageText('Статистика:\n\nВсего активных пользователей: 0\nВсего активных розыгрышей: 0\nВсего каналов: 0', {
			reply_markup: { inline_keyboard: [[{ text: BACK_TEXT, callback_data: 'adm_menu' }]] },
		});
	} catch (error) {
		console.error(error);
	}
}
export async function admGwListAction(ctx: Context) {
	// await prisma.giveaway.createMany({
	// 	data: [{ creatorId: 1366955147, locationId: -1002305925841, winnerCount: 1, active: true, publicated: true }],
	// });

	try {
		const page = Number(parseActionArgs(ctx)[1]);
		if (page === -1) return ctx.answerCbQuery();

		const agwCount = await prisma.giveaway.count({ where: { active: true, publicated: true } });
		const pageAgws = await prisma.giveaway.findMany({
			take: 20,
			skip: (page - 1) * 20,
			where: { active: true, publicated: true },
			include: { _count: { select: { participants: true } } },
			orderBy: { id: 'desc' },
		});

		return ctx.editMessageText(`Страница: ${page}\nВсего активных розыгрышей: ${0}\n`, {
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
	try {
	} catch (error) {
		console.error(error);
	}
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
			.map(w => (w.user.username ? '@' + w.user.username : w.userId))
			.join(', ')}\n\nНажми на кнопки ниже, что бы добавить или убрать победителя`;
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