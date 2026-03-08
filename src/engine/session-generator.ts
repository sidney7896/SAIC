import { computeBackoffWeight as computeBackoffWeightByPhase } from "@/engine/backoff";
import { evaluateCutStrength } from "@/engine/cut-strength";
import { buildRuleExplanation } from "@/engine/explanation";
import { computeBackoffWeight, computeTopSingleTarget, evaluateProgression } from "@/engine/progression";
import { checkSafetyGate } from "@/engine/safety";
import { roundToNearestPlate } from "@/lib/number";
import type {
  SessionInput,
  SessionRecommendation,
  AthleteState,
  Alert,
  ExercisePrescription,
} from "@/engine/types";

function buildWarmup(targetWeightKg: number) {
  const reference = Math.max(targetWeightKg, 60);

  return [
    { exercise: "flat_bench", weight_kg: "bar" as const, reps: 10, rest_sec: 60 },
    { exercise: "flat_bench", weight_kg: roundToNearestPlate(reference * 0.4), reps: 8, rest_sec: 75 },
    { exercise: "flat_bench", weight_kg: roundToNearestPlate(reference * 0.6), reps: 5, rest_sec: 90 },
    { exercise: "flat_bench", weight_kg: roundToNearestPlate(reference * 0.75), reps: 3, rest_sec: 120 },
    { exercise: "flat_bench", weight_kg: roundToNearestPlate(reference * 0.85), reps: 1, rest_sec: 150 },
  ];
}

function modifyForDeload(exercises: ExercisePrescription[]) {
  return exercises.map((exercise) => ({
    ...exercise,
    sets: Math.max(2, Math.round(exercise.sets * 0.6)),
    target_rir: Number((exercise.target_rir + 1).toFixed(1)),
    target_rir_range: [
      Number((exercise.target_rir_range[0] + 1).toFixed(1)),
      Number((exercise.target_rir_range[1] + 1).toFixed(1)),
    ] as [number, number],
  }));
}

