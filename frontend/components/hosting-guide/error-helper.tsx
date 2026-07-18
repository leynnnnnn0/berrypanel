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
          <h3 className="text-2xl font-semibold text-[#2F4156]">
            Paste the error exactly as shown
          </h3>
          <p className="text-sm leading-6 text-[#567C8D]">
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
          className="min-h-[260px] w-full resize-y rounded-[20px] border border-[#C8D9E6] bg-[#F1F1F1] p-4 text-sm leading-6 text-[#2F4156] outline-none transition focus:border-[#567C8D] focus:bg-white"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="h-12 rounded-full bg-[#2F4156] px-6 text-white hover:bg-[#2F4156]"
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
          <InfoCard className="flex min-h-[220px] flex-col justify-center gap-3 bg-[#F1F1F1]">
            <CheckCircle2 className="h-8 w-8 text-[#2F4156]" />
            <h3 className="text-xl font-semibold text-[#2F4156]">
              Your result will appear here
            </h3>
            <p className="text-sm leading-6 text-[#567C8D]">
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
                <h3 className="text-xl font-semibold text-[#2F4156]">
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
                  <h3 className="text-xl font-semibold text-[#2F4156]">
                    {match.title}
                  </h3>
                  <p className="text-sm leading-6 text-[#567C8D]">
                    {match.cause}
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#C8D9E6] px-3 py-1.5 text-xs font-medium text-[#567C8D]">
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
                  <p className="text-sm font-medium text-[#2F4156]">
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
