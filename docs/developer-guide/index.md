# Developer Guide

Welcome to the Nuxt Users module developer guide. This section is designed for contributors, maintainers, and advanced developers who want to understand the internal workings of the module, contribute to its development, or extend its functionality.

## What You'll Find Here

This developer guide provides comprehensive technical documentation about the module's internals, architecture, and development processes. Unlike the user guide which focuses on how to use the module, this section dives deep into how the module works under the hood.

### For Contributors

If you're looking to contribute to the Nuxt Users module, you'll find everything you need to get started:

- **[Development Setup](./development-setup.md)** - Set up your local development environment
- **[Contributing Guidelines](./contributing.md)** - Learn about our contribution process and standards
- **[Code Style](./code-style.md)** - Understand our coding conventions and style guidelines
- **[Testing](./testing.md)** - Learn how to run tests and write new ones

### For Advanced Developers

If you need to understand the module's internal architecture or extend its functionality:

- **[Architecture](./architecture.md)** - Comprehensive overview of the module's internal structure and design patterns
- **[Database Internals](./database-internals.md)** - Deep dive into database utilities like `useDatabase()` and `useNuxtUsersDatabase()`
- **[Server Utilities](./server-utilities.md)** - Documentation of internal server functions like `defineEventHandler()` and `getCookie()`

## Internal APIs and Utilities

This guide documents the internal APIs and utilities that power the Nuxt Users module. These are implementation details that module users don't need to know about, but are essential for contributors and developers who need to understand or modify the module's behavior.

### Key Internal Components

- **Database Layer**: Internal database utilities and connection management
- **Server Middleware**: Authentication and authorization middleware implementation
- **API Handlers**: Internal event handlers and server-side logic
- **Security Utilities**: Password hashing, token management, and security functions
- **Migration System**: Database schema management and migration utilities

## Getting Started as a Developer

1. **Start with [Development Setup](./development-setup.md)** to configure your local environment
2. **Read the [Architecture](./architecture.md)** documentation to understand the overall design
3. **Review [Contributing Guidelines](./contributing.md)** before making changes
4. **Check [Testing](./testing.md)** to learn how to validate your changes

## Difference from User Guide

The [User Guide](../user-guide/) focuses on how to use the module in your Nuxt application, while this Developer Guide focuses on how the module works internally and how to contribute to its development. If you're just looking to add authentication to your app, the User Guide is what you need.

## Need Help?

If you're working on the module and need assistance, please check our contributing guidelines for information on how to get help from the community and maintainers.