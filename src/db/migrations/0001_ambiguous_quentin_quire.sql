CREATE TABLE `stickers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`calendar_user_id` text NOT NULL,
	`month` text NOT NULL,
	`sticker_type` text NOT NULL,
	`x_percent` integer NOT NULL,
	`y_percent` integer NOT NULL,
	`scale` integer DEFAULT 100 NOT NULL,
	`z_index` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`calendar_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_stickers_calendar_month` ON `stickers` (`calendar_user_id`,`month`);