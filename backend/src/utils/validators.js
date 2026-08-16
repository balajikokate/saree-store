const { z } = require("zod");

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2, "Name is too short").max(100),
    email: z.string().email("Invalid email"),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    addressLine: z.string().min(5, "Address is too short").max(250),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1, "Cart is empty"),
  couponCode: z.string().max(30).optional(),
  giftWrap: z.boolean().optional(),
  giftNote: z.string().max(300).optional(),
});

const verifyPaymentSchema = z.object({
  orderId: z.string().uuid(), // our internal Order.id
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const adminProductSchema = z.object({
  name: z.string().min(2, "Name is too short").max(200),
  slug: z.string().min(2).max(200).optional(), // auto-generated from name if omitted
  description: z.string().min(10, "Description is too short").max(2000),
  fabric: z.string().min(2).max(100),
  color: z.string().min(2).max(50),
  occasion: z.string().min(2).max(50),
  price: z.number().positive("Price must be greater than 0"),
  discountPrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  images: z.array(z.string()).min(1, "At least one image is required"),
  featured: z.boolean().optional(),
  categorySlug: z.string().min(1, "Category is required"),
});

const adminCategorySchema = z.object({
  name: z.string().min(2, "Name is too short").max(100),
  slug: z.string().min(2).max(100).optional(),
});

const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
});

const customerLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(72),
});

const addressSchema = z.object({
  label: z.string().min(1).max(30).default("Home"),
  fullName: z.string().min(2, "Name is too short").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  addressLine: z.string().min(5, "Address is too short").max(250),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  isDefault: z.boolean().optional(),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Rating is required").max(5),
  comment: z.string().min(5, "Please write a few words").max(1000),
});

const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Code is too short")
    .max(30)
    .regex(/^[A-Za-z0-9]+$/, "Use letters and numbers only"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive("Value must be greater than 0"),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().positive().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const couponValidateSchema = z.object({
  code: z.string().min(1, "Enter a coupon code"),
  subtotal: z.number().nonnegative(),
});

const wholesaleInquirySchema = z.object({
  name: z.string().min(2, "Enter your name").max(100),
  businessName: z.string().max(150).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  message: z.string().min(10, "Tell us a bit more about what you're looking for").max(1000),
});

const settingsSchema = z.object({
  theme: z.enum(["royal", "purple", "pink"]),
});

module.exports = {
  checkoutSchema,
  verifyPaymentSchema,
  adminLoginSchema,
  adminProductSchema,
  adminCategorySchema,
  orderStatusSchema,
  signupSchema,
  customerLoginSchema,
  profileUpdateSchema,
  changePasswordSchema,
  addressSchema,
  reviewSchema,
  couponSchema,
  couponValidateSchema,
  wholesaleInquirySchema,
  settingsSchema,
};
