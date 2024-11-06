import { User } from '@prisma/client';
import 'telegraf/typings/scenes';

declare module 'telegraf' {
	interface Context {
		scene: {
			state: any;
			leave: Function;
			enter: Function;
			session: any;
		};

		session?: {
			admListPage?: number;
		} & { user: User & { isAdmin: boolean } };
	}
}
