
const { GoogleGenAI } = require("@google/genai");

let gemini;

const getGemini = () => {
  if (!gemini) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY environment variable is missing on this server."
      );
    }

    gemini = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return gemini;
};

const generateChatResponse = async (
  analyticsDoc,
  userMessage,
  chatHistory = [],
  currencyFormat = "INR"
) => {
  try {
    const ai = getGemini();

    const isINR = currencyFormat !== "USD_TO_INR";
    const symbol = isINR ? "₹" : "$";
    const locale = isINR ? "en-IN" : "en-US";

    const formatValue = (val) =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 2,
      }).format(Number(val) || 0);

    const growth = Number(analyticsDoc.growthPercent) || 0;

    const systemPrompt = `
You are an expert AI Business Assistant for MicroBizCopilot.

Answer questions about the user's business analytics accurately,
concisely, professionally, and with actionable recommendations.

Always use ${symbol} for monetary values.
${isINR
  ? "Use Indian number formatting, including lakhs and crores."
  : "Use international number formatting for USD."}

Use Markdown and bold important metrics.
Use only the supplied business data for business-specific facts.
Do not invent missing values or claim a forecast exists if it was not supplied.

BUSINESS DATA:
- Total Revenue: ${symbol}${formatValue(analyticsDoc.totalRevenue)}
- Total Orders: ${analyticsDoc.totalOrders || 0}
- Average Order Value: ${symbol}${formatValue(analyticsDoc.averageOrderValue)}
- Period-over-period growth: ${Math.abs(growth - 100).toFixed(1)}%
  ${growth >= 100 ? "Increase" : "Decrease"}
- Top Products: ${
  analyticsDoc.productPerformance
    ? analyticsDoc.productPerformance
        .slice(0, 3)
        .map(
          (p) =>
            `${p.product} (Revenue: ${symbol}${formatValue(p.revenue)}, Quantity: ${p.quantity})`
        )
        .join(", ")
    : "None"
}
- Bottom Products: ${
  analyticsDoc.productPerformance
    ? analyticsDoc.productPerformance
        .slice(-3)
        .map(
          (p) =>
            `${p.product} (Revenue: ${symbol}${formatValue(p.revenue)}, Quantity: ${p.quantity})`
        )
        .join(", ")
    : "None"
}
- Peak Sales Days: ${
  analyticsDoc.peakDays
    ? analyticsDoc.peakDays
        .slice(0, 2)
        .map((d) => `${d.dayOfWeek} (${d.orders} orders)`)
        .join(", ")
    : "None"
}
- Recent Insights: ${
  analyticsDoc.insights
    ? analyticsDoc.insights
        .slice(0, 3)
        .map((i) => `${i.title}: ${i.description}`)
        .join(" | ")
    : "None"
}
`;

    // Convert existing chat history to Gemini's format.
    // Gemini uses "model" instead of "assistant".
    const history = chatHistory
      .filter(
        (msg) =>
          (msg.role === "user" || msg.role === "ai") &&
          typeof msg.text === "string" &&
          msg.text.trim()
      )
      .map((msg) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.text }],
      }));

    // Gemini chat history must begin with a user message
    // and alternate user/model messages.
    const validHistory = [];
    let expectedRole = "user";

    for (const msg of history) {
      if (msg.role === expectedRole) {
        validHistory.push(msg);
        expectedRole = expectedRole === "user" ? "model" : "user";
      }
    }

    // If history ends with a user message, remove it:
    // the current question is sent separately below.
    if (validHistory.length > 0 &&
        validHistory[validHistory.length - 1].role === "user") {
      validHistory.pop();
    }

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: validHistory,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
    });

    const response = await chat.sendMessage({
      message: userMessage,
    });

    return (
      response.text ||
      "I'm sorry, I couldn't generate a response."
    );
  } catch (error) {
    console.error("Gemini API Error:", error.message);

    return "I'm sorry, I encountered an error while generating a response. Please try again later.";
  }
};

module.exports = { generateChatResponse };
