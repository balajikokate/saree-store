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

module.exports = {
  checkoutSchema,
  verifyPaymentSchema,
  adminLoginSchema,
  adminProductSchema,
  adminCategorySchema,
  orderStatusSchema,
};
