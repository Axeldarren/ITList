-- AlterTable
ALTER TABLE `attachment` MODIFY `fileURL` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false;
