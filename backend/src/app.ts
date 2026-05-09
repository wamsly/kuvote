import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import { pinoHttp } from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res: any) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Serve uploaded candidate documents/photos
app.use("/api/uploads", express.static(UPLOADS_DIR));

app.use("/api", router);

if (process.env.NODE_ENV !== "production") {
  const { createProxyMiddleware } = await import("http-proxy-middleware");
  const vitePort = process.env.VITE_PORT ?? "3000";
  app.use(
    "/",
    createProxyMiddleware({
      target: `http://localhost:${vitePort}`,
      changeOrigin: true,
      ws: true,
    }),
  );
}

export default app;
