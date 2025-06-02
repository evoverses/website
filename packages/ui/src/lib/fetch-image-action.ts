"use server";

export const fetchImageAction = async (url: string): Promise<string> => {

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "image/png";
  const base64 = buffer.toString("base64");
  return `data:${contentType};base64,${base64}`;
};
