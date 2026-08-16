import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../../services/api";

const STORE_INFO = {
  instagram: "https://www.instagram.com/ovee_collection_pune",
  instagramHandle: "@ovee_collection_pune",
  email: "oveecollection1103@gmail.com",
  address: "Shop No. 1, Savali Apartment, Opposite Adiraj Cluster, Behind Dualat Petrol Pump, Pirangut Road, Bhugaon - 412115",
};

export default function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    productApi.categories().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  return (
    <footer className="mt-24 bg-maroon text-ivory">
      <div className="zari-strip" aria-hidden="true" />
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h3 className="font-display text-xl">Ovee Collection</h3>
          <p className="mt-3 max-w-xs text-sm text-ivory/70">
            Handloom and silk sarees, woven by artisans across India and delivered to your door.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href={STORE_INFO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory/10 transition-colors hover:bg-ivory/20"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-light">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/80">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={`/shop?category=${c.slug}`} className="hover:text-gold-light">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-light">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/80">
            <li><Link to="/wholesale" className="hover:text-gold-light">Wholesale & Bulk Orders</Link></li>
            <li><Link to="/wishlist" className="hover:text-gold-light">My Wishlist</Link></li>
            <li><Link to="/account/orders" className="hover:text-gold-light">Track an Order</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-light">Visit / Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/80">
            <li className="leading-relaxed">{STORE_INFO.address}</li>
            <li>
              <a href={`mailto:${STORE_INFO.email}`} className="hover:text-gold-light">{STORE_INFO.email}</a>
            </li>
            <li>
              <a href={STORE_INFO.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-gold-light">
                {STORE_INFO.instagramHandle}
              </a>
            </li>
            <li>Secure payments via Razorpay</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10 py-5 text-center text-xs text-ivory/50">
        © {new Date().getFullYear()} Ovee Collection. All rights reserved.
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
