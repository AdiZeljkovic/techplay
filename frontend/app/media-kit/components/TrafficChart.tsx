"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Fake monthly traffic data showing growth
const generateTrafficData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseTraffic = 25000;

    return months.map((month, index) => {
        // Simulate realistic growth with some variance
        const growth = 1 + (index * 0.15) + (Math.random() * 0.1 - 0.05);
        return {
            month,
            visitors: Math.floor(baseTraffic * growth),
            pageViews: Math.floor(baseTraffic * growth * 3.2),
        };
    });
};

export default function TrafficChart() {
    const data = generateTrafficData();

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-3 rounded-lg shadow-lg">
                    <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
                        {payload[0].payload.month}
                    </p>
                    <p className="text-xs text-[var(--accent)]">
                        Visitors: {payload[0].value.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-400">
                        Page Views: {payload[1].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[400px] bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8">
            <div className="mb-6">
                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">
                    Traffic Growth Trend
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                    Monthly visitors and page views over the past year
                </p>
            </div>

            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FC4100" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FC4100" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="month"
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="#FC4100"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVisitors)"
                    />
                    <Area
                        type="monotone"
                        dataKey="pageViews"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPageViews)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
