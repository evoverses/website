import cors from "cors";

export const corsMiddleware = (allowedOrigins: string[]) => cors({
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
