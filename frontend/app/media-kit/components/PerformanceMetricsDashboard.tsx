"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Users, Activity, Globe } from "lucide-react";

const deviceData = [
    { name: 'Desktop', value: 62, color: '#3B82F6' },
    { name: 'Mobile', value: 31, color: '#DC143C' },
    { name: 'Tablet', value: 7, color: '#8B5CF6' },
];

const contentPerformance = [
    { category: 'Reviews', articles: 85, avgViews: 125, engagement: 92 },
    { category: 'Tech', articles: 42, avgViews: 180, engagement: 88 },
    { category: 'News', articles: 28, avgViews: 95, engagement: 85 },
    { category: 'Opinions', articles: 16, avgViews: 220, engagement: 95 },
];

// Realistic hourly traffic for 20K monthly users (~667 daily visitors)
const timeData = [
    { hour: '00:00', visitors: 18 },
    { hour: '04:00', visitors: 12 },
    { hour: '08:00', visitors: 32 },
    { hour: '12:00', visitors: 45 },
    { hour: '16:00', visitors: 62 },
    { hour: '20:00', visitors: 68 },
    { hour: '23:00', visitors: 38 },
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#001540] border border-white/[0.12] rounded-xl p-4 shadow-xl">
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="text-sm">
                        <span className="text-white/60">{entry.name}: </span>
                        <span className="text-white font-bold">
                            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function PerformanceMetricsDashboard() {
    return (
        <div className="space-y-8">
            {/* Top KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Users, label: "Average Monthly Users", value: "20K+", change: "+285%", color: "from-blue-500 to-cyan-500" },
                    { icon: TrendingUp, label: "Growth Rate", value: "12.4%", change: "+3.1%", color: "from-green-500 to-emerald-500" },
                    { icon: Activity, label: "Bounce Rate", value: "68.3%", change: "-2.1%", color: "from-purple-500 to-pink-500" },
                    { icon: Globe, label: "Page Views", value: "36.5K+", change: "+270%", color: "from-orange-500 to-red-500" },
                ].map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]
                                 hover:bg-white/[0.04] hover:border-white/[0.1]
                                 transition-all duration-500 group"
                    >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color}
                                       flex items-center justify-center mb-3 shadow-lg
                                       group-hover:scale-110 transition-transform duration-500`}>
                            <kpi.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl font-black text-white mb-0.5">{kpi.value}</div>
                        <div className="text-xs text-white/50 mb-2">{kpi.label}</div>
                        <div className="text-xs font-bold text-green-400">{kpi.change}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Device Distribution */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
                >
                    <h3 className="text-lg font-bold text-white mb-6">Device distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={deviceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {deviceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        {deviceData.map((device) => (
                            <div key={device.name} className="text-center">
                                <div className="w-3 h-3 rounded-full mx-auto mb-2"
                                     style={{ backgroundColor: device.color }} />
                                <div className="text-sm font-bold text-white">{device.value}%</div>
                                <div className="text-xs text-white/50">{device.name}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Content Performance */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
                >
                    <h3 className="text-lg font-bold text-white mb-6">Content performance</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={contentPerformance}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="category"
                                stroke="rgba(255,255,255,0.3)"
                                style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.5)' }}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.3)"
                                style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.5)' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="avgViews" name="Avg Views" fill="#DC143C" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Peak Hours */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
            >
                <h3 className="text-lg font-bold text-white mb-6">Traffic by Time of Day</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timeData}>
                        <defs>
                            <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="hour"
                            stroke="rgba(255,255,255,0.3)"
                            style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.5)' }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.3)"
                            style={{ fontSize: '12px', fill: 'rgba(255,255,255,0.5)' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="visitors"
                            name="Visitors"
                            stroke="#8B5CF6"
                            strokeWidth={3}
                            fill="url(#colorTime)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-white/40 text-center mt-4">
                    Peak traffic hours: 16:00 - 22:00 CET (Evening gaming hours)
                </p>
            </motion.div>
        </div>
    );
}
