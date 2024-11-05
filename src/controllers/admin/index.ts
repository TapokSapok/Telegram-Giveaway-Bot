import { bot } from '../../bot';
import { SCENES } from '../../config';
import { parseActionArgs } from '../../utils';
import { admGwListAction, admMailingAction, admMenuAction, admStatsAction, admWinnerAction } from './actions';

bot.action(/^adm_menu/, ctx => admMenuAction(ctx));
bot.action(/^adm_stats/, ctx => admStatsAction(ctx));
bot.action(/^adm_gw_list/, ctx => admGwListAction(ctx));
bot.action(/^adm_mailing/, ctx => admMailingAction(ctx));

bot.action(/^adm_winners:(.+)/, ctx => admWinnerAction(ctx));

bot.action(/^adm_choose_winner:(.+)/, ctx => ctx.scene.enter(SCENES.ADM_CHOOSE_WINNER, { args: parseActionArgs(ctx) }));
