# Restore Database

Restore the WorkSearch PostgreSQL database from a backup file.

## ⚠️ Warning

This will **overwrite all current data** in the database with the backup contents. Make sure you have the correct backup file before proceeding.

## Command

```bash
# Replace 'backup-20260207-143022.sql' with your actual backup filename
docker compose exec -T db sh -c 'psql -U $POSTGRES_USER $POSTGRES_DB' < backup-20260207-143022.sql
```

## Steps

1. **Stop the API** (optional but recommended):
   ```bash
   docker compose stop api
   ```

2. **Restore from backup**:
   ```bash
   docker compose exec -T db sh -c 'psql -U $POSTGRES_USER $POSTGRES_DB' < backup-YYYYMMDD-HHMMSS.sql
   ```

3. **Restart the API**:
   ```bash
   docker compose start api
   ```

## Verify restore

```bash
# Check company count
docker compose exec -T db sh -c 'psql -U $POSTGRES_USER $POSTGRES_DB -c "SELECT COUNT(*) FROM \"Company\";"'

# Check application count
docker compose exec -T db sh -c 'psql -U $POSTGRES_USER $POSTGRES_DB -c "SELECT COUNT(*) FROM \"Application\";"'

# Check users
docker compose exec -T db sh -c 'psql -U $POSTGRES_USER $POSTGRES_DB -c "SELECT email, role FROM \"User\";"'
```

## Troubleshooting

If restore fails with "relation already exists" errors:

1. **Drop and recreate the database**:
   ```bash
   docker compose exec db sh -c 'psql -U $POSTGRES_USER -c "DROP DATABASE $POSTGRES_DB;"'
   docker compose exec db sh -c 'psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB;"'
   docker compose exec -T db sh -c 'psql -U $POSTGRES_USER $POSTGRES_DB' < backup-YYYYMMDD-HHMMSS.sql
   ```

2. **Or use a clean restore**:
   ```bash
   docker compose exec api npx prisma migrate reset --force
   docker compose exec -T db sh -c 'psql -U $POSTGRES_USER $POSTGRES_DB' < backup-YYYYMMDD-HHMMSS.sql
   ```

## Notes

- The `-T` flag disables pseudo-TTY allocation (required for piping input)
- Restore preserves all data: users, companies, applications, transitions, events
- Sessions/cookies are not stored in the database (users will need to re-login)
- Large backups may take a few seconds to restore
