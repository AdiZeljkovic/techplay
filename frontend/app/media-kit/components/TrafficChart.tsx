"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const generateTrafficData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseTraffic = 25000;

    return months.map((month, index) => {
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
                <div className="bg-[#0d1220] border border-white/[0.08] p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                    <p className="text-sm font-bold text-white mb-2">{payload[0].payload.month} 2026</p>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                            <span className="text-xs text-white/50">Visitors:</span>
                            <span className="text-xs font-bold text-white">{payload[0].value.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            <span className="text-xs text-white/50">Page Views:</span>
                            <span className="text-xs font-bold text-white">{payload[1].value.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-7 pb-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Traffic Growth</h3>
                        <p className="text-sm text-white/40">Jan — Dec 2026</p>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                            <span className="text-xs text-white/50 font-medium">Visitors</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                            <span className="text-xs text-white/50 font-medium">Page Views</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[320px] px-4 pb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#DC143C" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#DC143C" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis
                            dataKey="month"
                            stroke="rgba(255,255,255,0.15)"
                            style={{ fontSize: '11px', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.15)"
                            style={{ fontSize: '11px', fontWeight: 500 }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
                        <Area
                            type="monotone"
                            dataKey="visitors"
                            stroke="#DC143C"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorVisitors)"
                        />
                        <Area
                            type="monotone"
                            dataKey="pageViews"
                            stroke="#60A5FA"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPageViews)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
