export type SessionType = "heavy" | "medium" | "light" | "test";
export type RecommendationSessionType =
  | SessionType
  | "deload"
  | "transition";
export type DayType = "push" | "pull" | "legs";
export type BenchStandard = "ipf" | "gym" | "gym_wraps";
export type Phase =
  | "cut"
  | "transition"
  | "builder"
  | "peaking"
  | "test_day"
  | "pivot";
export type BlockType = "accumulation" | "intensification" | "realization";
export type Confidence = "high" | "medium" | "low";
export type BodyweightTrend = "stable" | "gaining" | "losing";
export type TrendDirection = "up" | "flat" | "down";
export type RotationSlot =
  | "heavy_a"
  | "medium_a"
  | "heavy_b"
  | "medium_b"
  | "light_a"
  | "light_b";

export interface SessionInput {
  date: string;
  session_type: SessionType;
  day_type: DayType;
  pain: {
    score: number;
    location?: string;
    trend?: "stable" | "improving" | "worsening";
  };
  sleep_hours?: number;
  bodyweight_kg?: number;
  subjective_readiness?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  actual_result?: ActualResult;
}

export interface ActualResult {
  top_single?: {
    weight_kg: number;
    reps: number;
    rir: number;
    bench_standard: BenchStandard;
    failed: boolean;
    technical_notes?: string;
  };
  working_sets?: WorkingSet[];
  pain_during?: number;
  pain_after?: number;
}

export interface WorkingSet {
  exercise: string;
  weight_kg: number;
  reps: number;
  sets: number;
  rir?: number;
  bench_standard?: BenchStandard;
}

export interface AthleteState {
  current_phase: Phase;
  phase_week?: number;
  block_type?: BlockType;
  cycle_number?: number;
  e1rm: {
    ipf?: E1rmEstimate;
    gym?: E1rmEstimate;
    gym_wraps?: E1rmEstimate;
  };
  deload_triggers: {
    e1rm_drop: TriggerState;
    rpe_drift: TriggerState;
    pain_trend: TriggerState;
    triggers_met: number;
    deload_recommended: boolean;
  };
  cut_state?: {
    e1rm_change_pct: number;
    threshold: "stable" | "monitor" | "warning" | "red_flag";
    weeks_in_cut: number;
    bw_start_kg: number;
    bw_current_kg: number;
    bw_target_kg: number;
    e1rm_at_cut_start_kg?: number;
  };
  recent_sessions: RecentSession[];
  last_heavy_push?: RecentSession;
  last_medium_legs?: RecentSession;
  days_since_last_bench: number;
  bodyweight_kg: number;
  bodyweight_trend: BodyweightTrend;
  consecutive_sessions_above_target_rpe: number;
  last_pain_scores: number[];
  peaking_state?: {
    weeks_out: number;
    target_ipf_1rm: number;
    current_e1rm_pct_of_target: number;
    hard_sets_this_week: number;
    taper_active: boolean;
  };
}

export interface E1rmEstimate {
  value_kg: number;
  date: string;
  confidence: Confidence;
  method: "rpe_table" | "epley" | "test_day";
  trend: TrendDirection;
  trend_sessions: number;
  trend_change_pct: number;
}

export interface TriggerState {
  active: boolean;
  value: number;
  threshold: number;
  sessions_compared: string[];
}

export interface RecentSession {
  date: string;
  session_type: "heavy" | "medium" | "light";
  day_type: DayType;
  top_single_kg?: number;
  top_single_rir?: number;
  e1rm_kg?: number;
  bench_standard: BenchStandard;
  pain: number;
  hard_sets: number;
  notes?: string;
}

export interface Explanation {
  summary: string;
  key_inputs: string[];
  rule_applied: string;
  tradeoff: string;
  monitor_next: string[];
}

