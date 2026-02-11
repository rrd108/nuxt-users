# Agent Skill

Nuxt Users ships an **Agent Skill** that gives AI coding agents (Cursor, Claude Code, Cline, and others) procedural knowledge for this module. Once installed, your agent can help with configuration, CLI usage, composables, and authorization without you copying docs or prompts.

## Install

From any machine where you use your AI agent, run once:

```bash
npx skills add rrd108/nuxt-users
```

The skill is then available to your agent. No need to repeat the install unless you switch agents or environments.

## What the skill covers

- **Setup** — Installing the module, peer dependencies, and adding it to `nuxt.config.ts`
- **Database** — SQLite, MySQL, and PostgreSQL config; running `npx nuxt-users migrate`
- **CLI** — `create-user`, migrations, and other `nuxt-users` commands
- **Configuration** — `nuxtUsers` options (connector, auth, permissions, password validation, mailer, etc.)
- **Composables** — `useAuthentication`, `useUsers`, `usePublicPaths`, `usePasswordValidation`, `useNuxtUsersLocale`
- **Components** — `NUsersLoginForm`, `NUsersLogoutLink`, `NUsersProfileInfo`, and related components
- **Authorization** — Whitelist, role-based permissions, and common pitfalls (e.g. users redirected to login)

## Format and discovery

The skill follows the [Agent Skills specification](https://agentskills.io/specification) and lives in this repo at `skills/nuxt-users/SKILL.md`. It is part of the [Skills directory](https://skills.sh/), where you can browse and install skills for supported agents.

## Links

- [Agent Skills specification](https://agentskills.io/specification)
- [Skills directory (skills.sh)](https://skills.sh/)
- [Nuxt Users skill on GitHub](https://github.com/rrd108/nuxt-users/tree/main/skills/nuxt-users)
