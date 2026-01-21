/*
  Warnings:

  - A unique constraint covering the columns `[ticket_id]` on the table `ProjectTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId]` on the table `ProjectTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProjectTicket_ticket_id_key" ON "ProjectTicket"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTicket_projectId_key" ON "ProjectTicket"("projectId");
