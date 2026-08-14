import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import logo from "../../assets/icons/ovee4.png";

const navLinks = [
  { to: "/shop", label: "All Sarees" },
  { to: "/shop?category=kalanjali-paithani", label: "Kalanjali Paithani" },
  { to: "/shop?category=maheshwari-cotton", label: "Maheshwari Cotton" },
  { to: "/shop?category=party-wear", label: "Party Wear" },
];

export default function Navbar() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="Ovee Collection"
            className="h-14 w-auto"
            fetchPriority="high"
            decoding="async"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium tracking-wide transition-colors hover:text-maroon ${
                  isActive ? "text-maroon" : "text-ink/70"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/cart"
            aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-blush"
          >
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-maroon text-[11px] font-semibold text-ivory">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-blush md:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-ink/10 bg-ivory px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="rounded-sm px-2 py-3 text-sm font-medium text-ink/80 hover:bg-blush"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}

      {/* signature zari-border strip */}
      <div className="zari-strip" aria-hidden="true" />
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3h2l2.4 12.2a2 2 0 002 1.8h8.2a2 2 0 002-1.7L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="21" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="21" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      )}
    </svg>
  );
}
