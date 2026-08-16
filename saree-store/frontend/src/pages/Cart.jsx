import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/common/Button";

export default function Cart() {
  const { items, subtotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse our collection of handwoven sarees and find something you love."
        actionLabel="Start Shopping"
        actionTo="/shop"
      />
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl text-ink">Your Cart</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[1fr_340px]">
        <div>
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
          <Link to="/shop" className="mt-4 inline-block text-sm text-maroon underline">
            Continue shopping
          </Link>
        </div>

        <CartSummary subtotal={subtotal}>
          <Button className="mt-6 w-full" onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </Button>
        </CartSummary>
      </div>
    </div>
  );
}
