import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../../services/api";

// TODO: replace with your real handles/number
const SOCIAL_LINKS = {
  instagram: "https://instagram.com/oveacollection",
  whatsapp: "https://wa.me/919999999999",
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
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory/10 transition-colors hover:bg-ivory/20"
            >
              <InstagramIcon />
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory/10 transition-colors hover:bg-ivory/20"
            >
              <WhatsAppIcon />
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
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-light">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/80">
            <li>Shipping across India</li>
            <li>Secure payments via Razorpay</li>
            <li>support@oveecollection.example</li>
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

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.6 0-3.09-.44-4.36-1.21l-.31-.19-3 .79.8-2.92-.2-.3A7.94 7.94 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.4-5.6c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.42-1.33-1.66-.14-.24-.01-.37.11-.49.11-.11.24-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.4-.14 0-.3-.02-.46-.02s-.42.06-.64.3c-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}
