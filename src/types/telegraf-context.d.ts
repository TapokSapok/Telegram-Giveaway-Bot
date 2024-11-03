import { Giveaway, User } from '@prisma/client';
import 'telegraf/typings/scenes';

declare module 'telegraf' {
	interface Context {
		scene: {
			state: {
				locId: number;
				gw: Giveaway;
			};
			leave: Function;
			enter: Function;
		};
		session?: {
			user?: User & { isAdmin: boolean };
		};
	}
}
