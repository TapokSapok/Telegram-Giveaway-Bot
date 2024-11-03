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
