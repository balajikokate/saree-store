import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../services/api";
import ProductGrid from "../components/product/ProductGrid";
import Loader from "../components/common/Loader";
import bannerImage from "../assets/images/BrandImage.jpeg";
import heroVideo from "../assets/videos/hero-banner.mp4";

const TRUST_BADGES = [
  { icon: "shield", label: "Secure Payments", detail: "UPI, cards & netbanking via Razorpay" },
  { icon: "loom", label: "Authentic Handloom", detail: "Sourced directly from weaver clusters" },
  { icon: "truck", label: "Pan-India Delivery", detail: "Shipped safely to your doorstep" },
  { icon: "support", label: "Easy Support", detail: "Real help, whenever you need it" },
];

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
              className="h-full w-full"
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

      {/* Category quick links */}
      <section className="container-page py-12 sm:py-16">
        <h2 className="font-display text-xl text-ink sm:text-2xl">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {sections.map(({ category }) => (
            <Link
              key={category.slug}
              to={`/shop?category=${category.slug}`}
              className="group relative aspect-square overflow-hidden rounded-sm bg-blush"
            >
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/60 via-ink/0 to-ink/0 p-3 sm:p-4">
                <span className="font-display text-base text-ivory sm:text-lg">{category.name}</span>
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
        })
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
