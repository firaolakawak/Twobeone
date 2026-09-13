import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from './src/app/components/ui/dialog';
import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from './src/app/components/ui/select';
import { Input } from './src/app/components/ui/input';
import { Textarea } from './src/app/components/ui/textarea';
import { Button } from './src/app/components/ui/button';
import { Tabs,TabsList,TabsTrigger,TabsContent } from './src/app/components/ui/tabs';
﻿import App from './src/app/App';
import { MoodAnalytics } from './src/app/components/MoodAnalytics';
import { Heart } from 'lucide-react';
import { LanguageSelector } from './src/app/components/LanguageSelector';
import { NotificationCenter } from './src/app/components/NotificationCenter';
import { projectId, publicAnonKey } from './src/app/utils/supabase/info';import React, { useState } from 'react';
import { BottomNavigation } from './src/app/components/BottomNavigation';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './src/app/contexts/LanguageContext';
import { CoupleDashboard } from './src/app/components/CoupleDashboard';
import { createClient } from './src/app/utils/supabase/client';
import { Toaster } from 'sonner';
import './src/styles/index.css';

const scenario = new URLSearchParams(location.search).get('state') || 'normal';
const language = new URLSearchParams(location.search).get('lang') || 'en';
localStorage.setItem('twobeone_language',language);
sessionStorage.setItem('twobeone_push_reminder:sample-firaol','shown');
const fixtureWindow=window as any;
fixtureWindow.__dashboardRequests=[];
fixtureWindow.__dashboardActions=[];
const nativeFetch=window.fetch.bind(window);
const currentDate=new Date().toISOString();
let sampleMood:string|null='great';
const fixtureProfile={id:'sample-firaol',name:'Firaol Akawak',email:'firaol@example.test',partnerId:'sample-keti',createdAt:'2024-01-01T00:00:00Z',relationshipStart:'2025-06-01',language};
const fixturePartner={id:'sample-keti',name:'Keti Abira',email:'keti@example.test',partnerId:'sample-firaol',createdAt:'2024-01-01T00:00:00Z',language};
const devotion={id:'sample-devotion',title:'Love in the little things',reflection:'Make room for small acts of kindness that bring you closer to each other and God.',body:'Let all that you do be done in love.',verse:'1 Corinthians 16:14',verseText:'Let all that you do be done in love.',language,category:'Love',date:currentDate,createdAt:currentDate};
let userLoc:any={userId:'sample-firaol',location:{latitude:24.4539,longitude:54.3773,city:'Abu Dhabi',country:'United Arab Emirates'},locationType:'manual',updatedAt:currentDate};
let partnerLoc:any={userId:'sample-keti',location:{latitude:9.03,longitude:38.74,city:'Addis Ababa',country:'Ethiopia'},locationType:'manual',updatedAt:currentDate};
if(scenario==='long-cities'){userLoc.location.city='Al Dhafra Region, Abu Dhabi';partnerLoc.location.city='Addis Ababa Metropolitan Area';}
if(scenario==='missing-location')partnerLoc=null;
if(scenario==='no-locations'){partnerLoc=null;userLoc=null;}
if(scenario==='same-city')partnerLoc={...partnerLoc,location:{...userLoc.location}};
window.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);
 if(url.origin===location.origin)return nativeFetch(input,init);
 const method=init?.method||'GET';
 fixtureWindow.__dashboardRequests.push({url:url.href,method,mocked:true});
 const pathname=url.pathname;let data:any={};
 if(pathname.endsWith('/profile'))data={profile:fixtureProfile,partner:fixturePartner};
 else if(pathname.includes('/admin/check'))data={isAdmin:false};
 else if((pathname.includes('/devotionals/completions')||pathname.includes('/devotional-completions')))data={completions:[],stats:{totalCompleted:12}};
 else if((pathname.includes('/devotionals')||pathname.includes('/devotions')))data={devotions:[devotion],devotional:devotion};
 else if(pathname.endsWith('/journal'))data={entries:[{id:'sample-journal',userId:'sample-firaol',authorName:'Firaol',title:'Gratitude for today',content:'I am thankful for the care we show each other. '+String.fromCodePoint(0x134d,0x1245,0x122d),isShared:true,createdAt:currentDate,updatedAt:currentDate}]};
 else if(pathname.endsWith('/prayer'))data={prayers:[{id:'sample-prayer',userId:'sample-firaol',title:'Patience and kindness',content:'Help us listen and support each other.',category:'relationship',isAnswered:false,createdAt:currentDate,prayedBy:[],prayCount:0}]};
 else if(pathname.includes('/questions/responses'))data={userResponses:[],partnerResponses:[]};
 else if(pathname.includes('/streaks'))data={streaks:[{streak_type:'devotional',current_streak:scenario==='streak'?7:3}]};
 else if(pathname.includes('/chat/messages'))data={hasPartner:true,unreadCount:0,messages:[{id:'sample-chat',channelId:'sample',senderId:'sample-keti',senderName:'Keti',message:'I hope you have a lovely day. '+String.fromCodePoint(0x134d,0x1245,0x122d),createdAt:currentDate}]};
 else if(pathname.includes('/memory/progress'))data={progress:[]};
 else if(pathname.includes('/memory/stats'))data={stats:{totalVerses:0,masteredVerses:0,currentStreak:0,totalPoints:0}};
 else if(pathname.includes('/calendar'))data={items:[],activity:[]};
 else if(pathname.includes('/notifications'))data={notifications:[],unreadCount:0};
 else if(pathname.includes('/modules'))data={modules:[],progress:{completedLessons:[],completed:false}};
 else if(pathname.includes('couple-locations'))data={userLocation:userLoc,partnerLocation:partnerLoc};
 else if(pathname.endsWith('/update-location')){if(method==='DELETE')userLoc=null;else if(init?.body){const parsed=JSON.parse(String(init.body));userLoc={userId:'sample-firaol',...parsed};}data={success:true,location:userLoc};}
 else if(url.hostname==='nominatim.openstreetmap.org')data=[{lat:'24.4539',lon:'54.3773',display_name:'Abu Dhabi, United Arab Emirates'}];
 else if(pathname.includes('/questions/count'))data={count:12};
 else if(pathname.includes('/questions'))data={questions:[{id:'sample-question',question:'What made you feel loved this week?',title:'Care for each other',category:'daily-life',language,verse:'Let all that you do be done in love.',verseReference:'1 Corinthians 16:14',prompts:[{id:'sample-prompt',text:'What made you feel loved this week?',type:'text'}]}]};
 else if(pathname.includes('/milestones'))data={milestones:[{id:'sample-past-milestone',title:'Our first shared prayer',date:'2026-08-01',createdAt:currentDate},{id:'sample-milestone',title:'Our Sunday video date',date:'2026-09-20T16:30:00',createdAt:currentDate}]};
 else if(pathname.includes('/moods')){if(method==='POST'&&init?.body)sampleMood=JSON.parse(String(init.body)).mood;data={moods:[{userId:'sample-keti',mood:'good',createdAt:currentDate},...(sampleMood?[{userId:'sample-firaol',mood:sampleMood,createdAt:currentDate}]:[])],success:true};}
 else if(pathname.includes('/engagement/summary'))data={summary:{today:{totalSeconds:0,byCategory:{reading:0,answering:0,journaling:0,praying:0,other:0}},week:{totalSeconds:0,byCategory:{reading:0,answering:0,journaling:0,praying:0,other:0}},month:{totalSeconds:0,byCategory:{reading:0,answering:0,journaling:0,praying:0,other:0}},champion:{level:'starting',progress:0,nextTargetSeconds:3600}}};
 else if(pathname.includes('/modules/'))data={progress:{completedLessons:[],completed:false}};
 else if(url.hostname==='bible-api.com')data={reference:'1 Corinthians 16:14',text:'Let all that you do be done in love.',verses:[{verse:14,text:'Let all that you do be done in love.'}],translation_name:'King James Version'};
 else if(pathname.includes('/push/'))data={enabled:false,subscribed:false};
 return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
};
const client=createClient();
const session={access_token:'local-preview-only',refresh_token:'local-preview-only',expires_at:Math.floor(Date.now()/1000)+86400,token_type:'bearer',user:{id:'sample-firaol'}};
client.auth.getSession=async()=>({data:{session:scenario==='public'?null:session},error:null}) as any;
client.auth.onAuthStateChange=(()=>({data:{subscription:{unsubscribe(){}}}})) as any;
client.auth.refreshSession=async()=>({data:{session,user:session.user},error:null}) as any;
client.auth.getUser=async()=>({data:{user:session.user},error:null}) as any;
client.auth.stopAutoRefresh();
const mockChannel:any={on(){return this},subscribe(){return this},track:async()=>{},untrack:async()=>{},presenceState:()=>({})};
client.channel=()=>mockChannel;
client.removeChannel=async()=> 'ok';

