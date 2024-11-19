import { Giveaway, User, UserParticipant } from '@prisma/client';
import 'dotenv/config';
import { Context } from 'telegraf';
import { InlineKeyboardMarkup, LinkPreviewOptions, MessageEntity, ParseMode } from 'telegraf/typings/core/types/typegram';
import { prisma } from '.';

export function getLocEmoji(locType: string) {
	if (locType === 'channel') return ''; //`🏖`;
	else if (locType === 'group') return ''; // `🏫`;
	else if (locType === 'supergroup') return ''; //`💵`;
	else if (locType === 'private') return ''; //`🧰`;
	else return ``;
}

export function getLocTitle(locType: string) {
	if (locType === 'channel') return `${getLocEmoji(locType)}Канал:`;
	else if (locType === 'group') return `${getLocEmoji(locType)}Группа:`;
	else if (locType === 'supergroup') return `${getLocEmoji(locType)}Супер группа`;
	else if (locType === 'private') return `${getLocEmoji(locType)}Приватная группа`;
	else return ``;
}

export function parseActionArgs(ctx: any) {
	return ctx?.update?.callback_query?.data?.split(':');
}

export function errorReply(ctx: Context) {
	ctx
		.reply('Ошибка', {
			reply_markup: {
				inline_keyboard: [[{ text: 'В меню', callback_data: 'menu' }]],
			},
		})
		.catch(() => {});
	ctx?.scene?.leave();
}

export function changeTimeZone(date: Date, timezone: string) {
	const invdate = new Date(
		date.toLocaleString('ru-RU', {
			timeZone: timezone,
		})
	);
	const diff = date.getTime() - invdate.getTime();
	return new Date(date.getTime() - diff);
}

export function sendMenu(ctx: Context, isReply?: boolean) {
	try {
		const isAdmin = process.env.ADMIN_IDS?.split(',').includes(String(ctx?.from?.id) ?? 'asd');

		const startFileId = 'AgACAgIAAxkDAAIK1GcuIwuCvFi8vC7EWzFOIKJV7BkfAAIi5DEbyfRxSTv2kCWpc76rAQADAgADeQADNgQ';

		const text = 'Добро пожаловать! С помощью этого бота вы можете провести розыгрыш в своем канале.';

		const extra = {
			caption: text,
			reply_markup: {
				// keyboard: [['Создать розыгрыш', 'Мои каналы', isAdmin ? 'Админка' : (undefined as any)].filter(b => b)],
				// resize_keyboard: true,
				// one_time_keyboard: true,
				remove_keyboard: true,
				inline_keyboard: [
					[{ text: '⚡️ Наш канал', url: 'https://t.me/giveawaybotinfo' }],
					isAdmin ? [{ text: '🦖 Админка', callback_data: 'adm_menu:true' }] : [],
					[{ text: '💫 Создать розыгрыш', callback_data: 'choose_location:true' }],
					,
				].filter(b => b),
			},
		} as any;

		ctx.replyWithPhoto(startFileId, extra);
		// else return ctx.editMessageText(text, extra);
	} catch (error) {
		console.error(error);
	}
}

export async function isBotInChat(ctx: Context, chatId: number) {
	try {
		const botInfo = await ctx.telegram.getChatMember(chatId, ctx.botInfo.id);
		return botInfo.status === 'member' || botInfo.status === 'administrator';
	} catch (error) {
		return false;
	}
}

export async function pause(ms?: number) {
	return new Promise(r => setTimeout(r, ms));
}

export async function sendMessage(
	ctx: Context,
	text: string,
	extra: {
		parse_mode: ParseMode | undefined;
		entities: MessageEntity[] | undefined;
		link_preview_options: LinkPreviewOptions | undefined;
		reply_markup: InlineKeyboardMarkup | undefined;
	},
	isReply?: boolean
) {
	if (isReply) return ctx.reply(text, extra);
	else return ctx.editMessageText(text, extra);
}

export async function setWinners(gw: Giveaway) {
	try {
		let winners = await prisma.userParticipant.findMany({
			where: {
				isWinner: true,
				giveawayId: gw.id,
			},
			include: { user: true },
		});

		// winners = winners.

		if (winners.length < gw.winnerCount) {
			const noWinnerPartisipants = await prisma.userParticipant.findMany({
				where: { giveawayId: gw.id, isWinner: false },
				include: { user: true },
			});

			const needWinnersCount = gw.winnerCount - winners.length;
			const selectedIndexes: number[] = [];

			while (selectedIndexes.length < needWinnersCount && selectedIndexes.length < noWinnerPartisipants.length) {
				const randomIndex = Math.floor(Math.random() * noWinnerPartisipants.length);
				if (!selectedIndexes.includes(randomIndex)) {
					selectedIndexes.push(randomIndex);
				}
			}

			const newWinners = selectedIndexes.map(i => noWinnerPartisipants[i]);

			for (const p of newWinners) {
				await prisma.userParticipant.update({ where: { id: p.id }, data: { isWinner: true } }).catch(er => console.log(er));
			}

			winners = [...newWinners, ...winners];
		}

		return winners;
	} catch (error) {
		console.error(error);
		return [];
	}
}

export function formatWinnerPositions(winners: UserParticipant[]): any[] {
	try {
		if (!winners?.length) return [];
		const maxIndex = Math.max(...winners.map(obj => (obj.winnerIndex ? obj.winnerIndex - 1 : 0)));
		const result = Array(maxIndex + 1).fill(null);

		winners.forEach((w, i) => {
			if (typeof w.winnerIndex === 'number' && w.winnerIndex - 1 < result.length) {
				result[w.winnerIndex - 1] = winners[i];
			}
		});

		winners.forEach(item => {
			if (item.winnerIndex === null) {
				const emptyIndex = result.indexOf(null);
				if (emptyIndex !== -1) {
					result[emptyIndex] = item;
				}
			}
		});

		return result.filter(w => w);
	} catch (error) {
		console.error(error);
		return [];
	}
}

export function getUserName(user: User) {
	if (user?.username) {
		return '@' + user.username;
	} else if (user?.firstName) {
		return `<a href="tg://user?id=${user.id}">${user.firstName}</a>`;
	} else return `<a href="tg://user?id=${user.id}">${user.id}</a>`;
}

export function getIsAdmin(id?: number | string) {
	if (!id) return false;
	return !!process.env.ADMIN_IDS?.split(',').includes(String(id));
}
