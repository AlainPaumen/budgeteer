ALTER TABLE `locations` RENAME TO `affiliates`;
--> statement-breakpoint
ALTER TABLE `branches` RENAME COLUMN `location_id` TO `affiliate_id`;
