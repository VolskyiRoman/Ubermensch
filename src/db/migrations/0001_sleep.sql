CREATE TABLE `sleep_logs` (
	`date` text PRIMARY KEY NOT NULL,
	`bed_min` integer NOT NULL,
	`wake_min` integer NOT NULL
);
--> statement-breakpoint
-- Sleep moved out of habits into its own tracker (Profile); old sleep habits keep their history.
UPDATE `habits` SET `archived` = 1 WHERE `category` = 'sleep';
