const Groq = require("groq-sdk");

let groq;
const getGroq = () => {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY environment variable is missing on this server.");
    }
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

const generateChatResponse = async (analyticsDoc, userMessage, chatHistory, currencyFormat = 'INR') => {
  try {
    const aiInstance = getGroq();

    // Determine the currency symbol and locale from the user's selected data format
    const isINR = currencyFormat !== 'USD_TO_INR';
    const symbol = isINR ? '₹' : '$';
    const locale = isINR ? 'en-IN' : 'en-US';

    // Helper to format currency values in the prompt
    const formatValue = (val) => {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(val || 0);
    };

    // Provide context about the business's data
    const systemPrompt = `
You are an expert AI Business Assistant integrated directly into a business analytics dashboard for MicroBizCopilot.
The user is asking a question about their business data. Answer concisely, professionally, and use the provided data context to give accurate and specific insights.
ALWAYS use the correct currency symbol (**${symbol}**) and formatting for all monetary values.
${isINR ? "Place commas according to the **Indian numbering system (Lakhs and Crores)** for all INR values (e.g., ₹11,16,124)." : "Use the standard International numbering system for USD values (e.g., $1,116,124)."}

Use markdown for formatting, like **bolding** key metrics.

Here is the current business data context:
- Total Revenue: ${symbol}${formatValue(analyticsDoc.totalRevenue)}
- Total Orders: ${analyticsDoc.totalOrders || 0}
- Average Order Value (AOV): ${symbol}${formatValue(analyticsDoc.averageOrderValue)}
- Growth (Period over Period): ${Math.abs(analyticsDoc.growthPercent - 100).toFixed(1)}% ${analyticsDoc.growthPercent >= 100 ? 'Increase' : 'Decrease'}
- Top Products: ${analyticsDoc.productPerformance ? analyticsDoc.productPerformance.slice(0, 3).map(p => `${p.product} (Revenue: ${symbol}${formatValue(p.revenue)}, Qty: ${p.quantity})`).join(', ') : 'None'}
- Bottom Products: ${analyticsDoc.productPerformance ? analyticsDoc.productPerformance.slice(-3).map(p => `${p.product} (Revenue: ${symbol}${formatValue(p.revenue)}, Qty: ${p.quantity})`).join(', ') : 'None'}
- Top Sales Days: ${analyticsDoc.peakDays ? analyticsDoc.peakDays.slice(0, 2).map(d => `${d.dayOfWeek} (${d.orders} orders)`).join(', ') : 'None'}
- Recent System Insights: ${analyticsDoc.insights ? analyticsDoc.insights.slice(0, 3).map(i => i.title + ': ' + i.description).join(' | ') : 'None'}
`;

    // Format chat history for Groq API
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.text,
    }));

    const messages = [
      { role: "system", content: systemPrompt },
      ...formattedHistory,
      { role: "user", content: userMessage }
    ];

    const chatCompletion = await aiInstance.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant", // Fast and powerful open-source model
      temperature: 0.7,
      max_tokens: 4000,
    });

    return chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Groq API Error:", error);
    return "I'm sorry, I encountered an error while trying to generate a response. Please try again later.";
  }
};

module.exports = { generateChatResponse };
