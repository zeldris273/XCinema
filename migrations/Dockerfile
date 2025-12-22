# Dockerfile for golang-migrate
FROM migrate/migrate:latest

COPY *.sql /migrations/

WORKDIR /migrations

ENTRYPOINT ["migrate"]
