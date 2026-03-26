-- DropForeignKey
ALTER TABLE "ProductMaintenance" DROP CONSTRAINT "ProductMaintenance_projectId_fkey";

-- AddForeignKey
ALTER TABLE "ProductMaintenance" ADD CONSTRAINT "ProductMaintenance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
