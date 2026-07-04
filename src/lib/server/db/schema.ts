import { pgTable, serial, integer, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const users = pgTable('users', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
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
	// Latest result from Hack Club Identity's /api/external/check, refreshed at login.
	yswsCheckResult: text('ysws_check_result'),
	birthday: text('birthday'),
	accessTokenCt: text('access_token_ct'),
	accessTokenIv: text('access_token_iv'),
	accessTokenTag: text('access_token_tag'),
	hackatimeUserId: text('hackatime_user_id'),
	hackatimeTokenCt: text('hackatime_token_ct'),
	hackatimeTokenIv: text('hackatime_token_iv'),
	hackatimeTokenTag: text('hackatime_token_tag'),
	streetAddress: text('street_address'),
	addressLine2: text('address_line_2'),
	locality: text('locality'),
	region: text('region'),
	postalCode: text('postal_code'),
	country: text('country'),
	keySfxEnabled: boolean('key_sfx_enabled').notNull().default(true),
	darkModeEnabled: boolean('dark_mode_enabled').notNull().default(false),
	// null = hasn't finished the onboarding flow yet; set once they complete it
	onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
	// null = hasn't claimed their one unverified-tier prize yet; set when they do.
	// Unverified users may claim exactly one prize (ever); verifying unlocks the full shop instead.
	prizeClaimedAt: timestamp('prize_claimed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
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
	hackatimeProject: text('hackatime_project'),
	aiDeclaration: text('ai_declaration'),
	// Reviewer-set flag: project is under Fraud Squad investigation. Admin-only
	// toggle; surfaces a red tint + badge in the review queue and an internal-only
	// comment on the project timeline. Never exposed to the project's author.
	fraudCheck: boolean('fraud_check').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});

export const projectApprovals = pgTable('project_approvals', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	projectId: integer('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	submittedById: uuid('submitted_by_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	reviewerId: uuid('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
	submittedSeconds: integer('submitted_seconds').notNull(),
	approvedSeconds: integer('approved_seconds'),
	status: text('status').notNull().default('pending'),
	publicMessage: text('public_message'),
	internalNote: text('internal_note'),
	aiDeclaration: text('ai_declaration'),
	npsHeardAbout: text('nps_heard_about'),
	npsDoingWell: text('nps_doing_well'),
	npsImprove: text('nps_improve'),
	submittedAt: timestamp('submitted_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`),
	reviewedAt: timestamp('reviewed_at', { withTimezone: true })
});

export const projectEvents = pgTable('project_events', {
	id: serial('id').primaryKey(),
	projectId: integer('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	actorId: uuid('actor_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	action: text('action').notNull(), // 'submitted' | 'approved' | 'rejected' | 'comment' | 'fraud_check' | 'fraud_check_cleared'
	message: text('message'),
	internalNote: text('internal_note'),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});

export const projectExploreSnapshots = pgTable('project_explore_snapshots', {
	projectId: integer('project_id')
		.primaryKey()
		.references(() => projects.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	screenshotUrl: text('screenshot_url'),
	demoUrl: text('demo_url'),
	totalApprovedSeconds: integer('total_approved_seconds').notNull().default(0),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});

export const shopCategories = pgTable('shop_categories', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description'),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});

export const shopItems = pgTable('shop_items', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	categoryId: integer('category_id')
		.notNull()
		.references(() => shopCategories.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	priceSeconds: integer('price_seconds').notNull(),
	discountSeconds: integer('discount_seconds'), // null = no discount
	imageUrl: text('image_url'),
	stock: integer('stock').notNull().default(-1), // -1 = unlimited
	available: boolean('available').notNull().default(true),
	options: text('options').notNull().default('[]'), // JSON: Array<{label: string, choices: string[]}>
	imagePadding: integer('image_padding').notNull().default(0),
	fulfilledLocally: boolean('fulfilled_locally').notNull().default(false), // show "fulfilled locally" disclaimer in modal
	// true = hidden from the normal shop; only offered as one of the unverified-tier claimable prizes
	unverifiedPrize: boolean('unverified_prize').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});

export const shopOrders = pgTable('shop_orders', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	itemId: integer('item_id')
		.notNull()
		.references(() => shopItems.id, { onDelete: 'restrict' }),
	priceSeconds: integer('price_seconds').notNull(),
	status: text('status').notNull().default('ordered'), // ordered | shipped | fulfilled | refunded
	selectedOptions: text('selected_options').notNull().default('{}'), // JSON: Record<string, string>
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});

export const siteSettings = pgTable('site_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

// A single "current" timed goal shown on the home dashboard in place of the
// community goals card. The latest row (by createdAt) is the active goal; when
// no row exists the home card falls back to the community goals widget.
// Progress is computed live from approved hours (never stored): by default only
// hours approved within the goal window (createdAt → deadline) count; when
// allTime is set, all approved hours count (same pool as the community card).
// The countdown ring runs from createdAt (full) to deadline (empty).
export const timedGoals = pgTable('timed_goals', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	name: text('name').notNull(),
	description: text('description'),
	targetHours: integer('target_hours').notNull(),
	allTime: boolean('all_time').notNull().default(false),
	deadline: timestamp('deadline', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});

export const balanceAdjustments = pgTable('balance_adjustments', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	adminId: uuid('admin_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	seconds: integer('seconds').notNull(),
	message: text('message').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});

export const approvedSubmissions = pgTable('approved_submissions', {
	id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
	approvalId: integer('approval_id')
		.notNull()
		.unique()
		.references(() => projectApprovals.id, { onDelete: 'cascade' }),
	projectId: integer('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

	// author identity snapshot
	authorName: text('author_name'),
	authorHcaId: text('author_hca_id'),
	authorEmail: text('author_email'),

	// author address snapshot at approval time
	authorStreetAddress: text('author_street_address'),
	authorAddressLine2: text('author_address_line_2'),
	authorLocality: text('author_locality'),
	authorRegion: text('author_region'),
	authorPostalCode: text('author_postal_code'),
	authorCountry: text('author_country'),

	// project state snapshot at approval time
	projectName: text('project_name').notNull(),
	projectDescription: text('project_description'),
	projectRepoUrl: text('project_repo_url'),
	projectDemoUrl: text('project_demo_url'),
	projectScreenshotUrl: text('project_screenshot_url'),
	projectAiDeclaration: text('project_ai_declaration'),
	hackatimeProject: text('hackatime_project'),

	// author birthday snapshot
	authorBirthday: text('author_birthday'),

	// approval data
	submittedSeconds: integer('submitted_seconds').notNull(),
	approvedSeconds: integer('approved_seconds').notNull(),
	publicMessage: text('public_message'),
	internalNote: text('internal_note'),

	// NPS feedback collected at submission time
	npsHeardAbout: text('nps_heard_about'),
	npsDoingWell: text('nps_doing_well'),
	npsImprove: text('nps_improve'),

	submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull(),
	approvedAt: timestamp('approved_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});

export const reviewers = pgTable('reviewers', {
	id: uuid('id').primaryKey().defaultRandom(),
	hcaId: text('hca_id').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.default(sql`now()`)
});
