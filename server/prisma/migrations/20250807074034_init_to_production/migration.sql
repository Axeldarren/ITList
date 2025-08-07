-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_deletedById_fkey`;

-- DropIndex
DROP INDEX `User_deletedById_fkey` ON `user`;

-- RenameIndex
ALTER TABLE `comment` RENAME INDEX `Comment_maintenanceTaskId_fkey` TO `Comment_maintenanceTaskId_idx`;
