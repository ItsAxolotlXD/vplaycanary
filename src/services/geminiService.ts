import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const chatWithGemini = async (message: string, history: { role: "user" | "model", parts: string[] }[] = []) => {
  if (!apiKey) {
    console.error("Gemini API Key is missing!");
    return "Lỗi: API Key chưa được thiết lập. Vui lòng kiểm tra cấu hình.";
  }

  try {
    // Filter history to ensure it's in the correct format for Gemini
    // Gemini requires history to start with a content from the "user" role.
    let formattedHistory = history
      .filter(h => h.parts && h.parts.length > 0 && h.parts[0])
      .map(h => ({
        role: h.role === "model" ? "model" as const : "user" as const,
        parts: [{ text: h.parts[0] }]
      }));

    // Find the first 'user' message and slice from there
    const firstUserIndex = formattedHistory.findIndex(h => h.role === "user");
    if (firstUserIndex !== -1) {
      formattedHistory = formattedHistory.slice(firstUserIndex);
    } else {
      formattedHistory = [];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: "Bạn là Vplay AI, một trợ lý thông minh cho ứng dụng Vplay. Hãy trả lời thân thiện, hữu ích và tập trung vào việc hỗ trợ người dùng trải nghiệm ứng dụng Vplay (một ứng dụng xem tivi và giải trí). Trả lời bằng tiếng Việt. Nếu người dùng hỏi về các kênh tivi, hãy nói rằng Vplay có rất nhiều kênh tivi phổ biến như VTV, HTV, và các kênh địa phương."
      }
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    return responseText;
  } catch (error) {
    console.error("Gemini API Error Detail:", error);
    return "Xin lỗi, tôi đang gặp trục trặc kỹ thuật khi kết nối với AI. Vui lòng thử lại sau!";
  }
};
