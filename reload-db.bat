@echo off
REM Replace 'your_postgres_user' with your actual PostgreSQL username
SET PGPASSWORD=postgres
psql -U postgres -f "reload-db.psql"
