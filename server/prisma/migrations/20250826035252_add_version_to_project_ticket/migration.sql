/*
  Warnings:

  - You are about to drop the column `ticketId` on the `maintenancetaskticket` table. All the data in the column will be lost.
  - You are about to drop the column `ticketId` on the `projectticket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ticket_id]` on the table `MaintenanceTaskTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ticket_id]` on the table `ProjectTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,version]` on the table `ProjectTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ticket_id,version]` on the table `ProjectTicket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ticket_id` to the `MaintenanceTaskTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticket_id` to the `ProjectTicket` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `MaintenanceTaskTicket_ticketId_key` ON `maintenancetaskticket`;

-- DropIndex
DROP INDEX `ProjectTicket_ticketId_key` ON `projectticket`;

-- AlterTable
ALTER TABLE `maintenancetaskticket` DROP COLUMN `ticketId`,
    ADD COLUMN `ticket_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `projectticket` DROP COLUMN `ticketId`,
    ADD COLUMN `ticket_id` INTEGER NOT NULL,
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX `MaintenanceTaskTicket_ticket_id_key` ON `MaintenanceTaskTicket`(`ticket_id`);

-- CreateIndex
CREATE UNIQUE INDEX `ProjectTicket_ticket_id_key` ON `ProjectTicket`(`ticket_id`);

-- CreateIndex
CREATE UNIQUE INDEX `ProjectTicket_projectId_version_key` ON `ProjectTicket`(`projectId`, `version`);

-- CreateIndex
CREATE UNIQUE INDEX `ProjectTicket_ticket_id_version_key` ON `ProjectTicket`(`ticket_id`, `version`);
