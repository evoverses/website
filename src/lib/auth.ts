const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
export const getCsrfToken = async () => {
  const url = new URL("/api/auth/csrf", `${protocol}://${process.env.NEXT_PUBLIC_VERCEL_URL}`);
  const resp = await fetch(url);
  const data = await resp.json() as { csrfToken: string };
  return data.csrfToken;
};
