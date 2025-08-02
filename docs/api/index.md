# API Reference

The Nuxt Users module provides several API endpoints for authentication and password reset functionality.

## Authentication Endpoints

### Login

**Endpoint:** `POST /api/auth/login`

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

**Endpoint:** `GET /api/auth/logout`

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

## Profile Endpoints

### Get Profile

**Endpoint:** `GET /api/user/profile`

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

### Update Password

**Endpoint:** `POST /api/auth/update-password`

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

**Endpoint:** `POST /api/auth/forgot-password`

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
  "message": "Password reset link sent to your email"
}
```

**Notes:**
- Always returns success message (prevents email enumeration)
- Sends email only if user exists
- Token expires after 1 hour

### Reset Password

**Endpoint:** `POST /api/auth/reset-password`

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
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid or expired token
- `422 Unprocessable Entity`: Password confirmation mismatch

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

## Rate Limiting

Consider implementing rate limiting for these endpoints:

- `/api/auth/login`: Prevent brute force attacks
- `/api/auth/forgot-password`: Prevent email spam
- `/api/auth/reset-password`: Prevent token brute force

## Next Steps

- [Authentication Guide](/guide/authentication) - Learn about the authentication flow
- [Password Reset Guide](/guide/password-reset) - Understand password reset functionality
- [Components](/components/) - Use the provided Vue components 