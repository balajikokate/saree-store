import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

const tabs = [
  { to: "/account", label: "Profile", end: true },
  { to: "/account/addresses", label: "Addresses" },
  { to: "/account/orders", label: "Orders" },
];

export default function AccountLayout() {
  const { user, logout } = useCustomerAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">My Account</h1>
          {user && <p className="mt-1 text-sm text-ink/60">{user.name} · {user.email}</p>}
        </div>
        <button onClick={handleLogout} className="text-sm font-medium text-maroon underline">
          Log out
        </button>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-ink/10">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? "border-maroon text-maroon" : "border-transparent text-ink/60 hover:text-ink"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
