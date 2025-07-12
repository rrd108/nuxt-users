import { googleAuth } from '../../utils/lucia';

export default defineEventHandler(async (event) => {
  const [url, state] = await googleAuth.getAuthorizationUrl();

  setCookie(event, 'google_oauth_state', state, {
    httpOnly: true,
    secure: !process.dev,
    path: '/',
    maxAge: 60 * 60,
  });

  return sendRedirect(event, url.toString());
});
