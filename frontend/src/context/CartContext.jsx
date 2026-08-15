import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "ovee_collection_cart_v1";

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
      const { product, quantity } = action.payload;
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id
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
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.productId !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity: Math.min(quantity, 10) } : i
        ),
      };
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.productId !== action.payload.productId) };
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
      addItem: (product, quantity = 1) => dispatch({ type: "ADD_ITEM", payload: { product, quantity } }),
      updateQuantity: (productId, quantity) =>
        dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } }),
      removeItem: (productId) => dispatch({ type: "REMOVE_ITEM", payload: { productId } }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),

      buyNowItem,
      startBuyNow: (product, quantity = 1) =>
        setBuyNowItem({
          productId: product.id,
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
