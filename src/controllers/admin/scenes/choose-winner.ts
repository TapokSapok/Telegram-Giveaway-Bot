import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { SCENES } from '../../../config';
import { errorReply, parseActionArgs } from '../../../utils';
import { admMenuAction, admWinnerAction } from '../actions';

export const admChooseWinnerScene = new Scenes.WizardScene(
	SCENES.ADM_CHOOSE_WINNER,
	//@ts-ignore
	async ctx => {
		try {
			ctx.scene.state.args = ctx.scene.session.state.args as any[];
			const args = ctx.scene.state.args;
			const type = args[3];
			const gwId = Number(args[1]);
			const admPage = Number(args[2]);
			const gw = await prisma.giveaway.findUnique({
				where: { id: gwId },
			});
			if (!gw) {
				ctx.scene.leave();
				ctx.reply('Нет такого розыгрыша');
				return admMenuAction(ctx);
			}
			ctx.scene.state.gw = gw;

			const winners = await prisma.userParticipant.findMany({ where: { giveawayId: gwId, isWinner: true }, include: { user: true } });
			ctx.scene.state.winners = winners;

			if (type === 'add') {
				await ctx.reply(`Введи айди либо тег участников розыгрыша (до ${gw.winnerCount}), что бы выбрать его/их победителем`, {
					reply_markup: { inline_keyboard: [[{ text: 'Отмена', callback_data: `cancel:${gwId}:${admPage}` }]] },
				});
			} else if (type === 'remove') {
				await ctx.reply(
					`${winners
						.map((w, i) => (w.user.username ? '@' + w.user.username : w.userId))
						.join(', ')}\n\nВведи айди либо тег, пользователя из списка выше, что бы убрать его из списка победителей`,
					{
						reply_markup: { inline_keyboard: [[{ text: 'Отмена', callback_data: `cancel:${gwId}:${admPage}` }]] },
					}
				);
			}

			return ctx.wizard.next();
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	},
	async ctx => {
		try {
			const args = ctx.scene.state.args;
			const type = args[3];
			const gwId = Number(args[1]);
			const admPage = Number(args[2]);
			const { gw, winners } = ctx.scene.state;

			if (typeof ctx.text !== 'string') return ctx.reply('Неверный формат');

			let res = [];

			if (type === 'add') {
				const writedParts = ctx.text?.split(' ') ?? [];

				if (winners.length + writedParts.length > gw.winnerCount) {
					ctx.scene.leave();
					ctx.reply('❌ Перебор по кол-ву победителей');
					return ctx.scene.reenter();
				}

				for (let value of writedParts) {
					if (value[0] === '@') value = value.slice(1, value.length);
					try {
						let participant = await prisma.userParticipant.findFirst({
							where: {
								OR: [{ id: parseInt(value) ? parseInt(value) : 0 }, { user: { username: value } }],
								giveawayId: gwId,
							},
							include: { user: true },
						});
						if (participant) {
							participant = await prisma.userParticipant.update({ where: { id: participant.id }, data: { isWinner: true }, include: { user: true } });
							res.push('✅ ' + value);
						} else {
							res.push('🚫 ' + value);
						}
					} catch (error) {
						console.log(error);
					}
				}
			} else if (type === 'remove') {
				let value = ctx.text as string;
				if (value[0] === '@') value = value.slice(1, value.length);

				try {
					let participant = await prisma.userParticipant.findFirst({
						where: {
							OR: [{ id: parseInt(value) ? parseInt(value) : 0 }, { user: { username: value } }],
							giveawayId: gwId,
						},
						include: { user: true },
					});
					if (participant) {
						participant = await prisma.userParticipant.update({ where: { id: participant.id }, data: { isWinner: false }, include: { user: true } });
						res.push('✅ ' + value);
					} else {
						res.push('🚫 ' + value);
					}
				} catch (error) {
					console.error(error);
				}
			}

			ctx.reply(res.join('\n') + '.');

			ctx.scene.leave();

			return admWinnerAction(ctx, [null, gwId, admPage], true);
		} catch (error) {
			errorReply(ctx);
			console.error(error);
		}
	}
);

admChooseWinnerScene.action(/^cancel:(.+)/, async ctx => {
	ctx.answerCbQuery().catch(() => {});
	ctx.scene.leave();
	admWinnerAction(ctx, parseActionArgs(ctx));
});
