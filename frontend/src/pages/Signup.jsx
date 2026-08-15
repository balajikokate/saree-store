import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import Button from "../components/common/Button";

const FIELD_VALIDATORS = {
  name: (v) => (v.trim().length < 2 ? "Enter your full name" : ""),
  email: (v) => (!/^\S+@\S+\.\S+$/.test(v) ? "Enter a valid email" : ""),
  password: (v) => (v.length < 8 ? "Password must be at least 8 characters" : ""),
  phone: (v) => (v && !/^[6-9]\d{9}$/.test(v) ? "Enter a valid 10-digit mobile number" : ""),
};

export default function Signup() {
  const { signup } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: FIELD_VALIDATORS[name](value) }));
  };

  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const allErrors = {};
    for (const field of Object.keys(FIELD_VALIDATORS)) {
      allErrors[field] = FIELD_VALIDATORS[field](form[field]);
    }
    setErrors(allErrors);
    setTouched({ name: true, email: true, password: true, phone: true });
    if (Object.values(allErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await signup(form);
      const redirectTo = location.state?.from?.pathname || "/account";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-sm border border-ink/10 bg-white p-8 shadow-card">
        <h1 className="font-display text-2xl text-maroon">Create an account</h1>
        <p className="mt-1 text-sm text-ink/60">Track orders, save addresses, checkout faster</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <Field
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.name ? errors.name : ""}
            autoComplete="name"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email ? errors.email : ""}
            autoComplete="email"
          />
          <Field
            label="Phone (optional)"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.phone ? errors.phone : ""}
            autoComplete="tel"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password ? errors.password : ""}
            autoComplete="new-password"
          />

          {serverError && (
            <p className="rounded-sm bg-maroon/10 px-4 py-3 text-sm text-maroon">{serverError}</p>
          )}

          <Button type="submit" isLoading={submitting} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-medium text-maroon underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, onBlur, error, autoComplete }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-ink/80">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        className="input-field"
        aria-invalid={!!error}
      />
      {error && <p className="mt-1 text-xs text-maroon">{error}</p>}
    </div>
  );
}
