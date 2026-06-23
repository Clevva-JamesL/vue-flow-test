CREATE TABLE `media_items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`release_date` text,
	`external_ids` text,
	`metadata_cache` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `timeline_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`timeline_id` text NOT NULL,
	`vue_edge_id` text NOT NULL,
	`source_vue_id` text NOT NULL,
	`target_vue_id` text NOT NULL,
	`edge_type` text,
	`edge_data` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`timeline_id`) REFERENCES `timelines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `timeline_edges_timeline_vue_edge_idx` ON `timeline_edges` (`timeline_id`,`vue_edge_id`);--> statement-breakpoint
CREATE TABLE `timeline_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`timeline_id` text NOT NULL,
	`media_item_id` text,
	`vue_node_id` text NOT NULL,
	`position_x` real NOT NULL,
	`position_y` real NOT NULL,
	`parent_vue_node_id` text,
	`node_type` text NOT NULL,
	`node_data` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`timeline_id`) REFERENCES `timelines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `timeline_nodes_timeline_vue_node_idx` ON `timeline_nodes` (`timeline_id`,`vue_node_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `timelines` ADD `owner_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `timelines` ADD `visibility` text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE `timelines` ADD `share_slug` text;--> statement-breakpoint
ALTER TABLE `timelines` ADD `viewport` text;--> statement-breakpoint
ALTER TABLE `timelines` ADD `published_at` integer;--> statement-breakpoint
ALTER TABLE `timelines` ADD `published_graph_json` text;--> statement-breakpoint
CREATE UNIQUE INDEX `timelines_share_slug_unique` ON `timelines` (`share_slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `timelines_share_slug_idx` ON `timelines` (`share_slug`);