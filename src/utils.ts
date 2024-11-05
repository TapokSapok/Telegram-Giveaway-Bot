import { Context } from 'telegraf';

export function getLocEmoji(locType: string) {
	if (locType === 'channel') return `🏖`;
	else if (locType === 'group') return `🏫`;
	else if (locType === 'supergroup') return `💵`;
	else if (locType === 'private') return `🧰`;
	else return ``;
}

export function getLocTitle(locType: string) {
	if (locType === 'channel') return `${getLocEmoji(locType)} Канал`;
	else if (locType === 'group') return `${getLocEmoji(locType)} Группа`;
	else if (locType === 'supergroup') return `${getLocEmoji(locType)} Супер группа`;
	else if (locType === 'private') return `${getLocEmoji(locType)} Приватная группа`;
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
		const text = '🦖 NICE GIVEAWAY';
		const extra = {
			reply_markup: {
				inline_keyboard: [[{ text: '🦖 Админка', callback_data: 'adm_menu' }], [{ text: '🎛 Управление', callback_data: 'choose_location' }]],
			},
		} as any;

		if (isReply) return ctx.reply(text, extra);
		else return ctx.editMessageText(text, extra);
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
