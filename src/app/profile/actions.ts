"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { upsertProfileEntry } from "@/db/queries/profile";
import { readCheckbox, readString } from "@/lib/forms";

const PROFILE_FIELDS = [
  ["athlete_name", "athleteName"],
  ["goal_statement", "goalStatement"],
  ["current_phase", "currentPhase"],
  ["current_bodyweight_kg", "currentBodyweightKg"],
  ["cut_start_bodyweight_kg", "cutStartBodyweightKg"],
  ["cut_start_e1rm_kg", "cutStartE1rmKg"],
  ["cut_start_date", "cutStartDate"],
  ["bodyweight_target_kg", "bodyweightTargetKg"],
  ["bodyweight_trend", "bodyweightTrend"],
  ["test_day_date", "testDayDate"],
  ["last_training_date", "lastTrainingDate"],
  ["training_schedule", "trainingSchedule"],
  ["sleep_baseline_hours", "sleepBaselineHours"],
  ["preferred_style", "preferredStyle"],
  ["preferred_explanation_style", "preferredExplanationStyle"],
] as const;

export async function saveProfileAction(formData: FormData) {
  for (const [key, formKey] of PROFILE_FIELDS) {
    await upsertProfileEntry({
      key,
      value: readString(formData, formKey),
      updatedAt: new Date().toISOString(),
    });
  }

  await upsertProfileEntry({
    key: "is_in_caloric_deficit",
    value: readCheckbox(formData, "isInCaloricDeficit") ? "true" : "false",
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/session/new");
  redirect("/profile?saved=1");
}
