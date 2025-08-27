/*
  Warnings:

  - A unique constraint covering the columns `[staffId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `staffId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_staffId_key` ON `User`(`staffId`);
