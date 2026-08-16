import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

const navItems = [
  { to: "/account", label: "Profile", end: true, icon: "user" },
  { to: "/account/orders", label: "Orders", icon: "bag" },
  { to: "/account/addresses", label: "Addresses", icon: "pin" },
  { to: "/wishlist", label: "Wishlist", icon: "heart" },
];

export default function AccountLayout() {
  const { user, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="mb-6 font-display text-2xl text-ink sm:text-3xl">My Account</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-sm border border-ink/10 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-maroon font-display text-lg text-ivory">
                {(user?.name || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{user?.name}</p>
                <p className="truncate text-xs text-ink/50">{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="mt-3 overflow-hidden rounded-sm border border-ink/10 bg-white">
            {navItems.map((item, idx) => {
              const isActive =
                item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={`flex items-center gap-3 px-4 py-3.5 text-sm transition-colors ${
                    idx > 0 ? "border-t border-ink/10" : ""
                  } ${isActive ? "bg-blush/60 font-medium text-maroon" : "text-ink/70 hover:bg-blush/30"}`}
                >
                  <SidebarIcon name={item.icon} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronIcon />
                </NavLink>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 border-t border-ink/10 px-4 py-3.5 text-left text-sm text-maroon transition-colors hover:bg-blush/30"
            >
              <SidebarIcon name="logout" />
              <span className="flex-1">Log out</span>
            </button>
          </nav>
        </aside>

        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink/30">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidebarIcon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (name) {
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20c1.5-3.5 5-5 7.5-5s6 1.5 7.5 5" strokeLinecap="round" />
        </svg>
      );
    case "bag":
      return (
        <svg {...common}>
          <path d="M6 8h12l1 12H5L6 8z" strokeLinejoin="round" />
          <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-6.5 7-11.5A7 7 0 105 9.5C5 14.5 12 21 12 21z" strokeLinejoin="round" />
          <circle cx="12" cy="9.5" r="2.3" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path
            d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2 4.5 6 4c2.2-.3 4.2.9 6 3 1.8-2.1 3.8-3.3 6-3 4 .5 5.6 4.4 4 7.8-2.5 4.6-10 9.2-10 9.2z"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
