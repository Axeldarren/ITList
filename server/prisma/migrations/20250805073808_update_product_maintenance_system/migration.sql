/*
  Warnings:

  - You are about to drop the column `status` on the `maintenancetask` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `productmaintenance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.

*/
-- AlterTable
ALTER TABLE `comment` ADD COLUMN `devLogDuration` INTEGER NULL,
    ADD COLUMN `devLogEndTime` DATETIME(3) NULL,
    ADD COLUMN `devLogStartTime` DATETIME(3) NULL,
    ADD COLUMN `isDevLog` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `maintenancetask` DROP COLUMN `status`;

-- AlterTable
ALTER TABLE `productmaintenance` MODIFY `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active';

-- CreateTable
CREATE TABLE `MaintenanceTimeLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `productMaintenanceId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `maintenanceTaskId` INTEGER NULL,

    INDEX `MaintenanceTimeLog_productMaintenanceId_idx`(`productMaintenanceId`),
    INDEX `MaintenanceTimeLog_userId_idx`(`userId`),
    INDEX `MaintenanceTimeLog_maintenanceTaskId_idx`(`maintenanceTaskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MaintenanceTimeLog` ADD CONSTRAINT `MaintenanceTimeLog_productMaintenanceId_fkey` FOREIGN KEY (`productMaintenanceId`) REFERENCES `ProductMaintenance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceTimeLog` ADD CONSTRAINT `MaintenanceTimeLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceTimeLog` ADD CONSTRAINT `MaintenanceTimeLog_maintenanceTaskId_fkey` FOREIGN KEY (`maintenanceTaskId`) REFERENCES `MaintenanceTask`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
