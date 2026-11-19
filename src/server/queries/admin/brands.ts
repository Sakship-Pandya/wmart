import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function getAdminBrands(query?: string) {
  await requireAdmin();

  const trimmed = query?.trim();

  return db.brand.findMany({
    where: trimmed
      ? {
          OR: [
            { name: { contains: trimmed, mode: "insensitive" } },
            { slug: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

