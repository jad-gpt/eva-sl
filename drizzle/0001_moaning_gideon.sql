CREATE TABLE `arabic_speech_samples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`audioUrl` text NOT NULL,
	`transcription` text,
	`emotion` enum('happy','sad','angry','neutral','fearful','surprised','disgusted') NOT NULL,
	`speakerAge` int,
	`speakerGender` enum('male','female','other'),
	`dialect` varchar(64) DEFAULT 'Gulf',
	`durationSeconds` float,
	`isValidated` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `arabic_speech_samples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asl_signs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`letter` varchar(1) NOT NULL,
	`imageUrl` text NOT NULL,
	`description` text,
	`handShape` text,
	`isAiGenerated` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `asl_signs_id` PRIMARY KEY(`id`),
	CONSTRAINT `asl_signs_letter_unique` UNIQUE(`letter`)
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`originalText` text NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`emotion` enum('happy','sad','angry','neutral','fearful','surprised','disgusted') NOT NULL DEFAULT 'neutral',
	`emotionConfidence` float DEFAULT 0,
	`audioUrl` text,
	`durationSeconds` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `translations_id` PRIMARY KEY(`id`)
);
