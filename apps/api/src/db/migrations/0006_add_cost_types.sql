CREATE TABLE `cost_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`isFixed` integer NOT NULL DEFAULT 1,
	`isCapex` integer NOT NULL DEFAULT 0,
	`isActive` integer NOT NULL DEFAULT 1,
	`createdBy` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedBy` text NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updatedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cost_types_name_unique` ON `cost_types` (`name`);
