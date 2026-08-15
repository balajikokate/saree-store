import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import Loader from "../common/Loader";

export default function ProtectedCustomerRoute() {
  const { isAuthenticated, checked } = useCustomerAuth();
  const location = useLocation();

  if (!checked) {
    return <Loader label="Checking session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
