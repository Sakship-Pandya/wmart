// Sample data so the store pages have something to show before the real import.
// Run: npm run db:seed
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const brands = ["HP", "Dell", "Lenovo", "Asus", "Acer", "Apple"];
  for (const name of brands) {
    await db.brand.upsert({
      where: { slug: name.toLowerCase() },
      update: {},
      create: { name, slug: name.toLowerCase() },
    });
  }

  const categories = [
    ["Laptop Batteries", "laptop-batteries"],
    ["Laptop Adapters", "laptop-adapters"],
    ["Power Cables", "power-cables"],
    ["Accessories", "accessories"],
  ];
  for (const [name, slug] of categories) {
    await db.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
  }

  await db.product.upsert({
    where: { slug: "hp-hs04-41wh-4-cell-battery" },
    update: {},
    create: {
      slug: "hp-hs04-41wh-4-cell-battery",
      title: "HP HS04 41Wh 4 Cell Battery for 240 245 250 255 G4 Pavilion 14-ac 15-ac",
      description: "Original HP HS04 replacement battery. 14.8V, 41Wh, 4 cell.",
      brand: { connect: { slug: "hp" } },
      category: { connect: { slug: "laptop-batteries" } },
      mrp: 509900,
      price: 179900,
      stock: 25,
      isOriginal: true,
      hsnCode: "85076000",
      specs: { voltage: "14.8V", capacity: "41Wh", cells: 4 },
      partNumbers: { create: [{ code: "HS04" }, { code: "807956-001" }, { code: "N2L85AA" }] },
      compatibleWith: {
        create: [{ name: "HP 250 G4" }, { name: "HP Pavilion 15-ac" }, { name: "HP Pavilion 14-ac" }],
      },
    },
  });

  await db.product.upsert({
    where: { slug: "dell-65w-adapter-latitude-3490" },
    update: {},
    create: {
      slug: "dell-65w-adapter-latitude-3490",
      title: "Dell 65W Laptop Charger for Latitude 3490, 3590",
      brand: { connect: { slug: "dell" } },
      category: { connect: { slug: "laptop-adapters" } },
      mrp: 334900,
      price: 94800,
      stock: 40,
      hsnCode: "85044030",
      specs: { output: "19.5V 3.34A", connector: "4.5mm" },
      partNumbers: { create: [{ code: "MGJN9" }] },
      compatibleWith: { create: [{ name: "Dell Latitude 3490" }, { name: "Dell Latitude 3590" }] },
    },
  });

  console.log("Seed data added.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
