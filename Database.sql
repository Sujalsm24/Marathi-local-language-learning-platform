-- CREATE DATABASE MarathiLearningDb;
-- GO
-- USE MarathiLearningDb;

-- Create Core Tables
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Levels (
    LevelID INT IDENTITY(1,1) PRIMARY KEY,
    LevelName NVARCHAR(50) NOT NULL
);

CREATE TABLE Lessons (
    LessonID INT IDENTITY(1,1) PRIMARY KEY,
    LevelID INT FOREIGN KEY REFERENCES Levels(LevelID),
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    SequenceOrder INT NOT NULL
);

CREATE TABLE Vocabulary (
    WordID INT IDENTITY(1,1) PRIMARY KEY,
    LessonID INT FOREIGN KEY REFERENCES Lessons(LessonID),
    EnglishWord NVARCHAR(100) NOT NULL,
    MarathiWord NVARCHAR(100) NOT NULL,
    MarathiTransliteration NVARCHAR(100) NOT NULL,
    AudioUrl NVARCHAR(255)
);

CREATE TABLE UserProgress (
    ProgressID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    LessonID INT FOREIGN KEY REFERENCES Lessons(LessonID),
    IsCompleted BIT DEFAULT 0,
    LastAccessed DATETIME DEFAULT GETDATE(),
    QuizScore INT DEFAULT 0,
    TotalXP INT DEFAULT 0
);

-- Seed Initial Content Data
SET IDENTITY_INSERT Levels ON;
INSERT INTO Levels (LevelID, LevelName) VALUES (1, N'Beginner'), (2, N'Intermediate');
SET IDENTITY_INSERT Levels OFF;

SET IDENTITY_INSERT Lessons ON;
INSERT INTO Lessons (LessonID, LevelID, Title, Description, SequenceOrder) VALUES 
(1, 1, N'Greetings (नमस्कार)', N'Learn how to greet people politely in Marathi.', 1),
(2, 1, N'Numbers 1-5 (अंक)', N'Master basic counting rules.', 2);
SET IDENTITY_INSERT Lessons OFF;

SET IDENTITY_INSERT Vocabulary ON;
INSERT INTO Vocabulary (WordID, LessonID, EnglishWord, MarathiWord, MarathiTransliteration, AudioUrl) VALUES 
(1, 1, N'Hello', N'नमस्कार', N'Namaskar', N'/audio/namaskar.mp3'),
(2, 1, N'Thank you', N'धन्यवाद', N'Dhanyavaad', N'/audio/dhanyavaad.mp3'),
(3, 2, N'One', N'एक', N'Ek', N'/audio/ek.mp3');
SET IDENTITY_INSERT Vocabulary OFF;
