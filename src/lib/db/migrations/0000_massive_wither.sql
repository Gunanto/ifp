CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`grade` integer NOT NULL,
	`teacher_id` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`game_type` text NOT NULL,
	`difficulty` integer DEFAULT 1,
	`teacher_id` text,
	`class_id` text,
	`settings` text,
	`status` text DEFAULT 'waiting',
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`sub_topic` text NOT NULL,
	`difficulty` integer NOT NULL,
	`question_text` text NOT NULL,
	`question_data` text NOT NULL,
	`correct_answer` text NOT NULL,
	`solution_steps` text,
	`hint` text,
	`metadata` text,
	`created_by` text,
	`is_approved` integer DEFAULT false,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `student_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`session_id` text,
	`question_id` text NOT NULL,
	`answer` text,
	`is_correct` integer,
	`time_spent` real,
	`used_hints` integer DEFAULT 0,
	`confidence` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`password_hash` text NOT NULL,
	`class_id` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_sessions_code_unique` ON `game_sessions` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);