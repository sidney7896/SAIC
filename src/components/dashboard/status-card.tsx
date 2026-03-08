interface StatusCardProps {
  label: string;
  value: string;
  detail: string;
}

export function StatusCard({ label, value, detail }: StatusCardProps) {
  return (
    <section className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-stone-900">{value}</p>
      <p className="mt-2 text-sm text-stone-600">{detail}</p>
    </section>
  );
}
