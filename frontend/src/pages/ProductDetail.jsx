import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { productApi, reviewApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { trackRecentlyViewed } from "../utils/recentlyViewed";
import PriceTag from "../components/common/PriceTag";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ProductGrid from "../components/product/ProductGrid";
import { resolveImageUrl } from "../utils/image";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setRelated([]);
    setReviews([]);
    setReviewForm({ rating: 0, comment: "" });
    setReviewSuccess(false);
    productApi
      .getBySlug(slug)
      .then((res) => {
        if (!active) return;
        setProduct(res.data);
        setActiveImage(0);
        setQuantity(1);
        window.scrollTo({ top: 0, behavior: "instant" in window.history ? "instant" : "auto" });
        trackRecentlyViewed(res.data);

        // Fetch a few more sarees from the same category for "You may also like"
        if (res.data.category?.slug) {
          productApi
            .list({ category: res.data.category.slug, limit: 5 })
            .then((relatedRes) => {
              if (!active) return;
              setRelated(relatedRes.data.filter((p) => p.id !== res.data.id).slice(0, 4));
            })
            .catch(() => {});
        }

        setReviewsLoading(true);
        reviewApi
          .list(slug)
          .then((reviewsRes) => {
            if (!active) return;
            setReviews(reviewsRes.data);
          })
          .catch(() => {})
          .finally(() => active && setReviewsLoading(false));
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <Loader label="Loading saree" />;
  if (notFound || !product) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-display text-2xl">Saree not found</p>
        <Link to="/shop" className="mt-4 inline-block text-maroon underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    // Deliberately does NOT touch the shared cart — "Buy Now" is an
    // independent, single-item purchase. If it called addItem() here, it
    // would merge into whatever's already in the customer's cart, and the
    // checkout page would show the whole cart instead of just this item.
    navigate("/checkout", {
      state: {
        buyNowItem: {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0],
          price: Number(product.discountPrice ?? product.price),
          quantity,
        },
      },
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    if (reviewForm.rating < 1) {
      setReviewError("Select a star rating");
      return;
    }
    if (reviewForm.comment.trim().length < 5) {
      setReviewError("Please write a few words about the product");
      return;
    }
    setReviewSubmitting(true);
    try {
      await reviewApi.submit(slug, reviewForm);
      const res = await reviewApi.list(slug);
      setReviews(res.data);
      // Refresh product to pick up the recalculated average rating
      const productRes = await productApi.getBySlug(slug);
      setProduct(productRes.data);
      setReviewSuccess(true);
      setReviewForm({ rating: 0, comment: "" });
    } catch (err) {
      setReviewError(err.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-[3/4] overflow-hidden rounded-sm bg-blush">
            <img
              src={resolveImageUrl(product.images[activeImage])}
              alt={product.name}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={img + idx}
                  onClick={() => setActiveImage(idx)}
                  className={`h-20 w-16 overflow-hidden rounded-sm border-2 ${
                    idx === activeImage ? "border-maroon" : "border-transparent"
                  }`}
                >
                  <img src={resolveImageUrl(img)} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50">{product.category?.name}</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl text-ink sm:text-3xl">{product.name}</h1>
            <button
              onClick={() => toggle(product)}
              aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={isWishlisted(product.id)}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-ink/10 text-rose transition-colors hover:bg-blush"
            >
              <HeartIcon filled={isWishlisted(product.id)} />
            </button>
          </div>
          <div className="mt-3">
            <PriceTag
              price={product.discountPrice ?? product.price}
              mrp={product.discountPrice ? product.price : null}
              size="lg"
            />
          </div>

          {product.reviewCount > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <StarDisplay rating={Number(product.rating)} />
              <span className="text-ink/60">
                {Number(product.rating).toFixed(1)} ({product.reviewCount} review{product.reviewCount === 1 ? "" : "s"})
              </span>
            </div>
          )}

          <p className="mt-5 text-sm leading-relaxed text-ink/70">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink/50">Fabric</dt>
              <dd className="font-medium text-ink">{product.fabric}</dd>
            </div>
            <div>
              <dt className="text-ink/50">Color</dt>
              <dd className="font-medium text-ink">{product.color}</dd>
            </div>
            <div>
              <dt className="text-ink/50">Occasion</dt>
              <dd className="font-medium text-ink">{product.occasion}</dd>
            </div>
            <div>
              <dt className="text-ink/50">Availability</dt>
              <dd className={`font-medium ${product.stock > 0 ? "text-emerald" : "text-maroon"}`}>
                {product.stock > 0 ? `In stock (${product.stock} left)` : "Sold out"}
              </dd>
            </div>
          </dl>

          {product.stock > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-sm border border-ink/15">
                <button
                  className="px-3 py-2 text-ink/70 hover:text-maroon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm">{quantity}</span>
                <button
                  className="px-3 py-2 text-ink/70 hover:text-maroon"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Sticky-ish action bar on mobile so buttons are always reachable */}
          <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col gap-3 border-t border-ink/10 bg-ivory/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <Button variant="secondary" disabled={product.stock === 0} onClick={handleAddToCart} className="flex-1">
              {added ? "Added ✓" : "Add to Cart"}
            </Button>
            <Button disabled={product.stock === 0} onClick={handleBuyNow} className="flex-1">
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 border-t border-ink/10 pt-10 sm:mt-20">
        <h2 className="font-display text-xl text-ink sm:text-2xl">Customer Reviews</h2>

        {isAuthenticated ? (
          <form onSubmit={handleReviewSubmit} className="mt-6 max-w-lg space-y-3 rounded-sm border border-ink/10 bg-white p-5">
            <p className="text-sm font-medium text-ink/80">Write a review</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  className="text-2xl leading-none"
                >
                  <span className={n <= reviewForm.rating ? "text-gold-dark" : "text-ink/20"}>★</span>
                </button>
              ))}
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Share your experience with this saree…"
              rows={3}
              className="input-field"
            />
            {reviewError && <p className="text-xs text-maroon">{reviewError}</p>}
            {reviewSuccess && <p className="text-xs text-emerald">Thanks for your review!</p>}
            <Button type="submit" isLoading={reviewSubmitting} variant="secondary">
              Submit Review
            </Button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-ink/60">
            <Link to="/login" className="font-medium text-maroon underline">Log in</Link> to write a review.
          </p>
        )}

        <div className="mt-8 space-y-5">
          {reviewsLoading ? (
            <Loader label="Loading reviews" />
          ) : reviews.length === 0 ? (
            <p className="text-sm text-ink/50">No reviews yet — be the first to share your thoughts.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="border-b border-ink/10 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StarDisplay rating={r.rating} />
                  <span className="text-sm font-medium text-ink">{r.customerName}</span>
                  {r.verified && (
                    <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
                      Verified purchase
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-ink/70">{r.comment}</p>
                <p className="mt-1 text-xs text-ink/40">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16 sm:mt-20">
          <h2 className="font-display text-xl text-ink sm:text-2xl">You may also like</h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}

function StarDisplay({ rating }) {
  const rounded = Math.round(rating);
  return (
    <span className="text-sm text-gold-dark" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rounded)}
      <span className="text-ink/20">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2 4.5 6 4c2.2-.3 4.2.9 6 3 1.8-2.1 3.8-3.3 6-3 4 .5 5.6 4.4 4 7.8-2.5 4.6-10 9.2-10 9.2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
