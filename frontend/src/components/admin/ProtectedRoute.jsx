import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import Loader from "../common/Loader";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  // isAuthenticated is null while the initial session check (GET /admin/me)
  // is still in flight — show a loader rather than redirecting prematurely,
  // which would otherwise flash the login page for a split second on every
  // admin page load/refresh even for an already-logged-in session.
  if (isAuthenticated === null) {
    return <Loader label="Checking session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
