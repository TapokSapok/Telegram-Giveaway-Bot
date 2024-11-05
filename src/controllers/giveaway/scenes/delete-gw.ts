import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { SCENES } from '../../../config';
import { errorReply } from '../../../utils';
import { locationAction } from '../../location/actions';
import { showGwAction } from '../actions';

export const deleteGwScene = new Scenes.WizardScene(
	SCENES.DELETE_GW,
	//@ts-ignore
	async ctx => {
		try {
			ctx.answerCbQuery();
			//@ts-ignore
			ctx.scene.session.state.gwId = parseInt(ctx.scene.session.state.args[1]);
			ctx.reply('Вы уверены что хотите удалить этот розыгрыш?', {
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

deleteGwScene.action(/^cancel/, async ctx => {
	ctx.scene.leave();
	ctx.answerCbQuery();
	//@ts-ignore
	showGwAction(ctx, [null, ctx.scene.session.state.gwId], true);
});

deleteGwScene.action(/^confirm/, async ctx => {
	try {
		//@ts-ignore
		const gwId = ctx.scene.session.state.gwId;
		const gw = await prisma.giveaway.delete({
			where: { id: gwId },
			include: {
				location: {
					include: {
						_count: {
							select: {
								giveaways: { where: { active: true } },
							},
						},
					},
				},
			},
		});

		const locId = Number(gw.locationId);

		ctx.scene.leave();

		locationAction(ctx, locId, true);

		// if (gw.location._count.giveaways < 2) {
		// 	locationAction(ctx, locId, true);
		// } else {
		// 	locationAction(ctx, locId, true);
		// }

		ctx.answerCbQuery('✅ Розыгрыш успешно удален!');
	} catch (error) {
		errorReply(ctx);
		console.log(error);
	}
});
