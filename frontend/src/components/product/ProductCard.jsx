import { Link } from "react-router-dom";
import { useState } from "react";
import PriceTag from "../common/PriceTag";
import { useCart } from "../../context/CartContext";
import { resolveImageUrl } from "../../utils/image";

export default function ProductCard({ product }) {
  const { name, slug, images, price, discountPrice, fabric, stock } = product;
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e) => {
    // Card is wrapped in a <Link> — stop the click from also navigating.
    e.preventDefault();
    e.stopPropagation();
    if (stock === 0) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
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
        {stock === 0 && (
          <span className="absolute left-3 top-3 rounded-sm bg-ink/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ivory">
            Sold out
          </span>
        )}

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
        <h3 className="font-display text-base text-ink group-hover:text-maroon">{name}</h3>
        <PriceTag price={discountPrice ?? price} mrp={discountPrice ? price : null} />
      </div>
    </Link>
  );
}
