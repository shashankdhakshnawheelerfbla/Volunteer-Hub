
function redirectToLogin(message) {
  const url = new URL("/index.html", "https://volunteer-hub-8iz.pages.dev");
  url.searchParams.set("error", message);

  return Response.redirect(url.toString(), 302);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.headers.get("Cookie")
    ?.split("; ")
    .find((cookie) => cookie.startsWith("google_oauth_state="))
    ?.split("=")[1];

  if (!code || !state || !savedState || state !== savedState) {
    return redirectToLogin("google_signin_failed");
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return new Response("Google sign-in is not configured.", {
      status: 500
    });
  }

  const redirectUri =
    "https://volunteer-hub-8iz.pages.dev/auth/google/callback";

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) {
    return redirectToLogin("google_token_exchange_failed");
  }

  const tokens = await tokenResponse.json();

  if (!tokens.id_token) {
    return redirectToLogin("google_identity_missing");
  }

  const verifyResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`
  );

  if (!verifyResponse.ok) {
    return redirectToLogin("google_identity_invalid");
  }

  const identity = await verifyResponse.json();

  if (
    identity.aud !== env.GOOGLE_CLIENT_ID ||
    identity.email_verified !== "true" ||
    !identity.sub ||
    !identity.email
  ) {
    return redirectToLogin("google_identity_invalid");
  }

  // Identity verified. Session creation and database account linking
  // must be implemented before this callback can log users in.
  return new Response(
    "Google identity verified. Session creation is not implemented yet.",
    {
      status: 501,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}
