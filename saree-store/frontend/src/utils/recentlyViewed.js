const STORAGE_KEY = "ovee_collection_recently_viewed_v1";
const MAX_ITEMS = 8;

export function trackRecentlyViewed(product) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((p) => p.id !== product.id);
    const entry = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      images: product.images,
      price: product.price,
      discountPrice: product.discountPrice,
      fabric: product.fabric,
      stock: product.stock,
      featured: product.featured,
    };
    const next = [entry, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private browsing, etc.) — not worth failing over
  }
}

export function getRecentlyViewed(excludeId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return excludeId ? list.filter((p) => p.id !== excludeId) : list;
  } catch {
    return [];
  }
}
