export const dynamic = "force-dynamic";

import { PageShell } from "@/components/ui/page-shell";
import { importSeedCsvAction } from "@/app/import/actions";
import { ensureSeedData } from "@/db/seed";
import { listSessions } from "@/db/queries/sessions";

interface ImportPageProps {
  searchParams?: {
    imported?: string;
    skipped?: string;
  };
}

export default async function ImportPage({ searchParams }: ImportPageProps) {
  await ensureSeedData();
  const sessions = await listSessions();

  return (
    <PageShell
      title="Import Strengthlog CSV"
      description="Manual import path for the real Strengthlog CSV. Duplicate dates are skipped automatically."
    >
      <section className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm">
        {searchParams?.imported ? (
          <p className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Import finished: {searchParams.imported} rows imported, {searchParams.skipped ?? "0"} rows skipped.
          </p>
        ) : null}
        <p className="text-sm text-stone-700">
          Current SQLite session count: {sessions.length}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Source file: <code>data/bench-log.csv</code>
        </p>
        <form action={importSeedCsvAction} className="mt-6">
          <button className="rounded-full border border-stone-900 bg-stone-900 px-5 py-2 text-sm text-white" type="submit">
            Re-import Seed CSV
          </button>
        </form>
      </section>
    </PageShell>
  );
}
