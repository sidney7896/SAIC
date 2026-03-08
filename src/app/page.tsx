export const dynamic = "force-dynamic";

import Link from "next/link";
import { StatusCard } from "@/components/dashboard/status-card";
import { PageShell } from "@/components/ui/page-shell";
import { ensureSeedData } from "@/db/seed";
import { listSessions } from "@/db/queries/sessions";
import { computeAthleteState } from "@/db/queries/state";
import { buildStatusReport } from "@/lib/status-report";

export default async function DashboardPage() {
  await ensureSeedData();
  const state = await computeAthleteState();
  const sessions = await listSessions();

  if (!state) {
    return (
      <PageShell
        title="Dashboard"
        description="Athlete state is not available yet."
      />
    );
  }

  const report = buildStatusReport(state);

  return (
    <PageShell
      title="Dashboard"
      description="Current bench status computed from the seeded training history, the saved profile, and the rules layer."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard
          label="Current Phase"
          value={report.phase_progress.phase}
          detail={`Week ${report.phase_progress.week}${report.phase_progress.block ? ` • ${report.phase_progress.block}` : ""}`}
        />
        <StatusCard
          label="Gym e1RM"
          value={
            state.e1rm.gym ? `${state.e1rm.gym.value_kg.toFixed(1)} kg` : "Unavailable"
          }
          detail={
            state.e1rm.gym
              ? `${state.e1rm.gym.trend} (${state.e1rm.gym.trend_change_pct.toFixed(1)}%)`
              : "No usable gym-standard estimate yet."
          }
        />
        <StatusCard
          label="Deload"
          value={report.deload_status.recommendation}
          detail={`${report.deload_status.triggers_met}/3 triggers active`}
        />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-stone-900">Recent Sessions</h2>
            <Link
              href="/history"
              className="text-sm text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline"
            >
              Open history
            </Link>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-stone-700">
              <thead className="border-b border-stone-200 text-xs uppercase tracking-[0.2em] text-stone-500">
                <tr>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Top Single</th>
                  <th className="pb-3 pr-4">e1RM</th>
                  <th className="pb-3">Pain</th>
                </tr>
              </thead>
              <tbody>
                {report.recent_sessions.slice(0, 8).map((session) => (
                  <tr key={`${session.date}-${session.type}`} className="border-b border-stone-100">
                    <td className="py-3 pr-4">{session.date}</td>
                    <td className="py-3 pr-4">{session.type}</td>
                    <td className="py-3 pr-4">{session.top_single}</td>
                    <td className="py-3 pr-4">
                      {session.e1rm_kg > 0 ? `${session.e1rm_kg.toFixed(1)} kg` : "Unavailable"}
                    </td>
                    <td className="py-3">{session.pain}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-900">Bodyweight</h2>
            <p className="mt-4 text-sm text-stone-700">
              {report.bodyweight.current_kg} kg now, target {report.bodyweight.target_kg} kg, trend {report.bodyweight.trend}.
            </p>
            <p className="mt-2 text-sm text-stone-600">
              Strength-to-BW ratio: {report.bodyweight.strength_to_bw_ratio.toFixed(2)}
            </p>
          </section>
          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-900">Trigger Detail</h2>
            <ul className="mt-4 space-y-3 text-sm text-stone-700">
              {report.deload_status.trigger_details.map((trigger) => (
                <li key={trigger.name}>
                  <span className="font-medium text-stone-900">{trigger.name}:</span>{" "}
                  {trigger.active ? "active" : "inactive"} ({trigger.current_value} vs {trigger.threshold})
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-900">Actions</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:border-stone-600" href="/session/new">
                Get Recommendation
              </Link>
              <Link className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:border-stone-600" href="/session/log">
                Log Session
              </Link>
              <Link className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:border-stone-600" href="/profile">
                Edit Profile
              </Link>
            </div>
            <p className="mt-4 text-sm text-stone-600">{sessions.length} total sessions loaded in SQLite.</p>
          </section>
        </section>
      </section>
    </PageShell>
  );
}
