import React, { useState, useContext, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { AnalyticsContext } from '../context/AnalyticsContext';
import { formatCurrency } from '../utils/currencyFormatter';

const AIChatAssistant = ({ embedded = false }) => {
  const [isOpen, setIsOpen] = useState(embedded ? true : false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am your AI Business Assistant. Ask me about your top products, revenue trends, insights, or forecasts.' }
  ]);
  const [inputVal, setInputVal] = useState('');
  
  const { appState } = useContext(AnalyticsContext);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const generateAIResponse = (query) => {
    const q = query.toLowerCase();
    const { analytics, aiInsights, forecastResults } = appState;

    if (!analytics || analytics.totalRevenue === 0) {
      return "It looks like you haven't uploaded any data yet. Please upload a dataset to the Upload Center so I can analyze your business.";
    }

    // 1. Best Product Strategy
    if (q.includes("best product") || q.includes("top product") || q.includes("highest selling")) {
      const topProd = analytics.productPerformance[0];
      return `Your best-selling product is **${topProd.product}** with ${topProd.quantity} units sold, generating ${formatCurrency(topProd.revenue)}.`;
    }

    // 2. Worst Product Strategy
    if (q.includes("worst product") || q.includes("slow moving") || q.includes("lowest selling") || q.includes("bottom product")) {
      const bottomProd = analytics.productPerformance[analytics.productPerformance.length - 1];
      return `Your slowest-moving product currently is **${bottomProd.product}** with only ${bottomProd.quantity} units sold (${formatCurrency(bottomProd.revenue)}). Consider a discount or promotional push.`;
    }

    // 3. Revenue & Growth
    if (q.includes("revenue") || q.includes("sales") || q.includes("how much did i make")) {
      let msg = `Your total revenue is **${formatCurrency(analytics.totalRevenue)}** from ${analytics.totalOrders} total orders. `;
      if (analytics.growthPercent > 0) {
        msg += `Sales are up by ${Math.round(analytics.growthPercent)}%! Keep up the great work.`;
      } else if (analytics.growthPercent < 0) {
        msg += `Sales have dipped by ${Math.abs(Math.round(analytics.growthPercent))}%. Let's look into some insights to reverse this.`;
      }
      return msg;
    }

    // 4. Forecasts
    if (q.includes("predict") || q.includes("forecast") || q.includes("future") || q.includes("next")) {
      if (!forecastResults || forecastResults.length === 0) {
        return "I don't have enough historical data to generate a forecast just yet.";
      }
      const finalForecast = forecastResults[forecastResults.length - 1];
      const nextDay = forecastResults[0];
      return `For the immediate next period (${nextDay.date}), I predict revenues of **${formatCurrency(nextDay.predictedRevenue)}**. By the end of the forecast window (${finalForecast.date}), expect around ${formatCurrency(finalForecast.predictedRevenue)}.`;
    }

    // 5. General Insights (Why are sales dropping? What's going on?)
    if (q.includes("why") || q.includes("insight") || q.includes("what should i do") || q.includes("recommend")) {
      if (aiInsights && aiInsights.length > 0) {
        // Pick top opportunity or warning
        const topInsight = aiInsights.find(i => i.type === 'warning' || i.type === 'opportunity') || aiInsights[0];
        return `Here is a critical insight: **${topInsight.title}** - ${topInsight.description}`;
      }
      return "Your metrics seem stable. Continue monitoring your peak sales hours and category distributions.";
    }

    // Default Fallback
    return "I am an analytical engine. Try asking me specific questions like 'What is my best product?', 'What is my total revenue?', or 'Show me a sales forecast.'";
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    // Add user message
    const newMsgs = [...messages, { role: 'user', text: inputVal }];
    setMessages(newMsgs);
    setInputVal('');

    // Generate AI response
    setTimeout(() => {
      const aiResponseText = generateAIResponse(inputVal);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponseText }]);
    }, 400); // slight simulated delay
  };

  return (
    <>
      {/* Floating Button only shows if not embedded */}
      {!embedded && (
        <button 
          className="glass-panel"
          style={{
            position: 'fixed', bottom: '30px', right: '30px', 
            width: '60px', height: '60px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 1000,
            background: 'var(--accent-purple)', border: 'none',
            boxShadow: '0 8px 32px rgba(179, 136, 255, 0.3)'
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X color="#fff" size={28} /> : <MessageSquare color="#fff" size={28} />}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="glass-panel"
          style={embedded ? {
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            padding: 0, overflow: 'hidden',
            border: '1px solid var(--border-color)',
            marginTop: '24px'
          } : {
            position: 'fixed', bottom: '100px', right: '30px',
            width: '350px', height: '500px', display: 'flex', flexDirection: 'column',
            zIndex: 1000, padding: 0, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            border: '1px solid var(--accent-purple)'
          }}
        >
          {/* Header */}
          <div style={{ background: 'var(--accent-purple)', padding: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={24} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>AI Assistant</h3>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {msg.role === 'ai' && <div style={{ minWidth: '24px' }}><Bot size={20} color="var(--accent-purple)" /></div>}
                <div style={{ 
                  background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                  color: msg.role === 'user' ? '#0a192f' : '#fff',
                  padding: '10px 14px', borderRadius: '12px',
                  borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                  borderBottomLeftRadius: msg.role === 'ai' ? '2px' : '12px',
                  fontSize: '0.9rem', lineHeight: '1.4'
                }}>
                  {/* Super basic markdown bold support for products/revenue */}
                  {msg.text.split('**').map((chunk, index) => 
                     index % 2 === 1 ? <strong key={index}>{chunk}</strong> : chunk
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{ display: 'flex', padding: '12px', borderTop: '1px solid var(--border-color)', background: 'var(--panel-bg)' }}>
            <input 
              type="text" 
              className="input-control"
              style={{ flex: 1, marginBottom: 0, borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              placeholder="Ask about your data..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0 16px', minWidth: 'auto' }}
              disabled={!inputVal.trim() || appState.loading}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatAssistant;
