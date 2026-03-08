import type {
  AthleteProfileRow,
  E1rmHistoryRow,
  RecommendationRow,
  SessionRow,
  SetRow,
} from "@/db/schema";

export function mapSessionRow(row: Record<string, unknown>): SessionRow {
  return {
    id: Number(row.id),
    date: String(row.date),
    sessionType: String(row.session_type),
    dayType: String(row.day_type),
    painBefore: row.pain_before === null ? null : Number(row.pain_before),
    painDuring: row.pain_during === null ? null : Number(row.pain_during),
    painAfter: row.pain_after === null ? null : Number(row.pain_after),
    painLocation:
      row.pain_location === null ? null : String(row.pain_location),
    sleepHours: row.sleep_hours === null ? null : Number(row.sleep_hours),
    bodyweightKg:
      row.bodyweight_kg === null ? null : Number(row.bodyweight_kg),
    subjectiveReadiness:
      row.subjective_readiness === null
        ? null
        : Number(row.subjective_readiness),
    notes: row.notes === null ? null : String(row.notes),
    createdAt: String(row.created_at),
  };
}

export function mapSetRow(row: Record<string, unknown>): SetRow {
  return {
    id: Number(row.id),
    sessionId: Number(row.session_id),
    exercise: String(row.exercise),
    weightKg: Number(row.weight_kg),
    reps: Number(row.reps),
    sets: Number(row.num_sets),
    rir: row.rir === null ? null : Number(row.rir),
    benchStandard:
      row.bench_standard === null ? null : String(row.bench_standard),
    isTopSingle: Number(row.is_top_single),
    isWarmup: Number(row.is_warmup),
    failed: Number(row.failed),
    notes: row.notes === null ? null : String(row.notes),
  };
}

export function mapE1rmHistoryRow(row: Record<string, unknown>): E1rmHistoryRow {
  return {
    id: Number(row.id),
    sessionId: Number(row.session_id),
    date: String(row.date),
    benchStandard: String(row.bench_standard),
    valueKg: Number(row.value_kg),
    method: String(row.method),
    confidence: String(row.confidence),
    sourceWeightKg:
      row.source_weight_kg === null ? null : Number(row.source_weight_kg),
    sourceReps: row.source_reps === null ? null : Number(row.source_reps),
    sourceRir: row.source_rir === null ? null : Number(row.source_rir),
  };
}

export function mapAthleteProfileRow(
  row: Record<string, unknown>,
): AthleteProfileRow {
  return {
    id: Number(row.id),
    key: String(row.key),
    value: String(row.value),
    updatedAt: String(row.updated_at),
  };
}

export function mapRecommendationRow(
  row: Record<string, unknown>,
): RecommendationRow {
  return {
    id: Number(row.id),
    sessionId: row.session_id === null ? null : Number(row.session_id),
    date: String(row.date),
    phase: String(row.phase),
    prescriptionJson: String(row.prescription_json),
    stateSnapshotJson: String(row.state_snapshot_json),
    explanationJson:
      row.explanation_json === null ? null : String(row.explanation_json),
    createdAt: String(row.created_at),
  };
}
