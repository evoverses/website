import { headers } from "next/headers";

export const getServerSideUrlFromHeaders = async () => {
  const headersList = await headers();
  const url = headersList.get("x-referer");

  if (!url) {
    const headersArray = [ ...headersList.entries() ].map(([ k, v ]) => `${k}: ${v}`);
    console.warn(`No referer header found. Available headers:\n${headersArray.join("\n")}`);
    return undefined;
  }
  return url;
};
