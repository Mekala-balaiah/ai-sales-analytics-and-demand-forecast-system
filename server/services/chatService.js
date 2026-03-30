const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI;
const getGenAI = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is missing on this server.");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const generateChatResponse = async (analyticsDoc, userMessage, chatHistory) => {
  try {
    const aiInstance = getGenAI();
    const model = aiInstance.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format chat history for Gemini API
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.1, // Lower temperature to follow instructions more strictly
      },
    });

    // Provide context about the business's data
    const contextPrompt = `
SYSTEM INSTRUCTION:
- You are an expert AI Business Assistant for MicroBizCopilot.
- The user's business operates EXCLUSIVELY in Indian Rupees (INR).
- **MANDATORY**: You MUST prepend the Indian Rupee symbol (₹) to every financial figure you mention.
- **CRITICAL ERROR ALERT**: DO NOT use the dollar symbol ($) or the term "USD" under any circumstances. If the context contains a '$', you MUST convert it to '₹' in your response.
- Answer concisely and professionally. Use markdown for bolding metrics.

Current Business Data Context:
- Total Revenue: ₹${analyticsDoc.totalRevenue || 0}
- Total Orders: ${analyticsDoc.totalOrders || 0}
- Average Order Value (AOV): ₹${(analyticsDoc.averageOrderValue || 0).toFixed(2)}
- Growth (Period over Period): ${Math.abs(analyticsDoc.growthPercent - 100).toFixed(1)}% ${analyticsDoc.growthPercent >= 100 ? 'Increase' : 'Decrease'}
- Top Products: ${analyticsDoc.productPerformance ? analyticsDoc.productPerformance.slice(0, 3).map(p => `${p.product} (Revenue: ₹${p.revenue}, Qty: ${p.quantity})`).join(', ') : 'None'}
- Bottom Products: ${analyticsDoc.productPerformance ? analyticsDoc.productPerformance.slice(-3).map(p => `${p.product} (Revenue: ₹${p.revenue}, Qty: ${p.quantity})`).join(', ') : 'None'}
- Top Sales Days: ${analyticsDoc.peakDays ? analyticsDoc.peakDays.slice(0, 2).map(d => `${d.dayOfWeek} (${d.orders} orders)`).join(', ') : 'None'}
- Recent System Insights: ${analyticsDoc.insights ? analyticsDoc.insights.slice(0, 3).map(i => i.title + ': ' + i.description).join(' | ') : 'None'}

User's Question: ${userMessage}
`;

    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I encountered an error while trying to generate a response. Please try again later.";
  }
};

module.exports = { generateChatResponse };
