import React from 'react';
import { BookOpen, MessageCircle, GraduationCap, Users } from 'lucide-react';

export function QuickActions({onAction}:{onAction?:(a:string)=>void}){
  return (
    <div className="tb-quick-actions">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button onClick={()=>onAction?.('devotionals')} className="tb-action-pill"><BookOpen/> Add Devotional</button>
        <button onClick={()=>onAction?.('questions')} className="tb-action-pill"><MessageCircle/> Add Question</button>
        <button onClick={()=>onAction?.('modules')} className="tb-action-pill"><GraduationCap/> Create Module</button>
        <button onClick={()=>onAction?.('groups')} className="tb-action-pill"><Users/> Add Group</button>
      </div>
    </div>
  )
}
