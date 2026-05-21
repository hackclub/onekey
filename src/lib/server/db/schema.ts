import { pgTable, serial, integer, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const users = pgTable('users', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	hcaId: text('hca_id').notNull().unique(),
	name: text('name'),
	nickname: text('nickname'),
	email: text('email'),
	emailVerified: boolean('email_verified'),
	slackId: text('slack_id'),
	slackAvatarUrl: text('slack_avatar_url'),
	slackDisplayName: text('slack_display_name'),
	verificationStatus: text('verification_status'),
	yswsEligible: boolean('ysws_eligible'),
	accessTokenCt: text('access_token_ct'),
	accessTokenIv: text('access_token_iv'),
	accessTokenTag: text('access_token_tag'),
	hackatimeUserId: text('hackatime_user_id'),
	hackatimeTokenCt: text('hackatime_token_ct'),
	hackatimeTokenIv: text('hackatime_token_iv'),
	hackatimeTokenTag: text('hackatime_token_tag'),
	streetAddress: text('street_address'),
	locality: text('locality'),
	region: text('region'),
	postalCode: text('postal_code'),
	country: text('country'),
	keySfxEnabled: boolean('key_sfx_enabled').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const projects = pgTable('projects', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	screenshotUrl: text('screenshot_url'),
	repoUrl: text('repo_url'),
	demoUrl: text('demo_url'),
	status: text('status'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`)
});
