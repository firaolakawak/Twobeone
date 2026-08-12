import React, { useState } from 'react';

export function Kanban({columns}:{columns:any[]}){
  const [cols, setCols] = useState(() => JSON.parse(JSON.stringify(columns || [])));
  const [drag, setDrag] = useState<{fromCol:number,fromIdx:number}|null>(null);

  function onDragStart(e:React.DragEvent, fromCol:number, fromIdx:number){
    setDrag({fromCol, fromIdx});
    try{ e.dataTransfer.setData('text/plain', JSON.stringify({fromCol, fromIdx})); }catch{}
  }

  function onDragOver(e:React.DragEvent){ e.preventDefault(); }

  function onDrop(e:React.DragEvent, toCol:number){
    e.preventDefault();
    const data = drag; // get from state
    if (!data) return;
    const newCols = JSON.parse(JSON.stringify(cols));
    const [moved] = newCols[data.fromCol].cards.splice(data.fromIdx,1);
    if (!moved) return;
    newCols[toCol].cards.unshift(moved);
    setCols(newCols);
    setDrag(null);
  }

  return (
    <div className="tb-kanban grid grid-cols-3 gap-3">
      {cols.map((col:any,ci:number)=>(
        <div key={ci} className="kanban-column p-2" onDragOver={onDragOver} onDrop={(e)=>onDrop(e,ci)}>
          <div className="font-semibold mb-2">{col.title}</div>
          <div className="space-y-2">
            {col.cards.map((card:any,idx:number)=>(
              <div
                key={idx}
                className="kanban-card"
                draggable
                onDragStart={(e)=>onDragStart(e,ci,idx)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium">{card.title}</div>
                  <div className="text-xs tb-muted">{card.priority}</div>
                </div>
                <div className="text-xs tb-muted">{card.meta}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
