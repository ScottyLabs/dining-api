import { createUserSession, fetchUserSession } from "db/auth";
import { db } from "db/db";
import Elysia, { status, t } from "elysia";
import { env } from "env";
import { jwtDecode } from "jwt-decode";
import * as client from "openid-client";
import { notifySlack } from "utils/slack";
import cookieSigner from "cookie-signature";

const OIDCConfig = await client.discovery(
  env.OIDC_SERVER,
  env.OIDC_CLIENT_ID,
  env.OIDC_CLIENT_SECRET
);
export const authPlugin = new Elysia();
authPlugin.get(
  "/login",
  ({ request, cookie, query }) => {
    const originalOrigin = query.redirectURL;
    const curOrigin = new URL(request.url);
    if (originalOrigin === null) return new Response(null, { status: 403 });
    cookie["original_origin"]!.value = originalOrigin;
    const redirectURL = client.buildAuthorizationUrl(OIDCConfig, {
      redirect_uri: `${curOrigin.origin}/code-exchange`,
      scope: "openid email profile",
      prompt: "select_account", // force account picker
    });
    return new Response(null, {
      status: 303,
      headers: {
        Location: redirectURL.href,
      },
    });
  },
  { query: t.Object({ redirectURL: t.Nullable(t.String()) }) }
);
authPlugin.get(
  "/logout",
  ({ cookie, request, query }) => {
    const originalOrigin = query.redirectURL;
    if (originalOrigin === null) return new Response(null, { status: 403 });

    cookie["session_id"]!.remove();
    return new Response(null, {
      status: 303,
      headers: {
        Location: originalOrigin,
      },
    });
  },
  { query: t.Object({ redirectURL: t.Nullable(t.String()) }) }
);
authPlugin.get(
  "/code-exchange",
  async ({ request, cookie }) => {
    const originalOrigin = cookie["original_origin"]!.value as string;
    cookie["original_origin"]!.remove();

    const tokens = await client
      .authorizationCodeGrant(OIDCConfig, new URL(request.url))
      .catch((e) => {
        console.error(e);
        notifySlack(
          `<!channel> OIDC code exchange failed with error ${e} ${JSON.stringify(
            e.cause
          )} CODE: ${e.code}`
        );
        return undefined;
      });
    if (tokens?.id_token !== undefined) {
      const jwt = jwtDecode(tokens.id_token) as Record<string, string>;

      const sessionId = await createUserSession(db, {
        email: jwt.email,
        firstName: jwt.given_name ?? jwt.name,
        lastName: jwt.family_name,
        googleId: jwt.sub,
        pfpURL: jwt.picture,
      });
      if (sessionId !== undefined) {
        cookie["session_id"]!.value = cookieSigner.sign(
          sessionId,
          env.SESSION_COOKIE_SIGNING_SECRET
        );
        cookie["session_id"]!.httpOnly = true;
        cookie["session_id"]!.secure = true;
        cookie["session_id"]!.maxAge = 30 * 24 * 60 * 60; // 30 days
        cookie["session_id"]!.sameSite = env.ENV === "prod" ? "strict" : "none";
        console.log("created session", sessionId);
        return new Response(null, {
          status: 303,
          headers: {
            Location: originalOrigin,
          },
        });
      }
    }
    return new Response(null, {
      status: 303,
      headers: {
        Location: originalOrigin + "?AUTH_FAILED",
      },
    });
  },
  { query: t.Object({ code: t.String() }) }
);
export async function fetchUserDetails(sessionId?: string) {
  if (sessionId === undefined) return null;
  const unsignedSessionId = cookieSigner.unsign(
    sessionId,
    env.SESSION_COOKIE_SIGNING_SECRET
  );
  if (!unsignedSessionId) return null;

  return await fetchUserSession(db, unsignedSessionId);
}
/**
 * Use as follows: app.use(protectedRoute().get("", ({ user }) => user.id));
 */
export const protectedRoute = () => {
  return new Elysia().resolve(async ({ cookie }) => {
    const session = cookie["session_id"]!.value as string | undefined;
    const userDetails = await fetchUserDetails(session);
    if (userDetails === null) return status(401);

    return {
      user: userDetails,
    };
  });
};
