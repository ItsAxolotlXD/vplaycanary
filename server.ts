import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";
import admin from 'firebase-admin';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API Client initialized successfully.");
} else {
  console.warn("GEMINI_API_KEY is not set in environment variables! Using mock answers fallback.");
}

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

  // GEMINI SOCIAL & CHAT ASSISTANT
  app.post("/api/gemini/reply", async (req, res) => {
    const { message, contextType, chatHistory } = req.body;

    if (!ai) {
      // Elegant fallback response
      const fallbacks = [
        "Chào bạn! Cảm ơn bạn đã trò chuyện cùng mình trên Vconnect nhé. Chúc bạn một ngày ngập tràn niềm vui! 🌸",
        "Tuyệt vời quá nha! Mình rất đồng tình luôn nè. Hãy khám phá thêm nhiều kênh TV và trò chơi xịn sò khác nhé! 🎙️",
        "Hi hi, nghe hay đó! Hôm nào lập party kéo rank Liên Minh hay chơi FIFA chung nhé bạn ơi! 🎮🔥",
        "vPlay OS đúng là mượt mà và tiện ghê á. Có gì thắc mắc cứ hỏi mình mảng này nhé!",
        "Lời khuyên/Bình luận hay quá bạn ơi! Thả tim 1000 lần luôn nà! ❤️✨"
      ];
      const randomMsg = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return res.json({ reply: `[vPlay Bot 🤖]: ${randomMsg}` });
    }

    try {
      let systemInstruction = "Bạn là một thành viên năng động, cực kỳ thân thiện và dí hỏm trên mạng xã hội Vconnect thuộc hệ sinh thái giải trí vPlay Việt Nam. Hãy phản hồi ngắn gọn (dưới 3 câu), tự nhiên như người thật trò chuyện, xưng hô 'mình' - 'bạn/cậu/mọi người' hoặc tự xưng là 'ad' nếu thấy phù hợp. Sử dụng các icon sinh động (như 🎮✨📺🔥💬). Đừng bao giờ trả lời trịnh trọng như một AI khô khan.";
      
      if (contextType === "chat") {
        systemInstruction += " Đây là tin nhắn trực tiếp chat 1-1 (vChat direct message). Hãy đối đáp thật cởi mở, tự nhiên, trả lời trực diện vấn đề và có thể hỏi ngược lại một câu ngắn thú vị.";
      } else {
        systemInstruction += " Đây là phần bình luận dưới bài đăng cộng đồng (Vconnect Feed comments). Hãy viết bình luận hài hước hoặc góp ý tích cực, hào hứng phù hợp chủ đề.";
      }

      // Format conversation history for Gemini if present
      const formattedHistory = (chatHistory || []).slice(-6).map((h: any) => ({
        role: h.role === "model" || h.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: h.text }]
      }));

      const contents = [
        ...formattedHistory,
        { role: "user", parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.8
        }
      });

      res.json({ reply: response.text || "Nghe thú vị thật á! Mình sẽ tìm hiểu thêm nha." });
    } catch (err: any) {
      console.error("Gemini Response Error:", err);
      res.json({ reply: "Có lỗi khi kết nối với tinh vân AI, nhưng mình luôn ở đây đồng hành cùng bạn nha! 📺✨" });
    }
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
