// One-off audit for stored non-http(s) URLs (e.g. `javascript:` XSS payloads)
// in project/explore/approval rows. Pass `--fix` to NULL out the offending urls.
//   node --env-file=.env scripts/scan-unsafe-urls.mjs [--fix]
//   DATABASE_URL=... node scripts/scan-unsafe-urls.mjs [--fix]
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const fix = process.argv.includes('--fix');
const sql = postgres(url, { max: 1 });

// A value is unsafe if it's non-empty and does not start with http:// or https://
const isUnsafe = (col) => sql`${sql(col)} IS NOT NULL AND ${sql(col)} <> '' AND ${sql(col)} !~* '^https?://'`;

try {
	const projectsBad = await sql`
		SELECT id, user_id, repo_url, demo_url FROM projects
		WHERE (${isUnsafe('repo_url')}) OR (${isUnsafe('demo_url')})`;
	const snapshotsBad = await sql`
		SELECT project_id, demo_url FROM project_explore_snapshots
		WHERE ${isUnsafe('demo_url')}`;
	const approvalsBad = await sql`
		SELECT id, project_id, project_repo_url, project_demo_url FROM approved_submissions
		WHERE (${isUnsafe('project_repo_url')}) OR (${isUnsafe('project_demo_url')})`;

	console.log(`projects with unsafe url:            ${projectsBad.length}`);
	console.log(`explore snapshots with unsafe url:   ${snapshotsBad.length}`);
	console.log(`approved submissions with unsafe url:${approvalsBad.length}`);
	for (const r of projectsBad) console.dir(r, { depth: null });
	for (const r of snapshotsBad) console.dir(r, { depth: null });
	for (const r of approvalsBad) console.dir(r, { depth: null });

	if (fix) {
		const u = (col) => sql`${sql(col)} = CASE WHEN ${isUnsafe(col)} THEN NULL ELSE ${sql(col)} END`;
		await sql`UPDATE projects SET ${u('repo_url')}, ${u('demo_url')}
			WHERE (${isUnsafe('repo_url')}) OR (${isUnsafe('demo_url')})`;
		await sql`UPDATE project_explore_snapshots SET ${u('demo_url')} WHERE ${isUnsafe('demo_url')}`;
		await sql`UPDATE approved_submissions SET ${u('project_repo_url')}, ${u('project_demo_url')}
			WHERE (${isUnsafe('project_repo_url')}) OR (${isUnsafe('project_demo_url')})`;
		console.log('\n--fix applied: offending urls set to NULL');
	} else {
		console.log('\n(read-only scan; re-run with --fix to NULL out offending urls)');
	}
} finally {
	await sql.end();
}
