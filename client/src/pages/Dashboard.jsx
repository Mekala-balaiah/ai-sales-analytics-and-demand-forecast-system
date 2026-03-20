import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { AnalyticsContext } from '../context/AnalyticsContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, Info, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/currencyFormatter';

const COLORS = ['#64ffda', '#b388ff', '#58a6ff', '#00e676', '#ff5252'];

const Dashboard = () => {
  const { token } = useContext(AuthContext);
  const { activeBusiness } = useContext(BusinessContext);
  const { appState } = useContext(AnalyticsContext);
  const { analytics: data, loading } = appState;

  const [currencyFormat, setCurrencyFormat] = useState(() => {
    return localStorage.getItem('currencyFormat') || 'INR';
  });

  useEffect(() => {
    localStorage.setItem('currencyFormat', currencyFormat);
  }, [currencyFormat]);

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return <TrendingUp color="var(--success-color)" size={20} />;
      case 'negative': return <AlertTriangle color="var(--danger-color)" size={20} />;
      case 'recommendation': return <Zap color="var(--accent-purple)" size={20} />;
      default: return <Info color="var(--accent-color)" size={20} />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive': return 'var(--success-color)';
      case 'negative': return 'var(--danger-color)';
      case 'recommendation': return 'var(--accent-purple)';
      default: return 'var(--accent-color)';
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Dashboard...</div>;

  const isDataEmpty = !data || data.totalRevenue === 0;

  return (
    <div>
      <div className="mb-4 flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>What happened? Why happened? What will happen next?</p>
        </div>
        <div>
          <select
            className="input-control"
            style={{ width: 'auto', marginBottom: 0 }}
            value={currencyFormat}
            onChange={(e) => setCurrencyFormat(e.target.value)}
          >
            <option value="INR">Data is already in INR</option>
            <option value="USD_TO_INR">Data is in USD (Convert to INR)</option>
          </select>
        </div>
      </div>

      {isDataEmpty ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '64px' }}>
          <h2 style={{ color: 'var(--text-secondary)' }}>No Data Available</h2>
          <p className="mb-4">You have not uploaded any data for this business yet.</p>
          <Link to="/upload" className="btn-primary" style={{ textDecoration: 'none' }}>Go to Upload Dataset</Link>
        </div>
      ) : (
        <>
          {/* 1. KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div className="glass-panel text-center">
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total Revenue</p>
              <h2 style={{ color: 'var(--accent-color)', fontSize: '1.8rem', margin: '8px 0' }}>
                {formatCurrency(data.totalRevenue, currencyFormat)}
              </h2>
            </div>
            <div className="glass-panel text-center">
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total Orders</p>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '2.2rem', margin: '8px 0' }}>
                {data.totalOrders.toLocaleString()}
              </h2>
            </div>
            <div className="glass-panel text-center">
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Growth Rate</p>
              <h2 style={{ color: data.growthPercent > 100 ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '2.2rem', margin: '8px 0' }}>
                {data.growthPercent > 100 ? '↑' : '↓'} {Math.abs(data.growthPercent - 100).toFixed(1)}%
              </h2>
            </div>
            <div className="glass-panel text-center">
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Forecast Accuracy</p>
              <h2 style={{ color: 'var(--accent-purple)', fontSize: '2.2rem', margin: '8px 0' }}>
                {data.forecastAccuracy}%
              </h2>
            </div>
          </div>

          {/* 2. Sales Trend Chart */}
          <div className="glass-panel mb-4">
            <h3 className="mb-4">Sales Trend (Revenue Over Time)</h3>
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer>
                <LineChart data={data.salesOverTime}>
                  <defs>
                    <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} minTickGap={30} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--accent-color)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Product Performance | 4. Revenue Distribution */}
          <div className="responsive-grid cols-2">
            <div className="glass-panel">
              <h3 className="mb-4">Product Performance (Quantity Sold)</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <BarChart data={data.productPerformance.slice(0, 7)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="product" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                    <Bar dataKey="quantity" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel">
              <h3 className="mb-4">Revenue Distribution</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data.productPerformance.slice(0, 5)}
                      dataKey="revenue"
                      nameKey="product"
                      cx="50%" cy="50%"
                      outerRadius={110}
                      innerRadius={70}
                      paddingAngle={4}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        if (percent < 0.05) return null; // hide very small text
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                        return (
                          <text x={x} y={y} fill="#0a192f" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
                            {(percent * 100).toFixed(0)}%
                          </text>
                        );
                      }}
                    >
                      {data.productPerformance.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 5. Daily Comparison | 6. Peak Hours */}
          <div className="responsive-grid cols-2-reverse">
            <div className="glass-panel">
              <h3 className="mb-4">Daily Sales Comparison</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <BarChart data={data.peakDays} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-secondary)" />
                    <YAxis dataKey="dayOfWeek" type="category" stroke="var(--text-secondary)" width={80} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                    <Bar dataKey="orders" fill="var(--accent-color)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel">
              <h3 className="mb-4">Peak Sales Hours</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <AreaChart data={data.peakHours}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="hour" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip contentStyle={{ background: 'var(--bg-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="orders" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 7. Forecast Chart */}
          <div className="glass-panel mb-4">
            <h3 className="mb-4" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Demand Forecast (AI Predictive Model)
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Historical vs Predicted</span>
            </h3>
            {data.predictions && data.predictions.length > 0 ? (
              <div style={{ width: '100%', height: '350px' }}>
                {(() => {
                  // Combine last 14 days of actual data with 7 days of predictions for a continuous line chart
                  const lastActuals = data.salesOverTime.slice(-14).map(item => ({
                    name: item.date,
                    actual: item.revenue,
                    predicted: null
                  }));

                  // Connect the lines seamlessly 
                  if (lastActuals.length > 0) {
                    lastActuals[lastActuals.length - 1].predicted = lastActuals[lastActuals.length - 1].actual;
                  }

                  const preds = data.predictions.map(item => ({
                    name: item.date,
                    actual: null,
                    predicted: item.predictedRevenue
                  }));

                  const combinedData = [...lastActuals, ...preds];

                  return (
                    <ResponsiveContainer>
                      <AreaChart data={combinedData}>
                        <defs>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--success-color)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--success-color)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" minTickGap={30} />
                        <YAxis stroke="var(--text-secondary)" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                        <Legend verticalAlign="top" height={36} />
                        <Area type="monotone" dataKey="actual" name="Historical Sales" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" dot={false} activeDot={{ r: 6 }} />
                        <Area type="monotone" dataKey="predicted" name="AI Forecast" stroke="var(--success-color)" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" dot={false} activeDot={{ r: 8 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                })()}
              </div>
            ) : (
              <p>Upload more historical data to unlock AI Forecasting.</p>
            )}
          </div>

          {/* 8. AI Recommendations Panel */}
          {/* <div className="glass-panel mt-4" style={{ background: 'linear-gradient(135deg, rgba(82, 80, 223, 0.1) 0%, rgba(100, 255, 218, 0.05) 100%)', border: '1px solid var(--accent-purple)' }}>
            <h3 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap color="var(--accent-purple)" /> AI Business Recommendations
            </h3>
            
            {data.insights && data.insights.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {data.insights.map((insight, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '16px', 
                      background: 'rgba(0,0,0,0.3)', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      borderLeft: `4px solid ${getInsightColor(insight.type)}`
                    }}
                  >
                    <div>{getInsightIcon(insight.type)}</div>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 500 }}>{insight.message}</p>
                  </div>
                ))}
              </div>
            ) : (
               <p>No actionable insights generated at this time. AI relies on rich data arrays to process trends.</p>
            )}
          </div> */}

        </>
      )}
    </div>
  );
};

export default Dashboard;
