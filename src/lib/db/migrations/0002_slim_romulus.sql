CREATE TABLE `game_run_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`question_text` text NOT NULL,
	`question_token` text NOT NULL,
	`difficulty` integer NOT NULL,
	`answer` text,
	`correct_answer` text,
	`is_correct` integer NOT NULL,
	`time_spent` real,
	`created_at` integer
);
