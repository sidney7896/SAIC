import fs from "node:fs";
import path from "node:path";
import { parseApproximateDate } from "@/lib/dates";
import { parseFirstNumber } from "@/lib/number";

export interface ProfileEntryInput {
  key: string;
  value: string;
}

function readProfileMarkdown() {
  const profilePath = path.join(
    process.cwd(),
    "data",
    "profile",
    "athlete-profile.md",
  );

  return fs.readFileSync(profilePath, "utf8");
}

function extractBulletMap(markdown: string) {
  const map = new Map<string, string>();

  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^- ([a-z_]+):\s*(.+)$/);
    if (!match) {
      continue;
    }

    map.set(match[1], match[2].trim());
  }

  return map;
}

function deriveTestDay(goalStatement?: string) {
  if (!goalStatement) {
    return "2026-08-29";
  }

  const explicit = parseApproximateDate(goalStatement.match(/[A-Z][a-z]+ \d{1,2}, \d{4}/)?.[0]);

  return explicit ?? "2026-08-29";
}

function deriveTargetBodyweight(bodyweightTrend?: string, hardConstraints?: string) {
  const explicitTarget = hardConstraints?.match(/(\d+(?:\.\d+)?)\s*kg/)?.[1];
  if (explicitTarget) {
    return Number(explicitTarget);
  }

  const rangeTarget = bodyweightTrend?.match(/target\s+(\d+(?:\.\d+)?)/i)?.[1];
  if (rangeTarget) {
    return Number(rangeTarget);
  }

  return 65;
}

export function getDefaultProfileEntries(): ProfileEntryInput[] {
  const markdown = readProfileMarkdown();
  const bullets = extractBulletMap(markdown);
  const currentBodyweight =
    parseFirstNumber(bullets.get("current_bodyweight")) ?? 70;
  const targetBodyweight = deriveTargetBodyweight(
    bullets.get("bodyweight_trend"),
    bullets.get("hard_constraints"),
  );
  const testDayDate = deriveTestDay(bullets.get("goal_statement"));
  const lastTrainingDate = "2026-03-07";
  const profileEntries: ProfileEntryInput[] = [
    { key: "athlete_name", value: bullets.get("athlete_name") ?? "Sidney Drost" },
    {
      key: "goal_statement",
      value:
        bullets.get("goal_statement") ??
        "Become the strongest possible natural flat barbell bencher.",
    },
    { key: "current_phase", value: "cut" },
    { key: "current_bodyweight_kg", value: String(currentBodyweight) },
    { key: "bodyweight_target_kg", value: String(targetBodyweight) },
    { key: "bodyweight_trend", value: bullets.get("bodyweight_trend") ?? "losing" },
    { key: "is_in_caloric_deficit", value: "true" },
    { key: "test_day_date", value: testDayDate },
    { key: "last_training_date", value: lastTrainingDate },
    {
      key: "training_schedule",
      value: bullets.get("training_schedule") ?? "6-day PPL split",
    },
    {
      key: "sleep_baseline_hours",
      value: String(parseFirstNumber(bullets.get("sleep_pattern")) ?? 7.5),
    },
    {
      key: "preferred_style",
      value:
        bullets.get("preferred_style") ??
        "Direct, specific, evidence-based. No generic motivation.",
    },
    {
      key: "preferred_explanation_style",
      value:
        bullets.get("preferred_explanation_style") ??
        "Data-driven, traceable, clear tradeoffs.",
    },
  ];

  return profileEntries;
}
