-- CreateTable
CREATE TABLE "DoneTask" (
    "id" SERIAL NOT NULL,
    "taskNr" SERIAL NOT NULL,
    "completionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "DoneTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "matriculation" TEXT NOT NULL,
    "name" TEXT,
    "port" SERIAL NOT NULL,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_matriculation_key" ON "User"("matriculation");

-- AddForeignKey
ALTER TABLE "DoneTask" ADD CONSTRAINT "DoneTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Set first port to 49152
ALTER SEQUENCE "User_port_seq" RESTART WITH 49152;

-- AlterTable
ALTER TABLE "DoneTask" ALTER COLUMN "taskNr" DROP DEFAULT;
DROP SEQUENCE "DoneTask_taskNr_seq";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "containerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_port_key" ON "User"("port");

-- CreateIndex
CREATE UNIQUE INDEX "User_containerId_key" ON "User"("containerId");