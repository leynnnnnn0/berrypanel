"use client";

import { Button } from "@/components/ui/button";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Blocks, ExternalLink, GitBranch, Globe2, Plus, Rocket } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Project = { id:number; name:string; status:string; repository_url:string; repository_branch:string; domain:string };
const emptyForm = { name:"", repository_url:"", backend_directory:"/backend", frontend_directory:"/frontend" };

export default function NodeLaravelHostingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{projects:Project[]}>("/api/node-laravel-hosting")
      .then((response) => setProjects(response.projects))
      .catch((exception) => setError(exception.message));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await api<{project:Project}>("/api/node-laravel-hosting", { method:"POST", body:JSON.stringify(form) });
      setProjects((current) => [response.project, ...current]);
      setForm(emptyForm); setOpen(false);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to deploy project");
    } finally { setBusy(false); }
  }

  const field = (key:keyof typeof form, label:string, placeholder:string, help:string) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} required value={form[key]} placeholder={placeholder} onChange={(event) => setForm({...form,[key]:event.target.value})} className="h-14 rounded-2xl px-4 text-base" />
      <p className="text-xs leading-5 text-[#567C8D]">{help}</p>
    </div>
  );

  return <DashboardPage>
    <DashboardHero eyebrow="Full-stack hosting · Deployment workspace" title="Node.js + Laravel" description="Deploy a GitHub project containing a Laravel backend and Node.js frontend with one managed workflow." icon={Blocks} contextValue="Full-stack deployments" action={<Button className="h-12 rounded-full bg-white px-6 font-semibold text-[#2F4156] hover:bg-white/90" onClick={() => setOpen(true)}><Plus/>New hosting project</Button>} />
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard label="Projects" value={String(projects.length)} detail="hosting workspaces" icon={Blocks} tone="lavender" />
      <MetricCard label="Repositories" value={String(projects.filter(project=>project.repository_url).length)} detail="connected sources" icon={GitBranch} tone="sky" />
      <MetricCard label="Domains" value={String(projects.filter(project=>project.domain).length)} detail="assigned addresses" icon={Globe2} tone="mist" />
    </section>
    {error && <p className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>}
    <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
      <div>
        <p className="text-xs font-medium uppercase text-[#567C8D]">Inventory</p>
        <h2 className="mt-1 text-2xl font-semibold">Node.js + Laravel projects</h2>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-[#2F4156]/5">
        <div className="hidden grid-cols-[1.1fr_1.35fr_1fr_.65fr] bg-[#F5EFEB] px-5 py-3 text-xs font-medium uppercase text-[#567C8D] lg:grid">
          <span>Project</span><span>Repository</span><span>Domain</span><span>Status</span>
        </div>
        {projects.length===0&&<p className="border-t border-[#2F4156]/5 px-5 py-8 text-sm text-[#567C8D]">No Node.js + Laravel projects yet.</p>}
        {projects.map((project)=><div key={project.id} className="flex flex-col gap-4 border-t border-[#2F4156]/5 px-5 py-5 text-sm lg:grid lg:grid-cols-[1.1fr_1.35fr_1fr_.65fr] lg:items-center">
          <Link href={`/dashboard/node-laravel-hosting/${project.id}`} className="flex items-center gap-3 font-medium hover:underline"><span className="grid size-11 place-items-center rounded-xl bg-[#C8D9E6]"><Blocks className="size-5"/></span>{project.name}</Link>
          <a href={project.repository_url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 text-[#567C8D] hover:text-[#2F4156]"><GitBranch className="size-4 shrink-0"/><span className="truncate">{project.repository_branch} · {project.repository_url.replace("https://github.com/","")}</span><ExternalLink className="size-3 shrink-0"/></a>
          <a href={/^https?:\/\//i.test(project.domain)?project.domain:`http://${project.domain}`} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 text-[#567C8D] hover:text-[#2F4156] hover:underline"><Globe2 className="size-4 shrink-0"/><span className="truncate">{project.domain}</span><ExternalLink className="size-3 shrink-0"/></a>
          <span className="w-fit rounded-full bg-[#F5EFEB] px-3 py-1 text-xs">{project.status}</span>
        </div>)}
      </div>
    </section>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 sm:max-w-3xl">
        <DialogHeader className="rounded-t-[2rem] bg-[#C8D9E6] p-7 text-left sm:p-10">
          <span className="w-fit rounded-full bg-white/75 px-4 py-2 text-sm font-medium">Node.js + Laravel Provisioning</span>
          <DialogTitle className="pt-5 text-4xl font-semibold sm:text-5xl">New hosting project</DialogTitle>
          <DialogDescription className="max-w-xl text-base leading-7 text-[#567C8D]">Choose the repository and tell BerryPanel where each application lives. Everything else is configured automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-6 p-7 sm:grid-cols-2 sm:p-10">
            {field("name","Project name","my-project","Used for the isolated folder and automatic subdomain.")}
            {field("repository_url","Public GitHub URL","https://github.com/user/project","BerryPanel clones the main branch automatically.")}
            {field("backend_directory","Backend folder","/backend","Must contain artisan and composer.json.")}
            {field("frontend_directory","Frontend folder","/frontend","Must contain package.json.")}
            <div className="rounded-2xl bg-[#F1F1F1] p-5 sm:col-span-2"><p className="font-medium">Automatic deployment</p><p className="mt-2 text-sm leading-6 text-[#567C8D]">BerryPanel assigns the domain, detects the Laravel public folder, installs Composer and Node dependencies, builds the frontend, configures Nginx, and starts the deployment through the queue.</p></div>
          </div>
          <DialogFooter className="border-t p-6 sm:px-10"><Button type="button" variant="outline" className="rounded-full" onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={busy} className="rounded-full bg-[#2F4156] px-6"><Rocket/>{busy?"Deploying...":"Create and deploy"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </DashboardPage>;
}
