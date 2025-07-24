-- CreateTable
CREATE TABLE `TimeLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `taskId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    INDEX `TimeLog_taskId_idx`(`taskId`),
    INDEX `TimeLog_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TimeLog` ADD CONSTRAINT `TimeLog_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeLog` ADD CONSTRAINT `TimeLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;
