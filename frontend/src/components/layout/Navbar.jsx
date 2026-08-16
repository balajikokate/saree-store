import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { productApi } from "../../services/api";
import logo from "../../assets/icons/ovee4.png";

export default function Navbar() {
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { isAuthenticated, user, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);

  // Dynamic — reflects whatever categories currently exist, so a new
  // category added in the admin panel shows up here automatically without
  // a code change or redeploy.
  useEffect(() => {
    productApi.categories().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const navLinks = [
    { to: "/shop", label: "All Sarees" },
    ...categories.map((c) => ({ to: `/shop?category=${c.slug}`, label: c.name })),
  ];

  const handleLogout = async () => {
    await logout();
    setAccountMenuOpen(false);
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    setMenuOpen(false);
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Link to="/" className="flex flex-shrink-0 items-center">
          <img
            src={logo}
            alt="Ovee Collection"
            className="h-14 w-auto"
            fetchPriority="high"
            decoding="async"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `whitespace-nowrap text-sm font-medium tracking-wide transition-colors hover:text-maroon ${
                  isActive ? "text-maroon" : "text-ink/70"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop search */}
        <form onSubmit={handleSearchSubmit} className="hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sarees…"
              className="w-full rounded-full border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-ink/40 focus:border-maroon focus:outline-none"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
              <SearchIcon />
            </span>
          </div>
        </form>

        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-3">
          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen((o) => !o)}
            aria-label="Search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-blush md:hidden"
          >
            <SearchIcon />
          </button>

          {/* Account */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setAccountMenuOpen((o) => !o)}
              aria-label="Account"
              aria-expanded={accountMenuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-blush"
            >
              <UserIcon />
            </button>
            {accountMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-sm border border-ink/10 bg-white py-2 shadow-card">
                  {isAuthenticated ? (
                    <>
                      <p className="truncate px-4 py-1.5 text-xs text-ink/50">{user?.email}</p>
                      <Link
                        to="/account"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-ink/80 hover:bg-blush"
                      >
                        My Account
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-ink/80 hover:bg-blush"
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-sm text-maroon hover:bg-blush"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-ink/80 hover:bg-blush"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-ink/80 hover:bg-blush"
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <Link
            to="/wishlist"
            aria-label={`Wishlist, ${wishlistCount} item${wishlistCount === 1 ? "" : "s"}`}
            className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-blush sm:inline-flex"
          >
            <HeartIcon />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose text-[11px] font-semibold text-ivory">
                {wishlistCount}
              </span>
            )}
          </Link>

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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-blush lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <form onSubmit={handleSearchSubmit} className="border-t border-ink/10 bg-ivory px-4 py-3 md:hidden">
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sarees…"
              autoFocus
              className="w-full rounded-full border border-ink/15 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-ink/40 focus:border-maroon focus:outline-none"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
              <SearchIcon />
            </span>
          </div>
        </form>
      )}

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-ink/10 bg-ivory px-4 pb-4 lg:hidden">
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
          <Link
            to="/wishlist"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-between rounded-sm px-2 py-3 text-sm font-medium text-ink/80 hover:bg-blush"
          >
            Wishlist
            {wishlistCount > 0 && <span className="text-xs text-rose">{wishlistCount}</span>}
          </Link>
          <div className="mt-1 border-t border-ink/10 pt-2">
            {isAuthenticated ? (
              <>
                <Link to="/account" onClick={() => setMenuOpen(false)} className="block rounded-sm px-2 py-3 text-sm font-medium text-ink/80 hover:bg-blush">
                  My Account
                </Link>
                <Link to="/account/orders" onClick={() => setMenuOpen(false)} className="block rounded-sm px-2 py-3 text-sm font-medium text-ink/80 hover:bg-blush">
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full rounded-sm px-2 py-3 text-left text-sm font-medium text-maroon hover:bg-blush"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block rounded-sm px-2 py-3 text-sm font-medium text-ink/80 hover:bg-blush">
                  Log in
                </Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="block rounded-sm px-2 py-3 text-sm font-medium text-ink/80 hover:bg-blush">
                  Create account
                </Link>
              </>
            )}
          </div>
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

function HeartIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2 4.5 6 4c2.2-.3 4.2.9 6 3 1.8-2.1 3.8-3.3 6-3 4 .5 5.6 4.4 4 7.8-2.5 4.6-10 9.2-10 9.2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-3.5 5-5 7.5-5s6 1.5 7.5 5" strokeLinecap="round" />
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
