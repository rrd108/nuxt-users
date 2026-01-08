# HTTP API Endpoints

The Nuxt Users module provides REST API endpoints for authentication, user management, and password reset functionality. These endpoints can be used by external applications or frontend clients to interact with the authentication system.

## Authentication Endpoints

### Registration

**Endpoint:** `POST /api/nuxt-users/register`

Register a new user account with email confirmation.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123!"
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
  },
  "message": "Registration successful! Please check your email to confirm your account."
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields (email, name, password)
- `400 Bad Request`: Invalid email format
- `400 Bad Request`: Password validation failed
- `400 Bad Request`: User with this email already exists

**Notes:**
- User account is created in inactive state
- Confirmation email is sent automatically
- Password must meet strength requirements
- Requires `/register` to be in the auth whitelist
- Automatically whitelists `/confirm-email` route

### Email Confirmation

**Endpoint:** `GET /api/nuxt-users/confirm-email`

Confirm user's email address and activate their account.

**Query Parameters:**
- `token` (required): Email confirmation token from the registration email
- `email` (required): User's email address

**Example URL:**
```
GET /api/nuxt-users/confirm-email?token=abc123def456&email=user@example.com
```

**Response:**
```json
{
  "success": true,
  "message": "Email confirmed successfully! Your account is now active. You can now log in."
}
```

**Error Responses:**
- `400 Bad Request`: Missing token or email parameter
- `400 Bad Request`: Invalid or expired confirmation token

**Notes:**
- Token expires after 24 hours
- User account becomes active after confirmation
- Token is automatically deleted after successful confirmation
- No authentication required for this endpoint

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
    "active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials

**Notes:**
- No authentication required - this is a public endpoint
- Sets an HTTP-only authentication cookie upon successful login

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
- No authentication required - accessible to everyone
- If a valid token exists, it will be invalidated
- Always clears the authentication cookie
- Returns success even if no token was present

## Public Endpoints Summary

The following endpoints are **public** and do **not require authentication**:

- `POST /api/nuxt-users/session` - Login
- `DELETE /api/nuxt-users/session` - Logout
- `POST /api/nuxt-users/password/forgot` - Request password reset
- `POST /api/nuxt-users/password/reset` - Reset password
- `POST /api/nuxt-users/register` - Register (if `/register` is whitelisted)
- `GET /api/nuxt-users/confirm-email` - Email confirmation (if `/register` is whitelisted)

All other endpoints require authentication and proper authorization based on user roles.

## User Management Endpoints

These endpoints require authentication. Include your authentication token in requests.

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

**Request:** No request body required

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
  "role": "admin",
  "active": false
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
    "active": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid user ID
- `401 Unauthorized`: No authentication token or invalid token
- `403 Forbidden`: User doesn't have permission to update users, or is trying to update their own active status.
- `404 Not Found`: User not found

### Get Inactive Users

**Endpoint:** `GET /api/nuxt-users/inactive`

Get a list of all inactive users.

**Request:** No request body required

**Response:**
Returns a paginated list of user objects.

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

**Request:** No request body required

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
- Always returns success message for security reasons
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

## Authentication

For protected endpoints, authentication is handled automatically through cookies when using the module's built-in authentication flow. External API consumers should ensure they include the authentication cookie in their requests.

## Authorization

The API uses role-based access control:

- **Admin users** (`role: "admin"`) can access all user management endpoints
- **Regular users** can only access their own profile via `GET /api/nuxt-users/:id`
- **All users** must be authenticated to access any protected endpoint

For more details on configuring authorization, see the [Authorization Guide](/user-guide/authorization).

## Security Considerations

When using these API endpoints in production:

- Implement rate limiting to prevent abuse
- Use HTTPS for all authentication-related requests
- Ensure proper CORS configuration for cross-origin requests
- Monitor for suspicious authentication patterns

## Related Documentation

- [Authentication Guide](/user-guide/authentication) - Learn about the authentication flow
- [Authorization Guide](/user-guide/authorization) - Understand role-based access control
- [Password Reset Guide](/user-guide/password-reset) - Understand password reset functionality
- [Components](/user-guide/components) - Use the provided Vue components
- [Public Types](/api/types) - TypeScript types for API responses 