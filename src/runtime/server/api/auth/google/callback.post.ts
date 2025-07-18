import { google } from '@lucia-auth/oauth/providers';
import { auth, googleAuth } from '../../utils/lucia';

export default defineEventHandler(async (event) => {
  const { code, state } = getQuery(event);
  const storedState = getCookie(event, 'google_oauth_state');

  if (!code || !state || !storedState || state !== storedState) {
    throw new Error('Invalid state');
  }

  try {
    const { getExistingUser, googleUser, createUser } = await googleAuth.validateCallback(code);

    const getUser = async () => {
      const existingUser = await getExistingUser();
      if (existingUser) return existingUser;
      const user = await createUser({
        attributes: {
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
        },
      });
      return user;
    };

    const user = await getUser();
    const session = await auth.createSession({
      userId: user.userId,
      attributes: {},
    });
    const sessionCookie = auth.createSessionCookie(session);

    setCookie(event, sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return sendRedirect(event, '/');
  } catch (e) {
    console.error(e);
    return sendRedirect(event, '/login');
  }
});
