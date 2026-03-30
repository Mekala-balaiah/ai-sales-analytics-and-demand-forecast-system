import React, { useContext } from 'react';
import { AnalyticsContext } from '../context/AnalyticsContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/currencyFormatter';

const Forecast = () => {
  const { appState } = useContext(AnalyticsContext);
  const { forecastResults: predictions, loading } = appState;

  return (
    <div>
      <h1 className="mb-2">Demand Forecasting</h1>
      <p className="mb-4">AI-driven predictions for future revenue using linear regression analysis on your historical data.</p>
      
      {loading ? (
        <p>Running prediction models...</p>
      ) : predictions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p>Not enough historical data to generate an accurate forecast. Please upload more datasets.</p>
        </div>
      ) : (
        <>
          <div className="glass-panel" style={{ marginBottom: '32px' }}>
            <h3 className="mb-4">Expected Revenue Forecast (Next 5 Periods)</h3>
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer>
                <LineChart data={predictions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                    itemStyle={{ color: 'var(--success-color)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predictedRevenue" 
                    stroke="var(--success-color)" 
                    strokeWidth={3}
                    dot={{ fill: 'var(--success-color)', r: 6, strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                    name="Predicted Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <h3 className="mb-3">Prediction Matrix</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {predictions.map((p, idx) => (
              <div key={idx} className="glass-panel" style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>{p.date}</p>
                <h2 style={{ color: 'var(--success-color)', margin: '8px 0' }}>{formatCurrency(p.predictedRevenue)}</h2>
                <small style={{ color: 'var(--text-secondary)' }}>Confidence: {p.confidenceScore}%</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Forecast;
