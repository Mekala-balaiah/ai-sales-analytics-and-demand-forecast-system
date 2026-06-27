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
            let cat = 'Other';
            const prodLower = p.product.toLowerCase();
            
            if (prodLower.includes('annual') || prodLower.includes('yearly') || prodLower.includes('12 month') || prodLower.includes('12month')) {
                cat = 'Annual Membership';
            } else if (prodLower.includes('quarterly') || prodLower.includes('3 month') || prodLower.includes('3month')) {
                cat = 'Quarterly Membership';
            } else if (prodLower.includes('6 month') || prodLower.includes('6month') || prodLower.includes('half year')) {
                cat = 'Semi-Annual Membership';
            } else if (prodLower.includes('monthly') || prodLower.includes('1 month') || prodLower.includes('1month') || prodLower.includes('2 month') || prodLower.includes('2month')) {
                cat = 'Monthly Membership';
            } else if (prodLower.includes('membership') || prodLower.includes('workout') || prodLower.includes('gym')) {
                cat = 'Gym Membership';
            } else if (prodLower.includes('personal training') || prodLower.includes('pt') || prodLower.includes('trainer')) {
                cat = 'Personal Training';
            } else {
                const words = p.product.trim().split(' ');
                let lastWord = words.length > 1 ? words[words.length - 1] : words[0];
                lastWord = lastWord.replace(/[^a-zA-Z]/g, '');
                if (lastWord) {
                    cat = lastWord.charAt(0).toUpperCase() + lastWord.slice(1).toLowerCase();
                    if (cat === 'Months') cat = 'Month';
                    if (cat === 'Memberships') cat = 'Membership';
                }
            }
            
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
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '412px' }}>
                    <h3 className="mb-4" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        Category Distribution
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>By Revenue</span>
                    </h3>
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {/* Left side: Pie Chart */}
                        <div style={{ flex: '1 1 180px', height: '240px', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                    <Pie
                                        data={dynamicCategories}
                                        dataKey="value"
                                        nameKey="category"
                                        cx="50%" cy="50%"
                                        outerRadius={85}
                                        innerRadius={60}
                                        paddingAngle={3}
                                        cornerRadius={4}
                                        stroke="var(--panel-bg)"
                                        strokeWidth={2}
                                        labelLine={false}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                            if (percent < 0.05) return null;
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                            const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                            const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                            return (
                                                <text x={x} y={y} fill="#0a192f" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
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
                              </PieChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Right side: Custom Legend */}
                        <div style={{ flex: '1 2 240px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            {dynamicCategories.map((entry, index) => {
                                const percent = ((entry.value / data.totalRevenue) * 100).toFixed(0);
                                return (
                                    <div key={entry.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, marginRight: '8px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: COLORS[index % COLORS.length], flexShrink: 0 }} />
                                            <span 
                                                style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }} 
                                                title={entry.category}
                                            >
                                                {entry.category}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{percent}%</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-color)' }}>
                                                {formatCurrency(entry.value)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '412px' }}>
                    <h3 className="mb-4">Peak Activity Days</h3>
                    <div style={{ width: '100%', flex: 1, minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.peakDays} margin={{ bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="dayOfWeek" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={45} />
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
