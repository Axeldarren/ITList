/*
  Warnings:

  - You are about to drop the column `productOwnerUserId` on the `Team` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "productOwnerUserId" TEXT;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "productOwnerUserId";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_productOwnerUserId_fkey" FOREIGN KEY ("productOwnerUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
