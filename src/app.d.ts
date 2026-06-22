declare global {
	namespace App {
		interface Locals {
			isAdmin: boolean;
			isReviewer: boolean;
			isLaunched: boolean;
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
				hackatime_linked: boolean;
				onboarded: boolean;
				street_address?: string;
				address_line_2?: string;
				locality?: string;
				region?: string;
				postal_code?: string;
				country?: string;
				key_sfx_enabled: boolean;
				dark_mode_enabled: boolean;
			} | null;
		}
	}
}

export {};
