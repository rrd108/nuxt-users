# Changelog


## v1.2.0

[compare changes](https://github.com/rrd108/nuxt-users/compare/v1.1.6...v1.2.0)

### 🚀 Enhancements

- Adds user role functionality closes #25 ([#25](https://github.com/rrd108/nuxt-users/issues/25))
- Adds authentication middleware and route whitelisting closes #52 ([#52](https://github.com/rrd108/nuxt-users/issues/52))

### 🩹 Fixes

- **ci:** Adds playground preparation step to CI ([cf9af1f](https://github.com/rrd108/nuxt-users/commit/cf9af1f))

### 💅 Refactors

- Uses default table names as fallback ([dcee2ee](https://github.com/rrd108/nuxt-users/commit/dcee2ee))

### 🏡 Chore

- **release:** V1.1.6 ([1222bcd](https://github.com/rrd108/nuxt-users/commit/1222bcd))
- Consistently prefixes logs with "[Nuxt Users]" ([9ed1df1](https://github.com/rrd108/nuxt-users/commit/9ed1df1))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v1.1.6

[compare changes](https://github.com/rrd108/nuxt-users/compare/v1.1.5...v1.1.6)

### 🩹 Fixes

- **deps:** Exclude bcrypt from client-side bundle ([a678a96](https://github.com/rrd108/nuxt-users/commit/a678a96))
- **cli:** Exits process after successful user creation ([d71b779](https://github.com/rrd108/nuxt-users/commit/d71b779))
- Remove db releated code from client code ([114d360](https://github.com/rrd108/nuxt-users/commit/114d360))

### 💅 Refactors

- **cli:** Commands to load options ([403a281](https://github.com/rrd108/nuxt-users/commit/403a281))

### 🏡 Chore

- **release:** V1.1.5 ([98ab3d1](https://github.com/rrd108/nuxt-users/commit/98ab3d1))

### 🤖 CI

- Adds Nuxt 4 compatibility tests ([4132d86](https://github.com/rrd108/nuxt-users/commit/4132d86))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v1.1.5

[compare changes](https://github.com/rrd108/nuxt-users/compare/v1.1.4...v1.1.5)

### 🩹 Fixes

- **deps:** Exclude bcrypt from client-side bundle ([a678a96](https://github.com/rrd108/nuxt-users/commit/a678a96))

### 💅 Refactors

- **cli:** Commands to load options ([403a281](https://github.com/rrd108/nuxt-users/commit/403a281))

### 🏡 Chore

- **release:** V1.1.4 ([4980c98](https://github.com/rrd108/nuxt-users/commit/4980c98))

### ✅ Tests

- Ensures database cleanup on test completion ([a1a528c](https://github.com/rrd108/nuxt-users/commit/a1a528c))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v1.1.4

[compare changes](https://github.com/rrd108/nuxt-users/compare/v1.1.0...v1.1.4)

### 🩹 Fixes

- CLI tool for database management ([0a4793f](https://github.com/rrd108/nuxt-users/commit/0a4793f))
- Handling cli commands ([120c396](https://github.com/rrd108/nuxt-users/commit/120c396))
- Database handling and setup ([11ddc20](https://github.com/rrd108/nuxt-users/commit/11ddc20))
- Proper check for migrations table ([08701a1](https://github.com/rrd108/nuxt-users/commit/08701a1))
- Migration command in warning message ([1a62e50](https://github.com/rrd108/nuxt-users/commit/1a62e50))
- Improves database connector error handling ([db3b670](https://github.com/rrd108/nuxt-users/commit/db3b670))
- Use sql connector defined in nuxt.config ([b37900d](https://github.com/rrd108/nuxt-users/commit/b37900d))
- Module metadata and build process ([3da5410](https://github.com/rrd108/nuxt-users/commit/3da5410))
- **ci:** Install optional dependencies ([38d6ee8](https://github.com/rrd108/nuxt-users/commit/38d6ee8))
- Adds necessary database drivers for testing ([f1815f4](https://github.com/rrd108/nuxt-users/commit/f1815f4))
- **ci:** Installs peer dependencies in CI workflows ([423d4e9](https://github.com/rrd108/nuxt-users/commit/423d4e9))
- Test paths ([047f0e8](https://github.com/rrd108/nuxt-users/commit/047f0e8))
- Type errors ([3d5b35c](https://github.com/rrd108/nuxt-users/commit/3d5b35c))
- Consolidates build config and external deps ([48b4980](https://github.com/rrd108/nuxt-users/commit/48b4980))
- **ci:** Downgrade mariadb ([b1be244](https://github.com/rrd108/nuxt-users/commit/b1be244))
- Adds db0 to external dependencies ([b276c58](https://github.com/rrd108/nuxt-users/commit/b276c58))

### 💅 Refactors

- CLI commands to use environment variables ([3fc6c9f](https://github.com/rrd108/nuxt-users/commit/3fc6c9f))
- Remove unused types ([06b5e9f](https://github.com/rrd108/nuxt-users/commit/06b5e9f))
- Database connection logic ([f5baadf](https://github.com/rrd108/nuxt-users/commit/f5baadf))
- Moves user existence check to user utils ([62cc871](https://github.com/rrd108/nuxt-users/commit/62cc871))
- Remove unused options ([b391013](https://github.com/rrd108/nuxt-users/commit/b391013))
- Adds a color palette and styles login forms ([d3bffab](https://github.com/rrd108/nuxt-users/commit/d3bffab))
- Adds color palette and improves styling ([7cfab67](https://github.com/rrd108/nuxt-users/commit/7cfab67))
- Db check to plugin ([d466e2f](https://github.com/rrd108/nuxt-users/commit/d466e2f))
- Consolidates utils and CLI build ([21e9f3c](https://github.com/rrd108/nuxt-users/commit/21e9f3c))
- Remove unused option ([d9e3525](https://github.com/rrd108/nuxt-users/commit/d9e3525))
- Utils import paths ([e3b59c3](https://github.com/rrd108/nuxt-users/commit/e3b59c3))
- Module utils and improves CLI output ([e80b160](https://github.com/rrd108/nuxt-users/commit/e80b160))

### 🏡 Chore

- **release:** V1.1.0 ([bfc24f6](https://github.com/rrd108/nuxt-users/commit/bfc24f6))
- Adds script to deploy documentation to server ([81f7f74](https://github.com/rrd108/nuxt-users/commit/81f7f74))
- Adds script to deploy documentation ([7e2f642](https://github.com/rrd108/nuxt-users/commit/7e2f642))
- **release:** V1.1.1 ([e3bda8a](https://github.com/rrd108/nuxt-users/commit/e3bda8a))
- **release:** V1.1.2 ([3a2d2ae](https://github.com/rrd108/nuxt-users/commit/3a2d2ae))
- **release:** V1.1.3 ([b32a05f](https://github.com/rrd108/nuxt-users/commit/b32a05f))
- Updates dependencies in yarn.lock ([f29a369](https://github.com/rrd108/nuxt-users/commit/f29a369))
- Adds nodemailer to externals and dependencies ([b717d49](https://github.com/rrd108/nuxt-users/commit/b717d49))
- Removes stub build from dev prepare script ([dd96376](https://github.com/rrd108/nuxt-users/commit/dd96376))
- Remove examples ([d2f5c04](https://github.com/rrd108/nuxt-users/commit/d2f5c04))
- Remove comments ([6b45d71](https://github.com/rrd108/nuxt-users/commit/6b45d71))
- Renames unbuild config file ([bd7299f](https://github.com/rrd108/nuxt-users/commit/bd7299f))

### ✅ Tests

- Cleanup added ([50369a9](https://github.com/rrd108/nuxt-users/commit/50369a9))
- Ensures database cleanup on test completion ([a1a528c](https://github.com/rrd108/nuxt-users/commit/a1a528c))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v1.1.3

[compare changes](https://github.com/rrd108/nuxt-users/compare/v1.1.0...v1.1.3)

### 🩹 Fixes

- CLI tool for database management ([0a4793f](https://github.com/rrd108/nuxt-users/commit/0a4793f))
- Handling cli commands ([120c396](https://github.com/rrd108/nuxt-users/commit/120c396))
- Database handling and setup ([11ddc20](https://github.com/rrd108/nuxt-users/commit/11ddc20))
- Proper check for migrations table ([08701a1](https://github.com/rrd108/nuxt-users/commit/08701a1))
- Migration command in warning message ([1a62e50](https://github.com/rrd108/nuxt-users/commit/1a62e50))

### 💅 Refactors

- CLI commands to use environment variables ([3fc6c9f](https://github.com/rrd108/nuxt-users/commit/3fc6c9f))
- Remove unused types ([06b5e9f](https://github.com/rrd108/nuxt-users/commit/06b5e9f))
- Database connection logic ([f5baadf](https://github.com/rrd108/nuxt-users/commit/f5baadf))
- Moves user existence check to user utils ([62cc871](https://github.com/rrd108/nuxt-users/commit/62cc871))
- Remove unused options ([b391013](https://github.com/rrd108/nuxt-users/commit/b391013))
- Adds a color palette and styles login forms ([d3bffab](https://github.com/rrd108/nuxt-users/commit/d3bffab))
- Adds color palette and improves styling ([7cfab67](https://github.com/rrd108/nuxt-users/commit/7cfab67))
- Db check to plugin ([d466e2f](https://github.com/rrd108/nuxt-users/commit/d466e2f))
- Consolidates utils and CLI build ([21e9f3c](https://github.com/rrd108/nuxt-users/commit/21e9f3c))
- Remove unused option ([d9e3525](https://github.com/rrd108/nuxt-users/commit/d9e3525))

### 🏡 Chore

- **release:** V1.1.0 ([bfc24f6](https://github.com/rrd108/nuxt-users/commit/bfc24f6))
- Adds script to deploy documentation to server ([81f7f74](https://github.com/rrd108/nuxt-users/commit/81f7f74))
- Adds script to deploy documentation ([7e2f642](https://github.com/rrd108/nuxt-users/commit/7e2f642))
- **release:** V1.1.1 ([e3bda8a](https://github.com/rrd108/nuxt-users/commit/e3bda8a))
- **release:** V1.1.2 ([3a2d2ae](https://github.com/rrd108/nuxt-users/commit/3a2d2ae))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v1.1.2

[compare changes](https://github.com/rrd108/nuxt-users/compare/v1.1.0...v1.1.2)

### 🩹 Fixes

- CLI tool for database management ([0a4793f](https://github.com/rrd108/nuxt-users/commit/0a4793f))
- Handling cli commands ([120c396](https://github.com/rrd108/nuxt-users/commit/120c396))
- Database handling and setup ([11ddc20](https://github.com/rrd108/nuxt-users/commit/11ddc20))

### 💅 Refactors

- CLI commands to use environment variables ([3fc6c9f](https://github.com/rrd108/nuxt-users/commit/3fc6c9f))
- Remove unused types ([06b5e9f](https://github.com/rrd108/nuxt-users/commit/06b5e9f))
- Database connection logic ([f5baadf](https://github.com/rrd108/nuxt-users/commit/f5baadf))

### 🏡 Chore

- **release:** V1.1.0 ([bfc24f6](https://github.com/rrd108/nuxt-users/commit/bfc24f6))
- Adds script to deploy documentation to server ([81f7f74](https://github.com/rrd108/nuxt-users/commit/81f7f74))
- Adds script to deploy documentation ([7e2f642](https://github.com/rrd108/nuxt-users/commit/7e2f642))
- **release:** V1.1.1 ([e3bda8a](https://github.com/rrd108/nuxt-users/commit/e3bda8a))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v1.1.1

[compare changes](https://github.com/rrd108/nuxt-users/compare/v1.1.0...v1.1.1)

### 🩹 Fixes

- CLI tool for database management ([0a4793f](https://github.com/rrd108/nuxt-users/commit/0a4793f))
- Handling cli commands ([120c396](https://github.com/rrd108/nuxt-users/commit/120c396))

### 💅 Refactors

- CLI commands to use environment variables ([3fc6c9f](https://github.com/rrd108/nuxt-users/commit/3fc6c9f))
- Remove unused types ([06b5e9f](https://github.com/rrd108/nuxt-users/commit/06b5e9f))
- Database connection logic ([f5baadf](https://github.com/rrd108/nuxt-users/commit/f5baadf))

### 🏡 Chore

- **release:** V1.1.0 ([bfc24f6](https://github.com/rrd108/nuxt-users/commit/bfc24f6))
- Adds script to deploy documentation to server ([81f7f74](https://github.com/rrd108/nuxt-users/commit/81f7f74))
- Adds script to deploy documentation ([7e2f642](https://github.com/rrd108/nuxt-users/commit/7e2f642))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

## v1.1.0


### 🚀 Enhancements

- Implement Sanctum-style token authentication ([8b6d1d3](https://github.com/rrd108/nuxt-users/commit/8b6d1d3))
- Create and save token ([063cabf](https://github.com/rrd108/nuxt-users/commit/063cabf))
- Implement password reset functionality ([bf9d2bc](https://github.com/rrd108/nuxt-users/commit/bf9d2bc))
- Implement password reset functionality with FormKit forms ([c025be2](https://github.com/rrd108/nuxt-users/commit/c025be2))
- Make database table names customizable ([6db3c28](https://github.com/rrd108/nuxt-users/commit/6db3c28))

### 🩹 Fixes

- **ci:** Switch to mariadb for mysql tests ([8ddc60b](https://github.com/rrd108/nuxt-users/commit/8ddc60b))
- **deps:** Update nuxtjs monorepo to v3.17.7 ([89e3d3d](https://github.com/rrd108/nuxt-users/commit/89e3d3d))

### ❤️ Contributors

- Rrd108 ([@rrd108](https://github.com/rrd108))

