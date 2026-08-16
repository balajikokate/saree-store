/**
 * Seed script — populates categories and sample saree products.
 * Run with: npm run seed
 * Replace the placeholder image URLs with your real product photos before going live.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const categories = [
  { name: "Kalanjali Paithani", slug: "kalanjali-paithani" },
  { name: "Maheshwari Cotton", slug: "maheshwari-cotton" },
  { name: "Chiffon & Georgette", slug: "chiffon-georgette" },
  { name: "Cotton Handloom", slug: "cotton-handloom" },
  { name: "Party Wear", slug: "party-wear" },
];

// Images are served from backend/public/images/products/<category-slug>/
// via Express static middleware (see src/app.js). Replace these files with
// real photos any time — same filenames, no code changes needed.
const productImages = (category, slug, format = 'svg') => [
  `/images/products/${category}/${slug}-1.${format}`,
  `/images/products/${category}/${slug}-2.${format}`,
];

async function main() {
  console.log("🗑️  Clearing existing data...");

  // Delete all products first
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("✅ Existing data cleared");

  console.log("🌱 Seeding categories...");
  const createdCategories = {};
  for (const c of categories) {
    const cat = await prisma.category.create({
      data: c,
    });
    createdCategories[c.slug] = cat;
  }
  console.log("✅ Categories seeded");

  const products = [
    {
      name: "Blue Kalanjali Paithani Saree",
      slug: "blue-kalanjali-paithani",
      description:
        "Handwoven pure Kalanjali Paithani silk saree in Blue with gold zari temple border. Comes with unstitched matching blouse piece.",
      fabric: "Kalanjali Paithani",
      color: "Blue",
      occasion: "Wedding",
      price: 1200,
      discountPrice: 950,
      stock: 12,
      images: productImages("kalanjali-paithani", "blue-kalanjali-paithani", "jpeg"),
      featured: true,
      categorySlug: "kalanjali-paithani",
    },
    {
      name: "Peacock Kalanjali Paithani Saree",
      slug: "peacock-kalanjali-paithani",
      description:
        "Rich Peacock Kalanjali Paithani silk with intricate gold brocade weave and traditional peacock motifs, perfect for festive occasions.",
      fabric: "Kalanjali Paithani",
      color: "Green",
      occasion: "Festive",
      price: 1500,
      discountPrice: 1150,
      stock: 20,
      images: productImages("kalanjali-paithani", "peacock-kalanjali-paithani", "jpeg"),
      featured: true,
      categorySlug: "kalanjali-paithani",
    },
    {
      name: "Blush Pink Georgette Saree",
      slug: "blush-pink-georgette-saree",
      description:
        "Lightweight blush pink georgette saree with delicate sequin embroidery, ideal for evening parties.",
      fabric: "Georgette",
      color: "Pink",
      occasion: "Party",
      price: 5999,
      discountPrice: 4599,
      stock: 30,
      images: productImages("chiffon-georgette", "blush-pink-georgette-saree"),
      featured: true,
      categorySlug: "chiffon-georgette",
    },
    {
      name: "Maheshwari Cotton Saree",
      slug: "maheshwari-cotton-saree",
      description:
        "Breathable Maheshwari cotton saree with  border and traditional Maheshwari stripes, great for daily and office wear.",
      fabric: "Maheshwari Cotton",
      color: "Blue",
      occasion: "Casual",
      price: 3499,
      discountPrice: 2799,
      stock: 45,
      images: productImages("maheshwari-cotton", "maheshwari-cotton-saree", "jpeg"),
      featured: false,
      categorySlug: "maheshwari-cotton",
    },
    {
      name: "Midnight Blue Sequin Party Saree",
      slug: "midnight-blue-sequin-party-saree",
      description:
        "Midnight blue georgette saree fully embellished with sequins and stone work, made for statement evenings.",
      fabric: "Georgette",
      color: "Blue",
      occasion: "Party",
      price: 8999,
      discountPrice: 6499,
      stock: 15,
      images: productImages("party-wear", "midnight-blue-sequin-party-saree"),
      featured: true,
      categorySlug: "party-wear",
    },
    {
      name: "Sunflower Yellow Kalanjali Paithani Saree",
      slug: "sunflower-yellow-kalanjali-paithani-saree",
      description:
        "Vibrant sunflower yellow Kalanjali Paithani silk saree with a contrasting maroon pallu, woven with traditional peacock and lotus motifs.",
      fabric: "Kalanjali Paithani Silk",
      color: "Yellow",
      occasion: "Wedding",
      price: 15999,
      discountPrice: 12999,
      stock: 10,
      images: productImages("kalanjali-paithani", "sunflower-yellow-kalanjali-paithani-saree"),
      featured: false,
      categorySlug: "kalanjali-paithani",
    },
    {
      name: "Coral Chiffon Printed Saree",
      slug: "coral-chiffon-printed-saree",
      description:
        "Soft coral chiffon saree with a floral digital print, an easy breezy pick for summer festivities.",
      fabric: "Chiffon",
      color: "Coral",
      occasion: "Casual",
      price: 3499,
      discountPrice: 2499,
      stock: 40,
      images: productImages("chiffon-georgette", "coral-chiffon-printed-saree"),
      featured: false,
      categorySlug: "chiffon-georgette",
    },
    {
      name: "Classic Red Kalanjali Paithani Bridal Saree",
      slug: "classic-red-kalanjali-paithani-bridal-saree",
      description:
        "Traditional bridal red Kalanjali Paithani silk with a heavy gold zari pallu and temple border with peacock motifs — a timeless choice.",
      fabric: "Pure Kalanjali Paithani Silk",
      color: "Red",
      occasion: "Wedding",
      price: 27999,
      discountPrice: 22999,
      stock: 8,
      images: productImages("kalanjali-paithani", "classic-red-kalanjali-paithani-bridal-saree"),
      featured: true,
      categorySlug: "kalanjali-paithani",
    },
    {
      name: "Navy Blue Maheshwari Cotton Saree",
      slug: "navy-blue-maheshwari-cotton-saree",
      description:
        "Elegant navy blue Maheshwari cotton saree with traditional gold zari border and subtle Maheshwari checks, perfect for office and casual wear.",
      fabric: "Maheshwari Cotton",
      color: "Navy Blue",
      occasion: "Casual",
      price: 2999,
      discountPrice: 2299,
      stock: 35,
      images: productImages("maheshwari-cotton", "navy-blue-maheshwari-cotton-saree"),
      featured: false,
      categorySlug: "maheshwari-cotton",
    },
    {
      name: "Pastel Pink Maheshwari Cotton Saree",
      slug: "pastel-pink-maheshwari-cotton-saree",
      description:
        "Soft pastel pink Maheshwari cotton saree with contrasting green border and traditional striped pallu.",
      fabric: "Maheshwari Cotton",
      color: "Pink",
      occasion: "Casual",
      price: 2799,
      discountPrice: 1999,
      stock: 28,
      images: productImages("maheshwari-cotton", "pastel-pink-maheshwari-cotton-saree"),
      featured: false,
      categorySlug: "maheshwari-cotton",
    },
  ];

  console.log("🌱 Seeding products...");
  for (const p of products) {
    const { categorySlug, ...data } = p;
    await prisma.product.create({
      data: {
        ...data,
        categoryId: createdCategories[categorySlug].id,
      },
    });
  }

  console.log(`✅ Seeded ${products.length} products`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
