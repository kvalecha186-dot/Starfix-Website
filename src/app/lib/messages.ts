import { supabase } from "./supabase";

export const MESSAGES_CHANGED_EVENT = "starfix:messages-changed";
const STORAGE_KEY = "starfix:conversations";
let realtimeStarted = false;

export interface ChatMessage { id:string; sender:"user"|"mentor"; text:string; sentAt:string; status?:"sent"|"delivered"|"seen"; }
export interface Conversation { mentorId:number; archived:boolean; createdAt:string; messages:ChatMessage[]; unreadCount:number; }
function readAll():Record<number,Conversation>{if(typeof window==="undefined")return{};try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");}catch{return{};}}
function writeAll(data:Record<number,Conversation>){if(typeof window==="undefined")return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT));}catch{}}
function uid(){return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;}
export function getConversations(){return Object.values(readAll()).filter(c=>!c.archived).sort((a,b)=>new Date(b.messages.at(-1)?.sentAt||b.createdAt).getTime()-new Date(a.messages.at(-1)?.sentAt||a.createdAt).getTime());}
export function getConversation(mentorId:number){return readAll()[mentorId]??null;}
export function totalUnreadCount(){return getConversations().reduce((n,c)=>n+c.unreadCount,0);}
async function currentUserId(){const{data}=await supabase.auth.getUser();return data.user?.id??null;}
async function mentorUuid(mentorId:number){const{data}=await supabase.from("mentors").select("id").eq("legacy_id",mentorId).maybeSingle();return data?.id??null;}
async function persistConversation(mentorId:number,c:Conversation){const studentId=await currentUserId();const mid=await mentorUuid(mentorId);if(!studentId||!mid)return;const{data:existing}=await supabase.from("conversations").select("id").eq("student_id",studentId).eq("mentor_id",mid).maybeSingle();let cid=existing?.id;if(!cid){const{data}=await supabase.from("conversations").insert({student_id:studentId,mentor_id:mid,archived:c.archived,external_id:String(mentorId)}).select("id").single();cid=data?.id;}if(!cid)return;for(const m of c.messages)await supabase.from("messages").upsert({conversation_id:cid,sender:m.sender,body:m.text,status:m.status||"sent",created_at:m.sentAt,external_id:m.id},{onConflict:"conversation_id,external_id"});}
export async function hydrateMessages(userId?:string){const uidUser=userId||await currentUserId();if(!uidUser)return;const{data:cs}=await supabase.from("conversations").select("id,mentor_id,archived,created_at,external_id").eq("student_id",uidUser).order("created_at",{ascending:false});if(!cs?.length)return;const mids=[...new Set(cs.map((c:any)=>c.mentor_id))];const{data:ms}=await supabase.from("mentors").select("id,legacy_id").in("id",mids);const legacy=new Map((ms||[]).map((m:any)=>[m.id,Number(m.legacy_id)]));const cids=cs.map((c:any)=>c.id);const{data:msgs}=await supabase.from("messages").select("id,conversation_id,sender,body,status,created_at,external_id").in("conversation_id",cids).order("created_at",{ascending:true});const all:Record<number,Conversation>={};for(const c of cs as any[]){const mid=legacy.get(c.mentor_id);if(!mid)continue;all[mid]={mentorId:mid,archived:!!c.archived,createdAt:c.created_at,unreadCount:0,messages:(msgs||[]).filter((m:any)=>m.conversation_id===c.id).map((m:any)=>({id:m.external_id||m.id,sender:m.sender,text:m.body,sentAt:m.created_at,status:m.status}))};}const local=readAll();for(const[id,c]of Object.entries(local))if(!all[Number(id)])all[Number(id)]=c;writeAll(all);}
export function startMessageRealtime(userId:string){if(realtimeStarted)return;realtimeStarted=true;supabase.channel(`starfix-messages-${userId}`).on("postgres_changes",{event:"*",schema:"public",table:"messages"},()=>{void hydrateMessages(userId);}).subscribe();}
export function ensureConversation(mentorId:number,_mentorName:string){const all=readAll();let c=all[mentorId];if(c){if(c.archived){c.archived=false;writeAll(all);void persistConversation(mentorId,c);}return c;}c={mentorId,archived:false,createdAt:new Date().toISOString(),unreadCount:0,messages:[]};all[mentorId]=c;writeAll(all);void persistConversation(mentorId,c);return c;}
export function sendMessage(mentorId:number,text:string){const all=readAll();const c=all[mentorId];if(!c||!text.trim())return c??null;const m:ChatMessage={id:uid(),sender:"user",text:text.trim(),sentAt:new Date().toISOString(),status:"sent"};c.messages.push(m);writeAll(all);void persistConversation(mentorId,c);return c;}
export function markDelivered(mentorId:number,messageId:string){const all=readAll();const c=all[mentorId];if(!c)return;const m=c.messages.find(x=>x.id===messageId);if(!m||m.sender!=="user")return;m.status="delivered";writeAll(all);void persistConversation(mentorId,c);}
export function markRead(mentorId:number){const all=readAll();const c=all[mentorId];if(!c)return;c.unreadCount=0;writeAll(all);}
export function archiveConversation(mentorId:number){const all=readAll();const c=all[mentorId];if(!c)return;c.archived=true;writeAll(all);void persistConversation(mentorId,c);}
export const QUICK_CHIPS=[
{label:"Review my progress",text:"Could you review my current progress and let me know if I'm on the right track?"},
{label:"Explain this topic",text:"Could you explain this topic in a bit more detail? I want to make sure I really understand it."},
{label:"Check my project",text:"Could you take a look at my project and share some feedback?"},
{label:"Build a study plan",text:"Could you help me build a study plan for the next few weeks?"},
{label:"Give me next steps",text:"What should my next steps be to keep making progress on my path?"},
{label:"Prepare for interview",text:"Can you help me prepare for an upcoming interview?"},
];
