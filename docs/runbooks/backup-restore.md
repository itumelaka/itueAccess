# ITU eAccess Backup and Restore Drill

## Weekly backup

Set `SUPABASE_DB_URL` to the percent-encoded production connection string, then run:

```powershell
.\scripts\backup-database.ps1 -OutputDirectory ".\backups"
```

Store the `.sql` file and its `.sha256` sidecar in an owner-controlled location separate from the application. Never commit either file.

## Monthly disposable restore drill

1. Start a disposable local Supabase stack and record its local database URL with `supabase status`.
2. Verify the backup hash using `Get-FileHash -Algorithm SHA256` and compare it with the sidecar.
3. Reset the disposable database, then restore the SQL dump using the PostgreSQL client against the local URL.
4. Run `supabase test db` and verify the canonical locations plus a small sample of non-sensitive record counts.
5. Destroy only the disposable stack after recording the drill date, backup filename, result and operator.

Production must never be used as the restore target for a drill.
