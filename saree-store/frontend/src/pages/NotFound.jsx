import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-4xl text-ink">404</h1>
      <p className="mt-2 text-ink/60">This page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">
        Back to Home
      </Link>
    </div>
  );
}
