# Authorization (RBAC)

This module includes a simple yet powerful Role-Based Access Control (RBAC) system to control access to your application's pages and API routes.

## Overview

The authorization system follows a **whitelist approach** - by default, no routes are accessible unless explicitly configured. This ensures security by default.

## Flow Summary

The authorization logic follows these rules in order:

1. **`NO_AUTH_PATHS`**: These are internal paths used by the module that are always accessible and bypass all authentication and authorization checks. You don't need to configure anything for these.
2. **Whitelist Paths**: These paths are defined in your `nuxt.config.ts` (`nuxtUsers.auth.whitelist`) and are always accessible to any user, authenticated or not. They do not require any specific permissions.
3. **Protected Paths**: Any path that is not in the whitelist requires authentication. Additionally, you can protect routes based on user roles using the `permissions` configuration.

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
      whitelist: ['/login', '/register', '/public'],
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

### Examples

#### Basic Setup
```ts
nuxtUsers: {
  auth: {
    whitelist: ['/login', '/register', '/about'],
    permissions: {
      admin: ['*'],
      user: ['/profile', '/dashboard'],
      guest: [] // No permissions - can only access whitelisted routes
    }
  }
}
```

#### E-commerce Application
```ts
nuxtUsers: {
  auth: {
    whitelist: ['/login', '/register', '/products', '/categories'],
    permissions: {
      admin: ['*'],
      manager: ['/admin/*', '/api/admin/*', '/reports/*'],
      customer: ['/profile', '/orders', '/api/nuxt-users/*'],
      vendor: ['/vendor/*', '/api/vendor/*', '/products/manage']
    }
  }
}
```

#### Content Management System
```ts
nuxtUsers: {
  auth: {
    whitelist: ['/login', '/register', '/public/*'],
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

### How it Works

The authorization is enforced by global middleware that runs on both server-side and client-side:

#### Server-Side Middleware
- Runs on every API request and page request
- Checks authentication and permissions before processing requests
- Redirects unauthorized users to `/login`

#### Client-Side Middleware  
- Runs on every route navigation
- Prevents unauthorized navigation on the client
- Redirects to `/login` if access is denied

#### Authorization Process

1. **Path Check**: The middleware first checks if the route is in the `NO_AUTH_PATHS` or the user-defined `whitelist`. If so, access is granted without any further checks.

2. **Authentication Check**: If the route is not whitelisted, it checks if the user is authenticated. If not, it redirects to the login page.

3. **Permission Check**: If the user is authenticated, it checks their role against the `permissions` configuration:
   - Gets the list of allowed paths for the user's role
   - Checks if the requested path matches any of the allowed paths for that role
   - Supports wildcards (`*` and `/*`) for flexible matching
   - If the user's role has a `*` permission, they are granted access to all routes

4. **Access Decision**: 
   - If a match is found, access is granted
   - If no match is found, access is denied and the user is redirected to `/login`
   - If a route is not mentioned in any role's permissions, only users with a wildcard (`*`) permission can access it

### Security Features

#### Whitelist Approach
- **Default Deny**: By default, `permissions` is an empty object `{}`, meaning no routes are accessible
- **Explicit Allow**: You must explicitly define permissions to grant access
- **Secure by Default**: New routes are automatically protected until explicitly permitted

#### Wildcard Support
- `*` - Matches any path (full access)
- `/*` - Matches all sub-paths under a base path
- `**` - Matches any number of path segments
- Complex patterns like `/api/*/users/*` for flexible matching

#### Role Hierarchy
You can implement role hierarchies by giving higher-level roles access to lower-level paths:

```ts
permissions: {
  super_admin: ['*'],           // Access to everything
  admin: ['/admin/*', '/api/admin/*'],  // Access to admin areas
  manager: ['/manage/*', '/api/manage/*'], // Access to management
  user: ['/profile', '/dashboard']      // Basic user access
}
```

### Creating Users with Roles

You can create users with specific roles using the CLI:

```bash
# Create a standard user
npx nuxt-users create-user user@example.com "John Doe" password123 user

# Create an admin user
npx nuxt-users create-user admin@example.com "Admin User" adminpass123 admin

# Create an editor user
npx nuxt-users create-user editor@example.com "Editor User" editorpass123 editor

# Create a moderator user
npx nuxt-users create-user moderator@example.com "Moderator User" modpass123 moderator
```

The default role is `user` if not specified.

### Best Practices

1. **Start with Whitelist**: Begin by whitelisting public routes that don't need authentication
2. **Use Specific Permissions**: Avoid using `*` for regular users - be specific about what they can access
3. **Test Permissions**: Always test your permission configuration with different user roles
4. **Document Roles**: Keep a clear documentation of what each role can access
5. **Regular Review**: Periodically review and update permissions as your application evolves

### Troubleshooting

#### Common Issues

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
