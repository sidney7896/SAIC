import type { SessionInput, ValidationResult } from "@/engine/types";

export function validateSessionInput(
  input: unknown,
): ValidationResult<SessionInput> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return {
      success: false,
      errors: ["Session input must be an object."],
    };
  }

  const candidate = input as Partial<SessionInput>;

  if (!candidate.date) {
    errors.push("Date is required.");
  }

  if (
    candidate.session_type !== "heavy" &&
    candidate.session_type !== "medium" &&
    candidate.session_type !== "light" &&
    candidate.session_type !== "test"
  ) {
    errors.push("Session type must be heavy, medium, light, or test.");
  }

  if (
    candidate.day_type !== "push" &&
    candidate.day_type !== "pull" &&
    candidate.day_type !== "legs"
  ) {
    errors.push("Day type must be push, pull, or legs.");
  }

  const painScore = candidate.pain?.score;
  if (typeof painScore !== "number" || painScore < 0 || painScore > 10) {
    errors.push("Pain score must be a number between 0 and 10.");
  }

  if (
    candidate.sleep_hours !== undefined &&
    (candidate.sleep_hours < 0 || candidate.sleep_hours > 24)
  ) {
    errors.push("Sleep hours must be between 0 and 24.");
  }

  if (
    candidate.bodyweight_kg !== undefined &&
    (candidate.bodyweight_kg < 40 || candidate.bodyweight_kg > 200)
  ) {
    errors.push("Bodyweight must be between 40 and 200 kg.");
  }

  if (candidate.actual_result?.top_single) {
    const topSingle = candidate.actual_result.top_single;
    if (topSingle.weight_kg <= 0) {
      errors.push("Top single weight must be greater than 0.");
    }

    const validRir = [
      0,
      0.5,
      1,
      1.5,
      2,
      2.5,
      3,
      3.5,
      4,
      4.5,
      5,
    ];

    if (!validRir.includes(topSingle.rir)) {
      errors.push("Top single RIR must be between 0 and 5 in 0.5 steps.");
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: candidate as SessionInput,
    errors: [],
  };
}
