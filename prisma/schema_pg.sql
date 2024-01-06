-- CreateEnum
CREATE TYPE "Role" AS ENUM ('UNVERIFIED', 'USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User"
(
    "id"         TEXT   NOT NULL,
    "name"       TEXT   NOT NULL,
    "email"      TEXT,
    "expireTime" TIMESTAMP(3),
    "role"       "Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session"
(
    "id"             TEXT   NOT NULL,
    "user_id"        TEXT   NOT NULL,
    "active_expires" BIGINT NOT NULL,
    "idle_expires"   BIGINT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Key"
(
    "id"              TEXT NOT NULL,
    "hashed_password" TEXT,
    "user_id"         TEXT NOT NULL,

    CONSTRAINT "Key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification"
(
    "id"      TEXT   NOT NULL,
    "code"    TEXT   NOT NULL,
    "expires" BIGINT NOT NULL,
    "user_id" TEXT   NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise"
(
    "id"          SERIAL NOT NULL,
    "title"       TEXT   NOT NULL,
    "description" TEXT   NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task"
(
    "id"          SERIAL  NOT NULL,
    "title"       TEXT    NOT NULL,
    "content"     TEXT    NOT NULL,
    "hint"        TEXT,
    "regex"       TEXT    NOT NULL,
    "exercise_id" INTEGER NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedTask"
(
    "id"      SERIAL  NOT NULL,
    "user_id" TEXT    NOT NULL,
    "task_id" INTEGER NOT NULL,

    CONSTRAINT "CompletedTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User" ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session" ("id");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session" ("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Key_id_key" ON "Key" ("id");

-- CreateIndex
CREATE INDEX "Key_user_id_idx" ON "Key" ("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_id_key" ON "Verification" ("id");

-- CreateIndex
CREATE INDEX "Verification_user_id_idx" ON "Verification" ("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_title_key" ON "Exercise" ("title");

-- CreateIndex
CREATE INDEX "Exercise_id_idx" ON "Exercise" ("id");

-- CreateIndex
CREATE INDEX "Task_id_idx" ON "Task" ("id");

-- CreateIndex
CREATE INDEX "Task_exercise_id_idx" ON "Task" ("exercise_id");

-- CreateIndex
CREATE INDEX "CompletedTask_id_idx" ON "CompletedTask" ("id");

-- CreateIndex
CREATE INDEX "CompletedTask_task_id_user_id_idx" ON "CompletedTask" ("task_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "CompletedTask_task_id_user_id_key" ON "CompletedTask" ("task_id", "user_id");

-- AddForeignKey
ALTER TABLE "Session"
    ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Key"
    ADD CONSTRAINT "Key_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification"
    ADD CONSTRAINT "Verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task"
    ADD CONSTRAINT "Task_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedTask"
    ADD CONSTRAINT "CompletedTask_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedTask"
    ADD CONSTRAINT "CompletedTask_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
