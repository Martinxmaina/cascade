CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`website` text,
	`name` text,
	`offer` text,
	`price_point` text,
	`regions` text DEFAULT '[]' NOT NULL,
	`sizes` text DEFAULT '[]' NOT NULL,
	`lead_target` integer DEFAULT 50 NOT NULL,
	`brand` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `credit_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`credits` real NOT NULL,
	`run_id` text,
	`stripe_session_id` text,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_ledger_stripe_session_id_unique` ON `credit_ledger` (`stripe_session_id`);--> statement-breakpoint
CREATE INDEX `ledger_user_idx` ON `credit_ledger` (`user_id`);--> statement-breakpoint
CREATE INDEX `ledger_run_idx` ON `credit_ledger` (`run_id`);--> statement-breakpoint
CREATE TABLE `filter_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`filter_type` text NOT NULL,
	`values` text NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `icps` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`json` text NOT NULL,
	`note` text,
	`approved_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pages_read` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`url` text NOT NULL,
	`markdown` text NOT NULL,
	`treg_call_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `price_list` (
	`id` text PRIMARY KEY NOT NULL,
	`result_type` text NOT NULL,
	`label` text NOT NULL,
	`credits` real NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `price_list_result_type_unique` ON `price_list` (`result_type`);--> statement-breakpoint
CREATE TABLE `provider_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`row_id` text NOT NULL,
	`step` text NOT NULL,
	`endpoint_id` text NOT NULL,
	`hit` integer DEFAULT 0 NOT NULL,
	`cost_micro` integer DEFAULT 0 NOT NULL,
	`ms` integer,
	`treg_call_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`row_id`) REFERENCES `rows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attempts_row_idx` ON `provider_attempts` (`row_id`);--> statement-breakpoint
CREATE INDEX `attempts_endpoint_idx` ON `provider_attempts` (`endpoint_id`);--> statement-breakpoint
CREATE TABLE `rows` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`company_name` text,
	`domain` text,
	`logo_url` text,
	`person_name` text,
	`title` text,
	`linkedin_url` text,
	`email` text,
	`email_status` text,
	`email_provider` text,
	`phone` text,
	`phone_provider` text,
	`company_data` text,
	`extra` text,
	`credits` real DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `rows_run_idx` ON `rows` (`run_id`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`icp_id` text,
	`title` text,
	`target` integer DEFAULT 0 NOT NULL,
	`mode` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`held_credits` real DEFAULT 0 NOT NULL,
	`charged_credits` real DEFAULT 0 NOT NULL,
	`treg_cost_micro` integer DEFAULT 0 NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`icp_id`) REFERENCES `icps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `runs_user_idx` ON `runs` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `suppressions` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`kind` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suppressions_value_unique` ON `suppressions` (`value`);--> statement-breakpoint
CREATE TABLE `treg_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint_id` text NOT NULL,
	`params_hash` text,
	`status` integer,
	`cost_micro` integer DEFAULT 0 NOT NULL,
	`call_id` text,
	`idempotency_key` text,
	`meta` text,
	`user_id` text,
	`run_id` text,
	`step` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `treg_calls_user_idx` ON `treg_calls` (`user_id`);--> statement-breakpoint
CREATE INDEX `treg_calls_run_idx` ON `treg_calls` (`run_id`);--> statement-breakpoint
CREATE INDEX `treg_calls_day_idx` ON `treg_calls` (`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`agreed_terms_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `waterfall_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`step` text NOT NULL,
	`endpoint_ids` text NOT NULL,
	`mode` text DEFAULT 'default' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
