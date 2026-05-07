import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // HEALTH CHECK
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // CORS PROXY FOR HLS
  app.use("/proxy", (req, res, next) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).send("No URL provided");

    const urlObj = new URL(targetUrl);
    const proxy = createProxyMiddleware({
      target: urlObj.origin,
      changeOrigin: true,
      pathRewrite: (path, req) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const actualTarget = url.searchParams.get('url');
        if (actualTarget) {
          const targetPath = new URL(actualTarget).pathname + new URL(actualTarget).search;
          return targetPath;
        }
        return path;
      },
      on: {
        proxyRes: (proxyRes) => {
          proxyRes.headers["access-control-allow-origin"] = "*";
          proxyRes.headers["access-control-allow-methods"] = "GET, POST, OPTIONS";
          proxyRes.headers["access-control-allow-headers"] = "Content-Type, Authorization";
        },
      },
    });

    return proxy(req, res, next);
  });

  // Proxy removed - not needed since we moved to imported static assets.

  // VITE MIDDLEWARE
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
