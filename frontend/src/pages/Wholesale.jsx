import { useState } from "react";
import { wholesaleApi } from "../services/api";
import Button from "../components/common/Button";

const initialForm = { name: "", businessName: "", email: "", phone: "", message: "" };

export default function Wholesale() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await wholesaleApi.submit(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to send your inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-16 text-center">
        <div>
          <h1 className="font-display text-2xl text-maroon">Thank you!</h1>
          <p className="mt-2 text-sm text-ink/60">
            We've received your inquiry and will get back to you within 1-2 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-xl py-12">
      <h1 className="font-display text-3xl text-ink">Wholesale & Bulk Orders</h1>
      <p className="mt-2 text-sm text-ink/60">
        Sourcing sarees for a boutique, event, or resale? Tell us what you need and we'll get back
        to you with pricing and availability.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Your Name" name="name" value={form.name} onChange={handleChange} required />
        <Field label="Business Name (optional)" name="businessName" value={form.businessName} onChange={handleChange} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">
            What are you looking for?
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={5}
            required
            placeholder="Quantities, fabrics/categories of interest, timeline, etc."
            className="input-field"
          />
        </div>

        {error && <p className="rounded-sm bg-maroon/10 px-4 py-3 text-sm text-maroon">{error}</p>}

        <Button type="submit" isLoading={submitting} className="w-full sm:w-auto">
          Send Inquiry
        </Button>
      </form>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, required }) {
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
        required={required}
        className="input-field"
      />
    </div>
  );
}
