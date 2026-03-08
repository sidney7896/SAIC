"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession } from "@/db/queries/sessions";
import { createSets } from "@/db/queries/sets";
import { insertE1rmHistory } from "@/db/queries/e1rm";
import { linkRecommendationToSession } from "@/db/queries/recommendations";
import { calculateE1rm } from "@/engine/e1rm";
import type { NewSetRow } from "@/db/schema";
import { readOptionalNumber, readRequiredNumber, readString } from "@/lib/forms";

function buildSetRow(
  formData: FormData,
  prefix: string,
  sessionId: number,
  options?: { isTopSingle?: boolean },
): NewSetRow | null {
  const exercise = readString(formData, `${prefix}Exercise`);
  const weightKg = readOptionalNumber(formData, `${prefix}WeightKg`);
  const reps = readOptionalNumber(formData, `${prefix}Reps`);

  if (!exercise || weightKg === undefined || reps === undefined) {
    return null;
  }

  return {
    sessionId,
    exercise,
    weightKg,
    reps,
    sets: readOptionalNumber(formData, `${prefix}Sets`) ?? 1,
    rir: readOptionalNumber(formData, `${prefix}Rir`),
    benchStandard: readString(formData, `${prefix}BenchStandard`) || "gym",
    isTopSingle: options?.isTopSingle ? 1 : 0,
    isWarmup: 0,
    failed: readString(formData, `${prefix}Failed`) === "true" ? 1 : 0,
    notes: readString(formData, `${prefix}Notes`) || undefined,
  };
}

export async function saveLoggedSessionAction(formData: FormData) {
  const session = await createSession({
    date: readString(formData, "date"),
    sessionType: readString(formData, "sessionType"),
    dayType: readString(formData, "dayType"),
    painBefore: readRequiredNumber(formData, "painBefore"),
    painDuring: readOptionalNumber(formData, "painDuring"),
    painAfter: readOptionalNumber(formData, "painAfter"),
    painLocation: readString(formData, "painLocation") || undefined,
    sleepHours: readOptionalNumber(formData, "sleepHours"),
    bodyweightKg: readOptionalNumber(formData, "bodyweightKg"),
    subjectiveReadiness: readOptionalNumber(
      formData,
      "subjectiveReadiness",
    ) as number | undefined,
    notes: readString(formData, "notes") || undefined,
    createdAt: new Date().toISOString(),
  });

  if (!session) {
    redirect("/session/log?error=Could not save the session.");
  }

  const setRows = [
    buildSetRow(formData, "topSingle", session.id, { isTopSingle: true }),
    buildSetRow(formData, "backoffOne", session.id),
    buildSetRow(formData, "backoffTwo", session.id),
  ].filter((row): row is NewSetRow => row !== null);

  await createSets(setRows);

  const topSingle = setRows.find((row) => row.isTopSingle === 1);
  const e1rmSource =
    topSingle ??
    setRows.find(
      (row) =>
        row.reps > 1 && row.rir !== undefined && row.benchStandard === "gym",
    );

  if (e1rmSource && e1rmSource.rir !== undefined) {
    const e1rm = calculateE1rm(e1rmSource.weightKg, e1rmSource.reps, e1rmSource.rir);
    if (e1rm.valueKg !== null && e1rm.confidence !== null) {
      await insertE1rmHistory({
        sessionId: session.id,
        date: session.date,
        benchStandard: e1rmSource.benchStandard ?? "gym",
        valueKg: e1rm.valueKg,
        method: e1rm.method,
        confidence: e1rm.confidence,
        sourceWeightKg: e1rmSource.weightKg,
        sourceReps: e1rmSource.reps,
        sourceRir: e1rmSource.rir,
      });
    }
  }

  const recommendationId = readOptionalNumber(formData, "recommendationId");
  if (recommendationId !== undefined) {
    await linkRecommendationToSession(recommendationId, session.id);
  }

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/session/new");
  revalidatePath(`/session/${session.id}`);
  redirect(`/session/${session.id}?logged=1`);
}
