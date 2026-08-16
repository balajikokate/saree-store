import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { productApi } from "../services/api";
import ProductGrid from "../components/product/ProductGrid";
import ProductGridSkeleton from "../components/product/ProductGridSkeleton";
import ProductFilters from "../components/product/ProductFilters";
import Breadcrumbs from "../components/common/Breadcrumbs";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = {
    category: searchParams.get("category") || "",
    fabric: searchParams.get("fabric") || "",
    occasion: searchParams.get("occasion") || "",
    search: searchParams.get("search") || "",
    sort: searchParams.get("sort") || "newest",
    page: searchParams.get("page") || "1",
  };

  const activeFilterCount = ["category", "fabric", "occasion"].filter((k) => filters[k]).length;

  const applyFilters = useCallback(
    (next) => {
      const params = {};
      Object.entries({ ...next, page: "1" }).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      setSearchParams(params);
    },
    [setSearchParams]
  );

  useEffect(() => {
    productApi.categories().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    productApi
      .list({ ...filters, limit: 12 })
      .then((res) => {
        if (!active) return;
        setProducts(res.data);
        setPagination(res.pagination);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Lock background scroll while the mobile filter drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFiltersOpen]);

  const goToPage = (page) => {
    const params = Object.fromEntries(searchParams);
    setSearchParams({ ...params, page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ label: filters.search ? `Search: "${filters.search}"` : "All Sarees" }]} />
      <h1 className="font-display text-2xl text-ink sm:text-3xl">
        {filters.search ? `Results for "${filters.search}"` : "All Sarees"}
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        {pagination.total ?? 0} sarees found
        {filters.search && (
          <button
            onClick={() => {
              const params = Object.fromEntries(searchParams);
              delete params.search;
              setSearchParams(params);
            }}
            className="ml-3 font-medium text-maroon underline"
          >
            Clear search
          </button>
        )}
      </p>

      {/* Mobile filter trigger */}
      <div className="mt-4 flex items-center gap-2 md:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-sm border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-maroon text-[11px] font-semibold text-ivory">
              {activeFilterCount}
            </span>
          )}
        </button>
        <select
          value={filters.sort}
          onChange={(e) => applyFilters({ ...filters, sort: e.target.value })}
          className="input-field flex-1"
          aria-label="Sort by"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-10 sm:mt-8 md:grid-cols-[220px_1fr]">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <ProductFilters
            filters={filters}
            categories={categories}
            onChange={applyFilters}
            onClear={() => setSearchParams({})}
          />
        </div>

        <div>
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : (
            <>
              <ProductGrid products={products} />
              {pagination.totalPages > 1 && (
                <div className="mt-10 flex flex-wrap justify-center gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`h-9 w-9 rounded-sm text-sm ${
                        Number(filters.page) === p
                          ? "bg-maroon text-ivory"
                          : "border border-ink/15 text-ink/70 hover:border-maroon"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer: slides up from the bottom, capped height, its own scroll */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-ivory shadow-xl">
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="font-display text-lg text-ink">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-blush"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">
              <ProductFilters
                filters={filters}
                categories={categories}
                onChange={applyFilters}
                onClear={() => setSearchParams({})}
                footer={
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="btn-primary mt-2 w-full"
                  >
                    Show {pagination.total ?? 0} results
                  </button>
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
