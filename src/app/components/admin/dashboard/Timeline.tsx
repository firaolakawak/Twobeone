import React from 'react';

export function Timeline({items}:{items:any[]}){
  return (
    <div className="tb-timeline">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Recent Activity</h4>
      </div>
      <div>
        {items.map((it,idx)=> (
          <div key={idx} className="tb-timeline-item" style={{['--delay' as any]: `${idx*80}ms`}}>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-[var(--tb-primary)] mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{it.action}</div>
                    <div className="text-xs tb-muted">{it.user}</div>
                  </div>
                  <div className="text-xs tb-muted">{it.time}</div>
                </div>
                <div className="details text-xs tb-muted mt-2" aria-hidden>
                  {it.details || ''}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
