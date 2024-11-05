import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { bot } from '../../../bot';
import { SCENES } from '../../../config';
import { errorReply, getLocTitle, isBotInChat, sendMenu } from '../../../utils';
import { chooseLocationAction, locationAction } from '../actions';

export const deleteLocScene = new Scenes.WizardScene(
	SCENES.DELETE_LOC,
	//@ts-ignore
	async ctx => {
		try {
			//@ts-ignore
			ctx.scene.session.state.locId = parseInt(ctx.scene.session.state.args[1]);
			//@ts-ignore
			const locId = ctx.scene.session.state.locId;
			const loc = await prisma.giveawayLocation.findUnique({ where: { id: locId } });

			ctx.reply(`Вы уверены что хотите удалить ${getLocTitle(loc!.type)} "${loc?.title}" ?`, {
				reply_markup: {
					inline_keyboard: [
						[{ text: '✅ Подтвердить', callback_data: 'confirm' }],
						// @ts-ignore
						[{ text: 'Отмена', callback_data: `cancel` }],
					],
				},
			});

			return ctx.wizard.next();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	}
);

deleteLocScene.action(/^cancel/, async ctx => {
	ctx.scene.leave();

	//@ts-ignore
	locationAction(ctx, ctx.scene.session.state.locId, true);
});

deleteLocScene.action(/^confirm/, async ctx => {
	try {
		//@ts-ignore
		const locId = ctx.scene.session.state.locId;

		const botFromChat = await isBotInChat(ctx, locId);

		const loc = await prisma.giveawayLocation.findUnique({ where: { id: locId }, include: { _count: true } });
		if (!loc) {
			ctx.scene.leave();
			sendMenu(ctx);
			return ctx.reply('🚫 Нет такого чата');
		}

		if (!botFromChat) {
			await prisma.giveawayLocation.delete({ where: { id: locId } });

			ctx.scene.leave();
			sendMenu(ctx);
			return ctx.reply(`🚫 ${getLocTitle(loc.type)} не находится в этом чате!`);
		}

		await bot.telegram.leaveChat(Number(locId));

		await prisma.giveawayLocation.delete({ where: { id: locId } });

		if (loc!._count.giveaways < 2) {
			chooseLocationAction(ctx);
		} else {
			chooseLocationAction(ctx);
		}

		ctx.answerCbQuery(`✅ ${getLocTitle(loc?.type!)} успешно удален!`);
		ctx.scene.leave();
	} catch (error) {
		errorReply(ctx);
		console.log(error);
	}
});
