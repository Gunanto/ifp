CREATE TABLE `war_leaderboard` (
	`id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`player_id` text NOT NULL,
	`player_name` text NOT NULL,
	`team` text NOT NULL,
	`score` integer DEFAULT 0,
	`hp_left` integer DEFAULT 0,
	`is_winner` integer DEFAULT false,
	`created_at` integer
);
