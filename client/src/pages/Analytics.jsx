import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { AnalyticsContext } from '../context/AnalyticsContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '../utils/currencyFormatter';

const COLORS = ['#00e676', '#b388ff', '#0984e3', '#ff7675', '#fdcb6e', '#e17055', '#00cec9', '#6c5ce7'];

const AnalyticsPage = () => {
    const { appState } = useContext(AnalyticsContext);
    const { analytics: data, loading, error } = appState;

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Analytics...</div>;
    if (error) return <div className="glass-panel" style={{ color: 'var(--danger-color)', padding: '32px', textAlign: 'center' }}>Error: {error}</div>;
    if (!data || data.totalRevenue === 0) return <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}><p>No historical data available. Please upload a dataset first.</p></div>;

    // Dynamically derive meaningful categories if backend failed to (e.g., everything is "Other")
    const getUsefulCategories = () => {
        if (!data.categoryDistribution || data.categoryDistribution.length === 0) return [];
        if (data.categoryDistribution.length > 1 && data.categoryDistribution[0].category !== 'Other') {
            return data.categoryDistribution;
        }

        const group = {};
        data.productPerformance.forEach(p => {
            const words = p.product.trim().split(' ');
            // Use the last word as a generic category (e.g. "Paracetamol Tablet" -> "Tablet", "Lemon Pickle" -> "Pickle")
            let cat = words.length > 1 ? words[words.length - 1] : words[0];
            // Clean punctuation
            cat = cat.replace(/[^a-zA-Z0-9]/g, '');
            group[cat] = (group[cat] || 0) + p.revenue;
        });
        return Object.keys(group).map(k => ({ category: k, value: group[k] })).sort((a, b) => b.value - a.value).slice(0, 7);
    };

    const dynamicCategories = getUsefulCategories();

    // Find peak day for highlighting safely
    const maxOrders = data.peakDays && data.peakDays.length > 0
        ? Math.max(...data.peakDays.map(d => d.orders))
        : 0;

    return (
        <div>
            <h1 className="mb-4">Deep Analytics</h1>
            <div className="responsive-grid cols-2">
                <div className="glass-panel">
                    <h3 className="mb-4" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        Category Distribution
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>By Revenue</span>
                    </h3>
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={dynamicCategories}
                                    dataKey="value"
                                    nameKey="category"
                                    cx="50%" cy="50%"
                                    outerRadius={110}
                                    innerRadius={70}
                                    paddingAngle={4}
                                    labelLine={false}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                        if (percent < 0.05) return null;
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
                                    {dynamicCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value)} 
                                    contentStyle={{ 
                                        background: 'var(--panel-bg)', 
                                        borderColor: 'var(--border-color)', 
                                        borderRadius: '8px', 
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)'
                                    }} 
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    formatter={(value) => <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel">
                    <h3 className="mb-4">Peak Activity Days</h3>
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer>
                            <BarChart data={data.peakDays}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="dayOfWeek" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                                    contentStyle={{ 
                                        background: 'var(--panel-bg)', 
                                        borderColor: 'var(--border-color)', 
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }} 
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                                    {
                                        data.peakDays.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.orders === maxOrders ? 'var(--success-color)' : 'var(--accent-purple)'} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass-panel">
                <h3 className="mb-4">Peak Activity Hours</h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer>
                        <AreaChart data={data.peakHours}>
                            <defs>
                                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                            <XAxis dataKey="hour" stroke="var(--text-secondary)" />
                            <YAxis stroke="var(--text-secondary)" />
                            <Tooltip 
                                contentStyle={{ 
                                    background: 'var(--panel-bg)', 
                                    borderColor: 'var(--border-color)', 
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)'
                                }} 
                                itemStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Area type="monotone" dataKey="orders" stroke="var(--accent-color)" fillOpacity={1} fill="url(#colorHours)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
export default AnalyticsPage;
