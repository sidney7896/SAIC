import type { AthleteProfile } from "@/engine/types";
import type { AthleteProfileRow } from "@/db/schema";

export interface ProfileFormValues {
  athleteName: string;
  goalStatement: string;
  currentPhase: string;
  currentBodyweightKg: string;
  bodyweightTargetKg: string;
  bodyweightTrend: string;
  isInCaloricDeficit: boolean;
  testDayDate: string;
  lastTrainingDate: string;
  trainingSchedule: string;
  sleepBaselineHours: string;
  preferredStyle: string;
  preferredExplanationStyle: string;
}

export function profileRowsToMap(rows: AthleteProfileRow[]) {
  return new Map(rows.map((row) => [row.key, row.value]));
}

export function mapToAthleteProfile(map: Map<string, string>): AthleteProfile {
  const currentPhaseValue = map.get("current_phase");
  const lastTrainingDate = map.get("last_training_date");
  const bodyweightTargetValue = map.get("bodyweight_target_kg");
  const testDayDate = map.get("test_day_date");

  return {
    currentPhaseOverride:
      currentPhaseValue === "cut" ||
      currentPhaseValue === "transition" ||
      currentPhaseValue === "builder" ||
      currentPhaseValue === "peaking" ||
      currentPhaseValue === "test_day" ||
      currentPhaseValue === "pivot"
        ? currentPhaseValue
        : undefined,
    isInCaloricDeficit: map.get("is_in_caloric_deficit") === "true",
    bodyweightTargetKg: bodyweightTargetValue
      ? Number(bodyweightTargetValue)
      : undefined,
    testDayDate: testDayDate || undefined,
    lastTrainingDate: lastTrainingDate || undefined,
  };
}

export function mapToProfileFormValues(map: Map<string, string>): ProfileFormValues {
  return {
    athleteName: map.get("athlete_name") ?? "",
    goalStatement: map.get("goal_statement") ?? "",
    currentPhase: map.get("current_phase") ?? "cut",
    currentBodyweightKg: map.get("current_bodyweight_kg") ?? "",
    bodyweightTargetKg: map.get("bodyweight_target_kg") ?? "",
    bodyweightTrend: map.get("bodyweight_trend") ?? "losing",
    isInCaloricDeficit: map.get("is_in_caloric_deficit") === "true",
    testDayDate: map.get("test_day_date") ?? "",
    lastTrainingDate: map.get("last_training_date") ?? "",
    trainingSchedule: map.get("training_schedule") ?? "",
    sleepBaselineHours: map.get("sleep_baseline_hours") ?? "",
    preferredStyle: map.get("preferred_style") ?? "",
    preferredExplanationStyle: map.get("preferred_explanation_style") ?? "",
  };
}
