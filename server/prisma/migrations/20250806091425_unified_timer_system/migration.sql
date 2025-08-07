/*
  Warnings:

  - You are about to drop the column `devLogDuration` on the `comment` table. All the data in the column will be lost.
  - You are about to drop the column `devLogEndTime` on the `comment` table. All the data in the column will be lost.
  - You are about to drop the column `devLogStartTime` on the `comment` table. All the data in the column will be lost.
  - You are about to drop the column `isDevLog` on the `comment` table. All the data in the column will be lost.
  - You are about to drop the `maintenancetimelog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `maintenancetimelog` DROP FOREIGN KEY `MaintenanceTimeLog_maintenanceTaskId_fkey`;

-- DropForeignKey
ALTER TABLE `maintenancetimelog` DROP FOREIGN KEY `MaintenanceTimeLog_productMaintenanceId_fkey`;

-- DropForeignKey
ALTER TABLE `maintenancetimelog` DROP FOREIGN KEY `MaintenanceTimeLog_userId_fkey`;

-- AlterTable
ALTER TABLE `comment` DROP COLUMN `devLogDuration`,
    DROP COLUMN `devLogEndTime`,
    DROP COLUMN `devLogStartTime`,
    DROP COLUMN `isDevLog`,
    ADD COLUMN `maintenanceTaskId` INTEGER NULL,
    MODIFY `taskId` INTEGER NULL;

-- AlterTable
ALTER TABLE `maintenancetask` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `productmaintenance` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `project` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `task` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `timelog` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `maintenanceTaskId` INTEGER NULL,
    MODIFY `taskId` INTEGER NULL;

-- DropTable
DROP TABLE `maintenancetimelog`;

-- CreateIndex
CREATE INDEX `TimeLog_maintenanceTaskId_idx` ON `TimeLog`(`maintenanceTaskId`);

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_maintenanceTaskId_fkey` FOREIGN KEY (`maintenanceTaskId`) REFERENCES `MaintenanceTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeLog` ADD CONSTRAINT `TimeLog_maintenanceTaskId_fkey` FOREIGN KEY (`maintenanceTaskId`) REFERENCES `MaintenanceTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
