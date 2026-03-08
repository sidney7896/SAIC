export const dynamic = "force-dynamic";

import { PageShell } from "@/components/ui/page-shell";
import { saveLoggedSessionAction } from "@/app/session/log/actions";
import { ensureSeedData } from "@/db/seed";
import { getRecommendationById } from "@/db/queries/recommendations";
import type { SessionRecommendation } from "@/engine/types";
import { isoToday } from "@/lib/dates";

interface LogSessionPageProps {
  searchParams?: {
    recommendationId?: string;
    error?: string;
  };
}

export default async function LogSessionPage({
  searchParams,
}: LogSessionPageProps) {
  await ensureSeedData();
  const recommendationRow = searchParams?.recommendationId
    ? await getRecommendationById(Number(searchParams.recommendationId))
    : null;
  const recommendation = recommendationRow
    ? (JSON.parse(recommendationRow.prescriptionJson) as SessionRecommendation)
    : null;

  return (
    <PageShell
      title="Log Session"
      description="Persist a completed bench session, calculate a fresh e1RM when possible, and optionally link it to a recommendation."
    >
      <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
        {searchParams?.error ? (
          <p className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {searchParams.error}
          </p>
        ) : null}
        <form action={saveLoggedSessionAction} className="grid gap-5">
          <input name="recommendationId" type="hidden" defaultValue={searchParams?.recommendationId ?? ""} />
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm text-stone-700">
              Date
              <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="date" type="date" defaultValue={recommendation?.date ?? isoToday()} />
            </label>
            <label className="text-sm text-stone-700">
              Session Type
              <select className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="sessionType" defaultValue={recommendation?.session_type ?? "heavy"}>
                <option value="heavy">heavy</option>
                <option value="medium">medium</option>
                <option value="light">light</option>
                <option value="test">test</option>
              </select>
            </label>
            <label className="text-sm text-stone-700">
              Day Type
              <select className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="dayType" defaultValue={recommendation?.day_type ?? "push"}>
                <option value="push">push</option>
                <option value="legs">legs</option>
                <option value="pull">pull</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm text-stone-700">
              Pain Before
              <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="painBefore" type="number" min="0" max="10" step="0.5" defaultValue="0" />
            </label>
            <label className="text-sm text-stone-700">
              Pain During
              <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="painDuring" type="number" min="0" max="10" step="0.5" />
            </label>
            <label className="text-sm text-stone-700">
              Pain After
              <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="painAfter" type="number" min="0" max="10" step="0.5" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="text-sm text-stone-700">
              Pain Location
              <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="painLocation" />
            </label>
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

          <section className="rounded-xl border border-stone-200 p-4">
            <h2 className="text-lg font-semibold text-stone-900">Top Single</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-6">
              <label className="text-sm text-stone-700">
                Exercise
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="topSingleExercise" defaultValue="flat_bench" />
              </label>
              <label className="text-sm text-stone-700">
                Weight
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="topSingleWeightKg" type="number" step="0.5" defaultValue={recommendation?.exercises[0]?.target_weight_kg ?? ""} />
              </label>
              <label className="text-sm text-stone-700">
                Reps
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="topSingleReps" type="number" step="1" defaultValue="1" />
              </label>
              <label className="text-sm text-stone-700">
                RIR
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="topSingleRir" type="number" step="0.5" />
              </label>
              <label className="text-sm text-stone-700">
                Standard
                <select className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="topSingleBenchStandard" defaultValue="gym">
                  <option value="gym">gym</option>
                  <option value="ipf">ipf</option>
                  <option value="gym_wraps">gym_wraps</option>
                </select>
              </label>
              <label className="text-sm text-stone-700">
                Failed
                <select className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="topSingleFailed" defaultValue="false">
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 p-4">
            <h2 className="text-lg font-semibold text-stone-900">Back-off Block 1</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-6">
              <label className="text-sm text-stone-700">
                Exercise
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffOneExercise" defaultValue={recommendation?.exercises[1]?.exercise ?? "flat_bench"} />
              </label>
              <label className="text-sm text-stone-700">
                Weight
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffOneWeightKg" type="number" step="0.5" defaultValue={recommendation?.exercises[1]?.target_weight_kg ?? ""} />
              </label>
              <label className="text-sm text-stone-700">
                Reps
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffOneReps" type="number" step="1" defaultValue={recommendation?.exercises[1]?.reps ?? "4"} />
              </label>
              <label className="text-sm text-stone-700">
                Sets
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffOneSets" type="number" step="1" defaultValue={recommendation?.exercises[1]?.sets ?? "4"} />
              </label>
              <label className="text-sm text-stone-700">
                RIR
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffOneRir" type="number" step="0.5" />
              </label>
              <label className="text-sm text-stone-700">
                Standard
                <select className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffOneBenchStandard" defaultValue="gym">
                  <option value="gym">gym</option>
                  <option value="ipf">ipf</option>
                  <option value="gym_wraps">gym_wraps</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 p-4">
            <h2 className="text-lg font-semibold text-stone-900">Back-off Block 2 (Optional)</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-6">
              <label className="text-sm text-stone-700">
                Exercise
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffTwoExercise" defaultValue={recommendation?.exercises[2]?.exercise ?? ""} />
              </label>
              <label className="text-sm text-stone-700">
                Weight
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffTwoWeightKg" type="number" step="0.5" defaultValue={recommendation?.exercises[2]?.target_weight_kg ?? ""} />
              </label>
              <label className="text-sm text-stone-700">
                Reps
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffTwoReps" type="number" step="1" defaultValue={recommendation?.exercises[2]?.reps ?? ""} />
              </label>
              <label className="text-sm text-stone-700">
                Sets
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffTwoSets" type="number" step="1" defaultValue={recommendation?.exercises[2]?.sets ?? ""} />
              </label>
              <label className="text-sm text-stone-700">
                RIR
                <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffTwoRir" type="number" step="0.5" />
              </label>
              <label className="text-sm text-stone-700">
                Standard
                <select className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="backoffTwoBenchStandard" defaultValue="gym">
                  <option value="gym">gym</option>
                  <option value="ipf">ipf</option>
                  <option value="gym_wraps">gym_wraps</option>
                </select>
              </label>
            </div>
          </section>

          <button className="rounded-full border border-stone-900 bg-stone-900 px-5 py-2 text-sm text-white" type="submit">
            Save Session
          </button>
        </form>
      </section>
    </PageShell>
  );
}
