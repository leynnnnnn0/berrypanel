"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { CalendarClock, Loader2, Plus, Radio, RefreshCw } from "lucide-react";
import { FormEvent, useState } from "react";

type Service = { id:number; type:string; name:string; status:string; enabled:boolean };

const options = [
  { type:"queue", title:"Background jobs", description:"Process emails, notifications, imports, and other tasks in the background.", icon:RefreshCw },
  { type:"reverb", title:"Realtime updates", description:"Enable live notifications and other realtime features in your application.", icon:Radio },
  { type:"scheduler", title:"Scheduled tasks", description:"Run the tasks your application schedules automatically.", icon:CalendarClock },
];

export function CustomerServiceControls({ siteId, services, onChanged, allowAdditionalNodeService = false }:{ siteId:string; services:Service[]; onChanged:(service:Service)=>void; allowAdditionalNodeService?:boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [node, setNode] = useState({ name:"", working_directory:"/worker", start_command:"npm run start", install_command:"npm ci", build_command:"", internal_port:"" });

  async function toggle(type:string) {
    setBusy(type); setError("");
    const current=services.find((service)=>service.type===type);
    try {
      const response = current
        ? await api<{service:Service}>(`/api/sites/${siteId}/services/${current.id}/actions`, { method:"POST", body:JSON.stringify({ action:current.enabled?"disable":"enable" }) })
        : await api<{service:Service}>(`/api/sites/${siteId}/services/templates/${type}`, { method:"POST", body:"{}" });
      onChanged(response.service);
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Unable to update this service."); }
    finally { setBusy(null); }
  }

  async function addNodeService(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("additional-node"); setError("");
    try {
      const response=await api<{service:Service}>(`/api/sites/${siteId}/additional-node-services`, { method:"POST", body:JSON.stringify({ ...node, build_command:node.build_command||null, internal_port:node.internal_port?Number(node.internal_port):null, enabled:true }) });
      onChanged(response.service); setNode({ name:"", working_directory:"/worker", start_command:"npm run start", install_command:"npm ci", build_command:"", internal_port:"" });
    } catch (exception) { setError(exception instanceof Error ? exception.message : "Unable to save Node.js service."); }
    finally { setBusy(null); }
  }

  return <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8"><div><p className="text-xs font-medium uppercase text-[#567C8D]">Application services</p><h2 className="mt-1 text-2xl font-semibold">Keep your application running</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#567C8D]">Enable the features your application uses. BerryPanel keeps enabled services running automatically.</p></div>{error&&<p className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-6 grid gap-4 lg:grid-cols-3">{options.map((option)=>{const service=services.find((item)=>item.type===option.type);const Icon=option.icon;const enabled=Boolean(service?.enabled);return <div key={option.type} className="rounded-2xl border border-[#2F4156]/5 bg-[#F1F1F1] p-5"><Icon className="size-6"/><h3 className="mt-5 font-semibold">{option.title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-[#567C8D]">{option.description}</p><div className="mt-5 flex items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-xs ${enabled?"bg-[#dff8c8] text-[#2c4a1f]":"bg-white text-[#567C8D]"}`}>{enabled?"Enabled":"Disabled"}</span><Button size="sm" disabled={busy===option.type} onClick={()=>void toggle(option.type)} className="rounded-full">{busy===option.type?<Loader2 className="animate-spin"/>:enabled?"Disable":"Enable"}</Button></div></div>})}</div>
    {allowAdditionalNodeService && <form onSubmit={addNodeService} className="mt-8 rounded-2xl border border-[#2F4156]/5 bg-[#F1F1F1] p-5"><div className="flex items-center gap-2"><Plus className="size-5"/><h3 className="font-semibold">Additional Node.js service</h3></div><p className="mt-2 text-sm text-[#567C8D]">Use this for another folder in the same repository, such as <code>/worker</code>, <code>/socket</code>, or <code>/ar</code>. It is installed and started on the next deployment.</p><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Service name" value={node.name} onChange={(value)=>setNode({...node,name:value})} placeholder="AR service" required/><Field label="Folder" value={node.working_directory} onChange={(value)=>setNode({...node,working_directory:value})} placeholder="/ar" required/><Field label="Start command" value={node.start_command} onChange={(value)=>setNode({...node,start_command:value})} placeholder="npm run start" required/><Field label="Install command" value={node.install_command} onChange={(value)=>setNode({...node,install_command:value})} placeholder="npm ci" required/><Field label="Build command (optional)" value={node.build_command} onChange={(value)=>setNode({...node,build_command:value})} placeholder="npm run build"/><Field label="Internal port (optional)" value={node.internal_port} onChange={(value)=>setNode({...node,internal_port:value})} placeholder="3001" inputMode="numeric"/></div><Button type="submit" className="mt-5" disabled={busy==="additional-node"}>{busy==="additional-node"?<Loader2 className="animate-spin"/>:<Plus/>}Add service</Button></form>}
  </section>;
}

function Field({label,value,onChange,placeholder,required,inputMode}:{label:string;value:string;onChange:(value:string)=>void;placeholder:string;required?:boolean;inputMode?:"numeric"}) { return <div><Label>{label}</Label><Input className="mt-2" value={value} onChange={(event)=>onChange(event.target.value)} placeholder={placeholder} required={required} inputMode={inputMode}/></div>; }
