import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../services/api";
import ProductGrid from "../components/product/ProductGrid";
import ProductGridSkeleton from "../components/product/ProductGridSkeleton";
import { getRecentlyViewed } from "../utils/recentlyViewed";
import bannerImage from "../assets/images/BrandImage.jpeg";
import heroVideo from "../assets/videos/hero-banner.mp4";

const TRUST_BADGES = [
  { icon: "shield", label: "Secure Payments", detail: "UPI, cards & netbanking via Razorpay" },
  { icon: "loom", label: "Authentic Handloom", detail: "Sourced directly from weaver clusters" },
  { icon: "truck", label: "Pan-India Delivery", detail: "Shipped safely to your doorstep" },
  { icon: "support", label: "Easy Support", detail: "Real help, whenever you need it" },
];

export default function Home() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      productApi.list({ sort: "newest", limit: 8 }),
      // Single combined request — categories + a handful of products each —
      // instead of one request per category (avoids a slow request waterfall).
      productApi.home({ limit: 4 }),
    ])
      .then(([newArrivalsRes, homeRes]) => {
        if (!active) return;
        setNewArrivals(newArrivalsRes.data);
        setSections(homeRes.data);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));

    setRecentlyViewed(getRecentlyViewed());
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon">
        <div className="container-page grid items-center gap-8 py-14 sm:gap-10 sm:py-20 md:grid-cols-2 md:py-28">
          <div className="relative z-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
              Handwoven, not printed
            </p>
            <h1 className="font-display text-3xl leading-tight text-ivory sm:text-4xl md:text-5xl">
              Six yards of <span className="text-gold-light">craft</span>, carried through
              generations
            </h1>
            <p className="mt-4 max-w-md text-sm text-ivory/75 sm:mt-5 sm:text-base">
              Kalanjali Paithani, Maheshwari cotton and party silks — sourced directly from
              weaver clusters and shipped across India.
            </p>
            <Link to="/shop" className="btn-primary mt-6 bg-gold text-ink hover:bg-gold-dark sm:mt-8">
              Explore the collection
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
            <video
              className="h-full w-full object-cover"
              poster={bannerImage}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="A short video introducing Ovee Collection's handwoven sarees"
            >
              <source src={heroVideo} type="video/mp4" />
            </video>
          </div>
        </div>
        <div className="zari-strip" aria-hidden="true" />
      </section>

      {/* Trust badges */}
      <section className="border-b border-ink/10 bg-blush/40">
        <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4 sm:gap-4 sm:py-10">
          {TRUST_BADGES.map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white text-maroon shadow-card">
                <BadgeIcon name={b.icon} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{b.label}</p>
                <p className="hidden text-xs text-ink/60 sm:block">{b.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="container-page py-12 sm:py-16">
          <ProductGridSkeleton count={8} />
        </div>
      ) : (
        <>
          {/* New Arrivals — visually distinct so it catches the eye */}
          {newArrivals.length > 0 && (
            <section className="border-y border-rose/20 bg-gradient-to-b from-rose/10 via-blush/20 to-transparent py-12 sm:py-16">
              <div className="container-page">
                <div className="mb-5 flex items-center justify-between sm:mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose" />
                      </span>
                      <h2 className="font-display text-xl text-ink sm:text-2xl">New Arrivals</h2>
                    </div>
                    <p className="mt-1 text-sm text-ink/60">Just landed — freshly added to the collection</p>
                  </div>
                  <Link to="/shop?sort=newest" className="text-sm font-medium text-maroon underline">
                    View all
                  </Link>
                </div>
                <ProductGrid products={newArrivals} showNewBadge />
              </div>
            </section>
          )}

          {/* Category-wise product rows */}
          {sections.map(({ category, products }) => {
            if (!products || products.length === 0) return null;
            return (
              <section key={category.slug} className="container-page pb-12 sm:pb-16">
                <div className="mb-5 flex items-center justify-between sm:mb-6">
                  <h2 className="font-display text-xl text-ink sm:text-2xl">{category.name}</h2>
                  <Link to={`/shop?category=${category.slug}`} className="text-sm font-medium text-maroon underline">
                    View all
                  </Link>
                </div>
                <ProductGrid products={products} />
              </section>
            );
          })}

          {/* Recently viewed */}
          {recentlyViewed.length > 0 && (
            <section className="container-page pb-12 sm:pb-16">
              <h2 className="mb-5 font-display text-xl text-ink sm:mb-6 sm:text-2xl">Recently Viewed</h2>
              <ProductGrid products={recentlyViewed} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function BadgeIcon({ name }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (name) {
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "loom":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <path d="M3 9h18M3 14h18M8 4v16M16 4v16" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M3 6h11v9H3z" />
          <path d="M14 10h4l3 3v2h-7z" />
          <circle cx="7" cy="18" r="1.6" />
          <circle cx="17.5" cy="18" r="1.6" />
        </svg>
      );
    case "support":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
