import { clerkMiddleware, requireAuth as clerkRequireAuth } from "@clerk/express";
import cors from "cors";
import { DEVELOPMENT } from "./constants";

const devOrigins = [ 3000, 4350 ].map(port => `http://localhost:${port}`).concat("https://ngrok.cajun.tools");
const prodOrigins = [ "", "api", "preview" ].map(sd => `https://${sd}${sd ? "." : ""}evoverses.com`);
const allowedOrigins = prodOrigins.concat(DEVELOPMENT ? devOrigins : []);

const corsMiddleware = (allowedOrigins: string[]) => cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked CORS request from ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});

const url = DEVELOPMENT ? "https://localhost:4350/graphiql" : "https://api.evoverses.com/graphiql";

export const requireAuth = clerkRequireAuth({
  debug: DEVELOPMENT,
});

export const middlewares = [
  corsMiddleware(allowedOrigins),
  clerkMiddleware({
    debug: DEVELOPMENT,
  }),
];
