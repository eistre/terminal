BEGIN TRY

    BEGIN TRAN;

-- CreateTable
    CREATE TABLE [dbo].[User]
    (
        [id]         NVARCHAR(1000) NOT NULL,
        [name]       NVARCHAR(1000) NOT NULL,
        [email]      NVARCHAR(1000),
        [expireTime] DATETIME2,
        [role]       NVARCHAR(1000) NOT NULL,
        CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [User_id_key] UNIQUE NONCLUSTERED ([id])
    );

-- CreateTable
    CREATE TABLE [dbo].[Session]
    (
        [id]             NVARCHAR(1000) NOT NULL,
        [user_id]        NVARCHAR(1000) NOT NULL,
        [active_expires] BIGINT         NOT NULL,
        [idle_expires]   BIGINT         NOT NULL,
        CONSTRAINT [Session_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [Session_id_key] UNIQUE NONCLUSTERED ([id])
    );

-- CreateTable
    CREATE TABLE [dbo].[Key]
    (
        [id]              NVARCHAR(1000) NOT NULL,
        [hashed_password] NVARCHAR(1000),
        [user_id]         NVARCHAR(1000) NOT NULL,
        CONSTRAINT [Key_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [Key_id_key] UNIQUE NONCLUSTERED ([id])
    );

-- CreateTable
    CREATE TABLE [dbo].[Verification]
    (
        [id]      NVARCHAR(1000) NOT NULL,
        [code]    NVARCHAR(1000) NOT NULL,
        [expires] BIGINT         NOT NULL,
        [user_id] NVARCHAR(1000) NOT NULL,
        CONSTRAINT [Verification_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [Verification_id_key] UNIQUE NONCLUSTERED ([id])
    );

-- CreateTable
    CREATE TABLE [dbo].[Exercise]
    (
        [id]          INT            NOT NULL IDENTITY (1,1),
        [title]       NVARCHAR(1000) NOT NULL,
        [description] NVARCHAR(1000) NOT NULL,
        CONSTRAINT [Exercise_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [Exercise_title_key] UNIQUE NONCLUSTERED ([title])
    );

-- CreateTable
    CREATE TABLE [dbo].[Task]
    (
        [id]          INT            NOT NULL IDENTITY (1,1),
        [title]       NVARCHAR(1000) NOT NULL,
        [content]     NVARCHAR(1000) NOT NULL,
        [hint]        NVARCHAR(1000),
        [regex]       NVARCHAR(1000) NOT NULL,
        [exercise_id] INT            NOT NULL,
        CONSTRAINT [Task_pkey] PRIMARY KEY CLUSTERED ([id])
    );

-- CreateTable
    CREATE TABLE [dbo].[CompletedTask]
    (
        [id]      INT            NOT NULL IDENTITY (1,1),
        [user_id] NVARCHAR(1000) NOT NULL,
        [task_id] INT            NOT NULL,
        CONSTRAINT [CompletedTask_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [CompletedTask_task_id_user_id_key] UNIQUE NONCLUSTERED ([task_id], [user_id])
    );

-- CreateIndex
    CREATE NONCLUSTERED INDEX [Session_user_id_idx] ON [dbo].[Session] ([user_id]);

-- CreateIndex
    CREATE NONCLUSTERED INDEX [Key_user_id_idx] ON [dbo].[Key] ([user_id]);

-- CreateIndex
    CREATE NONCLUSTERED INDEX [Verification_user_id_idx] ON [dbo].[Verification] ([user_id]);

-- CreateIndex
    CREATE NONCLUSTERED INDEX [Exercise_id_idx] ON [dbo].[Exercise] ([id]);

-- CreateIndex
    CREATE NONCLUSTERED INDEX [Task_id_idx] ON [dbo].[Task] ([id]);

-- CreateIndex
    CREATE NONCLUSTERED INDEX [Task_exercise_id_idx] ON [dbo].[Task] ([exercise_id]);

-- CreateIndex
    CREATE NONCLUSTERED INDEX [CompletedTask_id_idx] ON [dbo].[CompletedTask] ([id]);

-- CreateIndex
    CREATE NONCLUSTERED INDEX [CompletedTask_task_id_user_id_idx] ON [dbo].[CompletedTask] ([task_id], [user_id]);

-- AddForeignKey
    ALTER TABLE [dbo].[Session]
        ADD CONSTRAINT [Session_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
    ALTER TABLE [dbo].[Key]
        ADD CONSTRAINT [Key_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
    ALTER TABLE [dbo].[Verification]
        ADD CONSTRAINT [Verification_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
    ALTER TABLE [dbo].[Task]
        ADD CONSTRAINT [Task_exercise_id_fkey] FOREIGN KEY ([exercise_id]) REFERENCES [dbo].[Exercise] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
    ALTER TABLE [dbo].[CompletedTask]
        ADD CONSTRAINT [CompletedTask_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
    ALTER TABLE [dbo].[CompletedTask]
        ADD CONSTRAINT [CompletedTask_task_id_fkey] FOREIGN KEY ([task_id]) REFERENCES [dbo].[Task] ([id]) ON DELETE CASCADE ON UPDATE CASCADE;

    COMMIT TRAN;

END TRY
BEGIN CATCH

    IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRAN;
        END;
    THROW

END CATCH
