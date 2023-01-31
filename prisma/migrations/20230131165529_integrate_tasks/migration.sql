/*
  Warnings:

  - A unique constraint covering the columns `[port]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[containerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DoneTask" ALTER COLUMN "taskNr" DROP DEFAULT;
DROP SEQUENCE "DoneTask_taskNr_seq";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "containerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_port_key" ON "User"("port");

-- CreateIndex
CREATE UNIQUE INDEX "User_containerId_key" ON "User"("containerId");