const amText=String.fromCodePoint(0x134d,0x1245,0x122d);
function SharedUiSpecimen(){return <LanguageProvider><Dialog open><DialogContent><DialogHeader><DialogTitle>Our shared story {amText}</DialogTitle><DialogDescription>Shared UI font and reflow specimen.</DialogDescription></DialogHeader><Input aria-label="Sample title" defaultValue={'Grace '+amText}/><Textarea aria-label="Sample reflection" defaultValue={'We grow together '+amText}/><Select defaultValue="long"><SelectTrigger aria-label="Sample category"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="long">A longer relationship category {amText}</SelectItem><SelectItem value="short">Shared prayer {amText}</SelectItem></SelectContent></Select><Tabs defaultValue="one"><TabsList><TabsTrigger value="one">Our reflections {amText}</TabsTrigger><TabsTrigger value="two">Our memories {amText}</TabsTrigger></TabsList><TabsContent value="one">A moment together.</TabsContent><TabsContent value="two">Our story.</TabsContent></Tabs><Button>Save our shared reflection {amText}</Button></DialogContent></Dialog></LanguageProvider>}
const supplemental=new URLSearchParams(location.search).get('supplemental');
createRoot(document.getElementById('root')!).render(supplemental==='ui'?<SharedUiSpecimen/>:supplemental==='mood'?<LanguageProvider><div className="app-mobile-shell min-h-screen bg-background p-6"><MoodAnalytics profile={fixtureProfile as any} partner={fixturePartner as any} onClose={()=>{}}/></div></LanguageProvider>:<App/>);
