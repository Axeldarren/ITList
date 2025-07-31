-- AlterTable
ALTER TABLE `user` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedById` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_deletedById_fkey` FOREIGN KEY (`deletedById`) REFERENCES `User`(`userId`) ON DELETE NO ACTION ON UPDATE NO ACTION;
