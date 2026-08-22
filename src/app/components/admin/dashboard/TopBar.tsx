import React, { useEffect, useState } from 'react';
import { Search, Bell, User, SunMoon } from 'lucide-react';

export function TopBar(){
  const [theme, setTheme] = useState<'light'|'dark'>(() => {
    try{
      const stored = localStorage.getItem('tb-theme');
      if (stored === 'dark' || stored === 'light') return stored;
    }catch{}
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  });

  useEffect(()=>{
    try{
      document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
      localStorage.setItem('tb-theme', theme);
    }catch{}
  },[theme]);

  return (
    <div className="tb-topbar p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div style={{width:36,height:36,background:'var(--tb-primary)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700}}>TB</div>
          <div className="font-semibold">TwoBeOne Admin</div>
        </div>
        <div className="ml-4 relative">
          <input className="px-3 py-2 rounded-lg border border-[--tb-borders] bg-white text-sm" placeholder="Search (press /)" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-md hover:bg-gray-100" title="Notifications"><Bell /></button>
        <button className="p-2 rounded-md hover:bg-gray-100" title="Profile"><User /></button>
        <button
          aria-label="Toggle theme"
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-md hover:bg-gray-100 flex items-center gap-2"
          title="Toggle dark mode"
        >
          <SunMoon />
        </button>
      </div>
    </div>
  );
}
