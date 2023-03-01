-- CreateTable
CREATE TABLE "DoneTask" (
    "id" SERIAL NOT NULL,
    "taskNr" INTEGER NOT NULL,
    "completionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DoneTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "matriculation" TEXT NOT NULL,
    "name" TEXT,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "containerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_matriculation_key" ON "User"("matriculation");

-- CreateIndex
CREATE UNIQUE INDEX "User_containerId_key" ON "User"("containerId");

-- AddForeignKey
ALTER TABLE "DoneTask" ADD CONSTRAINT "DoneTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
