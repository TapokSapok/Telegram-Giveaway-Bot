import { relations } from 'drizzle-orm';
import { integer, pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core';

export const gwTable = pgTable('giveaway', {
	id: integer().primaryKey().generatedByDefaultAsIdentity(),
	// text: varchar({ length: 255 }).notNull().unique(),
	locationId: integer().references(() => gwLocationTable.id),
});

export const gwTableRelations = relations(gwTable, ({ one }) => ({
	location: one(gwLocationTable, {
		fields: [gwTable.locationId],
		references: [gwLocationTable.id],
	}),
}));

// ==

export const gwLocationTypeEnum = pgEnum('type', ['channel', 'group']);

export const gwLocationTable = pgTable('giveaway_location', {
	type: gwLocationTypeEnum(),
	id: integer().primaryKey(),
});

// ==

export const userTable = pgTable('user', {
	id: integer().primaryKey(),
	username: varchar({ length: 255 }).unique(),
	firstName: varchar({ length: 255 }),
});
