# API Reference

The Nuxt Users module provides several API endpoints for authentication and password reset functionality.

## Authentication Endpoints

### Login

**Endpoint:** `POST /api/login`

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
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials

## Password Reset Endpoints

### Forgot Password

**Endpoint:** `POST /api/forgot-password`

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

**Endpoint:** `POST /api/reset-password`

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

- `/api/login`: Prevent brute force attacks
- `/api/forgot-password`: Prevent email spam
- `/api/reset-password`: Prevent token brute force

## Next Steps

- [Authentication Guide](/guide/authentication) - Learn about the authentication flow
- [Password Reset Guide](/guide/password-reset) - Understand password reset functionality
- [Components](/components/) - Use the provided Vue components 