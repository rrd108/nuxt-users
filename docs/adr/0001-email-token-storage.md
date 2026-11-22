# Email tokens: one table with a purpose, SHA-256, creation time plus a time limit

Password reset tokens and confirmation tokens stay in the existing `password_reset_tokens` table, which keeps its name and its `tables.passwordResetTokens` option to avoid a breaking change. A `purpose` column says which kind each token is, and a token is only ever accepted for its own purpose. Tokens are hashed with SHA-256 instead of bcrypt: they are 32 random bytes, so bcrypt's slowness adds no protection, and a plain hash lets a token be found directly instead of comparing it against every row for an email. Expiry is the row's `created_at` plus a time limit per purpose, judged on the database clock, because writing an `expires_at` from Node has caused time-zone bugs and doing it in SQL needs different interval syntax for each database.

## Considered options

- **Separate tables per purpose**: rejected. It adds a new table option and a second schema to migrate and clean up, with no gain over a purpose column.
- **Keep bcrypt**: rejected. Its only effect here is forcing a compare loop per email.

## Consequences

When this ships, the migration assigns a purpose to existing rows from the user's state: rows for an inactive user become confirmation tokens, and the rest become password reset tokens. Those rows keep a bcrypt check inside the email token module until they expire (24 hours at most), so links already sent keep working. That fallback can be removed in a later release.
