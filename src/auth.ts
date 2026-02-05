import type { AccessIdentity, Env } from "./types";

const ACCESS_EMAIL_HEADER = "cf-access-authenticated-user-email";
const ACCESS_NAME_HEADER = "cf-access-authenticated-user-name";
const ACCESS_ID_HEADER = "cf-access-authenticated-user-id";
const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

export function getAccessIdentity(request: Request, env: Env): AccessIdentity | null {
  const headers = request.headers;
  const email = headers.get(ACCESS_EMAIL_HEADER);
  if (email) {
    return {
      email,
      name: headers.get(ACCESS_NAME_HEADER),
      id: headers.get(ACCESS_ID_HEADER),
      jwt: headers.get(ACCESS_JWT_HEADER),
    };
  }

  if (env.DEV_BYPASS_AUTH === "true") {
    const devEmail = env.DEV_USER_EMAIL || "dev@example.com";
    return { email: devEmail, name: "Dev User", id: "dev", jwt: null };
  }

  return null;
}
