"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Blocks, GitBranch, Globe2, Plus, Rocket } from "lucide-react";
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
      <p className="text-xs leading-5 text-[#777]">{help}</p>
    </div>
  );

  return <div className="space-y-6">
    <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><span className="inline-flex rounded-full bg-[#d8cef2] px-4 py-2 text-sm"><Blocks className="mr-2 size-4"/>Hosting module</span><h1 className="mt-5 text-4xl font-semibold md:text-6xl">Node.js + Laravel</h1><p className="mt-4 max-w-2xl text-[#666]">Deploy a GitHub project containing a Laravel backend and Node.js frontend.</p></div>
        <Button className="rounded-full bg-black px-6" onClick={() => setOpen(true)}><Plus/>New hosting project</Button>
      </div>
    </section>
    {error && <p className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>}
    <section className="rounded-3xl bg-white p-6 shadow-sm lg:p-8"><h2 className="text-2xl font-semibold">Hosting projects</h2><div className="mt-6 space-y-3">{projects.length===0&&<p className="text-[#777]">No Node.js + Laravel projects yet.</p>}{projects.map((project)=><Link href={`/dashboard/sites/${project.id}/hosting`} key={project.id} className="grid gap-4 rounded-2xl border border-black/5 p-5 hover:bg-[#fafafa] md:grid-cols-[1.2fr_1.4fr_1fr_.7fr]"><span className="font-medium">{project.name}</span><span className="flex items-center gap-2 truncate text-sm text-[#666]"><GitBranch className="size-4"/>{project.repository_branch} · {project.repository_url.replace("https://github.com/","")}</span><span className="flex items-center gap-2 text-sm"><Globe2 className="size-4"/>{project.domain}</span><span className="w-fit rounded-full bg-[#f2f2f2] px-3 py-1 text-xs">{project.status}</span></Link>)}</div></section>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 sm:max-w-3xl">
        <DialogHeader className="rounded-t-[2rem] bg-[#d8cef2] p-7 text-left sm:p-10">
          <span className="w-fit rounded-full bg-white/75 px-4 py-2 text-sm font-medium">Node.js + Laravel Provisioning</span>
          <DialogTitle className="pt-5 text-4xl font-semibold sm:text-5xl">New hosting project</DialogTitle>
          <DialogDescription className="max-w-xl text-base leading-7 text-[#555]">Choose the repository and tell BerryPanel where each application lives. Everything else is configured automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-6 p-7 sm:grid-cols-2 sm:p-10">
            {field("name","Project name","my-project","Used for the isolated folder and automatic subdomain.")}
            {field("repository_url","Public GitHub URL","https://github.com/user/project","BerryPanel clones the main branch automatically.")}
            {field("backend_directory","Backend folder","/backend","Must contain artisan and composer.json.")}
            {field("frontend_directory","Frontend folder","/frontend","Must contain package.json.")}
            <div className="rounded-2xl bg-[#f7f7f7] p-5 sm:col-span-2"><p className="font-medium">Automatic deployment</p><p className="mt-2 text-sm leading-6 text-[#666]">BerryPanel assigns the domain, detects the Laravel public folder, installs Composer and Node dependencies, builds the frontend, configures Nginx, and starts the deployment through the queue.</p></div>
          </div>
          <DialogFooter className="border-t p-6 sm:px-10"><Button type="button" variant="outline" className="rounded-full" onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={busy} className="rounded-full bg-black px-6"><Rocket/>{busy?"Deploying...":"Create and deploy"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
