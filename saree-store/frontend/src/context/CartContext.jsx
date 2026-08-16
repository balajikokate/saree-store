import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "ovee_collection_cart_v2"; // v2: cart lines are now keyed by productId+variantId

// A cart LINE is identified by product + (optional) color variant, so the
// same saree in two different colors are two separate lines rather than
// merging into one (which would be wrong — they may have different stock
// and the customer picked them deliberately as separate items).
function lineKey(productId, variantId) {
  return `${productId}:${variantId || ""}`;
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, variant, quantity } = action.payload;
      const key = lineKey(product.id, variant?.id);
      const existing = state.items.find((i) => lineKey(i.productId, i.variantId) === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            lineKey(i.productId, i.variantId) === key
              ? { ...i, quantity: Math.min(i.quantity + quantity, 10) }
              : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            variantId: variant?.id || null,
            variantColor: variant?.color || null,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0],
            price: Number(product.discountPrice ?? product.price),
            quantity,
          },
        ],
      };
    }
    case "UPDATE_QUANTITY": {
      const { productId, variantId, quantity } = action.payload;
      const key = lineKey(productId, variantId);
      if (quantity <= 0) {
        return { items: state.items.filter((i) => lineKey(i.productId, i.variantId) !== key) };
      }
      return {
        items: state.items.map((i) =>
          lineKey(i.productId, i.variantId) === key ? { ...i, quantity: Math.min(quantity, 10) } : i
        ),
      };
    }
    case "REMOVE_ITEM": {
      const key = lineKey(action.payload.productId, action.payload.variantId);
      return { items: state.items.filter((i) => lineKey(i.productId, i.variantId) !== key) };
    }
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadInitialState);

  // "Buy Now" state is intentionally SEPARATE from the persistent cart above:
  // it lives only in memory (not localStorage), so clicking "Buy Now" never
  // adds the item to the shopper's actual cart or merges with what's already
  // in it. Checkout reads this instead of the cart when it's set.
  const [buyNowItem, setBuyNowItem] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => {
    const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      items: state.items,
      subtotal,
      itemCount,
      // `variant` is optional — pass it for products with color variants,
      // omit it for products without any.
      addItem: (product, quantity = 1, variant = null) =>
        dispatch({ type: "ADD_ITEM", payload: { product, variant, quantity } }),
      updateQuantity: (productId, quantity, variantId = null) =>
        dispatch({ type: "UPDATE_QUANTITY", payload: { productId, variantId, quantity } }),
      removeItem: (productId, variantId = null) =>
        dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId } }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),

      buyNowItem,
      startBuyNow: (product, quantity = 1, variant = null) =>
        setBuyNowItem({
          productId: product.id,
          variantId: variant?.id || null,
          variantColor: variant?.color || null,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0],
          price: Number(product.discountPrice ?? product.price),
          quantity,
        }),
      endBuyNow: () => setBuyNowItem(null),
    };
  }, [state, buyNowItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
