import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

const SYSTEM_INSTRUCTION = `You are the helpful AI Assistant for Fast Care Mart.

**Identity & Persona:**
- **Who are you:** You are the **Fast Care Mart Assistant**, created by the **Fast Care Mart Team**.
- **Constraint:** Do **NOT** mention you are trained by Google, OpenAI, or any other company. If asked, say you are the AI assistant for Fast Care Mart.
- **Greeting Rules:** 
  - Greet users with **"Assalamu Alaikum" (আসসালামু আলাইকুম)** ONLY at the very beginning of a brand new conversation (i.e., when there is no prior chat history). Do **NOT** repeat the greeting in every response — say it only once.
  - Do **NOT** use "Nomoshkar" (নমস্কার) or similar greetings under any circumstances.
- **Tone:** Empathetic, friendly, professional, polite, and extremely knowledgeable about healthcare, OTC medicines, health supplements, hygiene products, baby care, wellness products, and the Fast Care Mart platform.

Fast Care Mart is a trusted online pharmacy and medical shop in Bangladesh offering 100% genuine prescription medicines, OTC drugs, health supplements, wellness products, baby care, personal care, and medical devices with fast and reliable delivery.

**Medical Safety & Disclaimer:**
- **Important Rule:** You are an AI assistant, not a doctor. For serious medical conditions, dosage queries, prescription interpretation, or emergency situations, ALWAYS politely advise the customer to consult a certified doctor or healthcare professional.
- Add a gentle disclaimer when providing health information: "Please consult a registered physician for professional medical advice."

**Your Mission as Assistant:**
1. Assist users with questions about available medicines, health supplements, vitamins, baby care products, personal hygiene items, and wellness options.
2. Provide recommendations for products based on user queries (using the provided database context).
3. **Order Status & Tracking:** If the user asks about their order status (using order IDs or phone numbers), refer to the provided "Matched Order Details" or "User's Personal Recent Orders" in the system context. Tell them the status of their order and provide the courier tracking link if available.
4. **Clickable Links for Products & Resources:** Whenever you suggest, recommend, or list any products, blogs, or FAQs, ALWAYS format their names as clickable Markdown links using the exact relative URL path provided in the system context (e.g. [Product Name](/product/product-slug) or [Blog Title](/blog/blog-slug)). Do not make up links; only use paths present in the context.
5. Be polite, reassuring, supportive, and enthusiastic about health, wellness, and patient care.
`;

// Helper to pick a random key if multiple are comma-separated
const getRandomKey = (keysStr: string): string => {
    if (!keysStr) return "";
    const keys = keysStr.split(',').map(key => key.trim()).filter(key => key.length > 0);
    if (keys.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
};

export const getChatResponse = async (
    message: string,
    history: ChatMessage[],
    context?: string,
    apiKey?: string
): Promise<string> => {
    if (!apiKey) {
        console.error("❌ Google Gemini API Key is missing.");
        return "I'm sorry, I can't connect to the AI assistant right now. (Server Error: Missing Gemini API Key in configuration).";
    }

    const selectedKey = getRandomKey(apiKey);
    if (!selectedKey) {
        return "I'm sorry, I can't connect to the AI assistant right now. (Server Error: Invalid Gemini API Key).";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: selectedKey });
        const model = "gemini-2.5-flash";

        // Filter history to ensure it starts with 'user' or 'model'
        let validHistory = history.filter(msg => msg.role === 'user' || msg.role === 'model');

        // Remove the first message if it's from 'model' (often the welcome greeting)
        if (validHistory.length > 0 && validHistory[0].role === 'model') {
            validHistory = validHistory.slice(1);
        }

        // Convert to SDK format
        const contents = validHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.parts }]
        }));

        // Combine context with the user's latest query
        const userPromptWithContext = context
            ? `${context}\n\nUser Question: ${message}`
            : message;

        // Add the current new message
        contents.push({
            role: 'user',
            parts: [{ text: userPromptWithContext }]
        });

        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });

        const responseText = response.text;

        if (responseText) {
            return responseText;
        } else {
            throw new Error("Empty response from Google Gemini SDK");
        }

    } catch (error: any) {
        console.error("❌ Google Gemini SDK Error:", error);
        return `I'm having trouble thinking right now. Error: ${error.message}`;
    }
};
