import type {
  AthleteState,
  PainLevel,
  SafetyAction,
  SessionInput,
} from "@/engine/types";

export function checkSafetyGate(
  input: SessionInput,
  state: AthleteState,
): SafetyAction {
  const painLevel = applyPainProtocol(input.pain.score);
  const deloadNeedsJointFriendlyVariant = painLevel.level === 2;

  if (painLevel.level >= 4) {
    return {
      decision: "stop",
      painLevel,
      preferJointFriendly: false,
      alerts: [
        {
          severity: "critical",
          type: "pain_escalation",
          message: "Pain level indicates an acute stop condition.",
          action_required: "Stop benching and seek same-day medical assessment.",
        },
      ],
      reason: "Acute pain threshold reached.",
    };
  }

  if (painLevel.level === 3) {
    return {
      decision: "stop",
      painLevel,
      preferJointFriendly: false,
      alerts: [
        {
          severity: "critical",
          type: "pain_escalation",
          message: "Pain is at or above the stop threshold for bench work.",
          action_required: "Stop the session and begin the 7–10 day pivot protocol.",
        },
      ],
      reason: "Pain score requires an immediate stop.",
    };
  }

  if (state.deload_triggers.triggers_met >= 2) {
    return {
      decision: "deload",
      painLevel,
      preferJointFriendly: deloadNeedsJointFriendlyVariant,
      alerts: [
        {
          severity: "warning",
          type: "deload_recommended",
          message: deloadNeedsJointFriendlyVariant
            ? "Two or more deload triggers are active, and pain is in the 3–4/10 band. Deload and use a joint-friendly back-off variant."
            : "Two or more deload triggers are active.",
          action_required: deloadNeedsJointFriendlyVariant
            ? "Run a 1-week deload with volume down 40%, RPE down 1, and switch the back-off work to a joint-friendly variation."
            : "Run a 1-week deload with volume down 40% and RPE down 1.",
        },
      ],
      reason: deloadNeedsJointFriendlyVariant
        ? "The 2-of-3 deload rule has fired and Level 2 pain also requires a joint-friendly variant."
        : "The 2-of-3 deload rule has fired.",
    };
  }

  if (state.consecutive_sessions_above_target_rpe >= 2) {
    return {
      decision: "mini_deload",
      painLevel,
      preferJointFriendly: false,
      alerts: [
        {
          severity: "warning",
          type: "mini_deload",
          message: "Recent heavy singles have repeatedly exceeded the target effort.",
          action_required: "Use a 3-day mini-deload before pushing again.",
        },
      ],
      reason: "Two consecutive sessions overshot the top single target.",
    };
  }

  if (painLevel.level === 2) {
    return {
      decision: "modify",
      painLevel,
      preferJointFriendly: true,
      alerts: [
        {
          severity: "warning",
          type: "pain_escalation",
          message: "Pain is in the 3–4/10 modification band.",
          action_required: "Reduce bench volume and use a joint-friendly variant.",
        },
      ],
      reason: "Pain modification rules apply.",
    };
  }

  return {
    decision: "proceed",
    painLevel: {
      level: 1,
      action: "proceed",
      summary: "Pain and deload checks allow normal training.",
    },
    preferJointFriendly: false,
    alerts: [],
    reason: "No safety gate modifications are required.",
  };
}

export function applyPainProtocol(painScore: number): PainLevel {
  if (painScore >= 8) {
    return {
      level: 4,
      action: "seek_medical_attention",
      summary: "Pain is severe enough to treat as an acute red flag.",
    };
  }

  if (painScore >= 5) {
    return {
      level: 3,
      action: "stop",
      summary: "Pain is at the stop threshold for benching.",
    };
  }

  if (painScore >= 3) {
    return {
      level: 2,
      action: "modify",
      summary: "Pain requires lower volume, easier effort, and friendlier variations.",
    };
  }

  return {
    level: 1,
    action: "proceed",
    summary: "Pain is low enough to continue as planned.",
  };
}
