/*
  Warnings:

  - A unique constraint covering the columns `[commentId]` on the table `TimeLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `timelog` ADD COLUMN `commentId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `TimeLog_commentId_key` ON `TimeLog`(`commentId`);

-- AddForeignKey
ALTER TABLE `TimeLog` ADD CONSTRAINT `TimeLog_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
