-- AlterTable
ALTER TABLE `projectversion` ADD COLUMN `status` ENUM('Start', 'OnProgress', 'Resolve', 'Finish', 'Cancel') NOT NULL DEFAULT 'Finish';
