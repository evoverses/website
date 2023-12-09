export const BASE_URL = new URL(`https://${process.env.PLAYFAB_TITLE_ID}.playfabapi.com/`);
export const CLIENT_URL = new URL("/Client/", BASE_URL);

export const headers = { "Accept-Encoding": "identity", "Content-Type": "application/json" };
