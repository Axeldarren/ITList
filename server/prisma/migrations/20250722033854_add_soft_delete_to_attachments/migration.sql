-- AlterTable
ALTER TABLE `attachment` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedById` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_deletedById_fkey` FOREIGN KEY (`deletedById`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;
