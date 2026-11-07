# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`nuxt-users` is a published Nuxt module (Nuxt 3 and 4) providing authentication, RBAC authorization, user management, Vue components and a CLI, backed by SQLite, MySQL or PostgreSQL through `db0`. User-facing docs live in `docs/` (VitePress, deployed to https://nuxt-users.webmania.cc). `skills/nuxt-users/SKILL.md` and `llms.txt` are agent-facing summaries of the public API and should be kept in sync when public config, composables or components change.

## Commands

Node.js v22 or v24 is required: `dev`, `test` and `release` scripts abort on other versions, and CI tests both. `better-sqlite3` is a native module: after switching Node versions, run `npm rebuild better-sqlite3` (or reinstall) or SQLite tests fail to load it. Package manager is yarn.

```bash
yarn dev                 # stub-build module + run playground/ dev server
yarn build               # nuxt-module-build (module, utils, cli entries)
yarn lint / yarn lint:fix
yarn test                # full suite: lint + types + unit + integration + sqlite + mysql + postgresql
yarn test:quick          # unit + sqlite only (no external DB needed)
yarn test:unit           # vitest run test/unit/ (no database)
yarn test:sqlite         # all tests except test/unit/, DB_CONNECTOR=sqlite
yarn test:mysql          # needs MySQL at localhost:3306 root/rrd, db test_db
yarn test:postgresql     # needs PostgreSQL at localhost:5432
yarn test:types          # vue-tsc on module (tsconfig.vitest.json, includes *.test-d.ts) and playground
yarn test:integration    # builds playground, starts server, curls endpoints to verify middleware/whitelist
yarn check:translations && yarn check:locale-consistency   # locale key checks (run in release)
```

Single test file: pass the path to the matching script, e.g. `yarn test:unit test/unit/useUsers.test.ts` or `yarn test:sqlite test/login.test.ts`. The DB scripts set `DB_CONNECTOR` (and connection env vars); DB-backed tests read `process.env.DB_CONNECTOR` (default `sqlite`) and use helpers in `test/test-setup.ts`. Test files run sequentially (`fileParallelism: false`), and `test/vitest.setup.ts` closes all cached DB connections after each test.

Type-level tests (`test/unit/types.test-d.ts`) guard the public types: if one fails after a code change, treat it as a regression in the code, not a test to update, unless the public API change is intentional.

## Architecture

**Module setup (`src/module.ts`)** merges options with priority `runtimeConfig.nuxtUsers` > module options > `src/default-options.ts`. The `connector` is never merged with defaults (to avoid mixing SQLite `path` into MySQL/PG config). It writes a private `runtimeConfig.nuxtUsers` and a reduced `runtimeConfig.public.nuxtUsers`, and computes the auth whitelist (auto-adding registration/confirm-email endpoints when `/register` is whitelisted, and Google OAuth endpoints when `auth.google` is set). The whitelist logic is duplicated for private and public config; change both. API routes are registered explicitly with `addServerHandler` under the configurable `apiBasePath` (default `/api/nuxt-users`), so adding a file under `src/runtime/server/api/` does nothing until it is registered in `module.ts`. It also excludes `${apiBasePath}/**` from prerendering and schedules the `nuxt-users:cleanup-tokens` Nitro task.

**Entry points (`build.config.ts`)**: `module` (Nuxt module, also re-exports server internals from `src/runtime/server/internal/index.ts`), `utils` (`nuxt-users/utils`, from `src/utils/index.ts`: types, password/role validation, locale helpers, consumer-safe server utils), and `cli` (`src/cli/main.ts`, bin `nuxt-users`, built with citty). Inside the source, `nuxt-users/utils` is an alias to `src/utils/index.ts` (configured in `build.config.ts` and `vitest.config.ts`), and runtime code imports `ModuleOptions` etc. from it.

**Database layer (`src/runtime/server/utils/db.ts`)**: `useDb(options)` creates and caches a db0 instance per connector config, at runtime only (it throws at build/prerender time via `isBuildTime()`). MySQL uses a custom connector (`mysql-connector.ts`); SQLite/PG use db0's. SQL is written with db0 tagged templates; table names come from `options.tables.*` and are interpolated as `{${tableName}}`. Schema DDL differs per database, so table/migration utilities branch on `options.connector.name`.

**Migrations**: an ordered list in `src/runtime/server/utils/migrate.ts`, tracked by name in the migrations table. They run on server start (`server/plugins/auto-migrate.ts`) and via `nuxt-users migrate`. A new schema change means a new utility in `server/utils/`, a new entry appended to that list, and usually a matching `src/cli/` command.

**Auth flow**: login (`session/index.post.ts`) issues a token stored in `personal_access_tokens` and set as a cookie. `server/middleware/authorization.server.ts` runs on every request: whitelisted paths pass, otherwise it resolves the user from the token (`getCurrentUserFromToken`) and checks role permissions (`src/runtime/utils/permissions.ts`, supporting `*` wildcards and `{ path, methods }` entries). Client side, `plugin.auth-init.ts` (named `0-...` so it runs first) hydrates the user, and the global `middleware/authorization.client.ts` guards page navigation using the public whitelist. Server code gets the current user via the `useServerAuth` composable; `useNuxtUsersDatabase` gives consumers DB access.

**Business logic** lives in `server/services/` (registration, password reset/emails via nodemailer) and `server/utils/user.ts`; API handlers stay thin. Deletes are soft (`active` flag) unless `hardDelete` is set.

**Client**: composables in `src/runtime/composables/` (auto-imported; shared state uses `useState` created inside the composable function, never at module scope, to avoid cross-request leaks) and global `NUsers*` components in `src/runtime/components/`, themed via CSS variables in `assets/nuxt-users.css`. UI strings come from `src/runtime/locales/` (`en`, `hu` incl. formal variant) through `useNuxtUsersLocale`; any new key must be added to every locale or the translation checks fail.

## Conventions

- No semicolons; arrow functions; avoid `any`. ESLint uses `@nuxt/eslint-config` stylistic rules.
- Files kebab-case, components `NUsers*` PascalCase. Log prefix `[Nuxt Users]`.
- Commits follow Conventional Commits (`fix:`, `feat:`, `docs:`, `chore(release):`); `changelogen` generates CHANGELOG.md from them during `yarn release`.
- When behaviour or options change, update the relevant page in `docs/user-guide/` or `docs/developer-guide/`.
