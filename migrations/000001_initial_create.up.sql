-- Initial database schema for XCinema
-- This migration creates all tables for the movie streaming platform

-- ============================================================
-- BASE TABLES (No dependencies)
-- ============================================================

-- Actors table
CREATE TABLE "Actors" (
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Genres table
CREATE TABLE "Genres" (
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- AspNetRoles table (Identity)
CREATE TABLE "AspNetRoles" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(256),
    "NormalizedName" VARCHAR(256),
    "ConcurrencyStamp" TEXT
);

-- AspNetUsers table (Identity)
CREATE TABLE "AspNetUsers" (
    "Id" SERIAL PRIMARY KEY,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "DisplayName" TEXT,
    "Gender" TEXT,
    "AvatarUrl" TEXT,
    "UserName" VARCHAR(256),
    "NormalizedUserName" VARCHAR(256),
    "Email" VARCHAR(256),
    "NormalizedEmail" VARCHAR(256),
    "EmailConfirmed" BOOLEAN NOT NULL DEFAULT FALSE,
    "PasswordHash" TEXT,
    "SecurityStamp" TEXT,
    "ConcurrencyStamp" TEXT,
    "PhoneNumber" TEXT,
    "PhoneNumberConfirmed" BOOLEAN NOT NULL DEFAULT FALSE,
    "TwoFactorEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "LockoutEnd" TIMESTAMP WITH TIME ZONE,
    "LockoutEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "AccessFailedCount" INTEGER NOT NULL DEFAULT 0
);

-- Movies table
CREATE TABLE "Movies" (
    "Id" SERIAL PRIMARY KEY,
    "Title" TEXT NOT NULL,
    "Overview" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "ReleaseDate" TIMESTAMP WITH TIME ZONE,
    "Studio" TEXT NOT NULL,
    "Director" TEXT NOT NULL,
    "PosterUrl" TEXT NOT NULL,
    "BackdropUrl" TEXT NOT NULL,
    "Rating" NUMERIC,
    "NumberOfRatings" INTEGER,
    "VideoUrl" TEXT NOT NULL,
    "TrailerUrl" TEXT,
    "ViewCount" INTEGER NOT NULL DEFAULT 0,
    "SearchVector" TSVECTOR
);

-- TvSeries table
CREATE TABLE "TvSeries" (
    "Id" SERIAL PRIMARY KEY,
    "Title" TEXT NOT NULL,
    "Overview" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "ReleaseDate" TIMESTAMP WITH TIME ZONE,
    "Studio" TEXT NOT NULL,
    "Director" TEXT NOT NULL,
    "PosterUrl" TEXT NOT NULL,
    "BackdropUrl" TEXT NOT NULL,
    "Rating" NUMERIC,
    "NumberOfRatings" INTEGER,
    "ViewCount" INTEGER,
    "TrailerUrl" TEXT,
    "SearchVector" TSVECTOR
);

-- ViewLogs table
CREATE TABLE "ViewLogs" (
    "Id" SERIAL PRIMARY KEY,
    "ContentId" INTEGER NOT NULL,
    "ContentType" TEXT NOT NULL,
    "ViewedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEPENDENT TABLES (Reference base tables)
-- ============================================================

-- AspNetRoleClaims
CREATE TABLE "AspNetRoleClaims" (
    "Id" SERIAL PRIMARY KEY,
    "RoleId" INTEGER NOT NULL,
    "ClaimType" TEXT,
    "ClaimValue" TEXT,
    CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId" 
        FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles"("Id") ON DELETE CASCADE
);

-- AspNetUserClaims
CREATE TABLE "AspNetUserClaims" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "ClaimType" TEXT,
    "ClaimValue" TEXT,
    CONSTRAINT "FK_AspNetUserClaims_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

-- AspNetUserLogins
CREATE TABLE "AspNetUserLogins" (
    "LoginProvider" TEXT NOT NULL,
    "ProviderKey" TEXT NOT NULL,
    "ProviderDisplayName" TEXT,
    "UserId" INTEGER NOT NULL,
    PRIMARY KEY ("LoginProvider", "ProviderKey"),
    CONSTRAINT "FK_AspNetUserLogins_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

-- AspNetUserRoles
CREATE TABLE "AspNetUserRoles" (
    "UserId" INTEGER NOT NULL,
    "RoleId" INTEGER NOT NULL,
    PRIMARY KEY ("UserId", "RoleId"),
    CONSTRAINT "FK_AspNetUserRoles_AspNetRoles_RoleId" 
        FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AspNetUserRoles_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

-- AspNetUserTokens
CREATE TABLE "AspNetUserTokens" (
    "UserId" INTEGER NOT NULL,
    "LoginProvider" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Value" TEXT,
    PRIMARY KEY ("UserId", "LoginProvider", "Name"),
    CONSTRAINT "FK_AspNetUserTokens_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

-- Ratings
CREATE TABLE "Ratings" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "MediaId" INTEGER NOT NULL,
    "MediaType" TEXT NOT NULL,
    "RatingValue" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_Ratings_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

-- WatchList
CREATE TABLE "WatchList" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "MediaId" INTEGER NOT NULL,
    "MediaType" TEXT NOT NULL,
    "AddedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_WatchList_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

-- MovieActors
CREATE TABLE "MovieActors" (
    "Id" SERIAL PRIMARY KEY,
    "MovieId" INTEGER NOT NULL,
    "ActorId" INTEGER NOT NULL,
    "CharacterName" TEXT NOT NULL,
    CONSTRAINT "FK_MovieActors_Actors_ActorId" 
        FOREIGN KEY ("ActorId") REFERENCES "Actors"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_MovieActors_Movies_MovieId" 
        FOREIGN KEY ("MovieId") REFERENCES "Movies"("Id") ON DELETE CASCADE
);

-- MovieGenres
CREATE TABLE "MovieGenres" (
    "MovieId" INTEGER NOT NULL,
    "GenreId" INTEGER NOT NULL,
    "GenreId1" INTEGER,
    PRIMARY KEY ("MovieId", "GenreId"),
    CONSTRAINT "FK_MovieGenres_Genres_GenreId" 
        FOREIGN KEY ("GenreId") REFERENCES "Genres"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_MovieGenres_Genres_GenreId1" 
        FOREIGN KEY ("GenreId1") REFERENCES "Genres"("Id"),
    CONSTRAINT "FK_MovieGenres_Movies_MovieId" 
        FOREIGN KEY ("MovieId") REFERENCES "Movies"("Id") ON DELETE CASCADE
);

-- Seasons
CREATE TABLE "Seasons" (
    "Id" SERIAL PRIMARY KEY,
    "TvSeriesId" INTEGER NOT NULL,
    "SeasonNumber" INTEGER NOT NULL,
    CONSTRAINT "FK_Seasons_TvSeries_TvSeriesId" 
        FOREIGN KEY ("TvSeriesId") REFERENCES "TvSeries"("Id") ON DELETE CASCADE
);

-- TvSeriesActors
CREATE TABLE "TvSeriesActors" (
    "Id" SERIAL PRIMARY KEY,
    "TvSeriesId" INTEGER NOT NULL,
    "ActorId" INTEGER NOT NULL,
    "CharacterName" TEXT NOT NULL,
    CONSTRAINT "FK_TvSeriesActors_Actors_ActorId" 
        FOREIGN KEY ("ActorId") REFERENCES "Actors"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TvSeriesActors_TvSeries_TvSeriesId" 
        FOREIGN KEY ("TvSeriesId") REFERENCES "TvSeries"("Id") ON DELETE CASCADE
);

-- TvSeriesGenres
CREATE TABLE "TvSeriesGenres" (
    "TvSeriesId" INTEGER NOT NULL,
    "GenreId" INTEGER NOT NULL,
    "GenreId1" INTEGER,
    PRIMARY KEY ("TvSeriesId", "GenreId"),
    CONSTRAINT "FK_TvSeriesGenres_Genres_GenreId" 
        FOREIGN KEY ("GenreId") REFERENCES "Genres"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TvSeriesGenres_Genres_GenreId1" 
        FOREIGN KEY ("GenreId1") REFERENCES "Genres"("Id"),
    CONSTRAINT "FK_TvSeriesGenres_TvSeries_TvSeriesId" 
        FOREIGN KEY ("TvSeriesId") REFERENCES "TvSeries"("Id") ON DELETE CASCADE
);

-- Episodes
CREATE TABLE "Episodes" (
    "Id" SERIAL PRIMARY KEY,
    "SeasonId" INTEGER NOT NULL,
    "EpisodeNumber" INTEGER NOT NULL,
    "VideoUrl" TEXT NOT NULL,
    CONSTRAINT "FK_Episodes_Seasons_SeasonId" 
        FOREIGN KEY ("SeasonId") REFERENCES "Seasons"("Id") ON DELETE CASCADE
);

-- Comments
CREATE TABLE "Comments" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "MovieId" INTEGER,
    "TvSeriesId" INTEGER,
    "EpisodeId" INTEGER,
    "ParentCommentId" INTEGER,
    "CommentText" TEXT NOT NULL,
    "Timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_Comments_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Comments_Comments_ParentCommentId" 
        FOREIGN KEY ("ParentCommentId") REFERENCES "Comments"("Id"),
    CONSTRAINT "FK_Comments_Episodes_EpisodeId" 
        FOREIGN KEY ("EpisodeId") REFERENCES "Episodes"("Id"),
    CONSTRAINT "FK_Comments_Movies_MovieId" 
        FOREIGN KEY ("MovieId") REFERENCES "Movies"("Id"),
    CONSTRAINT "FK_Comments_TvSeries_TvSeriesId" 
        FOREIGN KEY ("TvSeriesId") REFERENCES "TvSeries"("Id")
);

-- Likes
CREATE TABLE "Likes" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "MovieId" INTEGER,
    "TvSeriesId" INTEGER,
    "CommentId" INTEGER,
    "IsLike" BOOLEAN NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "FK_Likes_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Likes_Comments_CommentId" 
        FOREIGN KEY ("CommentId") REFERENCES "Comments"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Likes_Movies_MovieId" 
        FOREIGN KEY ("MovieId") REFERENCES "Movies"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Likes_TvSeries_TvSeriesId" 
        FOREIGN KEY ("TvSeriesId") REFERENCES "TvSeries"("Id") ON DELETE CASCADE
);

-- Notifications
CREATE TABLE "Notifications" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "Type" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Message" TEXT NOT NULL,
    "Url" TEXT,
    "IsRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "CommentId" INTEGER,
    "RepliedByUserId" INTEGER,
    "TvSeriesId" INTEGER,
    "SeasonNumber" INTEGER,
    "EpisodeNumber" INTEGER,
    CONSTRAINT "FK_Notifications_AspNetUsers_RepliedByUserId" 
        FOREIGN KEY ("RepliedByUserId") REFERENCES "AspNetUsers"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Notifications_AspNetUsers_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Notifications_Comments_CommentId" 
        FOREIGN KEY ("CommentId") REFERENCES "Comments"("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Notifications_TvSeries_TvSeriesId" 
        FOREIGN KEY ("TvSeriesId") REFERENCES "TvSeries"("Id") ON DELETE SET NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

-- AspNetRoles indexes
CREATE UNIQUE INDEX "RoleNameIndex" ON "AspNetRoles" ("NormalizedName");

-- AspNetRoleClaims indexes
CREATE INDEX "IX_AspNetRoleClaims_RoleId" ON "AspNetRoleClaims" ("RoleId");

-- AspNetUsers indexes
CREATE INDEX "EmailIndex" ON "AspNetUsers" ("NormalizedEmail");
CREATE UNIQUE INDEX "UserNameIndex" ON "AspNetUsers" ("NormalizedUserName");

-- AspNetUserClaims indexes
CREATE INDEX "IX_AspNetUserClaims_UserId" ON "AspNetUserClaims" ("UserId");

-- AspNetUserLogins indexes
CREATE INDEX "IX_AspNetUserLogins_UserId" ON "AspNetUserLogins" ("UserId");

-- AspNetUserRoles indexes
CREATE INDEX "IX_AspNetUserRoles_RoleId" ON "AspNetUserRoles" ("RoleId");

-- Comments indexes
CREATE INDEX "IX_Comments_EpisodeId" ON "Comments" ("EpisodeId");
CREATE INDEX "IX_Comments_MovieId" ON "Comments" ("MovieId");
CREATE INDEX "IX_Comments_ParentCommentId" ON "Comments" ("ParentCommentId");
CREATE INDEX "IX_Comments_TvSeriesId" ON "Comments" ("TvSeriesId");
CREATE INDEX "IX_Comments_UserId" ON "Comments" ("UserId");

-- Episodes indexes
CREATE INDEX "IX_Episodes_SeasonId" ON "Episodes" ("SeasonId");

-- Likes indexes
CREATE INDEX "IX_Likes_CommentId" ON "Likes" ("CommentId");
CREATE INDEX "IX_Likes_MovieId" ON "Likes" ("MovieId");
CREATE INDEX "IX_Likes_TvSeriesId" ON "Likes" ("TvSeriesId");
CREATE UNIQUE INDEX "IX_Likes_UserId_MovieId_TvSeriesId_CommentId" 
    ON "Likes" ("UserId", "MovieId", "TvSeriesId", "CommentId");

-- MovieActors indexes
CREATE INDEX "IX_MovieActors_ActorId" ON "MovieActors" ("ActorId");
CREATE INDEX "IX_MovieActors_MovieId" ON "MovieActors" ("MovieId");

-- MovieGenres indexes
CREATE INDEX "IX_MovieGenres_GenreId" ON "MovieGenres" ("GenreId");
CREATE INDEX "IX_MovieGenres_GenreId1" ON "MovieGenres" ("GenreId1");

-- Movies indexes - Full Text Search
CREATE INDEX "IX_Movies_SearchVector" ON "Movies" USING GIN ("SearchVector");

-- Notifications indexes
CREATE INDEX "IX_Notifications_CommentId" ON "Notifications" ("CommentId");
CREATE INDEX "IX_Notifications_RepliedByUserId" ON "Notifications" ("RepliedByUserId");
CREATE INDEX "IX_Notifications_TvSeriesId" ON "Notifications" ("TvSeriesId");
CREATE INDEX "IX_Notifications_UserId_CreatedAt" ON "Notifications" ("UserId", "CreatedAt");

-- Ratings indexes
CREATE INDEX "IX_Ratings_UserId" ON "Ratings" ("UserId");

-- Seasons indexes
CREATE INDEX "IX_Seasons_TvSeriesId" ON "Seasons" ("TvSeriesId");

-- TvSeries indexes - Full Text Search
CREATE INDEX "IX_TvSeries_SearchVector" ON "TvSeries" USING GIN ("SearchVector");

-- TvSeriesActors indexes
CREATE INDEX "IX_TvSeriesActors_ActorId" ON "TvSeriesActors" ("ActorId");
CREATE INDEX "IX_TvSeriesActors_TvSeriesId" ON "TvSeriesActors" ("TvSeriesId");

-- TvSeriesGenres indexes
CREATE INDEX "IX_TvSeriesGenres_GenreId" ON "TvSeriesGenres" ("GenreId");
CREATE INDEX "IX_TvSeriesGenres_GenreId1" ON "TvSeriesGenres" ("GenreId1");

-- WatchList indexes
CREATE INDEX "IX_WatchList_UserId" ON "WatchList" ("UserId");

-- ============================================================
-- TRIGGERS FOR FULL TEXT SEARCH
-- ============================================================

-- Trigger for Movies search vector
CREATE OR REPLACE FUNCTION movies_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW."SearchVector" := 
        setweight(to_tsvector('english', COALESCE(NEW."Title", '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW."Overview", '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movies_search_vector_trigger
    BEFORE INSERT OR UPDATE ON "Movies"
    FOR EACH ROW
    EXECUTE FUNCTION movies_search_vector_update();

-- Trigger for TvSeries search vector
CREATE OR REPLACE FUNCTION tvseries_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW."SearchVector" := 
        setweight(to_tsvector('english', COALESCE(NEW."Title", '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW."Overview", '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tvseries_search_vector_trigger
    BEFORE INSERT OR UPDATE ON "TvSeries"
    FOR EACH ROW
    EXECUTE FUNCTION tvseries_search_vector_update();
