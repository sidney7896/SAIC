interface SessionPlaceholderProps {
  title: string;
  notes: string[];
}

export function SessionPlaceholder({
  title,
  notes,
}: SessionPlaceholderProps) {
  return (
    <section className="rounded-2xl border border-dashed border-stone-400 bg-white/80 p-6">
      <h2 className="text-2xl font-semibold text-stone-900">{title}</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone-700">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
