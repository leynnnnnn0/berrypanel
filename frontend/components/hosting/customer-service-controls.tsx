"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { CalendarClock, Loader2, Radio, RefreshCw } from "lucide-react";
import { useState } from "react";

type Service = { id:number; type:string; name:string; status:string; enabled:boolean };

const options = [
  { type:"queue", title:"Background jobs", description:"Process emails, notifications, imports, and other tasks in the background.", icon:RefreshCw },
  { type:"reverb", title:"Realtime updates", description:"Enable live notifications and other realtime features in your application.", icon:Radio },
  { type:"scheduler", title:"Scheduled tasks", description:"Run the tasks your application schedules automatically.", icon:CalendarClock },
];

export function CustomerServiceControls({ siteId, services, onChanged }:{ siteId:string; services:Service[]; onChanged:(service:Service)=>void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
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
  return <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8"><div><p className="text-xs font-medium uppercase text-[#888]">Application services</p><h2 className="mt-1 text-2xl font-semibold">Keep your application running</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#666]">Enable the features your application uses. BerryPanel keeps enabled services running automatically.</p></div>{error&&<p className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-6 grid gap-4 lg:grid-cols-3">{options.map((option)=>{const service=services.find((item)=>item.type===option.type);const Icon=option.icon;const enabled=Boolean(service?.enabled);return <div key={option.type} className="rounded-2xl border border-black/5 bg-[#f7f7f7] p-5"><Icon className="size-6"/><h3 className="mt-5 font-semibold">{option.title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-[#666]">{option.description}</p><div className="mt-5 flex items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-xs ${enabled?"bg-[#dff8c8] text-[#2c4a1f]":"bg-white text-[#666]"}`}>{enabled?"Enabled":"Disabled"}</span><Button size="sm" disabled={busy===option.type} onClick={()=>void toggle(option.type)} className="rounded-full">{busy===option.type?<Loader2 className="animate-spin"/>:enabled?"Disable":"Enable"}</Button></div></div>})}</div></section>;
}
