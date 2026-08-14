/**
 * Generates simple placeholder product images (SVG), one per saree, organized
 * into category folders under backend/public/images/products/<category-slug>/.
 * Matches the exact filenames referenced in prisma/seed.js.
 *
 * Run with: node scripts/generate-placeholder-images.js
 *
 * TO USE YOUR OWN REAL PHOTOS INSTEAD:
 * Drop real .jpg/.jpeg/.png files into the matching category folder using the
 * same filenames referenced in prisma/seed.js. No other code changes needed —
 * Express serves anything placed under public/images/products/ automatically.
 * IMPORTANT: keep photo file sizes reasonable (compress to ~150-300KB each,
 * max ~1500px wide) — large uncompressed photos are the #1 cause of slow
 * image loading and a poor Lighthouse performance score.
 */
const fs = require("fs");
const path = require("path");

// category, slug, color, label — mirrors prisma/seed.js exactly
const products = [
  { category: "kalanjali-paithani", slug: "blue-kalanjali-paithani", color: "#1B3A6B", label: "Blue Kalanjali Paithani" },
  { category: "kalanjali-paithani", slug: "peacock-kalanjali-paithani", color: "#1F4032", label: "Peacock Kalanjali Paithani" },
  { category: "chiffon-georgette", slug: "blush-pink-georgette-saree", color: "#D98E9B", label: "Blush Pink Georgette" },
  { category: "maheshwari-cotton", slug: "maheshwari-cotton-saree", color: "#3A5A8C", label: "Maheshwari Cotton" },
  { category: "party-wear", slug: "midnight-blue-sequin-party-saree", color: "#1B2A4A", label: "Midnight Blue Sequin" },
  { category: "kalanjali-paithani", slug: "sunflower-yellow-kalanjali-paithani-saree", color: "#D9A82B", label: "Sunflower Yellow Paithani" },
  { category: "chiffon-georgette", slug: "coral-chiffon-printed-saree", color: "#E8785A", label: "Coral Chiffon Printed" },
  { category: "kalanjali-paithani", slug: "classic-red-kalanjali-paithani-bridal-saree", color: "#A11E2B", label: "Classic Red Paithani Bridal" },
  { category: "maheshwari-cotton", slug: "navy-blue-maheshwari-cotton-saree", color: "#1E2E4A", label: "Navy Blue Maheshwari" },
  { category: "maheshwari-cotton", slug: "pastel-pink-maheshwari-cotton-saree", color: "#E8B9C4", label: "Pastel Pink Maheshwari" },
];

function svg(color, label, variant) {
  const textColor = "#FBF6EE";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="${color}"/>
  <rect x="30" y="30" width="740" height="940" fill="none" stroke="#C89B3C" stroke-width="3"/>
  <text x="400" y="480" font-family="Georgia, serif" font-size="34" fill="${textColor}" text-anchor="middle">${label}</text>
  <text x="400" y="530" font-family="Georgia, serif" font-size="20" fill="${textColor}" text-anchor="middle" opacity="0.7">Sample image ${variant} — replace with real photo</text>
</svg>`;
}

const baseDir = path.join(__dirname, "..", "public", "images", "products");

for (const p of products) {
  const dir = path.join(baseDir, p.category);
  fs.mkdirSync(dir, { recursive: true });
  for (const variant of [1, 2]) {
    const filePath = path.join(dir, `${p.slug}-${variant}.svg`);
    fs.writeFileSync(filePath, svg(p.color, p.label, variant));
  }
  console.log(`Generated placeholder images for ${p.slug}`);
}

console.log("\nDone. Placeholder SVGs are in backend/public/images/products/<category>/");
console.log("NOTE: seed.js references some of these as .jpeg (blue-kalanjali-paithani,");
console.log("peacock-kalanjali-paithani, maheshwari-cotton-saree) — those need real .jpeg");
console.log("photo files with matching names, since this script only generates .svg placeholders.");
