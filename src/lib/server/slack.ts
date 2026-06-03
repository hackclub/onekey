import { SLACK_BOT_TOKEN } from '$env/static/private';

export async function sendSlackDM(slackUserId: string, text: string): Promise<void> {
	if (!SLACK_BOT_TOKEN) return;

	await fetch('https://slack.com/api/chat.postMessage', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ channel: slackUserId, text, mrkdwn: true })
	});
}
