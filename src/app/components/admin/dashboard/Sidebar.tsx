import React from 'react';
import { Home, BookOpen, MessageSquare, Users, Shield, Archive, LogOut } from 'lucide-react';

const items = [
  {label:'Dashboard',icon:Home,key:'dashboard'},
  {label:'Devotionals',icon:BookOpen,key:'devotionals'},
  {label:'Q&A',icon:MessageSquare,key:'questions'},
  {label:'Modules',icon:Archive,key:'modules'},
  {label:'Groups',icon:Users,key:'groups'},
  {label:'Landing Page',icon:Shield,key:'landing'},
  {label:'Audit Log',icon:Shield,key:'audit'},
]

export function Sidebar({active, onNavigate}:{active?:string,onNavigate?:(k:string)=>void}){
  return (
    <aside className="tb-sidebar h-full">
      <div className="mb-6">
        <div className="text-sm tb-muted">Content</div>
        <div className="mt-3 space-y-1">
          {items.slice(0,4).map(it=>{
            const Icon = it.icon as any;
            return (
              <button key={it.key} onClick={()=>onNavigate?.(it.key)} className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 ${active===it.key? 'bg-gradient-to-r from-[--tb-primary] to-[--tb-accent] text-white':''}`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm">{it.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-8">
        <div className="text-sm tb-muted">Users</div>
        <div className="mt-3 space-y-1">
          <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-50"><Users className="w-4 h-4"/><span className="text-sm">Couples</span></button>
          <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-50"><Shield className="w-4 h-4"/><span className="text-sm">User Management</span></button>
        </div>
      </div>
    </aside>
  )
}
