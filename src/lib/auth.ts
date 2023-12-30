
export const getCsrfToken = async () => {
  const url = new URL("/api/auth/csrf", process.env.AUTH_URL);
  const resp = await fetch(url);
  const data = await resp.json() as { csrfToken: string };
  return data.csrfToken;
};
