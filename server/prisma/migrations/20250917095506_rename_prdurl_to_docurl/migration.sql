/*
  Warnings:

  - You are about to drop the column `prdUrl` on the `project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `project` DROP COLUMN `prdUrl`,
    ADD COLUMN `docUrl` TEXT NULL;
