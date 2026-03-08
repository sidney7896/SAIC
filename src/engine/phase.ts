import { daysBetween } from "@/lib/dates";
import type { AthleteProfile, PhaseContext } from "@/engine/types";

export function resolvePhase(date: string, profile: AthleteProfile): PhaseContext {
  const testDay = profile.testDayDate ?? "2026-08-29";
  const daysUntilTest = daysBetween(date, testDay);
  const daysSinceLastTraining = profile.lastTrainingDate
    ? daysBetween(profile.lastTrainingDate, date)
    : 0;

  if (date === testDay) {
    return {
      current_phase: "test_day",
      override_reason: "Date matches the annual test day.",
    };
  }

  if (date > testDay && daysBetween(testDay, date) <= 30) {
    return {
      current_phase: "pivot",
      override_reason: "Date falls in the post-test pivot window.",
    };
  }

  if (daysSinceLastTraining > 7) {
    return {
      current_phase: "transition",
      override_reason: "More than 7 days have passed since the last bench session.",
    };
  }

  if (profile.currentPhaseOverride) {
    return {
      current_phase: profile.currentPhaseOverride,
      override_reason: "Manual profile phase override.",
    };
  }

  if (profile.isInCaloricDeficit) {
    return {
      current_phase: "cut",
      block_type: "accumulation",
      phase_week: 1,
      override_reason: "Profile indicates an active caloric deficit.",
    };
  }

  if (daysUntilTest <= 70) {
    return {
      current_phase: "peaking",
      phase_week: Math.max(1, 11 - Math.ceil(daysUntilTest / 7)),
      override_reason: "Within the 10-week peaking window.",
    };
  }

  return {
    current_phase: "builder",
    block_type: "accumulation",
    phase_week: 1,
    cycle_number: 1,
    override_reason: "Defaulting to the year-round builder phase.",
  };
}
