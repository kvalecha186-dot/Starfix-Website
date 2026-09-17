import { useEffect, useState } from "react";
import { Code2, Users, GraduationCap, Loader2 } from "lucide-react";
import { A } from "../adminColors";
import { loadAdminPaths } from "../../lib/adminBackend";

export function AdminPathsPage(){
 const [paths,setPaths]=useState<any[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 useEffect(()=>{loadAdminPaths().then(setPaths).catch(e=>setError(e.message||"Could not load paths")).finally(()=>setLoading(false))},[]);
 return <div style={{padding:"36px 40px 60px",maxWidth:1180,margin:"0 auto"}}><div style={{marginBottom:24}}><h1 style={{fontFamily:A.serif,fontSize:"1.5rem",color:A.text,margin:"0 0 6px"}}>Growth Paths</h1><p style={{fontSize:".85rem",color:A.textMuted,margin:0}}>{paths.length} paths in Supabase.</p></div>{loading?<Loader2 size={20}/>:error?<div style={{color:A.red}}>{error}</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>{paths.map(p=><div key={p.id} style={{background:A.surface,border:`1px solid ${A.border}`,borderRadius:A.radius,padding:22,boxShadow:A.shadow}}><div style={{width:36,height:36,borderRadius:"50%",background:A.goldLight,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><Code2 size={16} color={A.gold}/></div><div style={{fontSize:"1rem",fontWeight:700,color:A.text}}>{p.title}</div><div style={{fontSize:".76rem",color:A.textFaint,margin:"3px 0 16px"}}>{p.category}</div><p style={{fontSize:".78rem",color:A.textMuted,lineHeight:1.5,minHeight:38}}>{p.description||""}</p><div style={{display:"flex",gap:18,paddingTop:14,borderTop:`1px solid ${A.borderMuted}`}}><span style={{fontSize:".78rem",color:A.text}}><Users size={12}/> {p.learner_count||0}</span><span style={{fontSize:".78rem",color:A.text}}><GraduationCap size={12}/> {p.level||"—"}</span></div></div>)}</div>}</div>;
}
