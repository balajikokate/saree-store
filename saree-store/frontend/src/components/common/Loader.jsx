export default function Loader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
      <span className="text-sm text-ink/60">{label}…</span>
    </div>
  );
}
