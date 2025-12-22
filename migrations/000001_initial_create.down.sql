-- Rollback migration - Drop all tables in reverse order

-- Drop triggers first
DROP TRIGGER IF EXISTS movies_search_vector_trigger ON "Movies";
DROP TRIGGER IF EXISTS tvseries_search_vector_trigger ON "TvSeries";

-- Drop functions
DROP FUNCTION IF EXISTS movies_search_vector_update();
DROP FUNCTION IF EXISTS tvseries_search_vector_update();

-- Drop tables with dependencies first
DROP TABLE IF EXISTS "Notifications" CASCADE;
DROP TABLE IF EXISTS "Likes" CASCADE;
DROP TABLE IF EXISTS "Comments" CASCADE;
DROP TABLE IF EXISTS "Episodes" CASCADE;
DROP TABLE IF EXISTS "TvSeriesGenres" CASCADE;
DROP TABLE IF EXISTS "TvSeriesActors" CASCADE;
DROP TABLE IF EXISTS "Seasons" CASCADE;
DROP TABLE IF EXISTS "MovieGenres" CASCADE;
DROP TABLE IF EXISTS "MovieActors" CASCADE;
DROP TABLE IF EXISTS "WatchList" CASCADE;
DROP TABLE IF EXISTS "Ratings" CASCADE;
DROP TABLE IF EXISTS "AspNetUserTokens" CASCADE;
DROP TABLE IF EXISTS "AspNetUserRoles" CASCADE;
DROP TABLE IF EXISTS "AspNetUserLogins" CASCADE;
DROP TABLE IF EXISTS "AspNetUserClaims" CASCADE;
DROP TABLE IF EXISTS "AspNetRoleClaims" CASCADE;

-- Drop base tables
DROP TABLE IF EXISTS "ViewLogs" CASCADE;
DROP TABLE IF EXISTS "TvSeries" CASCADE;
DROP TABLE IF EXISTS "Movies" CASCADE;
DROP TABLE IF EXISTS "AspNetUsers" CASCADE;
DROP TABLE IF EXISTS "AspNetRoles" CASCADE;
DROP TABLE IF EXISTS "Genres" CASCADE;
DROP TABLE IF EXISTS "Actors" CASCADE;
