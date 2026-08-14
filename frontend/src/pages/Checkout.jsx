import { useState } from "react";
import { useCart } from "../context/CartContext";
import { orderApi } from "../services/api";
import CartSummary from "../components/cart/CartSummary";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your full name";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Enter a valid email";
  if (!/^[6-9]\d{9}$/.test(form.phone)) errors.phone = "Enter a valid 10-digit mobile number";
  if (form.addressLine.trim().length < 5) errors.addressLine = "Enter your full address";
  if (form.city.trim().length < 2) errors.city = "Enter your city";
  if (form.state.trim().length < 2) errors.state = "Enter your state";
  if (!/^\d{6}$/.test(form.pincode)) errors.pincode = "Enter a valid 6-digit pincode";
  return errors;
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add a few sarees to your cart before checking out."
        actionLabel="Start Shopping"
        actionTo="/shop"
      />
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setServerError("Unable to load the payment gateway. Check your connection and try again.");
        setSubmitting(false);
        return;
      }

      const checkoutRes = await orderApi.checkout({
        customer: form,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      const { orderId, orderNumber, amount, currency, razorpayOrderId, razorpayKeyId } =
        checkoutRes.data;

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount,
        currency,
        name: "Ovee Collection",
        description: `Order ${orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#6E1423" },
        handler: async (response) => {
          try {
            await orderApi.verifyPayment({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            // Close the Razorpay widget explicitly, then do a FULL browser
            // navigation (not client-side routing) to the success page.
            // Razorpay's checkout SDK injects iframes and background
            // listeners into the page; a normal SPA route change leaves
            // those running indefinitely since the document never reloads.
            // A hard redirect guarantees they're fully torn down.
            rzp.close();
            window.location.href = `/order-success/${orderNumber}`;
          } catch (err) {
            setServerError(err.message || "Payment verification failed. Contact support with your order number: " + orderNumber);
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });

      rzp.on("payment.failed", () => {
        setServerError("Payment failed. Please try again or use a different payment method.");
        setSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      setServerError(err.message || "Something went wrong while creating your order.");
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl text-ink">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[1fr_340px]">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <h2 className="font-display text-lg text-ink">Shipping Details</h2>

          <Field label="Full Name" name="name" value={form.name} onChange={handleChange} error={errors.name} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
            <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} />
          </div>
          <Field label="Address" name="addressLine" value={form.addressLine} onChange={handleChange} error={errors.addressLine} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="City" name="city" value={form.city} onChange={handleChange} error={errors.city} />
            <Field label="State" name="state" value={form.state} onChange={handleChange} error={errors.state} />
            <Field label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} error={errors.pincode} />
          </div>

          {serverError && (
            <p className="rounded-sm bg-maroon/10 px-4 py-3 text-sm text-maroon">{serverError}</p>
          )}

          <Button type="submit" isLoading={submitting} className="w-full sm:w-auto">
            Pay with Razorpay
          </Button>
          <p className="text-xs text-ink/50">
            You'll be redirected to Razorpay's secure checkout to complete payment via UPI, card, or netbanking.
          </p>
        </form>

        <CartSummary subtotal={subtotal} />
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, error }) {
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
        className="input-field"
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-maroon">
          {error}
        </p>
      )}
    </div>
  );
}
