import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const navItems = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
];

export default function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-ivory">
      <div className="flex">
        <aside className="sticky top-0 h-screen w-56 flex-shrink-0 border-r border-ink/10 bg-white">
          <div className="border-b border-ink/10 px-5 py-6">
            <p className="font-display text-lg text-maroon">Ovee Collection</p>
            <p className="text-xs text-ink/50">Admin Panel</p>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
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
          <div className="absolute bottom-0 w-56 border-t border-ink/10 p-3">
            <button
              onClick={handleLogout}
              className="w-full rounded-sm px-3 py-2 text-left text-sm font-medium text-ink/70 hover:bg-blush"
            >
              Log out
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
