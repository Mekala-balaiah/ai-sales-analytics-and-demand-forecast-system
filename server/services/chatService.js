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
    const model = aiInstance.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Format chat history for Gemini API
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    // Provide context about the business's data
    const contextPrompt = `
You are an expert AI Business Assistant integrated directly into a business analytics dashboard.
The user is asking a question about their business data. Answer concisely, professionally, and use the provided data context to give accurate and specific insights.
Use markdown for formatting, like **bolding** key metrics.

Here is the current business data context:
- Total Revenue: $${analyticsDoc.totalRevenue || 0}
- Total Orders: ${analyticsDoc.totalOrders || 0}
- Average Order Value (AOV): $${(analyticsDoc.averageOrderValue || 0).toFixed(2)}
- Growth (Period over Period): ${analyticsDoc.growthPercent || 0}%
- Top Products: ${analyticsDoc.productPerformance ? analyticsDoc.productPerformance.slice(0, 3).map(p => `${p.product} (Revenue: $${p.revenue}, Qty: ${p.quantity})`).join(', ') : 'None'}
- Bottom Products: ${analyticsDoc.productPerformance ? analyticsDoc.productPerformance.slice(-3).map(p => `${p.product} (Revenue: $${p.revenue}, Qty: ${p.quantity})`).join(', ') : 'None'}
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
