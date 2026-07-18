CREATE TABLE `invoice_line_tags` (
	`invoice_line_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`invoice_line_id`, `tag_id`),
	FOREIGN KEY (`invoice_line_id`) REFERENCES `invoice_lines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
