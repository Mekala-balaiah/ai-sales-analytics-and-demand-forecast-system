import React, { useState, useContext, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { AnalyticsContext } from '../context/AnalyticsContext';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { formatCurrency } from '../utils/currencyFormatter';

const AIChatAssistant = ({ embedded = false }) => {
  const [isOpen, setIsOpen] = useState(embedded ? true : false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am your AI Business Assistant. Ask me about your top products, revenue trends, insights, or forecasts.' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { appState } = useContext(AnalyticsContext);
  const { token } = useContext(AuthContext);
  const { activeBusiness } = useContext(BusinessContext);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isTyping) return;

    const userMessage = inputVal;

    // Add user message
    const newMsgs = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMsgs);
    setInputVal('');
    setIsTyping(true);

    if (!activeBusiness?._id) {
      setMessages(prev => [...prev, { role: 'ai', text: "Please select a business first." }]);
      setIsTyping(false);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/analytics/${activeBusiness._id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(1) // send history, skip the initial greeting
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: data.message || "Sorry, I couldn't process your request right now." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "An error occurred while communicating with the AI server." }]);
    } finally {
      setIsTyping(false);
    }
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
                  background: msg.role === 'user' ? 'var(--accent-color)' : 'var(--panel-bg)',
                  color: msg.role === 'user' ? '#0a192f' : 'var(--text-primary)',
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
            {isTyping && (
              <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start', maxWidth: '85%' }}>
                <div style={{ minWidth: '24px' }}><Bot size={20} color="var(--accent-purple)" /></div>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  padding: '10px 14px', borderRadius: '12px',
                  borderBottomLeftRadius: '2px',
                  fontSize: '0.9rem', lineHeight: '1.4'
                }}>
                  <span className="typing-dot">.</span>
                  <span className="typing-dot">.</span>
                  <span className="typing-dot">.</span>
                </div>
              </div>
            )}
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
              disabled={!inputVal.trim() || appState.loading || isTyping}
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
