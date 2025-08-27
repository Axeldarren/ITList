/*
  Warnings:

  - You are about to drop the column `ticketId` on the `maintenancetask` table. All the data in the column will be lost.
  - You are about to drop the column `ticketId` on the `project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `maintenancetask` DROP COLUMN `ticketId`;

-- AlterTable
ALTER TABLE `project` DROP COLUMN `ticketId`;
