import { ASSET_BASE_URL } from "../services/api";

/**
 * Resolves a product image reference to a full, loadable URL.
 * - Absolute URLs (http/https, e.g. an external CDN) are returned unchanged.
 * - Relative paths (e.g. "/images/products/kalanjali-paithani/xyz-1.svg", as
 *   served by the backend's static folder) are prefixed with the API origin.
 */
export function resolveImageUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${ASSET_BASE_URL}${pathOrUrl}`;
}
