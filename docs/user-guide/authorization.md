# Authorization (RBAC)

This module includes a simple yet powerful Role-Based Access Control (RBAC) system to control access to your application's pages and API routes.

> 🚨 **Critical: Permissions Required**
> 
> **By default, NO users (including admins) can access any protected routes until you configure permissions.** If you're experiencing redirect loops or users being sent back to login after authentication, this is likely the cause.
> 
> **Quick fix for admin access:**
> ```ts
> // nuxt.config.ts
> nuxtUsers: {
>   auth: {
>     permissions: {
>       admin: ['*'] // Gives admin access to everything
>     }
>   }
> }
> ```

## Overview

The authorization system follows a **whitelist approach** - by default, no routes are accessible unless explicitly configured. This ensures security by default, but requires explicit permission configuration for any protected access.

## How Authorization Works

The authorization logic follows these rules in order:

1. **Whitelist Paths**: These paths are defined in your `nuxt.config.ts` (`nuxtUsers.auth.whitelist`) and are always accessible to any user, authenticated or not. They do not require any specific permissions.
2. **Protected Paths**: Any path that is not in the whitelist requires authentication. Additionally, you can protect routes based on user roles using the `permissions` configuration.

This means that routes like `/login` or `/register` (if whitelisted) are accessible to everyone, bypassing the permission system entirely.

## Role-Based Access Control

You can restrict access to certain routes based on the user's role. The user's role is stored in the `role` column of the `users` table.

### Configuration

You can define permissions in your `nuxt.config.ts` file under the `nuxtUsers.auth.permissions` option. The `permissions` object maps roles to an array of allowed rules.

