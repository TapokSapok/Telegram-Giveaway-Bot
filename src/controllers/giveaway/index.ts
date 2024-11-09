import { bot } from '../../bot';
import { SCENES } from '../../config';
import { parseActionArgs } from '../../utils';
import { activeGwAction, changeGwAction, createGwAction, editGwAction, finishGwAction, publicateGwAction, showGwAction, sumGwResultsAction } from './actions';

bot.action(/^active_gw:(\D+)/, ctx => activeGwAction(ctx));

bot.action(/^show_gw:(.+)/, ctx => showGwAction(ctx));

bot.action(/^create_gw:(.+)/, createGwAction);

bot.action(/^publicate_gw:(.+)/, publicateGwAction);

bot.action(/^edit_gw:(.+)/, ctx => editGwAction(ctx));

bot.action(/^change_gw:(.+):(.+)/, changeGwAction);

bot.action(/^delete_gw:(.+)/, ctx => ctx.scene.enter(SCENES.DELETE_GW, { args: parseActionArgs(ctx) }));

bot.action(/^sum_gw_results:(.+)/, ctx => sumGwResultsAction(ctx));

bot.action(/^finish_gw:(.+)/, ctx => finishGwAction(ctx));

bot.action(/^retry_captcha:(.+)/, ctx => {
	ctx.answerCbQuery().catch(() => {});
	const gwId = Number(parseActionArgs(ctx)[1]);
	console.log(gwId);
	ctx.scene.enter(SCENES.SOLVE_CAPTCHA, { gwId: gwId, retry: true });
});
