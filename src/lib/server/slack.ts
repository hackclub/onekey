import { env } from '$env/dynamic/private';

export async function sendSlackDM(slackUserId: string, text: string): Promise<void> {
	if (!env.SLACK_BOT_TOKEN) return;

	await fetch('https://slack.com/api/chat.postMessage', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ channel: slackUserId, text, mrkdwn: true })
	});
}

export async function inviteToChannel(slackUserId: string, channelId: string): Promise<void> {
	if (!env.SLACK_BOT_TOKEN) return;

	await fetch('https://slack.com/api/conversations.invite', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ channel: channelId, users: slackUserId })
	});
}