export function generateSession(
  input: SessionInput,
  state: AthleteState,
): SessionRecommendation {
  const safety = checkSafetyGate(input, state);
  const currentBlock = state.block_type ?? "accumulation";
  const baseE1rm = state.e1rm.gym?.value_kg ?? 90;
  const alerts: Alert[] = [...safety.alerts];
  const exercises: ExercisePrescription[] = [];
  let sessionType: SessionRecommendation["session_type"] = input.session_type;

  if (safety.decision === "stop") {
    const recommendation: SessionRecommendation = {
      date: input.date,
      phase: state.current_phase,
      session_type: "transition",
      day_type: input.day_type,
      warmup: [],
      exercises: [],
      rest_between_exercises: "Stop bench work and switch to the pain protocol.",
      alerts,
      explanation: {
        summary: "Safety gate stopped bench training for this session.",
        key_inputs: [],
        rule_applied: "",
        tradeoff: "",
        monitor_next: [],
      },
      state_snapshot: {
        e1rm_gym_kg: state.e1rm.gym?.value_kg ?? 0,
        e1rm_ipf_kg: state.e1rm.ipf?.value_kg,
        e1rm_gym_wraps_kg: state.e1rm.gym_wraps?.value_kg,
        deload_triggers_met: state.deload_triggers.triggers_met,
        pain_score: input.pain.score,
        bodyweight_kg: state.bodyweight_kg,
        phase: state.current_phase,
        block: state.block_type,
        phase_week: state.phase_week,
      },
    };

    recommendation.explanation = buildRuleExplanation(recommendation);

    return recommendation;
  }

  if (state.current_phase === "cut") {
    if (input.day_type === "pull" || input.session_type === "light") {
      exercises.push({
        order: 1,
        exercise: "flat_bench",
        variation: "touch_and_go",
        sets: 3,
        reps: 5,
        target_weight_kg: roundToNearestPlate(baseE1rm * 0.6),
        target_rir: 4,
        target_rir_range: [4, 5],
        rest_sec: 120,
        purpose: "Technique exposure with low fatigue on a pull day.",
        is_optional: false,
      });
    } else if (input.day_type === "legs" || input.session_type === "medium") {
      exercises.push({
        order: 1,
        exercise: "flat_bench",
        variation: "touch_and_go",
        sets: 4,
        reps: 4,
        target_weight_kg: roundToNearestPlate(baseE1rm * 0.67),
        target_rir: 3.5,
        target_rir_range: [3, 4],
        rest_sec: 150,
        purpose: "Medium bench volume that does not interfere with the next heavy push day.",
        is_optional: false,
      });
    } else {
      const targetRir = safety.decision === "modify" ? 2.5 : 2;
      const progression = state.last_heavy_push
        ? evaluateProgression(state.last_heavy_push, targetRir)
        : { action: "hold" as const, changeKg: 0, reason: "No comparable heavy session yet." };
      let topSingleTarget =
        computeTopSingleTarget(
          state,
          currentBlock,
          state.phase_week ?? 1,
        ) + progression.changeKg;

      if (
        input.sleep_hours !== undefined &&
        input.sleep_hours >= 8 &&
        input.subjective_readiness !== undefined &&
        input.subjective_readiness >= 4 &&
        input.pain.score === 0
      ) {
        topSingleTarget += 2.5;
      }

      if (
        (input.sleep_hours !== undefined && input.sleep_hours < 6) ||
        (input.subjective_readiness !== undefined && input.subjective_readiness <= 2)
      ) {
        topSingleTarget -= 2.5;
      }

      if (safety.decision === "modify") {
        topSingleTarget -= 2.5;
      }

      topSingleTarget = Math.min(roundToNearestPlate(baseE1rm), roundToNearestPlate(topSingleTarget));

      exercises.push({
        order: 1,
        exercise: "flat_bench",
        variation: "paused",
        sets: 1,
        reps: 1,
        target_weight_kg: topSingleTarget,
        target_rir: targetRir,
        target_rir_range: safety.decision === "modify" ? [2, 3] : [1.5, 2.5],
        rest_sec: 240,
        purpose: "Heavy single to preserve skill and strength during the cut.",
        is_optional: false,
      });

      exercises.push({
        order: 2,
        exercise: safety.decision === "modify" ? "spoto_press" : "flat_bench",
        variation: safety.decision === "modify" ? "joint_friendly" : "touch_and_go",
        sets: safety.decision === "mini_deload" ? 3 : safety.decision === "modify" ? 2 : 4,
        reps: 4,
        target_weight_kg: computeBackoffWeightByPhase(baseE1rm, currentBlock, state.current_phase),
        target_rir: safety.decision === "modify" ? 2.5 : 2,
        target_rir_range: safety.decision === "modify" ? [2, 3] : [1.5, 2.5],
        rest_sec: 180,
        purpose: "Back-off work for bench-specific volume without abandoning intensity.",
        is_optional: false,
      });

      if (safety.decision === "proceed") {
        exercises.push({
          order: 3,
          exercise: "close_grip_bench",
          sets: 2,
          reps: 5,
          target_weight_kg: roundToNearestPlate(baseE1rm * 0.68),
          target_rir: 2.5,
          target_rir_range: [2, 3],
          rest_sec: 150,
          purpose: "Optional extra bench variation if the top single stays in the target window.",
          is_optional: true,
          safety_note: "Skip if the top single reaches RPE 9 or higher.",
        });
      }
    }

    const cutStrength = evaluateCutStrength(state);
    if (cutStrength?.threshold === "warning" || cutStrength?.threshold === "red_flag") {
      alerts.push({
        severity: cutStrength.threshold === "red_flag" ? "critical" : "warning",
        type: "strength_loss_warning",
        message: cutStrength.action,
        action_required: "Watch the next comparable heavy push session closely.",
      });
    }
  } else if (state.current_phase === "transition") {
    sessionType = "transition";
    exercises.push({
      order: 1,
      exercise: "flat_bench",
      variation: "paused",
      sets: 3,
      reps: 5,
      target_weight_kg: roundToNearestPlate(baseE1rm * 0.7),
      target_rir: 3,
      target_rir_range: [3, 4],
      rest_sec: 180,
      purpose: "Ramp-back week to restore bench rhythm after time away.",
      is_optional: false,
    });
  } else {
    exercises.push({
      order: 1,
      exercise: "flat_bench",
      variation: "competition",
      sets: 4,
      reps: input.session_type === "heavy" ? 3 : 5,
      target_weight_kg:
        input.session_type === "heavy"
          ? computeTopSingleTarget(state, currentBlock, state.phase_week ?? 1)
          : computeBackoffWeight(state, currentBlock),
      target_rir: input.session_type === "heavy" ? 2 : 3,
      target_rir_range: input.session_type === "heavy" ? [1.5, 2.5] : [2.5, 3.5],
      rest_sec: input.session_type === "heavy" ? 210 : 150,
      purpose: "Generic non-cut bench work until the phase-specific modules deepen.",
      is_optional: false,
    });
  }

  if (safety.decision === "deload") {
    sessionType = "deload";
  }

  const finalizedExercises =
    safety.decision === "deload" ? modifyForDeload(exercises) : exercises;

  const recommendation: SessionRecommendation = {
    date: input.date,
    phase: state.current_phase,
    session_type: sessionType,
    day_type: input.day_type,
    warmup:
      finalizedExercises.length > 0
        ? buildWarmup(finalizedExercises[0].target_weight_kg)
        : [],
    exercises: finalizedExercises,
    rest_between_exercises:
      input.session_type === "heavy"
        ? "Rest 3–5 minutes on the heavy work and 2–3 minutes on supporting bench work."
        : "Rest 2–3 minutes between sets and keep execution clean.",
    alerts,
    explanation: {
      summary: "",
      key_inputs: [],
      rule_applied: "",
      tradeoff: "",
      monitor_next: [],
    },
    state_snapshot: {
      e1rm_gym_kg: state.e1rm.gym?.value_kg ?? 0,
      e1rm_ipf_kg: state.e1rm.ipf?.value_kg,
      e1rm_gym_wraps_kg: state.e1rm.gym_wraps?.value_kg,
      deload_triggers_met: state.deload_triggers.triggers_met,
      pain_score: input.pain.score,
      bodyweight_kg: state.bodyweight_kg,
      phase: state.current_phase,
      block: state.block_type,
      phase_week: state.phase_week,
    },
  };

  recommendation.explanation = buildRuleExplanation(recommendation);

  return recommendation;
}
