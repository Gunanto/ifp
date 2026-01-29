CREATE TABLE `game_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'mixed',
	`score` integer DEFAULT 0,
	`difficulty` integer DEFAULT 3,
	`streak` integer DEFAULT 0,
	`total_answered` integer DEFAULT 0,
	`correct_answered` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`time_limit` integer DEFAULT 60,
	`created_at` integer,
	`updated_at` integer
);
