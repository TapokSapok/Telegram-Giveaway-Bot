import { Context } from 'telegraf';
import { prisma } from '../..';
import { BACK_TEXT } from '../../config';
import { getLocTitle, parseActionArgs, sendMenu } from '../../utils';

export async function chooseLocationAction(ctx: Context) {
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
}

export async function locationAction(ctx: Context, locId2?: number, isReply?: boolean) {
	try {
		const args = parseActionArgs(ctx);
		const locationId = args?.length >= 2 ? parseInt(args[1]) : locId2;

		const loc = await prisma.giveawayLocation.findUnique({ where: { id: locationId } });
		if (!loc) {
			sendMenu(ctx);
			return;
		}

		const activeGwCount = await prisma.giveaway.count({ where: { active: true, locationId: locationId } });

		const text = `${getLocTitle(loc.type)} ${loc.title}\n\n💎 Активных розыгрышей: ${activeGwCount}\n`;
		const extra = {
			reply_markup: {
				inline_keyboard: [
					[{ text: `🏅 Активные розыгрыши`, callback_data: `active_gw:${loc.id}` }],
					[{ text: `➕ Создать розыгрыш`, callback_data: `create_gw:${loc.id}` }],
					[{ text: `🚫 Удалить ${loc.type === 'channel' ? 'канал' : 'группу'}`, callback_data: `delete_loc:${loc.id}` }],
					[{ text: BACK_TEXT, callback_data: `choose_location:${loc.id}` }],
				],
			},
		};

		if (isReply) return ctx.reply(text, extra);
		else return ctx.editMessageText(text, extra);
	} catch (error) {
		console.error(error);
	}
}

export async function deleteLocation(ctx: Context) {}
