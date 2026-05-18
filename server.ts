import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin lazily in routes if needed, but for now we define it here
// assuming FIREBASE_CONFIG or credentials are provided via env if not using default.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.warn("Firebase Admin failed to initialize. Ensure GOOGLE_APPLICATION_CREDENTIALS is set.");
  }
}

const db = admin.apps.length ? admin.firestore() : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // HEALTH CHECK
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy support for HLS
  app.use("/proxy", (req, res, next) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).send("No URL provided");

    try {
      const urlObj = new URL(targetUrl);
      const proxy = createProxyMiddleware({
        target: urlObj.origin,
        changeOrigin: true,
        pathRewrite: (p, r) => {
          const url = new URL(r.url!, `http://${r.headers.host}`);
          const actualTarget = url.searchParams.get('url');
          if (actualTarget) {
            const target = new URL(actualTarget);
            return target.pathname + target.search;
          }
          return p;
        },
        on: {
          proxyRes: (proxyRes) => {
            proxyRes.headers["access-control-allow-origin"] = "*";
          },
        },
      });
      return proxy(req, res, next);
    } catch (e) {
      return res.status(400).send("Invalid URL");
    }
  });

  // VDS COMMUNITY - API Endpoint for adding posts
  app.post("/api/vds/posts", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase Admin not initialized" });
    try {
      const { content, authorId, username, photoURL, image } = req.body;
      const post = {
        content,
        authorId,
        username,
        photoURL,
        image: image || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        likes: [],
        commentCount: 0
      };
      const docRef = await db.collection('posts').add(post);
      res.status(200).json({ id: docRef.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // VDS COMMUNITY - API Endpoint for comments
  app.post("/api/vds/comments", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase Admin not initialized" });
    try {
      const { postId, content, authorId, username, photoURL } = req.body;
      const comment = {
        postId,
        content,
        authorId,
        username,
        photoURL,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('comments').add(comment);
      
      const postRef = db.collection('posts').doc(postId);
      const commentsSnap = await db.collection('comments').where('postId', '==', postId).get();
      await postRef.update({ commentCount: commentsSnap.size });
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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
