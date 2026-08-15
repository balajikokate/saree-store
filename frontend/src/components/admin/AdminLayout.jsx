import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const navItems = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
];

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const navLinks = (onNavigate) => (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-maroon text-ivory" : "text-ink/70 hover:bg-blush"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ivory">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-white px-4 py-3 md:hidden">
        <div>
          <p className="font-display text-lg text-maroon">Ovee Collection</p>
          <p className="text-xs text-ink/50">Admin Panel</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-blush"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <p className="font-display text-lg text-maroon">Menu</p>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-blush"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {navLinks(() => setMobileOpen(false))}
            <div className="border-t border-ink/10 p-3">
              <button
                onClick={handleLogout}
                className="w-full rounded-sm px-3 py-2 text-left text-sm font-medium text-ink/70 hover:bg-blush"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-56 flex-shrink-0 border-r border-ink/10 bg-white md:block">
          <div className="border-b border-ink/10 px-5 py-6">
            <p className="font-display text-lg text-maroon">Ovee Collection</p>
            <p className="text-xs text-ink/50">Admin Panel</p>
          </div>
          {navLinks()}
          <div className="absolute bottom-0 w-56 border-t border-ink/10 p-3">
            <button
              onClick={handleLogout}
              className="w-full rounded-sm px-3 py-2 text-left text-sm font-medium text-ink/70 hover:bg-blush"
            >
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
