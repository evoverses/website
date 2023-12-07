import prisma from "@/lib/prisma/client";
import { cache } from "react";

export const getEvos = cache(async () => {
  const evos = await prisma.evo.findMany({
    take: 50,
  });
  return evos;
});
