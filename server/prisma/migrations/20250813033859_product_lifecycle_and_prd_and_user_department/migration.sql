-- AlterTable
ALTER TABLE `productmaintenance` ADD COLUMN `lifecycle` ENUM('Planned', 'Maintaining', 'Finished') NOT NULL DEFAULT 'Planned';

-- AlterTable
ALTER TABLE `project` ADD COLUMN `prdUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `department` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ProductMaintenanceStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productMaintenanceId` INTEGER NOT NULL,
    `status` ENUM('Planned', 'Maintaining', 'Finished') NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `changedById` INTEGER NOT NULL,

    INDEX `ProductMaintenanceStatusHistory_productMaintenanceId_idx`(`productMaintenanceId`),
    INDEX `PMStatusHistory_changedById_fkey`(`changedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductMaintenanceStatusHistory` ADD CONSTRAINT `ProductMaintenanceStatusHistory_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductMaintenanceStatusHistory` ADD CONSTRAINT `ProductMaintenanceStatusHistory_productMaintenanceId_fkey` FOREIGN KEY (`productMaintenanceId`) REFERENCES `ProductMaintenance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
