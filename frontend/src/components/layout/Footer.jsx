import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-24 bg-maroon text-ivory">
      <div className="zari-strip" aria-hidden="true" />
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <h3 className="font-display text-xl">Ovee Collection</h3>
          <p className="mt-3 max-w-xs text-sm text-ivory/70">
            Handloom and silk sarees, woven by artisans across India and delivered to your door.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-light">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-ivory/80">
            <li><Link to="/shop?category=kalanjali-paithani" className="hover:text-gold-light">Kalanjali Paithani</Link></li>
            <li><Link to="/shop?category=maheshwari-cotton" className="hover:text-gold-light">Maheshwari Cotton</Link></li>
            <li><Link to="/shop?category=chiffon-georgette" className="hover:text-gold-light">Chiffon & Georgette</Link></li>
            <li><Link to="/shop?category=party-wear" className="hover:text-gold-light">Party Wear</Link></li>
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
