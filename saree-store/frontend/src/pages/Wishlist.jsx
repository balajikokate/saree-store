import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import PriceTag from "../components/common/PriceTag";
import EmptyState from "../components/common/EmptyState";
import { resolveImageUrl } from "../utils/image";

export default function Wishlist() {
  const { items, remove } = useWishlist();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Tap the heart on any saree to save it here for later."
        actionLabel="Browse Sarees"
        actionTo="/shop"
      />
    );
  }

  const handleMoveToCart = (item) => {
    addItem(
      {
        id: item.productId,
        name: item.name,
        slug: item.slug,
        images: [item.image],
        price: item.mrp,
        discountPrice: item.price,
      },
      1
    );
    remove(item.productId);
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-2xl text-ink sm:text-3xl">My Wishlist</h1>
      <p className="mt-1 text-sm text-ink/60">{items.length} saved saree{items.length === 1 ? "" : "s"}</p>

      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.productId} className="group">
            <Link to={`/product/${item.slug}`} className="block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-blush">
                <img
                  src={resolveImageUrl(item.image)}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.stock === 0 && (
                  <span className="absolute left-3 top-3 rounded-sm bg-ink/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ivory">
                    Sold out
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs uppercase tracking-wide text-ink/50">{item.fabric}</p>
                <h3 className="font-display text-base text-ink group-hover:text-maroon">{item.name}</h3>
                <PriceTag price={item.price} mrp={item.mrp > item.price ? item.mrp : null} />
              </div>
            </Link>
            <div className="mt-2 flex gap-3 text-xs">
              <button
                onClick={() => handleMoveToCart(item)}
                disabled={item.stock === 0}
                className="font-medium text-maroon underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                Move to cart
              </button>
              <button onClick={() => remove(item.productId)} className="font-medium text-ink/50 underline">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
