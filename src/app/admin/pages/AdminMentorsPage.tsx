import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, Users, Clock, Save, Loader2 } from "lucide-react";
import { A } from "../adminColors";
import { loadAdminMentors, updateMentor, type DbMentor } from "../../lib/adminBackend";

function MentorDrawer({ mentor, onClose, onSaved }: { mentor: DbMentor; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState(mentor); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const save = async () => { setSaving(true); setError(""); try { await updateMentor(mentor.id, draft); onSaved(); onClose(); } catch (e: any) { setError(e.message || "Could not save mentor"); } finally { setSaving(false); } };
  const fields = ["name","headline","company","category","location","price","availability"] as const;
  return <>
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(23,23,23,.28)",zIndex:40}} />
    <motion.div initial={{x:420}} animate={{x:0}} exit={{x:420}} style={{position:"fixed",top:0,right:0,bottom:0,width:420,background:A.surface,borderLeft:`1px solid ${A.border}`,zIndex:41,overflowY:"auto",padding:"28px 30px 40px",boxShadow:A.shadowMd}}>
      <button onClick={onClose} style={{position:"absolute",top:24,right:24,width:30,height:30,borderRadius:"50%",border:`1px solid ${A.border}`,background:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={14}/></button>
      <h2 style={{fontFamily:A.serif,color:A.text,margin:"0 0 22px"}}>Edit Mentor</h2>
      {fields.map(key=><label key={key} style={{display:"block",fontSize:".72rem",fontWeight:600,color:A.textMuted,marginBottom:12,textTransform:"capitalize"}}>{key.replace("_"," ")}<input value={String((draft as any)[key] ?? "")} onChange={e=>setDraft({...draft,[key]:e.target.value})} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:5,padding:"10px 12px",border:`1px solid ${A.border}`,borderRadius:10,outline:"none"}}/></label>)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <label style={{fontSize:".72rem",fontWeight:600,color:A.textMuted}}>Experience<input type="number" value={draft.years_experience ?? 0} onChange={e=>setDraft({...draft,years_experience:Number(e.target.value)})} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:5,padding:10,border:`1px solid ${A.border}`,borderRadius:10}}/></label>
        <label style={{fontSize:".72rem",fontWeight:600,color:A.textMuted}}>Rating<input type="number" step="0.1" value={draft.rating ?? 0} onChange={e=>setDraft({...draft,rating:Number(e.target.value)})} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:5,padding:10,border:`1px solid ${A.border}`,borderRadius:10}}/></label>
      </div>
      {error && <div style={{color:A.red,fontSize:".75rem",marginTop:14}}>{error}</div>}
      <button onClick={save} disabled={saving} style={{marginTop:22,width:"100%",padding:11,border:0,borderRadius:10,background:A.gold,color:"white",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>{saving?<Loader2 size={15}/>:<Save size={15}/>}Save changes</button>
    </motion.div>
  </>;
}

export function AdminMentorsPage() {
  const [mentors,setMentors]=useState<DbMentor[]>([]); const [selected,setSelected]=useState<DbMentor|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const load=async()=>{setLoading(true);try{setMentors(await loadAdminMentors());setError("")}catch(e:any){setError(e.message||"Could not load mentors")}finally{setLoading(false)}};
  useEffect(()=>{void load()},[]);
  return <div style={{padding:"36px 40px 60px",maxWidth:1180,margin:"0 auto"}}>
    <div style={{marginBottom:24}}><h1 style={{fontFamily:A.serif,fontSize:"1.5rem",color:A.text,margin:"0 0 6px"}}>Mentors</h1><p style={{fontSize:".85rem",color:A.textMuted,margin:0}}>{mentors.length} mentors in Supabase.</p></div>
    {loading?<Loader2 size={20}/>:error?<div style={{color:A.red}}>{error}</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>{mentors.map(m=><div key={m.id} onClick={()=>setSelected(m)} style={{background:A.surface,border:`1px solid ${A.border}`,borderRadius:A.radius,padding:22,boxShadow:A.shadow,cursor:"pointer"}}>
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16}}><div style={{width:46,height:46,borderRadius:"50%",background:`${m.color||A.gold}18`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:m.color||A.gold}}>{m.initials||"M"}</div><div><div style={{fontWeight:700,color:A.text}}>{m.name}</div><div style={{fontSize:".76rem",color:A.textMuted}}>{m.headline||m.category||"Mentor"}</div></div></div>
      <div style={{display:"flex",gap:14,fontSize:".78rem",color:A.textMuted}}><span><Star size={12} color={A.gold}/> {m.rating ?? "—"}</span><span><Users size={12}/> {m.students_count ?? 0}</span><span><Clock size={12}/> {m.availability||"—"}</span></div>
    </div>)}</div>}
    <AnimatePresence>{selected&&<MentorDrawer mentor={selected} onClose={()=>setSelected(null)} onSaved={load}/>}</AnimatePresence>
  </div>;
}
