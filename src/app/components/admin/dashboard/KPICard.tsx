import React from 'react';

interface KPICardProps{
  label:string;
  value:string;
  change?:string;
  icon?:React.ReactNode;
  delay?:number;
}

export function KPICard({label, value, change, icon, delay=0}:KPICardProps){
  const style:React.CSSProperties = { animationDelay: `${delay}ms` };
  return (
    <div className="tb-kpi-card tb-animate-in" style={style}>
      <div className="flex items-start justify-between">
        <div>
          <div className="tb-kpi-label">{label}</div>
          <div className="tb-kpi-number">{value}</div>
        </div>
        <div className="opacity-20 text-4xl">{icon}</div>
      </div>
      <div className="mt-3 tb-muted text-sm">{change}</div>
    </div>
  )
}