export interface SessionRecommendation {
  date: string;
  phase: Phase;
  session_type: RecommendationSessionType;
  day_type: DayType;
  warmup: WarmupStep[];
  exercises: ExercisePrescription[];
  rest_between_exercises: string;
  alerts: Alert[];
  explanation: Explanation;
  state_snapshot: {
    e1rm_gym_kg: number;
    e1rm_ipf_kg?: number;
    e1rm_gym_wraps_kg?: number;
    deload_triggers_met: number;
    pain_score: number;
    bodyweight_kg: number;
    phase: Phase;
    block?: BlockType;
    phase_week?: number;
  };
}

export interface WarmupStep {
  exercise: string;
  weight_kg: number | "bar";
  reps: number;
  rest_sec: number;
  notes?: string;
}

export interface ExercisePrescription {
  order: number;
  exercise: string;
  variation?: string;
  sets: number;
  reps: number;
  target_weight_kg: number;
  target_rir: number;
  target_rir_range: [number, number];
  rest_sec: number;
  purpose: string;
  is_optional: boolean;
  safety_note?: string;
}

export interface Alert {
  severity: "info" | "warning" | "critical";
  type:
    | "deload_recommended"
    | "safety_override"
    | "pain_escalation"
    | "strength_loss_warning"
    | "missing_data"
    | "phase_transition"
    | "test_day_prep"
    | "mini_deload";
  message: string;
  action_required: string;
  data?: Record<string, unknown>;
}

export interface StatusReport {
  e1rm_summary: {
    standard: BenchStandard;
    current_kg: number;
    trend: TrendDirection;
    trend_change_pct: number;
    confidence: Confidence;
    last_updated: string;
  }[];
  deload_status: {
    triggers_met: number;
    trigger_details: {
      name: string;
      active: boolean;
      current_value: string;
      threshold: string;
    }[];
    recommendation: string;
  };
  phase_progress: {
    phase: Phase;
    week: number;
    total_weeks: number;
    block?: BlockType;
    next_milestone: string;
  };
  bodyweight: {
    current_kg: number;
    target_kg: number;
    trend: string;
    strength_to_bw_ratio: number;
  };
  recent_sessions: {
    date: string;
    type: string;
    top_single: string;
    e1rm_kg: number;
    pain: number;
    hard_sets: number;
  }[];
}

export interface AthleteProfile {
  currentPhaseOverride?: Phase;
  isInCaloricDeficit?: boolean;
  bodyweightTargetKg?: number;
  peakingStartDate?: string;
  testDayDate?: string;
  lastTrainingDate?: string;
}

export interface SessionContext {
  date?: string;
  session_type: RecentSession["session_type"];
  day_type: DayType;
  bench_standard: BenchStandard;
}

export interface E1rmResult {
  valueKg: number | null;
  method: E1rmEstimate["method"] | "unavailable";
  confidence: Confidence | null;
  reason?: string;
}

export interface ComparableResult {
  sessions: RecentSession[];
  confidence: Confidence;
}

export interface DeloadTriggerResult {
  triggers_met: number;
  deload_recommended: boolean;
  details: {
    name: "e1rm_drop" | "rpe_drift" | "pain_trend";
    active: boolean;
    value: number;
    threshold: number;
    sessions_compared: string[];
  }[];
}

export interface PainLevel {
  level: 1 | 2 | 3 | 4;
  action: "proceed" | "modify" | "stop" | "seek_medical_attention";
  summary: string;
}

export interface SafetyAction {
  decision: "proceed" | "modify" | "deload" | "mini_deload" | "stop";
  painLevel: PainLevel;
  alerts: Alert[];
  reason: string;
}

export interface ProgressionAction {
  action: "increase" | "hold" | "decrease" | "review_technique";
  changeKg: number;
  reason: string;
}

export interface PhaseContext {
  current_phase: Phase;
  phase_week?: number;
  block_type?: BlockType;
  cycle_number?: number;
  weeks_out?: number;
  override_reason?: string;
}

export interface CutStrengthResult {
  threshold: "stable" | "monitor" | "warning" | "red_flag";
  action: string;
  drop_pct: number;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
}
