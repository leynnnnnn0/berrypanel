"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Server, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandBlock, DotList, InfoCard } from "@/components/hosting-guide/guide-section";
import { errorPlaybooks } from "@/components/hosting-guide/guide-data";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function ErrorHelper() {
  const [input, setInput] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const matches = useMemo(() => {
    const text = normalize(input);

    if (!text) {
      return [];
    }

    return errorPlaybooks.filter((playbook) =>
      playbook.symptoms.some((symptom) => text.includes(normalize(symptom)))
    );
  }, [input]);

  const fallback = hasAnalyzed && input.trim() && matches.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <InfoCard className="space-y-5">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-neutral-950">
            Paste the error exactly as shown
          </h3>
          <p className="text-sm leading-6 text-neutral-600">
            Paste a browser, deployment, or application error message here.
            BerryPanel will suggest the next step.
          </p>
        </div>

        <textarea
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setHasAnalyzed(false);
          }}
          placeholder="Example: Frontend build failed. Command output: sh: 1: vite: not found"
          className="min-h-[260px] w-full resize-y rounded-[20px] border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-400 focus:bg-white"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="h-12 rounded-full bg-black px-6 text-white hover:bg-neutral-800"
            onClick={() => setHasAnalyzed(true)}
          >
            Analyze error
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-full px-6"
            onClick={() => {
              setInput("");
              setHasAnalyzed(false);
            }}
          >
            Clear
          </Button>
        </div>
      </InfoCard>

      <div className="space-y-4">
        {!hasAnalyzed && (
          <InfoCard className="flex min-h-[220px] flex-col justify-center gap-3 bg-neutral-50">
            <CheckCircle2 className="h-8 w-8 text-neutral-900" />
            <h3 className="text-xl font-semibold text-neutral-950">
              Your result will appear here
            </h3>
            <p className="text-sm leading-6 text-neutral-600">
              Use this before guessing. Most hosting issues fall into a few
              categories: missing app key, wrong database credentials, missing
              application dependencies, configuration, storage, or domain setup.
            </p>
          </InfoCard>
        )}

        {fallback && (
          <InfoCard className="space-y-4 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 text-amber-700" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-neutral-950">
                  No exact match yet
                </h3>
                <p className="text-sm leading-6 text-amber-900">
                  Start with the Laravel log, then verify APP_KEY, database
                  credentials, migrations, and storage permissions.
                </p>
              </div>
            </div>
            <CommandBlock command="tail -n 80 storage/logs/laravel.log" />
          </InfoCard>
        )}

        {hasAnalyzed &&
          matches.map((match) => (
            <InfoCard key={match.id} className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-neutral-950">
                    {match.title}
                  </h3>
                  <p className="text-sm leading-6 text-neutral-600">
                    {match.cause}
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700">
                  {match.owner === "customer" ? (
                    <UserRound className="h-3.5 w-3.5" />
                  ) : (
                    <Server className="h-3.5 w-3.5" />
                  )}
                  {match.owner === "customer" ? "What you can do" : "Contact support"}
                </span>
              </div>

              <DotList items={match.fixes} />

              {match.commands && match.commands.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-neutral-900">
                    Commands to type in the site terminal
                  </p>
                  {match.commands.map((command) => (
                    <CommandBlock key={command} command={command} />
                  ))}
                </div>
              )}
            </InfoCard>
          ))}
      </div>
    </div>
  );
}
