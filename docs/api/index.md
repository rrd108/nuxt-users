# API Reference

The Nuxt Users module provides several API endpoints for authentication, user management, and password reset functionality.

## Authentication Endpoints

### Login

**Endpoint:** `POST /api/nuxt-users/session`

Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials

### Logout

**Endpoint:** `DELETE /api/nuxt-users/session`

Logout the current user by removing their authentication token.

**Request:** No request body required

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Notes:**
- Removes the authentication token from the database
- Clears the `auth_token` cookie
- No authentication required (works with any valid token)

## User Management Endpoints

Authentication and authorization are handled by middleware.

### Create User

**Endpoint:** `POST /api/nuxt-users`

Create a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "name": "New User",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields (email, name, password)
- `401 Unauthorized`: No authentication token or invalid token
- `403 Forbidden`: User doesn't have permission to create users

### Get User

**Endpoint:** `GET /api/nuxt-users/:id`

Get a user by ID. Users can only access their own profile unless they have admin permissions.

**Request:** No request body required (uses authentication token from cookie)

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid user ID
- `401 Unauthorized`: No authentication token or invalid token
- `403 Forbidden`: User doesn't have permission to access this profile
- `404 Not Found`: User not found

### Update User

**Endpoint:** `PATCH /api/nuxt-users/:id`

Update a user's information.

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "admin"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "updated@example.com",
    "name": "Updated Name",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid user ID
- `401 Unauthorized`: No authentication token or invalid token
- `403 Forbidden`: User doesn't have permission to update users
- `404 Not Found`: User not found

### Delete User

**Endpoint:** `DELETE /api/nuxt-users/:id`

Delete a user.

**Request:** No request body required

**Response:**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request`: Invalid user ID
- `401 Unauthorized`: No authentication token or invalid token
- `403 Forbidden`: User doesn't have permission to delete users
- `404 Not Found`: User not found

### Get Profile

**Endpoint:** `GET /api/nuxt-users/me`

Get the current user's profile information.

**Request:** No request body required (uses authentication token from cookie)

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: No authentication token or invalid token

### Update Profile

**Endpoint:** `PATCH /api/nuxt-users/me`

Update the current user's profile information (e.g., name, email).

**Request Body:**
```json
{
  "name": "Johnathan Doe",
  "email": "john.doe@new-email.com"
}
```

**Notes:**
- Users cannot change their own `role` using this endpoint.

**Response:**
Returns the updated user object.

**Error Responses:**
- `400 Bad Request`: Invalid data, such as an email that is already taken.
- `401 Unauthorized`: No authentication token or invalid token

### Update Password

**Endpoint:** `PATCH /api/nuxt-users/password`

Update the current user's password.

**Request Body:**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password",
  "newPasswordConfirmation": "new-password"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing fields, password mismatch, or weak password
- `401 Unauthorized`: No authentication token or invalid token
- `400 Bad Request`: Current password is incorrect

**Notes:**
- Requires current password verification
- New password must be at least 8 characters
- Password confirmation must match new password

## Password Reset Endpoints

### Forgot Password

**Endpoint:** `POST /api/nuxt-users/password/forgot`

Send a password reset link to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If a user with that email exists, a password reset link has been sent."
}
```

**Notes:**
- Always returns success message (prevents email enumeration)
- Sends email only if user exists
- Token expires after 1 hour

### Reset Password

**Endpoint:** `POST /api/nuxt-users/password/reset`

Reset user password using a valid token.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "email": "user@example.com",
  "password": "new-password",
  "password_confirmation": "new-password"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or password validation failed
- `400 Bad Request`: Invalid or expired token, or email mismatch

## Error Handling

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "statusMessage": "Error description"
}
```

## Authentication Headers

For protected endpoints, include the authentication cookie:

```
Cookie: auth_token=your-auth-token
```

The module automatically handles cookie management for login/logout.

## Permission System

The user management endpoints use a role-based permission system. Permissions can be configured to be method-specific (e.g., allowing GET but denying DELETE on the same path). See the [Authorization Guide](/guide/authorization) for more details.

- **Admin users** (`role: "admin"`) can access all user management endpoints
- **Regular users** can only access their own profile via `GET /api/nuxt-users/:id`
- **All users** must be authenticated to access any protected endpoint

## Rate Limiting

Consider implementing rate limiting for these endpoints:

- `/api/nuxt-users/session`: Prevent brute force attacks
- `/api/nuxt-users/password/forgot`: Prevent email spam
- `/api/nuxt-users/password/reset`: Prevent token brute force
- `/api/nuxt-users/*`: Prevent abuse of user management endpoints

## Next Steps

- [Authentication Guide](/guide/authentication) - Learn about the authentication flow
- [Authorization Guide](/guide/authorization) - Understand role-based access control
- [Password Reset Guide](/guide/password-reset) - Understand password reset functionality
- [Components](/components/) - Use the provided Vue components 