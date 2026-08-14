import ProductCard from "./ProductCard";
import EmptyState from "../common/EmptyState";

export default function ProductGrid({ products }) {
  if (!products || products.length === 0) {
    return (
      <EmptyState
        title="No sarees match your filters"
        description="Try adjusting or clearing your filters to see more results."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
