import { Scenes } from 'telegraf';
import { prisma } from '../../..';
import { SCENES } from '../../../config';
import { errorReply, getUserName, parseActionArgs } from '../../../utils';
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
				if (winners.length === gw.winnerCount) {
					ctx.editMessageText('🚫 Больше победителей выбрать нельзя!');
					ctx.scene.leave();
					admWinnerAction(ctx, [null, ctx.scene.state.args[1], ctx.scene.state.args[2]], true);
					return;
				}

				await ctx.reply(`Введи айди либо тег участника розыгрыша, и место, что бы выбрать его победителем.\n<code>через пробел</code>`, {
					parse_mode: 'HTML',
					reply_markup: { inline_keyboard: [[{ text: 'Отмена', callback_data: `cancel:${gwId}:${admPage}` }]] },
				});
			} else if (type === 'remove') {
				await ctx.reply(
					`${winners
						.map((w, i) => getUserName(w.user) + (w.winnerIndex ? ` - ${w.winnerIndex} место` : ''))
						.join('\n')}\n\nВведи айди либо тег, пользователя из списка выше, что бы убрать его из списка победителей`,
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

			if (type === 'add') {
				let [value, winnerIndex] = ctx?.text?.split(' ') as [string, number];

				if (winnerIndex && (winnerIndex > gw.winnerCount || winnerIndex < 1)) {
					await ctx.reply('🚫 Нет столько мест для победителей, и место должно быть больше нуля');
					ctx.scene.leave();
					return admWinnerAction(ctx, [null, gwId, admPage], true);
				}
				if (value[0] === '@') value = value.slice(1, value.length);

				let participant = await prisma.userParticipant.findFirst({
					where: {
						OR: [{ user: { id: parseInt(value) ? parseInt(value) : 0 } }, { user: { username: value } }],
						giveawayId: gwId,
					},
					include: { user: true },
				});
				if (participant) {
					participant = await prisma.userParticipant.update({
						where: { id: participant.id },
						data: { isWinner: true, winnerIndex: winnerIndex ? Number(winnerIndex) : null },
						include: { user: true },
					});

					await ctx.reply(
						`✅ ${participant.user.username ? '@' + participant.user.username : participant.user.id} успешно выбран победителем ${winnerIndex ? `на ${winnerIndex} место` : ''}`
					);
				} else {
					await ctx.reply('🚫 Не удалось пользователя среди участников');
				}
			} else if (type === 'remove') {
				let value = ctx?.text as string;
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
						await ctx.reply(`✅ ${participant.user.username ? '@' + participant.user.username : participant.user.id} убран из списка победителей`);
					} else {
						await ctx.reply('🚫 Не удалось пользователя среди победителей');
					}
				} catch (error) {
					console.error(error);
				}
			}

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
