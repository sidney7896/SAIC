export const dynamic = "force-dynamic";

import { PageShell } from "@/components/ui/page-shell";
import { ensureSeedData } from "@/db/seed";
import { listSessions } from "@/db/queries/sessions";
import { listE1rmHistory } from "@/db/queries/e1rm";
import Link from "next/link";

export default async function HistoryPage() {
  await ensureSeedData();
  const sessions = await listSessions();
  const e1rmHistory = await listE1rmHistory();

  return (
    <PageShell
      title="Training History"
      description="Session log and e1RM history pulled directly from SQLite."
    >
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-900">Sessions</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-stone-700">
              <thead className="border-b border-stone-200 text-xs uppercase tracking-[0.2em] text-stone-500">
                <tr>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Pain</th>
                  <th className="pb-3">Review</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 30).map((session) => (
                  <tr key={session.id} className="border-b border-stone-100">
                    <td className="py-3 pr-4">{session.date}</td>
                    <td className="py-3 pr-4">{session.dayType} {session.sessionType}</td>
                    <td className="py-3 pr-4">{session.painBefore ?? 0}/10</td>
                    <td className="py-3">
                      <Link className="underline-offset-4 hover:underline" href={`/session/${session.id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-900">e1RM History</h2>
          <ul className="mt-4 space-y-3 text-sm text-stone-700">
            {e1rmHistory.slice(0, 20).map((entry) => (
              <li key={entry.id} className="rounded-xl border border-stone-200 px-4 py-3">
                <span className="font-medium text-stone-900">{entry.date}</span>:{" "}
                {entry.valueKg.toFixed(1)} kg ({entry.benchStandard}, {entry.method}, {entry.confidence})
              </li>
            ))}
          </ul>
        </section>
      </section>
    </PageShell>
  );
}
