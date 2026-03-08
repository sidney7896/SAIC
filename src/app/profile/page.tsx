export const dynamic = "force-dynamic";

import { PageShell } from "@/components/ui/page-shell";
import { ensureSeedData } from "@/db/seed";
import { listProfileEntries } from "@/db/queries/profile";
import { mapToProfileFormValues, mapToAthleteProfile, profileRowsToMap } from "@/lib/profile";
import { saveProfileAction } from "@/app/profile/actions";

interface ProfilePageProps {
  searchParams?: {
    saved?: string;
  };
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  await ensureSeedData();
  const rows = await listProfileEntries();
  const values = mapToProfileFormValues(profileRowsToMap(rows));
  const profile = mapToAthleteProfile(profileRowsToMap(rows));

  return (
    <PageShell
      title="Athlete Profile"
      description="Edit the durable profile fields that drive phase resolution, bodyweight targets, and recommendation defaults."
    >
      <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
        {searchParams?.saved ? (
          <p className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Profile saved.
          </p>
        ) : null}
        <form action={saveProfileAction} className="grid gap-5 md:grid-cols-2">
          <label className="text-sm text-stone-700">
            Athlete Name
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="athleteName" defaultValue={values.athleteName} />
          </label>
          <label className="text-sm text-stone-700">
            Current Phase
            <select className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="currentPhase" defaultValue={values.currentPhase}>
              <option value="cut">cut</option>
              <option value="transition">transition</option>
              <option value="builder">builder</option>
              <option value="peaking">peaking</option>
              <option value="test_day">test_day</option>
              <option value="pivot">pivot</option>
            </select>
          </label>
          <label className="text-sm text-stone-700 md:col-span-2">
            Goal Statement
            <textarea className="mt-2 min-h-28 w-full rounded-xl border border-stone-300 px-3 py-2" name="goalStatement" defaultValue={values.goalStatement} />
          </label>
          <label className="text-sm text-stone-700">
            Current Bodyweight (kg)
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="currentBodyweightKg" defaultValue={values.currentBodyweightKg} type="number" step="0.1" />
          </label>
          <label className="text-sm text-stone-700">
            Cut Start Bodyweight (kg)
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="cutStartBodyweightKg" defaultValue={values.cutStartBodyweightKg} type="number" step="0.1" />
          </label>
          <label className="text-sm text-stone-700">
            Cut Start e1RM (kg)
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="cutStartE1rmKg" defaultValue={values.cutStartE1rmKg} type="number" step="0.1" />
          </label>
          <label className="text-sm text-stone-700">
            Cut Start Date
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="cutStartDate" defaultValue={values.cutStartDate} type="date" />
          </label>
          <label className="text-sm text-stone-700">
            Target Bodyweight (kg)
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="bodyweightTargetKg" defaultValue={values.bodyweightTargetKg} type="number" step="0.1" />
          </label>
          <label className="text-sm text-stone-700">
            Bodyweight Trend
            <select className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="bodyweightTrend" defaultValue={values.bodyweightTrend}>
              <option value="losing">losing</option>
              <option value="stable">stable</option>
              <option value="gaining">gaining</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-700">
            <input name="isInCaloricDeficit" type="checkbox" defaultChecked={values.isInCaloricDeficit} />
            In caloric deficit
          </label>
          <label className="text-sm text-stone-700">
            Test Day
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="testDayDate" defaultValue={values.testDayDate} type="date" />
          </label>
          <label className="text-sm text-stone-700">
            Last Training Date
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="lastTrainingDate" defaultValue={values.lastTrainingDate} type="date" />
          </label>
          <label className="text-sm text-stone-700">
            Training Schedule
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="trainingSchedule" defaultValue={values.trainingSchedule} />
          </label>
          <label className="text-sm text-stone-700">
            Sleep Baseline (hours)
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="sleepBaselineHours" defaultValue={values.sleepBaselineHours} type="number" step="0.1" />
          </label>
          <label className="text-sm text-stone-700">
            Preferred Style
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="preferredStyle" defaultValue={values.preferredStyle} />
          </label>
          <label className="text-sm text-stone-700">
            Preferred Explanation Style
            <input className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2" name="preferredExplanationStyle" defaultValue={values.preferredExplanationStyle} />
          </label>
          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-sm text-stone-500">
              Phase resolver currently sees: {profile.currentPhaseOverride ?? "none"}.
            </p>
            <button className="rounded-full border border-stone-900 bg-stone-900 px-5 py-2 text-sm text-white" type="submit">
              Save Profile
            </button>
          </div>
        </form>
      </section>
    </PageShell>
  );
}
