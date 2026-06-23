CREATE TABLE `timelines` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT 'Untitled Timeline' NOT NULL,
	`graph_json` text DEFAULT '{"nodes":[],"edges":[],"viewport":null}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
