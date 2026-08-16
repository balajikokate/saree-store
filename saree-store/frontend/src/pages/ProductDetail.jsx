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
import Breadcrumbs from "../components/common/Breadcrumbs";
import ProductGrid from "../components/product/ProductGrid";
import { resolveImageUrl } from "../utils/image";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
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
        const variants = res.data.variants || [];
        setSelectedVariant(
          variants.length > 0 ? variants.find((v) => v.stock > 0) || variants[0] : null
        );
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

  const hasVariants = (product.variants || []).length > 0;
  const availableStock = hasVariants ? selectedVariant?.stock ?? 0 : product.stock;
  // Show the selected color's own photos when it has any — this is what
  // makes picking "Blue" actually show the blue saree instead of whatever
  // color happened to be in the product's default photos.
  const displayImages =
    hasVariants && selectedVariant?.images?.length > 0 ? selectedVariant.images : product.images;

  const handleAddToCart = () => {
    addItem(product, quantity, selectedVariant);
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
          variantId: selectedVariant?.id || null,
          variantColor: selectedVariant?.color || null,
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
      <Breadcrumbs
        items={[
          ...(product.category ? [{ label: product.category.name, to: `/shop?category=${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />
      <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="group aspect-[3/4] overflow-hidden rounded-sm bg-blush">
            <img
              src={resolveImageUrl(displayImages[activeImage] || displayImages[0])}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-125"
              fetchPriority="high"
            />
          </div>
          {displayImages.length > 1 && (
            <div className="mt-3 flex gap-3">
              {displayImages.map((img, idx) => (
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
            {!hasVariants && (
              <div>
                <dt className="text-ink/50">Color</dt>
                <dd className="font-medium text-ink">{product.color}</dd>
              </div>
            )}
            <div>
              <dt className="text-ink/50">Occasion</dt>
              <dd className="font-medium text-ink">{product.occasion}</dd>
            </div>
            <div>
              <dt className="text-ink/50">Availability</dt>
              <dd className={`font-medium ${availableStock > 0 ? "text-emerald" : "text-maroon"}`}>
                {availableStock > 0 ? `In stock (${availableStock} left)` : "Sold out"}
              </dd>
            </div>
          </dl>

          {hasVariants && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-ink/80">
                Color: <span className="font-normal text-ink/60">{selectedVariant?.color}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(1);
                      setActiveImage(0);
                    }}
                    disabled={v.stock === 0}
                    title={v.stock === 0 ? `${v.color} — sold out` : v.color}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      selectedVariant?.id === v.id ? "border-maroon" : "border-transparent"
                    } ${v.stock === 0 ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    <span
                      className="h-8 w-8 rounded-full border border-ink/10"
                      style={{ backgroundColor: v.colorHex || "#ccc" }}
                    />
                    {v.stock === 0 && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="h-px w-10 rotate-45 bg-ink/40" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableStock > 0 && (
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
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Sticky-ish action bar on mobile so buttons are always reachable */}
          <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col gap-3 border-t border-ink/10 bg-ivory/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <Button variant="secondary" disabled={availableStock === 0} onClick={handleAddToCart} className="flex-1">
              {added ? "Added ✓" : "Add to Cart"}
            </Button>
            <Button disabled={availableStock === 0} onClick={handleBuyNow} className="flex-1">
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 border-t border-ink/10 pt-10 sm:mt-20">
        <h2 className="font-display text-xl text-ink sm:text-2xl">Customer Reviews</h2>

        {!reviewsLoading && reviews.length > 0 && (
          <div className="mt-6 flex flex-col gap-6 rounded-sm border border-ink/10 bg-white p-6 sm:flex-row sm:items-center">
            <div className="flex flex-shrink-0 flex-col items-center sm:border-r sm:border-ink/10 sm:pr-6">
              <p className="font-display text-4xl text-ink">{Number(product.rating).toFixed(1)}</p>
              <StarDisplay rating={Number(product.rating)} size={16} />
              <p className="mt-1 text-xs text-ink/50">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs text-ink/60">
                    <span className="w-8 flex-shrink-0">{star} star</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-blush">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 flex-shrink-0 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isAuthenticated ? (
          <form onSubmit={handleReviewSubmit} className="mt-6 max-w-lg space-y-3 rounded-sm border border-ink/10 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-ink">Write a review</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  className="text-3xl leading-none transition-transform hover:scale-110"
                >
                  <span className={n <= reviewForm.rating ? "text-gold-dark" : "text-ink/15"}>★</span>
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

        <div className="mt-8 space-y-4">
          {reviewsLoading ? (
            <Loader label="Loading reviews" />
          ) : reviews.length === 0 ? (
            <p className="text-sm text-ink/50">No reviews yet — be the first to share your thoughts.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="rounded-sm border border-ink/10 bg-white p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-maroon font-display text-sm text-ivory">
                    {(r.customerName || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{r.customerName}</span>
                      {r.verified && (
                        <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
                          ✓ Verified purchase
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <StarDisplay rating={r.rating} size={13} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">{r.comment}</p>
                    <p className="mt-2 text-xs text-ink/40">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
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

function StarDisplay({ rating, size = 14 }) {
  const rounded = Math.round(rating);
  return (
    <span className="text-gold-dark" style={{ fontSize: size }} aria-label={`${rating} out of 5 stars`}>
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
