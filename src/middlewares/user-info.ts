import 'dotenv/config';
import { Context } from 'telegraf';
import { prisma } from '..';

export async function userInfoMiddleware(ctx: Context, next: Function) {
	if (!ctx.from) return next();
	try {
		const id = ctx.from.id;
		const firstName = ctx.from?.first_name;
		const username = ctx.from?.username;
		let user = await prisma.user.findUnique({
			where: { id },
		});

		if (!user) {
			user = await prisma.user.create({
				data: {
					firstName,
					id,
					username,
				},
			});
		}

		if (!ctx.session) ctx.session = {};
		ctx.session.user = { ...user, isAdmin: process.env.ADMIN_IDS?.split(',').includes(String(user.id)) ?? false };
		return next();
	} catch (error) {
		console.error(error);
	}
}
