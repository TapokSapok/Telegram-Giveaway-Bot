import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { bot } from './bot';

export const prisma = new PrismaClient();

async function main() {
	await prisma.$connect();
}
main();

bot;
