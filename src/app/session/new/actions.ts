"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRecommendation } from "@/db/queries/recommendations";
import { computeAthleteState } from "@/db/queries/state";
import { generateSession } from "@/engine/session-generator";
import type { SessionInput } from "@/engine/types";
import { validateSessionInput } from "@/engine/validation";
import { generateExplanation } from "@/llm/explain";
import { readOptionalNumber, readRequiredNumber, readString } from "@/lib/forms";

export async function createRecommendationAction(formData: FormData) {
  const input: SessionInput = {
    date: readString(formData, "date"),
    session_type: readString(formData, "sessionType") as SessionInput["session_type"],
    day_type: readString(formData, "dayType") as SessionInput["day_type"],
    pain: {
      score: readRequiredNumber(formData, "painScore"),
      location: readString(formData, "painLocation") || undefined,
      trend:
        (readString(formData, "painTrend") as SessionInput["pain"]["trend"]) ||
        undefined,
    },
    sleep_hours: readOptionalNumber(formData, "sleepHours"),
    bodyweight_kg: readOptionalNumber(formData, "bodyweightKg"),
    subjective_readiness: readOptionalNumber(
      formData,
      "subjectiveReadiness",
    ) as SessionInput["subjective_readiness"],
    notes: readString(formData, "notes") || undefined,
  };

  const validation = validateSessionInput(input);
  if (!validation.success || !validation.data) {
    redirect(
      `/session/new?error=${encodeURIComponent(validation.errors.join(" "))}`,
    );
  }

  const state = await computeAthleteState();
  if (!state) {
    redirect("/session/new?error=Athlete state is unavailable.");
  }

  const recommendation = generateSession(validation.data, state);
  recommendation.explanation = await generateExplanation(recommendation);

  const saved = await createRecommendation({
    sessionId: null,
    date: recommendation.date,
    phase: recommendation.phase,
    prescriptionJson: JSON.stringify(recommendation),
    stateSnapshotJson: JSON.stringify(recommendation.state_snapshot),
    explanationJson: JSON.stringify(recommendation.explanation),
  });

  revalidatePath("/");
  revalidatePath("/session/new");
  redirect(`/session/new?recommendationId=${saved?.id ?? ""}`);
}
