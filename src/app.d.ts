declare global {
	namespace App {
		interface Locals {
			isAdmin: boolean;
			isReviewer: boolean;
			user: {
				sub: string;
				name?: string;
				nickname?: string;
				email?: string;
				email_verified?: boolean;
				slack_id?: string;
				verification_status?: string;
				avatar_url?: string;
				slack_display_name?: string;
				ysws_eligible?: boolean;
				address?: {
					street_address?: string;
					locality?: string;
					region?: string;
					postal_code?: string;
					country?: string;
				};
			} | null;
		}
	}
}

export {};
