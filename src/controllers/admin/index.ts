import { bot } from '../../bot';
import { SCENES } from '../../config';
import { getIsAdmin, parseActionArgs } from '../../utils';
import { admGwListAction, admMailingAction, admMenuAction, admStatsAction, admWinnerAction } from './actions';

bot.action(/^adm_menu/, ctx => (getIsAdmin(ctx?.from?.id) ? admMenuAction(ctx) : undefined));
bot.action(/^adm_stats/, ctx => (getIsAdmin(ctx?.from?.id) ? admStatsAction(ctx) : undefined));
bot.action(/^adm_gw_list/, ctx => (getIsAdmin(ctx?.from?.id) ? admGwListAction(ctx) : undefined));
bot.action(/^adm_mailing/, ctx => (getIsAdmin(ctx?.from?.id) ? admMailingAction(ctx) : undefined));

bot.action(/^adm_winners:(.+)/, ctx => (getIsAdmin(ctx?.from?.id) ? admWinnerAction(ctx) : undefined));

bot.action(/^adm_choose_winner:(.+)/, ctx => (getIsAdmin(ctx?.from?.id) ? ctx.scene.enter(SCENES.ADM_CHOOSE_WINNER, { args: parseActionArgs(ctx) }) : undefined));
