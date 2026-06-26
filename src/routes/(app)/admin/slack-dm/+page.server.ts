import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendUserDM } from '$lib/server/slack';
import { computeCohorts, COHORTS, type CohortKey } from '$lib/server/cohorts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SEND_DELAY_MS = 350; // gentle throttle between DMs to stay under Slack rate limits

const isCohortKey = (v: unknown): v is CohortKey =>
	v === 'no_project' || v === 'no_hackatime' || v === 'not_shipped';

export async function load({ locals }) {
	if (!locals.isAdmin) error(403, 'Forbidden');

	const cohorts = await computeCohorts();

	return {
		tokenConfigured: Boolean(env.SLACK_USER_TOKEN),
		cohortMeta: COHORTS,
		cohorts: COHORTS.map((c) => ({
			key: c.key,
			label: c.label,
			description: c.description,
			reachable: cohorts[c.key].reachable,
			reachableCount: cohorts[c.key].reachable.length,
			unreachableCount: cohorts[c.key].unreachableCount
		}))
	};
}

async function getAdminSlackId(hcaId: string) {
	const [row] = await db
		.select({ slackId: users.slackId })
		.from(users)
		.where(eq(users.hcaId, hcaId))
		.limit(1);
	return row?.slackId ?? null;
}

export const actions = {
	// Send the composed message only to the logged-in admin, so they can eyeball it.
	test: async ({ request, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden');

		const token = env.SLACK_USER_TOKEN;
		if (!token) return fail(400, { error: 'SLACK_USER_TOKEN is not configured on the server.' });

		const form = await request.formData();
		const message = (form.get('message') as string)?.trim();
		if (!message) return fail(400, { error: 'message is required' });

		const imageUrl = (form.get('image_url') as string)?.trim() || null;
		if (imageUrl && !/^https?:\/\//i.test(imageUrl))
			return fail(400, { error: 'image URL must start with http(s)://' });

		const slackId = await getAdminSlackId(locals.user!.sub);
		if (!slackId)
			return fail(400, { error: 'your account has no linked Slack ID, so a test DM cannot be sent.' });

		const res = await sendUserDM(token, slackId, message, imageUrl);
		if (!res.ok) return fail(400, { error: `test DM failed: ${res.error}` });

		return { tested: true };
	},

	// Send the message to every reachable user in the chosen cohort.
	send: async ({ request, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden');

		const token = env.SLACK_USER_TOKEN;
		if (!token) return fail(400, { error: 'SLACK_USER_TOKEN is not configured on the server.' });

		const form = await request.formData();
		const cohortKey = form.get('cohort');
		const message = (form.get('message') as string)?.trim();
		const confirm = (form.get('confirm') as string)?.trim();
		const imageUrl = (form.get('image_url') as string)?.trim() || null;

		if (!isCohortKey(cohortKey)) return fail(400, { error: 'pick a valid cohort' });
		if (!message) return fail(400, { error: 'message is required' });
		if (imageUrl && !/^https?:\/\//i.test(imageUrl))
			return fail(400, { error: 'image URL must start with http(s)://' });
		if (confirm !== 'CONFIRM')
			return fail(400, { error: 'type CONFIRM in the confirmation box to send' });

		// recompute server-side — never trust a client-supplied recipient list
		const cohorts = await computeCohorts();
		const recipients = cohorts[cohortKey].reachable;

		if (recipients.length === 0) return fail(400, { error: 'this cohort has no reachable users' });

		let sent = 0;
		const failures: { name: string; error: string }[] = [];

		for (const r of recipients) {
			if (!r.slackId) continue;
			let res = await sendUserDM(token, r.slackId, message, imageUrl);

			// one retry if Slack rate-limits us
			if (!res.ok && res.error === 'ratelimited') {
				await sleep((res.retryAfter ?? 5) * 1000);
				res = await sendUserDM(token, r.slackId, message, imageUrl);
			}

			if (res.ok) sent++;
			else failures.push({ name: r.name, error: res.error ?? 'unknown' });

			await sleep(SEND_DELAY_MS);
		}

		return {
			sent: true,
			cohort: cohortKey,
			sentCount: sent,
			failedCount: failures.length,
			failures: failures.slice(0, 25)
		};
	}
};
