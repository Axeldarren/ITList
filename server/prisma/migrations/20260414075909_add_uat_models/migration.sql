-- DropForeignKey
ALTER TABLE "ProductMaintenance" DROP CONSTRAINT "ProductMaintenance_projectId_fkey";

-- CreateTable
CREATE TABLE "Uat" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "taskId" INTEGER,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "Uat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UatStep" (
    "id" SERIAL NOT NULL,
    "uatId" INTEGER NOT NULL,
    "testerRole" TEXT NOT NULL,
    "business" TEXT,
    "pathAndAction" TEXT,
    "expectedResult" TEXT,
    "actualResult" TEXT,
    "testDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "signUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UatStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Uat_projectId_idx" ON "Uat"("projectId");

-- CreateIndex
CREATE INDEX "Uat_taskId_idx" ON "Uat"("taskId");

-- CreateIndex
CREATE INDEX "Uat_deletedById_idx" ON "Uat"("deletedById");

-- CreateIndex
CREATE INDEX "UatStep_uatId_idx" ON "UatStep"("uatId");

-- CreateIndex
CREATE INDEX "UatStep_signUserId_idx" ON "UatStep"("signUserId");

-- AddForeignKey
ALTER TABLE "ProductMaintenance" ADD CONSTRAINT "ProductMaintenance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Uat" ADD CONSTRAINT "Uat_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Uat" ADD CONSTRAINT "Uat_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Uat" ADD CONSTRAINT "Uat_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UatStep" ADD CONSTRAINT "UatStep_uatId_fkey" FOREIGN KEY ("uatId") REFERENCES "Uat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UatStep" ADD CONSTRAINT "UatStep_signUserId_fkey" FOREIGN KEY ("signUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
