# Backup Database

Create a timestamped backup of the WorkSearch PostgreSQL database.

## Command

```bash
docker compose exec -T db sh -c 'pg_dump -U $POSTGRES_USER $POSTGRES_DB' > backup-$(date +%Y%m%d-%H%M%S).sql
```

## What it does

- Connects to the PostgreSQL container using container environment variables
- Dumps the entire database to a SQL file
- Names the file with current timestamp (e.g., `backup-20260207-143022.sql`)

## When to use

- Before running `prisma migrate reset`
- Before making schema changes
- Before upgrading dependencies
- As a regular backup (daily/weekly)

## Verify backup

```bash
# Check the backup file was created
ls -lh backup-*.sql

# View first few lines to verify
head -20 backup-*.sql
```

## Notes

- Backup files can be large if you have many applications
- Store backups outside the repository (add `backup-*.sql` to `.gitignore`)
- Consider automating backups with a cron job
