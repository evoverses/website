import type { Request, Response } from "express";

export const graphqlRoutes = {
  get: (_req: Request, res: Response) => {
    return res.redirect("/graphiql");
  },
};

export const appRoutes = {
  health: (_req: Request, res: Response) => {
    res.status(200).json("ok");
  },
};
