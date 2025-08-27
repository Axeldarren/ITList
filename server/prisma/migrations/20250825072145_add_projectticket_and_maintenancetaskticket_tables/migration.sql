-- CreateTable
CREATE TABLE `ProjectTicket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProjectTicket_ticketId_key`(`ticketId`),
    UNIQUE INDEX `ProjectTicket_projectId_key`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaintenanceTaskTicket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `maintenanceTaskId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MaintenanceTaskTicket_ticketId_key`(`ticketId`),
    UNIQUE INDEX `MaintenanceTaskTicket_maintenanceTaskId_key`(`maintenanceTaskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectTicket` ADD CONSTRAINT `ProjectTicket_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceTaskTicket` ADD CONSTRAINT `MaintenanceTaskTicket_maintenanceTaskId_fkey` FOREIGN KEY (`maintenanceTaskId`) REFERENCES `MaintenanceTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
