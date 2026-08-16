import { Link } from "react-router-dom";

export default function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {description && <p className="max-w-md text-sm text-ink/60">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-3">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
