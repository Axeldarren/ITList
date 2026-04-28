/*
  Warnings:

  - You are about to drop the `Uat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UatStep` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Uat" DROP CONSTRAINT "Uat_deletedById_fkey";

-- DropForeignKey
ALTER TABLE "Uat" DROP CONSTRAINT "Uat_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Uat" DROP CONSTRAINT "Uat_taskId_fkey";

-- DropForeignKey
ALTER TABLE "UatStep" DROP CONSTRAINT "UatStep_signUserId_fkey";

-- DropForeignKey
ALTER TABLE "UatStep" DROP CONSTRAINT "UatStep_uatId_fkey";

-- DropTable
DROP TABLE "Uat";

-- DropTable
DROP TABLE "UatStep";
