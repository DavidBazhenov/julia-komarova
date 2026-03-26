import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categorySeeds = [
  {
    slug: "solo-exhibitions",
    title: "Персональные выставки",
    titleRu: "Персональные выставки",
    titleEn: "Solo exhibition",
    sortOrder: 1,
    isVisible: true,
  },
  {
    slug: "group-exhibitions",
    title: "Групповые выставки",
    titleRu: "Групповые выставки",
    titleEn: "Group exhibition",
    sortOrder: 2,
    isVisible: true,
  },
  {
    slug: "press",
    title: "Публикации",
    titleRu: "Публикации",
    titleEn: "Press",
    sortOrder: 3,
    isVisible: true,
  },
];

const slugBySection = {
  SOLO: "solo-exhibitions",
  GROUP: "group-exhibitions",
  PRESS: "press",
};

async function main() {
  const createdCategories = [];

  for (const category of categorySeeds) {
    const item = await prisma.exhibitionCategory.upsert({
      where: { slug: category.slug },
      update: {
        title: category.title,
        titleRu: category.titleRu,
        titleEn: category.titleEn,
        sortOrder: category.sortOrder,
        isVisible: category.isVisible,
      },
      create: category,
    });

    createdCategories.push(item);
  }

  const categoryIdBySlug = Object.fromEntries(
    createdCategories.map((item) => [item.slug, item.id]),
  );

  const exhibitions = await prisma.exhibition.findMany({
    select: {
      id: true,
      slug: true,
      section: true,
      categoryId: true,
    },
  });

  for (const exhibition of exhibitions) {
    const categorySlug = slugBySection[exhibition.section ?? "GROUP"] ?? "group-exhibitions";
    const categoryId = categoryIdBySlug[categorySlug];

    if (!categoryId) {
      continue;
    }

    if (exhibition.categoryId === categoryId) {
      continue;
    }

    await prisma.exhibition.update({
      where: { id: exhibition.id },
      data: {
        categoryId,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        categories: createdCategories.map(({ id, slug, titleRu, titleEn }) => ({
          id,
          slug,
          titleRu,
          titleEn,
        })),
        updatedExhibitions: exhibitions.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
