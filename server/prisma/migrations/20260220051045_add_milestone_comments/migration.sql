-- CreateTable
CREATE TABLE "MilestoneComment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MilestoneComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MilestoneComment_projectId_idx" ON "MilestoneComment"("projectId");

-- CreateIndex
CREATE INDEX "MilestoneComment_userId_idx" ON "MilestoneComment"("userId");

-- AddForeignKey
ALTER TABLE "MilestoneComment" ADD CONSTRAINT "MilestoneComment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneComment" ADD CONSTRAINT "MilestoneComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
