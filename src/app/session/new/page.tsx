export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { createRecommendationAction } from "@/app/session/new/actions";
import { getRecommendationById } from "@/db/queries/recommendations";
import { computeAthleteState } from "@/db/queries/state";
import { ensureSeedData } from "@/db/seed";
import type { SessionRecommendation } from "@/engine/types";
import { isoToday } from "@/lib/dates";

interface NewSessionPageProps {
  searchParams?: {
    recommendationId?: string;
    error?: string;
  };
}

export default async function NewSessionPage({
  searchParams,
}: NewSessionPageProps) {
  await ensureSeedData();
  const state = await computeAthleteState();
  const recommendationRow = searchParams?.recommendationId
    ? await getRecommendationById(Number(searchParams.recommendationId))
    : null;
  const recommendation = recommendationRow
    ? (JSON.parse(recommendationRow.prescriptionJson) as SessionRecommendation)
    : null;

  return (
    <PageShell
      title="Today's Recommendation"
      description="Request a bench prescription from the seeded state and current readiness inputs."
    >
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          {searchParams?.error ? (
            <p className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {searchParams.error}
            </p>
          ) : null}
          <h2 className="text-2xl font-semibold text-stone-900">Readiness Input</h2>
          <form action={createRecommendationAction} className="mt-5 grid gap-4">
            <label className="text-sm text-stone-700">
              Date
              <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="date" type="date" defaultValue={isoToday()} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-stone-700">
                Session Type
                <select className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="sessionType" defaultValue="heavy">
                  <option value="heavy">heavy</option>
                  <option value="medium">medium</option>
                  <option value="light">light</option>
                  <option value="test">test</option>
                </select>
              </label>
              <label className="text-sm text-stone-700">
                Day Type
                <select className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="dayType" defaultValue="push">
                  <option value="push">push</option>
                  <option value="legs">legs</option>
                  <option value="pull">pull</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-stone-700">
                Pain Score
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="painScore" type="number" min="0" max="10" step="0.5" defaultValue="0" />
              </label>
              <label className="text-sm text-stone-700">
                Pain Location
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="painLocation" placeholder="optional" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm text-stone-700">
                Sleep Hours
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="sleepHours" type="number" step="0.1" />
              </label>
              <label className="text-sm text-stone-700">
                Bodyweight (kg)
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="bodyweightKg" type="number" step="0.1" />
              </label>
              <label className="text-sm text-stone-700">
                Readiness (1-5)
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="subjectiveReadiness" type="number" min="1" max="5" step="1" />
              </label>
            </div>
            <label className="text-sm text-stone-700">
              Notes
              <textarea className="mt-2 min-h-24 w-full rounded-xl border border-stone-300 px-3 py-2" name="notes" />
            </label>
            <button className="rounded-full border border-stone-900 bg-stone-900 px-5 py-2 text-sm text-white" type="submit">
              Generate Recommendation
            </button>
          </form>
        </section>

        <section className="space-y-6">
          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-900">Current Basis</h2>
            {state ? (
              <ul className="mt-4 space-y-3 text-sm text-stone-700">
                <li>Phase: {state.current_phase}</li>
                <li>Gym e1RM: {state.e1rm.gym ? `${state.e1rm.gym.value_kg.toFixed(1)} kg` : "Unavailable"}</li>
                <li>Last heavy push: {state.last_heavy_push ? `${state.last_heavy_push.date} • ${state.last_heavy_push.top_single_kg ?? "n/a"} kg @ ${state.last_heavy_push.top_single_rir ?? "n/a"} RIR` : "Unavailable"}</li>
                <li>Deload triggers: {state.deload_triggers.triggers_met}/3</li>
                <li>Bodyweight: {state.bodyweight_kg} kg ({state.bodyweight_trend})</li>
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-600">State unavailable.</p>
            )}
          </section>

          {recommendation ? (
            <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-stone-900">Recommendation</h2>
                <Link
                  href={`/session/log?recommendationId=${searchParams?.recommendationId}`}
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:border-stone-600"
                >
                  Log This Session
                </Link>
              </div>
              <p className="mt-4 text-sm text-stone-700">{recommendation.explanation.summary}</p>
              <ul className="mt-5 space-y-4">
                {recommendation.exercises.map((exercise) => (
                  <li key={`${exercise.order}-${exercise.exercise}`} className="rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700">
                    <div className="font-medium text-stone-900">
                      {exercise.order}. {exercise.exercise}
                      {exercise.variation ? ` (${exercise.variation})` : ""}
                    </div>
                    <div className="mt-1">
                      {exercise.sets} x {exercise.reps} @ {exercise.target_weight_kg} kg, target RIR {exercise.target_rir_range[0]}–{exercise.target_rir_range[1]}
                    </div>
                    <div className="mt-1 text-stone-600">{exercise.purpose}</div>
                  </li>
                ))}
              </ul>
              {recommendation.alerts.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {recommendation.alerts.map((alert) => (
                    <div key={`${alert.type}-${alert.message}`} className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <span className="font-medium">{alert.type}:</span> {alert.message}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-5 text-sm text-stone-600">
                <p>Rule applied: {recommendation.explanation.rule_applied}</p>
                <p className="mt-2">Tradeoff: {recommendation.explanation.tradeoff}</p>
              </div>
            </section>
          ) : null}
        </section>
      </section>
    </PageShell>
  );
}
