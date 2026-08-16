import { Link } from "react-router-dom";
import { useState } from "react";
import PriceTag from "../common/PriceTag";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { resolveImageUrl } from "../../utils/image";

export default function ProductCard({ product, showNewBadge = false }) {
  const { id, name, slug, images, price, discountPrice, fabric, stock, featured } = product;
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [added, setAdded] = useState(false);
  const wishlisted = isWishlisted(id);

  const handleAddToCart = (e) => {
    // Card is wrapped in a <Link> — stop the click from also navigating.
    e.preventDefault();
    e.stopPropagation();
    if (stock === 0) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  };

  return (
    <Link to={`/product/${slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-blush">
        <img
          src={resolveImageUrl(images?.[0])}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {showNewBadge && stock > 0 && (
          <div className="absolute -left-9 top-4 w-32 -rotate-45 bg-rose py-1 text-center text-[10px] font-bold uppercase tracking-wider text-ivory shadow-md">
            ✦ New In
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {stock === 0 && (
            <span className="rounded-sm bg-ink/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ivory">
              Sold out
            </span>
          )}
          {featured && stock > 0 && !showNewBadge && (
            <span className="rounded-sm bg-gold px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink">
              Bestseller
            </span>
          )}
        </div>

        <button
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          aria-pressed={wishlisted}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose shadow-card transition-transform hover:scale-110"
        >
          <HeartIcon filled={wishlisted} />
        </button>

        {stock > 0 && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-sm bg-maroon/95 px-3 py-2 text-xs font-semibold text-ivory shadow-card transition-colors hover:bg-maroon-dark"
            aria-label={`Add ${name} to cart`}
          >
            {added ? "Added ✓" : "Add to Cart"}
          </button>
        )}

        <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wide text-ink/50">{fabric}</p>
        <h3 className="line-clamp-2 font-display text-base leading-snug text-ink group-hover:text-maroon">{name}</h3>
        <PriceTag price={discountPrice ?? price} mrp={discountPrice ? price : null} />
      </div>
    </Link>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2 4.5 6 4c2.2-.3 4.2.9 6 3 1.8-2.1 3.8-3.3 6-3 4 .5 5.6 4.4 4 7.8-2.5 4.6-10 9.2-10 9.2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
