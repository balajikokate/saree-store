import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { productApi } from "../services/api";
import { useCart } from "../context/CartContext";
import PriceTag from "../components/common/PriceTag";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ProductGrid from "../components/product/ProductGrid";
import { resolveImageUrl } from "../utils/image";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setRelated([]);
    productApi
      .getBySlug(slug)
      .then((res) => {
        if (!active) return;
        setProduct(res.data);
        setActiveImage(0);
        setQuantity(1);
        window.scrollTo({ top: 0, behavior: "instant" in window.history ? "instant" : "auto" });

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
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">{product.name}</h1>
          <div className="mt-3">
            <PriceTag
              price={product.discountPrice ?? product.price}
              mrp={product.discountPrice ? product.price : null}
              size="lg"
            />
          </div>

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
