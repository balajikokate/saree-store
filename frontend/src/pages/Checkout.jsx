import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { orderApi, accountApi, couponApi } from "../services/api";
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

const FIELD_VALIDATORS = {
  name: (v) => (v.trim().length < 2 ? "Enter your full name" : ""),
  email: (v) => (!/^\S+@\S+\.\S+$/.test(v) ? "Enter a valid email" : ""),
  phone: (v) => (!/^[6-9]\d{9}$/.test(v) ? "Enter a valid 10-digit mobile number" : ""),
  addressLine: (v) => (v.trim().length < 5 ? "Enter your full address" : ""),
  city: (v) => (v.trim().length < 2 ? "Enter your city" : ""),
  state: (v) => (v.trim().length < 2 ? "Enter your state" : ""),
  pincode: (v) => (!/^\d{6}$/.test(v) ? "Enter a valid 6-digit pincode" : ""),
};

function validateAll(form) {
  const errors = {};
  for (const field of Object.keys(FIELD_VALIDATORS)) {
    const msg = FIELD_VALIDATORS[field](form[field]);
    if (msg) errors[field] = msg;
  }
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
  const { items: cartItems, subtotal: cartSubtotal, clearCart } = useCart();
  const { isAuthenticated, user } = useCustomerAuth();
  const location = useLocation();

  // "Buy Now" arrives with a single item in router state and must NOT touch
  // the persisted cart — it's an independent purchase. Fall back to the
  // regular cart otherwise.
  const buyNowItem = location.state?.buyNowItem || null;
  const items = useMemo(() => (buyNowItem ? [buyNowItem] : cartItems), [buyNowItem, cartItems]);
  const subtotal = useMemo(
    () => (buyNowItem ? buyNowItem.price * buyNowItem.quantity : cartSubtotal),
    [buyNowItem, cartSubtotal]
  );

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount }
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [giftWrap, setGiftWrap] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const GIFT_WRAP_FEE = 49;

  // Prefill name/email for logged-in customers, and offer their saved
  // addresses so they don't have to retype anything.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setForm((f) => ({ ...f, name: f.name || user.name || "", email: f.email || user.email || "" }));
    accountApi.addresses
      .list()
      .then((res) => {
        setSavedAddresses(res.data);
        const defaultAddr = res.data.find((a) => a.isDefault);
        if (defaultAddr) applyAddress(defaultAddr);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const applyAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setForm((f) => ({
      ...f,
      name: addr.fullName,
      phone: addr.phone,
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    }));
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError("");
    setCouponChecking(true);
    try {
      const res = await couponApi.validate(code, subtotal);
      if (!res.success) {
        setCouponError(res.message || "This coupon isn't valid");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: res.data.code, discountAmount: res.data.discountAmount });
      }
    } catch (err) {
      setCouponError(err.message || "Failed to check coupon");
      setAppliedCoupon(null);
    } finally {
      setCouponChecking(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

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
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    setTouched((t) => ({ ...t, [name]: true }));
    // Validate live, as the person types — but only surface the error for
    // the field they've actually touched, so we're not flashing "invalid"
    // messages on fields they haven't gotten to yet.
    const msg = FIELD_VALIDATORS[name](value);
    setErrors((prev) => ({ ...prev, [name]: msg }));
  };

  const handleBlur = (e) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const allErrors = validateAll(form);
    setErrors(allErrors);
    setTouched(Object.fromEntries(Object.keys(FIELD_VALIDATORS).map((k) => [k, true])));
    if (Object.values(allErrors).some(Boolean)) return;

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
        couponCode: appliedCoupon?.code,
        giftWrap,
        giftNote: giftWrap ? giftNote : undefined,
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
        // Deliberately NOT overriding config.display here. A hand-curated
        // block/sequence list is fragile: if a listed method (e.g. UPI)
        // happens to be disabled in your Razorpay Dashboard → Settings →
        // Payment Methods, a custom config can silently hide it with no
        // fallback. Razorpay's own default layout already puts UPI first
        // for INR checkouts in India, so the safest, most robust choice is
        // to let Razorpay decide the layout and just ensure every method
        // you want is toggled ON in the Dashboard.
        handler: async (response) => {
          try {
            await orderApi.verifyPayment({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // Only clear the persisted cart if this was a cart checkout —
            // a "Buy Now" purchase never touched the cart, so there's
            // nothing to clear (and clearing it would wrongly wipe out
            // unrelated items the customer still has saved).
            if (!buyNowItem) clearCart();
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
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Checkout</h1>
      {buyNowItem && (
        <p className="mt-1 text-sm text-ink/60">
          Buying this item directly — your saved cart is untouched.
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[1fr_340px]">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <h2 className="font-display text-lg text-ink">Shipping Details</h2>

          {!isAuthenticated && (
            <p className="rounded-sm bg-blush/60 px-4 py-3 text-sm text-ink/70">
              <Link to="/login" state={{ from: location }} className="font-medium text-maroon underline">
                Log in
              </Link>{" "}
              for faster checkout next time, or continue as a guest below.
            </p>
          )}

          {isAuthenticated && savedAddresses.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/80">Use a saved address</label>
              <select
                value={selectedAddressId}
                onChange={(e) => {
                  const addr = savedAddresses.find((a) => a.id === e.target.value);
                  if (addr) applyAddress(addr);
                }}
                className="input-field"
              >
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label} — {addr.addressLine}, {addr.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Field label="Full Name" name="name" value={form.name} onChange={handleChange} onBlur={handleBlur} error={touched.name ? errors.name : ""} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} error={touched.email ? errors.email : ""} />
            <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} onBlur={handleBlur} error={touched.phone ? errors.phone : ""} />
          </div>
          <Field label="Address" name="addressLine" value={form.addressLine} onChange={handleChange} onBlur={handleBlur} error={touched.addressLine ? errors.addressLine : ""} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="City" name="city" value={form.city} onChange={handleChange} onBlur={handleBlur} error={touched.city ? errors.city : ""} />
            <Field label="State" name="state" value={form.state} onChange={handleChange} onBlur={handleBlur} error={touched.state ? errors.state : ""} />
            <Field label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} onBlur={handleBlur} error={touched.pincode ? errors.pincode : ""} />
          </div>

          {serverError && (
            <p className="rounded-sm bg-maroon/10 px-4 py-3 text-sm text-maroon">{serverError}</p>
          )}

          <div className="rounded-sm border border-ink/10 p-4">
            <label className="mb-1 block text-sm font-medium text-ink/80">Coupon code</label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-sm bg-emerald/10 px-3 py-2 text-sm text-emerald">
                <span>
                  <strong>{appliedCoupon.code}</strong> applied — you saved{" "}
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(appliedCoupon.discountAmount)}
                </span>
                <button type="button" onClick={handleRemoveCoupon} className="font-medium underline">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="input-field flex-1"
                />
                <Button type="button" variant="secondary" onClick={handleApplyCoupon} isLoading={couponChecking}>
                  Apply
                </Button>
              </div>
            )}
            {couponError && <p className="mt-1 text-xs text-maroon">{couponError}</p>}
          </div>

          <div className="rounded-sm border border-ink/10 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                className="h-4 w-4 accent-maroon"
              />
              Gift wrap this order (+₹{GIFT_WRAP_FEE})
            </label>
            {giftWrap && (
              <textarea
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                placeholder="Add a gift note (optional)"
                rows={2}
                maxLength={300}
                className="input-field mt-3"
              />
            )}
          </div>

          <Button type="submit" isLoading={submitting} className="w-full sm:w-auto">
            Pay with Razorpay
          </Button>
          <p className="text-xs text-ink/50">
            You'll be redirected to Razorpay's secure checkout to complete payment via UPI, card, or netbanking.
          </p>
        </form>

        <CartSummary
          subtotal={subtotal}
          items={items}
          discountAmount={appliedCoupon?.discountAmount || 0}
          couponCode={appliedCoupon?.code}
          giftWrapFee={giftWrap ? GIFT_WRAP_FEE : 0}
        />
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, onBlur, error }) {
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
