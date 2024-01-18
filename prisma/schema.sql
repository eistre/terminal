-- CreateTable
CREATE TABLE `User`
(
    `id`         VARCHAR(191)                         NOT NULL,
    `name`       VARCHAR(191)                         NOT NULL,
    `email`      VARCHAR(191)                         NULL,
    `expireTime` DATETIME(3)                          NULL,
    `role`       ENUM ('UNVERIFIED', 'USER', 'ADMIN') NOT NULL,

    UNIQUE INDEX `User_id_key` (`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session`
(
    `id`             VARCHAR(191) NOT NULL,
    `user_id`        VARCHAR(191) NOT NULL,
    `active_expires` BIGINT       NOT NULL,
    `idle_expires`   BIGINT       NOT NULL,

    UNIQUE INDEX `Session_id_key` (`id`),
    INDEX `Session_user_id_idx` (`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Key`
(
    `id`              VARCHAR(191) NOT NULL,
    `hashed_password` VARCHAR(191) NULL,
    `user_id`         VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Key_id_key` (`id`),
    INDEX `Key_user_id_idx` (`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Verification`
(
    `id`      VARCHAR(191) NOT NULL,
    `code`    VARCHAR(191) NOT NULL,
    `expires` BIGINT       NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Verification_id_key` (`id`),
    INDEX `Verification_user_id_idx` (`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Exercise`
(
    `id`          INTEGER      NOT NULL AUTO_INCREMENT,
    `title`       VARCHAR(191) NOT NULL,
    `description` TEXT         NOT NULL,

    UNIQUE INDEX `Exercise_title_key` (`title`),
    INDEX `Exercise_id_idx` (`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task`
(
    `id`          INTEGER NOT NULL AUTO_INCREMENT,
    `title`       TEXT    NOT NULL,
    `content`     TEXT    NOT NULL,
    `hint`        TEXT    NULL,
    `regex`       TEXT    NOT NULL,
    `exercise_id` INTEGER NOT NULL,

    INDEX `Task_id_idx` (`id`),
    INDEX `Task_exercise_id_idx` (`exercise_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompletedTask`
(
    `id`      INTEGER      NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `task_id` INTEGER      NOT NULL,

    INDEX `CompletedTask_id_idx` (`id`),
    INDEX `CompletedTask_task_id_user_id_idx` (`task_id`, `user_id`),
    INDEX `CompletedTask_user_id_idx` (`user_id`),
    UNIQUE INDEX `CompletedTask_task_id_user_id_key` (`task_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Domain`
(
    `id`       INTEGER      NOT NULL AUTO_INCREMENT,
    `name`     VARCHAR(191) NOT NULL,
    `hidden`   BOOLEAN      NOT NULL DEFAULT true,
    `verified` BOOLEAN      NOT NULL DEFAULT false,

    UNIQUE INDEX `Domain_name_key` (`name`),
    INDEX `Domain_id_idx` (`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
