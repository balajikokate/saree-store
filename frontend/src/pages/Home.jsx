import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../services/api";
import ProductGrid from "../components/product/ProductGrid";
import Loader from "../components/common/Loader";
import bannerImage from "../assets/images/BrandImage.jpeg";

export default function Home() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // Single combined request — categories + a handful of products each —
    // instead of one request per category (avoids a slow request waterfall).
    productApi
      .home({ limit: 4 })
      .then((res) => {
        if (active) setSections(res.data);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon">
        <div className="container-page grid items-center gap-10 py-20 md:grid-cols-2 md:py-28">
          <div className="relative z-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
              Handwoven, not printed
            </p>
            <h1 className="font-display text-4xl leading-tight text-ivory sm:text-5xl">
              Six yards of <span className="text-gold-light">craft</span>, carried through
              generations
            </h1>
            <p className="mt-5 max-w-md text-ivory/75">
              Kalanjali Paithani, Maheshwari cotton and party silks — sourced directly from
              weaver clusters and shipped across India.
            </p>
            <Link to="/shop" className="btn-primary mt-8 bg-gold text-ink hover:bg-gold-dark">
              Explore the collection
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
            <img
              src={bannerImage}
              alt="Model draped in a handwoven silk saree"
              className="h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
        <div className="zari-strip" aria-hidden="true" />
      </section>

      {/* Category quick links */}
      <section className="container-page py-16">
        <h2 className="font-display text-2xl text-ink">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {sections.map(({ category }) => (
            <Link
              key={category.slug}
              to={`/shop?category=${category.slug}`}
              className="group relative aspect-square overflow-hidden rounded-sm bg-blush"
            >
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/60 via-ink/0 to-ink/0 p-4">
                <span className="font-display text-lg text-ivory">{category.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Category-wise product rows */}
      {loading ? (
        <Loader label="Loading sarees" />
      ) : (
        sections.map(({ category, products }) => {
          if (!products || products.length === 0) return null;
          return (
            <section key={category.slug} className="container-page pb-16">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl text-ink">{category.name}</h2>
                <Link to={`/shop?category=${category.slug}`} className="text-sm font-medium text-maroon underline">
                  View all
                </Link>
              </div>
              <ProductGrid products={products} />
            </section>
          );
        })
      )}
    </div>
  );
}
