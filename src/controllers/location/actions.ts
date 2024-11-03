import { GiveawayLocation } from '@prisma/client';
import { prisma } from '../..';
import { bot } from '../../bot';
import { BACK_TEXT } from '../../config';
import { getLocTitle, parseActionArgs } from '../../utils';

bot.action(/^choose_location/, async ctx => {
	try {
		const locations = await prisma.giveawayLocation.findMany({ where: { userId: ctx.session?.user?.id } });

		return ctx.editMessageText('Выбери канал или группу', {
			reply_markup: {
				inline_keyboard: [
					...locations.map(loc => [{ text: `${getLocTitle(loc.type)} ${loc.title ?? loc.id}`, callback_data: `location:${loc.id}` }]),
					[{ text: BACK_TEXT, callback_data: 'menu' }],
				],
			},
		});
	} catch (error) {
		console.error(error);
	}
});

bot.action(/^location:(\D+)/, async ctx => {
	try {
		const locationId = parseInt(parseActionArgs(ctx)[1]);

		const loc = (await prisma.giveawayLocation.findUnique({ where: { id: locationId } })) as GiveawayLocation;
		const activeGwCount = await prisma.giveaway.count({ where: { active: true, locationId: loc.id } });

		return ctx.editMessageText(`${getLocTitle(loc.type)} ${loc.title}\n\n💎 Активных розыгрышей: ${activeGwCount}\n`, {
			reply_markup: {
				inline_keyboard: [
					[{ text: `🏅 Активные розыгрыши`, callback_data: `active_gw:${loc.id}` }],
					[{ text: `➕ Создать розыгрыш`, callback_data: `create_gw:${loc.id}` }],
					[{ text: `🚫 Удалить ${loc.type === 'channel' ? 'канал' : 'группу'}`, callback_data: `remove_location:${loc.id}` }],
					[{ text: BACK_TEXT, callback_data: `choose_location:${loc.id}` }],
				],
			},
		});
	} catch (error) {
		console.error(error);
	}
});

bot.action(/^remove_location:(\D+)/, async ctx => {});
