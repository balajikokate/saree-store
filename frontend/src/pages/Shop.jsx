import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { productApi } from "../services/api";
import ProductGrid from "../components/product/ProductGrid";
import ProductFilters from "../components/product/ProductFilters";
import Loader from "../components/common/Loader";

const DEFAULT_FILTERS = { category: "", fabric: "", occasion: "", sort: "newest" };

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const filters = {
    category: searchParams.get("category") || "",
    fabric: searchParams.get("fabric") || "",
    occasion: searchParams.get("occasion") || "",
    sort: searchParams.get("sort") || "newest",
    page: searchParams.get("page") || "1",
  };

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

  const goToPage = (page) => {
    const params = Object.fromEntries(searchParams);
    setSearchParams({ ...params, page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl text-ink">All Sarees</h1>
      <p className="mt-1 text-sm text-ink/60">{pagination.total ?? 0} sarees found</p>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
        <ProductFilters
          filters={filters}
          categories={categories}
          onChange={applyFilters}
          onClear={() => setSearchParams({})}
        />

        <div>
          {loading ? (
            <Loader label="Loading sarees" />
          ) : (
            <>
              <ProductGrid products={products} />
              {pagination.totalPages > 1 && (
                <div className="mt-10 flex justify-center gap-2">
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
    </div>
  );
}
