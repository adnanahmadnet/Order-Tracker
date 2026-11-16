DROP TABLE `translations`;
--> statement-breakpoint
CREATE TABLE `text_translations` (
	`lang` text NOT NULL,
	`source` text NOT NULL,
	`translated` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`lang`, `source`)
);
