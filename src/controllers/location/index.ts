import { bot } from '../../bot';
import { SCENES } from '../../config';
import { parseActionArgs } from '../../utils';
import { chooseLocationAction, locationAction } from './actions';

bot.action(/^choose_location/, chooseLocationAction);

bot.action(/^location:(\D+)/, ctx => locationAction(ctx));

bot.action(/^delete_loc:(\D+)/, ctx => ctx.scene.enter(SCENES.DELETE_LOC, { args: parseActionArgs(ctx) }));
