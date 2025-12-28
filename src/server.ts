import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { env } from "env";
import { notifySlack } from "utils/slack";
import { node } from "@elysiajs/node";
import { deprecatedNotice } from "deprecationNotice";
import { getAllLocationsFromDB } from "db/getLocations";
import { openapi } from "@elysiajs/openapi";
import { initDBConnection } from "db/db";
import { DateTime } from "luxon";
import { QueryUtils } from "db/dbQueryUtils";
import { refreshDB } from "reload";
import { LocationsSchema } from "schemas";
import * as client from "openid-client";
import { jwtDecode } from "jwt-decode";

const OIDCConfig = await client.discovery(
  env.OIDC_SERVER,
  env.OIDC_CLIENT_ID,
  env.OIDC_CLIENT_SECRET
);
const activeSessions: Record<string, string> = {};
const [pool, db] = initDBConnection(env.DATABASE_URL);
export const app = new Elysia({ adapter: node() }).use(
  openapi({
    // references: fromTypes("src/server.ts"), // welp I can't get this to work
    documentation: {
      tags: [],
      info: {
        title: "CMU Dining API",
        version: "2.0.0",
      },
    },
  })
); // I don't trust bun (as a runtime) enough (Eric Xu - 7/18/2025). This may change in the future, but bun is currently NOT a full drop-in replacement for node and is still rather unstable from personal experience

app.onError(({ error, path, code }) => {
  if (code === "NOT_FOUND") {
    console.log(`Someone tried visiting ${path}, which does not exist :P`);
  } else {
    notifySlack(
      `<!channel> handling request on ${path} failed with error ${error}\n${
        error instanceof Error ? error.stack : "No stack trace"
      }`
    );
  }
});
app.use(cors());
// app.onAfterHandle(({ responseValue }) => {
//   if (typeof responseValue === "object") {
//     // pretty print this
//     return new Response(JSON.stringify(responseValue, null, 4), {
//       headers: { "Content-Type": "application/json; charset=utf-8" },
//     }); // we can actually set proper content-type headers this way
//   }
// });

app.get(
  "/",
  ({ cookie }) => {
    cookie["X_HI"]!.value = Math.random();
    cookie["X_HI"]!.httpOnly = true;
    return "ScottyLabs Dining API";
  },
  { response: t.String({ examples: ["ScottyLabs Dining API"] }) }
);
app.get(
  "/v2/locations",
  async () => await getAllLocationsFromDB(db, DateTime.now()),
  { response: LocationsSchema }
);
app.get("/emails", async () => await new QueryUtils(db).getEmails(), {
  response: t.Array(
    t.Object({
      name: t.String({
        example: ["Alice"],
      }),
      email: t.String({
        example: "alice72@andrew.cmu.edu",
      }),
    })
  ),
});

app.post(
  "/sendSlackMessage",
  async ({ body: { message } }) => {
    await notifySlack(message, env.SLACK_FRONTEND_WEBHOOK_URL);
  },
  {
    body: t.Object({
      message: t.String(),
    }),
  }
);
if (!env.DEV_DONT_FETCH) {
  setInterval(() => {
    refreshDB(db).catch(
      (er) => `Error in reload process: ${notifySlack(String(er))}\n${er.stack}`
    );
  }, env.RELOAD_WAIT_INTERVAL);
  refreshDB(db).catch(
    (er) => `Error in reload process: ${notifySlack(String(er))}\n${er.stack}`
  );
}
app.get("/login", ({ set, request }) => {
  const originalOrigin = `${request.headers.get(
    "x-forwarded-proto"
  )}://${request.headers.get("x-forwarded-host")}/api/code-exchange`;
  const redirectURL = client.buildAuthorizationUrl(OIDCConfig, {
    redirect_uri: originalOrigin,
    scope: "openid email",
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectURL.href,
    },
  });
});
app.get("/logout", ({ cookie, request }) => {
  const originalOrigin = `${request.headers.get(
    "x-forwarded-proto"
  )}://${request.headers.get("x-forwarded-host")}`;
  cookie["session_id"]!.value = "";
  return new Response(null, {
    status: 302,
    headers: {
      Location: originalOrigin,
    },
  });
});
app.get(
  "/whoami",
  ({ cookie }) => {
    const session = cookie["session_id"]!.value as string | undefined;
    const jwt = activeSessions[session ?? ""];
    if (jwt) {
      return { sub: jwtDecode(jwt).sub ?? null };
    } else {
      return { sub: null };
    }
  },
  { response: t.Object({ sub: t.Nullable(t.String()) }) }
);
app.get(
  "/code-exchange",
  async ({ query, request, cookie }) => {
    const reqURL = new URL(request.url);
    const originalOrigin = `${request.headers.get(
      "x-forwarded-proto"
    )}://${request.headers.get("x-forwarded-host")}`;
    const fullPath = `${originalOrigin}/api${reqURL.pathname}${reqURL.search}`;
    const tokens = await client
      .authorizationCodeGrant(OIDCConfig, new URL(fullPath))
      .catch((e) => {
        console.error(e);
        return undefined;
      });

    if (tokens?.id_token !== undefined) {
      const randSessId = crypto.randomUUID();
      activeSessions[randSessId] = tokens.id_token;
      cookie["session_id"]!.value = randSessId;
      cookie["session_id"]!.httpOnly = true;
      cookie["session_id"]!.sameSite = "strict";
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: originalOrigin,
      },
    });
  },
  { query: t.Object({ code: t.String() }) }
);

// DEPRECATED

app.get("/locations", async () => ({ locations: deprecatedNotice }), {
  detail: {
    tags: ["Deprecated"],
    hide: true,
  },
});

app.get(
  "/location/:name",
  async ({ params: { name } }) => {
    const filteredLocation = deprecatedNotice.filter((location) => {
      return location.name?.toLowerCase().includes(name.toLowerCase());
    });
    return {
      locations: filteredLocation,
    };
  },
  {
    detail: {
      tags: ["Deprecated"],
      hide: true,
    },
  }
);

app.get(
  "/locations/time/:day/:hour/:min",
  async ({ params: { day, hour, min } }) => {
    const result = deprecatedNotice.filter((el) => {
      let returning = false;
      el.times.forEach((element) => {
        const startMins =
          element.start.day * 1440 +
          element.start.hour * 60 +
          element.start.minute;
        const endMins =
          element.end.day * 1440 + element.end.hour * 60 + element.end.minute;
        const currentMins =
          parseInt(day) * 1440 + parseInt(hour) * 60 + parseInt(min);
        if (currentMins >= startMins && currentMins < endMins) {
          returning = true;
        }
      });
      return returning;
    });
    return { locations: result };
  },
  {
    detail: {
      tags: ["Deprecated"],
      hide: true,
    },
  }
);
app.listen(env.PORT, ({ hostname, port }) => {
  notifySlack(`Dining API is running at ${hostname}:${port}`);
});
