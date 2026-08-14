/**
 * Reusable Button.
 * variant: "primary" | "secondary" | "ghost"
 */
export default function Button({
  children,
  variant = "primary",
  className = "",
  isLoading = false,
  disabled = false,
  type = "button",
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary: "bg-maroon text-ivory hover:bg-maroon-dark",
    secondary: "border border-maroon text-maroon hover:bg-maroon hover:text-ivory",
    ghost: "text-maroon hover:bg-blush",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {isLoading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
