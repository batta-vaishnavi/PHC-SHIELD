import React from 'react';
import { Globe2, Building2, Layers, Network, ShieldCheck, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export const BricsScalability = () => {
  const tiers = [
    {
      level: "Tier 1: Primary Health Centres (PHC)",
      scope: "Edge Telemetry Collection",
      data: "Patient Footfall, Medicine Stock, Bed Occupancy, Local Shift Rosters",
      privacy: "Raw clinical data resides strictly within facility boundary",
      icon: Building2,
      color: "border-teal-500 bg-teal-50/50"
    },
    {
      level: "Tier 2: District Healthcare Silo",
      scope: "Sub-Regional Edge Model Training",
      data: "Localized Ridge gradient computation & cold-chain buffer optimization",
      privacy: "Only mathematical parameter updates uploaded to district coordinator",
      icon: Layers,
      color: "border-indigo-500 bg-indigo-50/50"
    },
    {
      level: "Tier 3: State / Provincial Command",
      scope: "Inter-District Transport Routing",
      data: "Multi-facility OR-Tools transportation solving & buffer load balancing",
      privacy: "Differential privacy noise added to aggregated parameter gradients",
      icon: Network,
      color: "border-purple-500 bg-purple-50/50"
    },
    {
      level: "Tier 4: National Health Intelligence Hub",
      scope: "National Epidemic Preparedness",
      data: "Global demand forecast weights & strategic national stockpile reserves",
      privacy: "Zero patient-identifiable or facility-level raw records transmitted",
      icon: ShieldCheck,
      color: "border-navy-600 bg-navy-50/50"
    },
    {
      level: "Tier 5: BRICS Global Federation",
      scope: "Cross-Border Pandemic Resilience",
      data: "Federated global medical foundation weights (India, Brazil, South Africa, etc.)",
      privacy: "Cross-border treaty compliant federated model parameter synchronization",
      icon: Globe2,
      color: "border-amber-500 bg-amber-50/50"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Globe2 className="w-6 h-6 text-teal-600" />
              BRICS Multi-Tier Scalability Architecture
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Prototype Scalability Architecture
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hierarchical federated AI federation topology spanning local PHCs up to cross-national health intelligence hubs.
          </p>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-navy-950 text-white p-6 rounded-2xl border border-navy-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Decentralized Healthcare Federation Framework</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Scaling Resilience from Rural Health Posts to Global Pandemic Preparedness
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            PHC-SHIELD is architected as a recursive federated hierarchy. Individual Primary Health Centres retain complete sovereignty over patient records, while federated parameter updates aggregate upward through administrative tiers.
          </p>
        </div>
      </div>

      {/* Tier Steps */}
      <div className="space-y-4">
        {tiers.map((tier, idx) => {
          const Icon = tier.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-xl border-l-4 p-5 shadow-card hover:shadow-card-hover transition-all ${tier.color}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold font-mono uppercase text-slate-500 tracking-wider">
                      Hierarchy Level {idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{tier.level}</h3>
                    <p className="text-xs font-semibold text-teal-800 mt-0.5">{tier.scope}</p>
                    
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <strong className="text-slate-800">Telemetry Processed: </strong>
                        <span>{tier.data}</span>
                      </div>
                      <div>
                        <strong className="text-slate-800">Privacy Guarantee: </strong>
                        <span className="text-emerald-700 font-medium">{tier.privacy}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
