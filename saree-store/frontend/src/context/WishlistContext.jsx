import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { accountApi } from "../services/api";
import { useCustomerAuth } from "./CustomerAuthContext";

const WishlistContext = createContext(null);
const STORAGE_KEY = "ovee_collection_wishlist_v1";

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function productToItem(product) {
  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    image: product.images?.[0],
    price: Number(product.discountPrice ?? product.price),
    mrp: Number(product.price),
    fabric: product.fabric,
    stock: product.stock,
  };
}

function wishlistReducer(state, action) {
  switch (action.type) {
    case "SET":
      return { items: action.payload.items };
    case "TOGGLE": {
      const { product } = action.payload;
      const exists = state.items.some((i) => i.productId === product.id);
      if (exists) {
        return { items: state.items.filter((i) => i.productId !== product.id) };
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
            mrp: Number(product.price),
            fabric: product.fabric,
            stock: product.stock,
            addedAt: Date.now(),
          },
        ],
      };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.productId !== action.payload.productId) };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

export function WishlistProvider({ children }) {
  const { isAuthenticated, checked } = useCustomerAuth();
  const [state, dispatch] = useReducer(wishlistReducer, undefined, loadInitialState);
  const migratedRef = useRef(false);

  // Always mirror to localStorage — for guests this IS the wishlist; for
  // logged-in customers it's just a harmless offline-friendly cache of
  // whatever the account wishlist currently holds.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // On login, merge anything saved as a guest into the account (one-time),
  // then treat the account's wishlist (from the backend) as the source of
  // truth going forward — this is what makes the wishlist follow the
  // customer across devices instead of being stuck in one browser.
  useEffect(() => {
    if (!checked) return;
    if (!isAuthenticated) {
      migratedRef.current = false;
      return;
    }
    if (migratedRef.current) return;
    migratedRef.current = true;

    const guestItems = loadInitialState().items;

    (async () => {
      try {
        await Promise.all(
          guestItems.map((i) => accountApi.wishlist.add(i.productId).catch(() => {}))
        );
        const res = await accountApi.wishlist.list();
        dispatch({ type: "SET", payload: { items: res.data.map(productToItem) } });
      } catch {
        // Sync failed — keep whatever's already in local state rather than
        // losing it. Not fatal; the wishlist just stays browser-local.
      }
    })();
  }, [isAuthenticated, checked]);

  const value = useMemo(() => {
    const ids = new Set(state.items.map((i) => i.productId));

    const toggle = (product) => {
      const exists = ids.has(product.id);
      dispatch({ type: "TOGGLE", payload: { product } }); // optimistic
      if (isAuthenticated) {
        (exists ? accountApi.wishlist.remove(product.id) : accountApi.wishlist.add(product.id)).catch(
          () => {}
        );
      }
    };

    const remove = (productId) => {
      dispatch({ type: "REMOVE", payload: { productId } });
      if (isAuthenticated) accountApi.wishlist.remove(productId).catch(() => {});
    };

    return {
      items: state.items,
      count: state.items.length,
      isWishlisted: (productId) => ids.has(productId),
      toggle,
      remove,
      clear: () => dispatch({ type: "CLEAR" }),
    };
  }, [state, isAuthenticated]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
