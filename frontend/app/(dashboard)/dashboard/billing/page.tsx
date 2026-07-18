"use client";

import { Button } from "@/components/ui/button";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { api } from "@/lib/api";
import {
  CalendarClock,
  Check,
  CircleAlert,
  CreditCard,
  Loader2,
  QrCode,
  ReceiptText,
} from "lucide-react";
import { useEffect, useState } from "react";

type Plan = {
  slug: string;
  name: string;
  description: string;
  price_centavos: number;
  billing_months: number;
  storage_bytes: number;
  laravel_site_limit: number;
  hybrid_site_limit: number;
  background_services: boolean;
  features: string[];
};

type Subscription = {
  status: "active" | "expired";
  plan: Plan;
  current_period_start: string;
  current_period_end: string;
  days_remaining: number | null;
  renewal_due: boolean;
};

type Payment = {
  id: number;
  reference_number: string;
  plan_name: string;
  amount_centavos: number;
  currency: string;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
};

type BillingOverview = {
  plans: Plan[];
  subscription: Subscription | null;
  payments: Payment[];
};

const money = (centavos: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(centavos / 100);

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "—";

export default function BillingPage() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      setError("");
      setOverview(await api<BillingOverview>("/api/billing"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load billing details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("payment");
    if (result === "success") {
      setNotice("Payment submitted. Your plan updates as soon as PayMongo confirms the QR payment.");
    } else if (result === "cancelled") {
      setNotice("Payment was cancelled. Your current plan was not changed.");
    }
    void load();
  }, []);

  const checkout = async (plan: Plan) => {
    setPaying(plan.slug);
    setError("");
    try {
      const response = await api<{ payment: { checkout_url: string } }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: plan.slug }),
      });
      window.location.assign(response.payment.checkout_url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start the QR payment.");
      setPaying(null);
    }
  };

  const subscription = overview?.subscription;

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="Plans · Payments"
        title="Billing"
        description="Choose your hosting plan and renew it securely with QR Ph. Your payment history and next due date stay together here."
        icon={CreditCard}
        contextLabel="Current plan"
        contextValue={loading ? "Loading…" : subscription?.plan.name ?? "No active plan"}
      />

      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-800">{notice}</p>}

      {!loading && subscription?.renewal_due && (
        <section className="flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-950">
                {subscription.status === "expired" ? "Your plan is due for renewal" : "Your next payment is coming up"}
              </p>
              <p className="mt-1 text-sm text-amber-800">
                {subscription.status === "expired"
                  ? "Choose your plan below to restore the next month of service."
                  : `Your plan is paid through ${date(subscription.current_period_end)}.`}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-amber-900">
            {subscription.status === "expired" ? "Payment due" : `${subscription.days_remaining} days remaining`}
          </span>
        </section>
      )}

      {!loading && subscription && !subscription.renewal_due && (
        <section className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-3">
          <Summary label="Plan" value={subscription.plan.name} icon={CreditCard} />
          <Summary label="Paid through" value={date(subscription.current_period_end)} icon={CalendarClock} />
          <Summary label="Time remaining" value={`${subscription.days_remaining} days`} icon={Check} />
        </section>
      )}

      <section>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Hosting plans</h2>
          <p className="mt-1 text-sm text-[#567C8D]">Each QR Ph payment covers one month. You can pay early to add another month.</p>
        </div>
        {loading ? (
          <div className="mt-5 grid min-h-52 place-items-center rounded-3xl bg-white"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {overview?.plans.map((plan) => {
              const current = subscription?.plan.slug === plan.slug && subscription.status === "active";
              return (
                <article key={plan.slug} className={`flex flex-col rounded-3xl border p-6 shadow-sm ${current ? "border-[#567C8D] bg-[#F5FAFC]" : "border-[#C8D9E6] bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="text-xl font-semibold">{plan.name}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-[#567C8D]">{plan.description}</p></div>
                    {current && <span className="rounded-full bg-[#2F4156] px-3 py-1 text-xs font-semibold text-white">Current</span>}
                  </div>
                  <p className="mt-6 text-4xl font-semibold tracking-tight">{money(plan.price_centavos)}<span className="ml-1 text-sm font-normal text-[#567C8D]">/month</span></p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">{plan.features.map(feature => <li key={feature} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />{feature}</li>)}</ul>
                  <Button className="mt-7 h-11 bg-[#2F4156]" disabled={paying !== null} onClick={() => void checkout(plan)}>
                    {paying === plan.slug ? <Loader2 className="animate-spin" /> : <QrCode />}
                    {current ? "Pay next month" : `Choose ${plan.name}`}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Payment history</h2><p className="mt-1 text-sm text-[#567C8D]">Confirmed QR Ph payments and recent attempts.</p></div><ReceiptText className="size-5 text-[#567C8D]" /></div>
        {!overview?.payments.length ? <p className="py-12 text-center text-sm text-[#567C8D]">No payments recorded yet.</p> : (
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-[#567C8D]"><tr><th className="py-3">Date</th><th>Plan</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead><tbody>{overview.payments.map(payment => <tr key={payment.id} className="border-b border-[#E8EEF2] last:border-0"><td className="py-4">{date(payment.paid_at ?? payment.created_at)}</td><td>{payment.plan_name}</td><td className="font-mono text-xs">{payment.reference_number}</td><td>{money(payment.amount_centavos)}</td><td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payment.status === "paid" ? "bg-emerald-100 text-emerald-800" : payment.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{payment.status === "paid" ? "Paid" : payment.status === "pending" ? "Awaiting payment" : "Not completed"}</span></td></tr>)}</tbody></table></div>
        )}
      </section>
    </DashboardPage>
  );
}

function Summary({ label, value, icon: Icon }: { label: string; value: string; icon: typeof CreditCard }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-[#F1F1F1] p-4"><span className="grid size-10 place-items-center rounded-xl bg-white"><Icon className="size-4" /></span><span><span className="block text-xs uppercase tracking-wide text-[#567C8D]">{label}</span><span className="mt-1 block font-semibold">{value}</span></span></div>;
}
