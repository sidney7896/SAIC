export const dynamic = "force-dynamic";

import { PageShell } from "@/components/ui/page-shell";
import { ensureSeedData } from "@/db/seed";
import { getSessionById } from "@/db/queries/sessions";
import { listSetsForSession } from "@/db/queries/sets";
import { listE1rmHistoryForSession } from "@/db/queries/e1rm";
import { listRecommendationsForSession } from "@/db/queries/recommendations";
import type { SessionRecommendation } from "@/engine/types";

interface SessionReviewPageProps {
  params: {
    id: string;
  };
}

export default function SessionReviewPage({
  params,
}: SessionReviewPageProps) {
  return <SessionReviewPageInner id={Number(params.id)} />;
}

async function SessionReviewPageInner({ id }: { id: number }) {
  await ensureSeedData();
  const session = await getSessionById(id);

  if (!session) {
    return (
      <PageShell
        title={`Session Review #${id}`}
        description="Requested session was not found."
      />
    );
  }

  const sets = await listSetsForSession(session.id);
  const e1rmHistory = await listE1rmHistoryForSession(session.id);
  const recommendations = await listRecommendationsForSession(session.id);
  const linkedRecommendation = recommendations[0]
    ? (JSON.parse(recommendations[0].prescriptionJson) as SessionRecommendation)
    : null;

  return (
    <PageShell
      title={`Session Review #${session.id}`}
      description="Compare the logged session, any linked recommendation, and the calculated e1RM artifacts."
    >
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-900">Logged Session</h2>
          <ul className="mt-4 space-y-2 text-sm text-stone-700">
            <li>Date: {session.date}</li>
            <li>Type: {session.dayType} {session.sessionType}</li>
            <li>Pain: {session.painBefore ?? 0}/10 before, {session.painAfter ?? 0}/10 after</li>
            <li>Sleep: {session.sleepHours ?? "n/a"} h</li>
            <li>Bodyweight: {session.bodyweightKg ?? "n/a"} kg</li>
          </ul>
          <div className="mt-5 space-y-3">
            {sets.map((set) => (
              <div key={set.id} className="rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700">
                <div className="font-medium text-stone-900">
                  {set.exercise} {set.isTopSingle ? "(top single)" : ""}
                </div>
                <div className="mt-1">
                  {set.sets} x {set.reps} @ {set.weightKg} kg
                  {set.rir !== null ? ` @ RIR ${set.rir}` : ""}
                  {set.benchStandard ? ` • ${set.benchStandard}` : ""}
                </div>
              </div>
            ))}
          </div>
          {e1rmHistory.length > 0 ? (
            <div className="mt-5 rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700">
              Latest e1RM: {e1rmHistory[0].valueKg.toFixed(1)} kg ({e1rmHistory[0].method}, {e1rmHistory[0].confidence})
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-900">Linked Recommendation</h2>
            {linkedRecommendation ? (
              <>
                <p className="mt-4 text-sm text-stone-700">
                  {linkedRecommendation.explanation.summary}
                </p>
                <ul className="mt-5 space-y-3">
                  {linkedRecommendation.exercises.map((exercise) => (
                    <li key={`${exercise.order}-${exercise.exercise}`} className="rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700">
                      {exercise.order}. {exercise.exercise}: {exercise.sets} x {exercise.reps} @ {exercise.target_weight_kg} kg
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-sm text-stone-600">No recommendation has been linked to this session.</p>
            )}
          </section>
          <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-stone-900">Recommendation Basis</h2>
            {linkedRecommendation ? (
              <ul className="mt-4 space-y-2 text-sm text-stone-700">
                {linkedRecommendation.explanation.key_inputs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-600">
                Basis is shown on the recommendation page until a session is linked.
              </p>
            )}
          </section>
        </section>
      </section>
    </PageShell>
  );
}
