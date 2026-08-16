/**
 * Shows shimmering placeholder cards in the exact shape of ProductCard
 * while products are loading. Used instead of a plain spinner on product
 * grids specifically — it reads as "content is arriving" rather than
 * "please wait", which feels considerably more premium and is what most
 * established e-commerce sites (Myntra, Ajio, etc.) do for grid loading.
 */
export default function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] rounded-sm bg-blush" />
          <div className="mt-3 space-y-2">
            <div className="h-2.5 w-1/3 rounded-full bg-blush" />
            <div className="h-3.5 w-4/5 rounded-full bg-blush" />
            <div className="h-3.5 w-1/2 rounded-full bg-blush" />
          </div>
        </div>
      ))}
    </div>
  );
}