A rule can be a simple `string` for a path (which allows all methods) or an `object` to specify allowed HTTP methods for a path.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    // ... other options
    auth: {
      whitelist: ['/register', '/public'],
      permissions: {
        admin: ['*'], // Admin can access everything
        user: ['/profile', '/settings', '/api/nuxt-users/me'],
        manager: [
          // Manager can only GET and PATCH users, but not DELETE them
          { path: '/api/nuxt-users/*', methods: ['GET', 'PATCH'] },
          '/manager-dashboard' // They can access their dashboard normally
        ]
      }
    }
  }
})
```

### Permission Patterns

The system supports various patterns for flexible route protection:

#### Method-Based Permissions (Recommended)

For fine-grained control over API endpoints, use the object format. This is the most secure way to grant permissions.

```ts
permissions: {
  manager: [
    { path: '/api/users/*', methods: ['GET', 'PATCH'] },
    { path: '/api/posts', methods: ['POST'] }
  ],
  viewer: [
    { path: '/api/posts/*', methods: ['GET'] }
  ]
}
```

:::info NOTE
Requests using safe, non-modifying methods like `OPTIONS` and `HEAD` are always allowed and bypass permission checks.
:::

#### Exact Paths
```ts
permissions: {
      user: ['/profile', '/settings']
}
```

#### Wildcard Patterns
```ts
permissions: {
  admin: ['*'],                    // Access to everything
  moderator: ['/admin/*'],         // Access to all admin sub-routes
  editor: ['/content/*', '/api/content/*']  // Access to content routes
}
```

#### Complex Wildcards
```ts
permissions: {
  api_user: ['/api/*/profile'],    // Example pattern
  manager: ['/admin/*/users/*']    // Access to user management under admin
}
```

## Configuration Examples

### Basic Setup
```ts
nuxtUsers: {
  auth: {
    whitelist: ['/register', '/about'],
    permissions: {
      admin: ['*'],
      user: ['/profile', '/dashboard'],
      guest: [] // No permissions - can only access whitelisted routes
    }
  }
}
```

### E-commerce Application
```ts
nuxtUsers: {
  auth: {
    whitelist: ['/register', '/products', '/categories'],
    permissions: {
      admin: ['*'],
      manager: ['/admin/*', '/api/admin/*', '/reports/*'],
      customer: ['/profile', '/orders', '/api/nuxt-users/*'],
      vendor: ['/vendor/*', '/api/vendor/*', '/products/manage']
    }
  }
}
```

### Content Management System
```ts
nuxtUsers: {
  auth: {
    whitelist: ['/register', '/public/*'],
    permissions: {
      super_admin: ['*'],
      admin: ['/admin/*', '/api/admin/*'],
      editor: ['/editor/*', '/api/editor/*', '/content/*'],
      author: ['/author/*', '/api/author/*', '/content/create'],
      reviewer: ['/review/*', '/api/review/*']
    }
  }
}
```

## Security Features

### Whitelist Approach
- **Default Deny**: By default, `permissions` is an empty object `{}`, meaning no routes are accessible
- **Explicit Allow**: You must explicitly define permissions to grant access
- **Secure by Default**: New routes are automatically protected until explicitly permitted

### Wildcard Support
- `*` - Matches any path (full access)
- `/*` at the end - Matches the base path and all sub-paths under it (`/admin/*` matches `/admin` and `/admin/users/1`)
- `*` inside a pattern - Matches exactly one path segment (`/api/*/users` matches `/api/admin/users`)
- `**` - Matches any number of path segments
- Patterns are matched against the whole path: `/api/*/users` does not match `/api/admin/users/1` or `/api/admin/users-export`. Use `/api/*/users/*` to include sub-paths

### Role Hierarchy
You can implement role hierarchies by giving higher-level roles access to lower-level paths:

```ts
permissions: {
  super_admin: ['*'],           // Access to everything
  admin: ['/admin/*', '/api/admin/*'],  // Access to admin areas
  manager: ['/manage/*', '/api/manage/*'], // Access to management
  user: ['/profile', '/dashboard']      // Basic user access
}
```

## Creating Users with Roles

You can create users with specific roles using the CLI:

```bash
# Create a standard user
npx nuxt-users create-user -e user@example.com -n "John Doe" -p password123 -r user

# Create an admin user
npx nuxt-users create-user -e admin@example.com -n "Admin User" -p adminpass123 -r admin

# Create an editor user
npx nuxt-users create-user -e editor@example.com -n "Editor User" -p editorpass123 -r editor

# Create a moderator user
npx nuxt-users create-user -e moderator@example.com -n "Moderator User" -p modpass123 -r moderator
```

The default role is `user` if not specified. Role values should match keys in `auth.permissions` unless `auth.allowCustomRoles` is `true` (or permissions are not configured yet).

## Listing Public and Protected Routes

To check your `whitelist` and `permissions` against what your app actually serves, run from the project root:

```bash
npx nuxt-users list-routes
```

The command loads your Nuxt project and lists every page and API endpoint with who can reach it:

```
[Nuxt Users] Pages (4)
[Nuxt Users]    protected  /               roles: admin, user
[Nuxt Users]    public     /about          whitelist: /about
[Nuxt Users]    public     /login          built-in public page
[Nuxt Users]    protected  /reports        ⚠️  no role has access

[Nuxt Users] API endpoints (3)
[Nuxt Users]    protected  GET   /api/nuxt-users          roles: admin
[Nuxt Users]    signed-in  GET   /api/nuxt-users/me       any signed-in user
[Nuxt Users]    public     POST  /api/nuxt-users/session  built-in public endpoint
```

Each route gets one of these access levels:

| Level | Meaning |
|-------|---------|
| `public` | No sign-in needed. The reason says why: a built-in public page or endpoint (login, logout, password reset), or the `whitelist` entry that matches it (including the endpoints whitelisted automatically for `/register` and Google OAuth) |
| `signed-in` | Any signed-in user, whatever the role (`/me` and changing your own password) |
| `protected` | Only the listed roles from `auth.permissions`. **no role has access** means nobody can reach it, so add it to `whitelist` or `permissions` if it should be reachable |

The command checks routes in the same order as the server authorization middleware, and per HTTP method, so a `{ path, methods }` permission only counts for its methods. A server handler without a method in its file name (`server/api/posts.ts`) is shown as `ANY` when every method gets the same access, otherwise as one row per method.

Where the routes come from:

- **Pages**: files in the `pages/` directory of your app and its layers. Dynamic segments are shown as `:id` (`[id].vue`), `:id?` (`[[id]].vue`) and `:slug*` (`[...slug].vue`), and are matched against your patterns as written, so `/users/*` covers `/users/:id` but `/users/1` does not.
- **Endpoints**: the nuxt-users API, handlers registered by other modules or `nitro.handlers`, and the files in `server/api/` and `server/routes/`.

Pages added only at runtime or through the `pages:extend` hook are not listed.

For scripts or CI checks, print the result as JSON (loading logs go to stderr, so stdout stays valid JSON):

```bash
npx nuxt-users list-routes --json
```

```json
{
  "pages": [
    { "method": "GET", "path": "/about", "source": "pages/about.vue", "access": { "level": "public", "reason": "whitelist: /about", "roles": [] } }
  ],
  "endpoints": [
    { "method": "GET", "path": "/api/nuxt-users", "source": "module", "access": { "level": "protected", "roles": ["admin"] } }
  ]
}
```

`access.level` is `public`, `authenticated` or `protected`, and `source` is the file relative to the project root, or `module` for handlers registered by a module.

## Best Practices

1. **Start with Whitelist**: Begin by whitelisting public routes that don't need authentication
2. **Use Specific Permissions**: Avoid using `*` for regular users - be specific about what they can access
3. **Test Permissions**: Always test your permission configuration with different user roles
4. **Document Roles**: Keep a clear documentation of what each role can access
5. **Regular Review**: Periodically review and update permissions as your application evolves

## Troubleshooting

### Common Issues

**🔄 Authenticated users redirected to login (Redirect Loop):**

This is the **most common issue** - your authenticated users (including admins) are being redirected back to login when trying to access any page.

**Cause:** No permissions are configured. By default, `permissions: {}` means no one can access anything.

**Solution:**
```ts
// nuxt.config.ts
nuxtUsers: {
  auth: {
    permissions: {
      admin: ['*'], // Admin can access everything
      user: ['/profile', '/api/nuxt-users/me'] // Basic user access
    }
  }
}
```

**Debug:** Check browser console for messages like:
```
[Nuxt Users] client.middleware.auth.global: User with role admin denied access to /profile
```

**User can't access a route they should have access to:**
- Check if the route is in the `whitelist` (whitelisted routes bypass permissions)
- Verify the user's role matches the permissions configuration
- Ensure the path pattern matches exactly (including leading/trailing slashes)

**All users are being redirected to login:**
- Check if `permissions` is configured (empty permissions deny all access)
- Verify that at least one role has the necessary permissions
- Ensure the user's role exists in the permissions configuration

**Wildcards not working as expected:**
- Use `/*` for sub-path matching (e.g., `/admin/*` matches `/admin/users`)
- Use `*` for full access (e.g., `admin: ['*']`)
- Test complex patterns with the actual paths you're trying to protect

## Programmatic Access Control

For programmatic access control using the `usePublicPaths` composable, refer to the [Composables documentation](/user-guide/composables.md#usepublicpaths).
