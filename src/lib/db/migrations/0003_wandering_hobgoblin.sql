CREATE TABLE `war_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'waiting',
	`settings` text,
	`state` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `war_rooms_code_unique` ON `war_rooms` (`code`);