import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminReviewApi } from "../../services/adminApi";
import Loader from "../../components/common/Loader";

function Stars({ rating }) {
  return (
    <span className="text-gold-dark" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-ink/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    setLoading(true);
    adminReviewApi
      .list()
      .then((res) => setReviews(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchReviews, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await adminReviewApi.remove(id);
      fetchReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Loader label="Loading reviews" />;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Reviews</h1>
      <p className="mt-1 text-sm text-ink/60">{reviews.length} total reviews</p>

      {reviews.length === 0 ? (
        <p className="mt-10 text-sm text-ink/60">No reviews yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-sm border border-ink/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Stars rating={r.rating} />
                  <span className="ml-2 text-sm font-medium text-ink">{r.user.name}</span>
                  {r.verified && (
                    <span className="ml-2 rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
                      Verified purchase
                    </span>
                  )}
                </div>
                <Link to={`/product/${r.product.slug}`} target="_blank" className="text-xs text-maroon underline">
                  {r.product.name}
                </Link>
              </div>
              <p className="mt-2 text-sm text-ink/70">{r.comment}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-ink/40">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                <button onClick={() => handleDelete(r.id)} className="text-xs font-medium text-maroon underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
