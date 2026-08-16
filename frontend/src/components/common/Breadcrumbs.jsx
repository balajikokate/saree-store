import { Link } from "react-router-dom";

/**
 * items: [{ label, to }]  — the last item is rendered as plain text
 * (current page), not a link.
 */
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-ink/50 sm:text-sm">
      <Link to="/" className="hover:text-maroon">Home</Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            {isLast || !item.to ? (
              <span className="text-ink/70" aria-current={isLast ? "page" : undefined}>
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="hover:text-maroon">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
