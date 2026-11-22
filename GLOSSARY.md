# Nuxt Users

A Nuxt module that gives an application its users: who they are, how they prove it, and what they may reach.

## Language

### People and access

**User**:
A person with an account in the consuming application, identified by email.
_Avoid_: account, member

**Unconfirmed user**:
A user who registered but has not yet completed email confirmation, so cannot log in yet.
_Avoid_: inactive user, pending user

**Deactivated user**:
A user an admin has removed while keeping their record, so they can no longer log in. Only an admin can reverse it.
_Avoid_: soft-deleted user, inactive user, disabled user

**Delete**:
Permanently removing a user's record, as opposed to deactivating them.
_Avoid_: hard delete

**Role**:
A named label on a user that decides which permissions apply to them.
_Avoid_: group, user type

**Permission**:
A route pattern, optionally restricted to HTTP methods, that a role is allowed to reach.
_Avoid_: rule, grant, ACL

**Public route**:
A page or API route that anyone may reach without a session.
_Avoid_: open route, unprotected route

**Whitelist**:
The consumer-configured list of public routes, on top of the ones the module always makes public.
_Avoid_: allowlist, public paths

**Self-service route**:
A route where a user acts on their own user (profile, password, passkeys), reachable with any session whatever the role.
_Avoid_: auto-access endpoint

**Protected route**:
Any route that is neither a public route nor a self-service route, so it needs a session and a matching permission.

### Proving identity

**Login method**:
One way a user proves their identity: password, Google, or passkey. Every login method ends in the same kind of session.
_Avoid_: auth provider, strategy

**Session**:
A user's logged-in state, created by a login and ended by logout or expiry, carried by a session token.
_Avoid_: login (as a noun), auth

**Session token**:
The secret that the browser presents to prove it holds a session.
_Avoid_: auth token, access token, personal access token

**Remember me**:
A login choice that gives the session a long lifetime instead of the short default.

**Passkey**:
A WebAuthn credential that a user registers on a device and can then log in with instead of a password.
_Avoid_: WebAuthn key, security key

**Relying party**:
The application as passkeys see it, identified by its domain, to which every passkey is bound.
_Avoid_: rpId (in prose)

**Site URL**:
The application's public address, used for links in emails and as the origin for passkeys.
_Avoid_: base URL, host

### Email flows

**Password reset**:
The flow in which a user who forgot their password receives an emailed link and chooses a new one.

**Password reset token**:
The single-use secret in a password reset link.
_Avoid_: reset link (for the secret itself)

**Email confirmation**:
The flow in which a newly registered user proves they own their email address before they can log in.
_Avoid_: email verification, activation

**Confirmation token**:
The single-use secret in an email confirmation link.
_Avoid_: activation token

**Registration**:
A visitor creating their own user, as opposed to an admin creating one.
_Avoid_: sign-up
