import React from 'react';
import AIChatAssistant from '../components/AIChatAssistant';

const Insights = () => {
  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <h1 className="mb-2">AI Chat Assistant</h1>
      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
        Interact with your dedicated business assistant to instantly analyze your sales data, top products, and generate demand forecasts.
      </p>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <AIChatAssistant embedded={true} />
      </div>
    </div>
  );
};

export default Insights;
