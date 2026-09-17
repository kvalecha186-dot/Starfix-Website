import { useEffect, useState } from "react";
import { Circle, CalendarClock, CheckCircle2, Loader2 } from "lucide-react";
import { A } from "../adminColors";
import { loadAdminSessions } from "../../lib/adminBackend";

function SessionRow({ s }: { s: any }) {
  const time = s.start ? new Date(s.start).toLocaleString([], { dateStyle:"medium", timeStyle:"short" }) : "Scheduled";
  return <div style={{display:"flex",alignItems:"center",gap:16,padding:"14px 20px",borderBottom:`1px solid ${A.borderMuted}`}}>
    <div style={{flex:1}}><div style={{fontSize:".86rem",fontWeight:600,color:A.text}}>{s.learner} <span style={{color:A.textFaint,fontWeight:400}}>with</span> {s.mentor}</div><div style={{fontSize:".78rem",color:A.textMuted,marginTop:2}}>{s.topic}</div></div>
    <span style={{fontSize:".78rem",color:A.textFaint,whiteSpace:"nowrap"}}>{time}</span>
  </div>;
}
function Group({title,Icon,items}:{title:string;Icon:any;items:any[]}){return <div style={{marginBottom:30}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><Icon size={14} color={A.gold}/><span style={{fontSize:".78rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:A.textFaint}}>{title} ({items.length})</span></div><div style={{background:A.surface,border:`1px solid ${A.border}`,borderRadius:A.radius,overflow:"hidden"}}>{items.length?items.map(s=><SessionRow key={s.id} s={s}/>):<div style={{padding:20,fontSize:".82rem",color:A.textFaint}}>Nothing here right now.</div>}</div></div>}
export function SessionsPage(){
 const [sessions,setSessions]=useState<any[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 useEffect(()=>{loadAdminSessions().then(setSessions).catch(e=>setError(e.message||"Could not load sessions")).finally(()=>setLoading(false))},[]);
 const now=Date.now(); const upcoming=sessions.filter(s=>s.status!=="cancelled"&&s.start&&new Date(s.start).getTime()>=now); const completed=sessions.filter(s=>s.status==="completed"||(s.start&&new Date(s.start).getTime()<now)); const live=sessions.filter(s=>s.status==="live");
 return <div style={{padding:"36px 40px 60px",maxWidth:900,margin:"0 auto"}}><div style={{marginBottom:28}}><h1 style={{fontFamily:A.serif,fontSize:"1.5rem",color:A.text,margin:"0 0 6px"}}>Sessions</h1><p style={{fontSize:".85rem",color:A.textMuted,margin:0}}>Live booking activity from Supabase.</p></div>{loading?<Loader2 size={20}/>:error?<div style={{color:A.red}}>{error}</div>:<><Group title="Live now" Icon={Circle} items={live}/><Group title="Upcoming" Icon={CalendarClock} items={upcoming}/><Group title="Completed" Icon={CheckCircle2} items={completed}/></>}</div>;
}
