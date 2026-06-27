import { createCookieSessionStorage, redirect } from "react-router";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export { getSession, commitSession, destroySession };

export async function requireAuth(request: Request): Promise<void> {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.get("userId")) {
    throw redirect("/login");
  }
}
