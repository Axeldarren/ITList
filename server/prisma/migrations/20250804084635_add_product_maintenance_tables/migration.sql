-- CreateTable
CREATE TABLE `ProductMaintenance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `priority` VARCHAR(191) NULL DEFAULT 'Medium',
    `projectId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedById` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaintenanceTask` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `priority` VARCHAR(191) NULL DEFAULT 'Medium',
    `type` VARCHAR(191) NOT NULL,
    `estimatedHours` INTEGER NULL,
    `actualHours` INTEGER NULL,
    `productMaintenanceId` INTEGER NOT NULL,
    `assignedToId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` INTEGER NOT NULL,
    `updatedById` INTEGER NULL,

    INDEX `MaintenanceTask_productMaintenanceId_idx`(`productMaintenanceId`),
    INDEX `MaintenanceTask_assignedToId_idx`(`assignedToId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductMaintainer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productMaintenanceId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'Maintainer',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProductMaintainer_productMaintenanceId_userId_key`(`productMaintenanceId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductMaintenance` ADD CONSTRAINT `ProductMaintenance_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductMaintenance` ADD CONSTRAINT `ProductMaintenance_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductMaintenance` ADD CONSTRAINT `ProductMaintenance_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductMaintenance` ADD CONSTRAINT `ProductMaintenance_deletedById_fkey` FOREIGN KEY (`deletedById`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceTask` ADD CONSTRAINT `MaintenanceTask_productMaintenanceId_fkey` FOREIGN KEY (`productMaintenanceId`) REFERENCES `ProductMaintenance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceTask` ADD CONSTRAINT `MaintenanceTask_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceTask` ADD CONSTRAINT `MaintenanceTask_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceTask` ADD CONSTRAINT `MaintenanceTask_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductMaintainer` ADD CONSTRAINT `ProductMaintainer_productMaintenanceId_fkey` FOREIGN KEY (`productMaintenanceId`) REFERENCES `ProductMaintenance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductMaintainer` ADD CONSTRAINT `ProductMaintainer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;
