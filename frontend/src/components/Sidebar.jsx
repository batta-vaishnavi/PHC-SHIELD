import React from 'react';
import {
  LayoutDashboard, Map, Building2, Pill, Users, Bed,
  UserCheck, TrendingUp, AlertTriangle, ArrowRightLeft,
  Cpu, MessageSquare, Flame, Globe2, Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar = () => {
  const { activeTab, setActiveTab, stats } = useApp();

  const navSections = [
    {
      title: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "map", label: "Geospatial Map", icon: Map },
      ]
    },
    {
      title: "Operations",
      items: [
        { id: "phcs", label: "PHC Network", icon: Building2 },
        { id: "stock", label: "Medicine Stock", icon: Pill },
        { id: "footfall", label: "Footfall Tracker", icon: Users },
        { id: "beds", label: "Bed Capacity", icon: Bed },
        { id: "staff", label: "Staff Attendance", icon: UserCheck },
      ]
    },
    {
      title: "AI & Optimization",
      items: [
        { id: "forecast", label: "Demand Forecast", icon: TrendingUp },
        { id: "alerts", label: "Early Warnings", icon: AlertTriangle, badge: stats?.active_alerts },
        { id: "redistribution", label: "Redistribution Plan", icon: ArrowRightLeft },
        { id: "federated", label: "Federated AI", icon: Cpu },
        { id: "assistant", label: "Gemini Assistant", icon: MessageSquare },
      ]
    },
    {
      title: "Crisis & Resilience",
      items: [
        { id: "emergency", label: "Emergency Simulation", icon: Flame },
        { id: "brics", label: "BRICS Scalability", icon: Globe2 },
        { id: "settings", label: "System Settings", icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-navy-950 text-slate-300 min-h-[calc(100vh-4rem)] border-r border-navy-800 p-4 shrink-0 hidden md:block">
      <div className="space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
              {sec.title}
            </p>
            <nav className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-glow-teal font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-navy-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive ? 'bg-white text-teal-800' : 'bg-rose-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};
