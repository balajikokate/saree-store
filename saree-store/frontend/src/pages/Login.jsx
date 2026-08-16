import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import Button from "../components/common/Button";

export default function Login() {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname || "/account";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-sm border border-ink/10 bg-white p-8 shadow-card">
        <h1 className="font-display text-2xl text-maroon">Welcome back</h1>
        <p className="mt-1 text-sm text-ink/60">Log in to your Ovee Collection account</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink/80">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink/80">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="rounded-sm bg-maroon/10 px-4 py-3 text-sm text-maroon">{error}</p>}

          <Button type="submit" isLoading={submitting} className="w-full">
            Log in
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink/60">
          New here?{" "}
          <Link to="/signup" state={location.state} className="font-medium text-maroon underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
