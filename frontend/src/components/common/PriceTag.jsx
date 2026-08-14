const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function PriceTag({ price, mrp, size = "md" }) {
  const hasDiscount = mrp && Number(mrp) > Number(price);
  const discountPct = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-semibold text-ink ${sizeClasses[size]}`}>{formatINR(price)}</span>
      {hasDiscount && (
        <>
          <span className="text-sm text-ink/40 line-through">{formatINR(mrp)}</span>
          <span className="text-xs font-semibold text-emerald">{discountPct}% off</span>
        </>
      )}
    </div>
  );
}

export { formatINR };
