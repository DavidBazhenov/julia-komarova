const categoryLandscapeId = ObjectId("65f100000000000000000001");
const categoryPortraitId = ObjectId("65f100000000000000000002");
const categoryAtmosphericId = ObjectId("65f100000000000000000003");
const exhibitionId = ObjectId("65f100000000000000000301");

const artworkSilentFieldId = ObjectId("65f100000000000000000101");
const artworkGreenFigureId = ObjectId("65f100000000000000000102");
const artworkStudyInRedId = ObjectId("65f100000000000000000103");
const artworkVeilStudyId = ObjectId("65f100000000000000000104");
const artworkWhiteAssemblyId = ObjectId("65f100000000000000000105");
const artworkStillWaterId = ObjectId("65f100000000000000000106");

const imageSilentFieldId = ObjectId("65f100000000000000000201");
const imageGreenFigureId = ObjectId("65f100000000000000000202");
const imageStudyInRedId = ObjectId("65f100000000000000000203");
const imageVeilStudyId = ObjectId("65f100000000000000000204");
const imageWhiteAssemblyId = ObjectId("65f100000000000000000205");
const imageStillWaterId = ObjectId("65f100000000000000000206");

const categorySlugs = ["landscape", "portrait-studies", "atmospheric-series"];
const exhibitionSlugs = ["studio-preview-2026"];
const artworkSlugs = [
  "silent-field",
  "green-figure",
  "study-in-red",
  "veil-study",
  "white-assembly",
  "still-water",
];

const now = new Date();
const publishedAt = new Date("2026-03-22T18:00:00.000Z");

db.Category.deleteMany({
  slug: { $in: categorySlugs },
  _id: { $nin: [categoryLandscapeId, categoryPortraitId, categoryAtmosphericId] },
});

db.Exhibition.deleteMany({
  slug: { $in: exhibitionSlugs },
  _id: { $ne: exhibitionId },
});

db.Artwork.deleteMany({
  slug: { $in: artworkSlugs },
  _id: {
    $nin: [
      artworkSilentFieldId,
      artworkGreenFigureId,
      artworkStudyInRedId,
      artworkVeilStudyId,
      artworkWhiteAssemblyId,
      artworkStillWaterId,
    ],
  },
});

db.ArtworkImage.deleteMany({
  _id: {
    $nin: [
      imageSilentFieldId,
      imageGreenFigureId,
      imageStudyInRedId,
      imageVeilStudyId,
      imageWhiteAssemblyId,
      imageStillWaterId,
    ],
  },
  artworkId: {
    $in: [
      artworkSilentFieldId,
      artworkGreenFigureId,
      artworkStudyInRedId,
      artworkVeilStudyId,
      artworkWhiteAssemblyId,
      artworkStillWaterId,
    ],
  },
});

db.Category.replaceOne(
  { _id: categoryLandscapeId },
  {
    _id: categoryLandscapeId,
    slug: "landscape",
    title: "Пейзажи",
    titleRu: "Пейзажи",
    titleEn: "Landscapes",
    description: "Тестовая категория для реалистичных работ.",
    descriptionRu: "Тестовая категория для реалистичных работ.",
    descriptionEn: "Test category for realistic landscape works.",
    sortOrder: 1,
    isVisible: true,
    createdAt: now,
    updatedAt: now,
  },
  { upsert: true },
);

db.Category.replaceOne(
  { _id: categoryPortraitId },
  {
    _id: categoryPortraitId,
    slug: "portrait-studies",
    title: "Фигурные этюды",
    titleRu: "Фигурные этюды",
    titleEn: "Figure Studies",
    description: "Тестовая категория для фигурных композиций.",
    descriptionRu: "Тестовая категория для фигурных композиций.",
    descriptionEn: "Test category for figurative compositions.",
    sortOrder: 2,
    isVisible: true,
    createdAt: now,
    updatedAt: now,
  },
  { upsert: true },
);

db.Category.replaceOne(
  { _id: categoryAtmosphericId },
  {
    _id: categoryAtmosphericId,
    slug: "atmospheric-series",
    title: "Атмосферическая серия",
    titleRu: "Атмосферическая серия",
    titleEn: "Atmospheric Series",
    description: "Работы о свете, тишине и дистанции.",
    descriptionRu: "Работы о свете, тишине и дистанции.",
    descriptionEn: "Works about light, stillness, and distance.",
    sortOrder: 3,
    isVisible: true,
    createdAt: now,
    updatedAt: now,
  },
  { upsert: true },
);

db.Exhibition.replaceOne(
  { _id: exhibitionId },
  {
    _id: exhibitionId,
    slug: "studio-preview-2026",
    title: "Студийный показ 2026",
    titleRu: "Студийный показ 2026",
    titleEn: "Studio Preview 2026",
    venue: "Julia Komarova Studio",
    city: "Moscow",
    country: "Russia",
    startDate: new Date("2026-05-20T18:00:00.000Z"),
    endDate: new Date("2026-06-10T18:00:00.000Z"),
    description: "Тестовая выставка для проверки витрины и карточек выставок.",
    descriptionRu: "Тестовая выставка для проверки витрины и карточек выставок.",
    descriptionEn: "A seeded exhibition used to validate the exhibitions section and cards.",
    seoTitle: "Студийный показ Julia Komarova",
    seoTitleRu: "Студийный показ Julia Komarova",
    seoTitleEn: "Julia Komarova Studio Preview",
    seoDescription: "Тестовая выставка в рамках seed-данных проекта.",
    seoDescriptionRu: "Тестовая выставка в рамках seed-данных проекта.",
    seoDescriptionEn: "A seeded exhibition entry for validating the website.",
    posterImageUrl: null,
    isPublished: true,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  { upsert: true },
);

const imageDocs = [
  {
    _id: imageSilentFieldId,
    artworkId: artworkSilentFieldId,
    storageKey: "artworks/65f100000000000000000101/65f100000000000000000201",
    url: "/media/artworks/65f100000000000000000101/65f100000000000000000201/display.webp",
    width: 846,
    height: 1280,
    alt: "Тестовое изображение seeded artwork Silent Field",
  },
  {
    _id: imageGreenFigureId,
    artworkId: artworkGreenFigureId,
    storageKey: "artworks/65f100000000000000000102/65f100000000000000000202",
    url: "/media/artworks/65f100000000000000000102/65f100000000000000000202/display.webp",
    width: 846,
    height: 1280,
    alt: "Тестовое изображение seeded artwork Green Figure",
  },
  {
    _id: imageStudyInRedId,
    artworkId: artworkStudyInRedId,
    storageKey: "artworks/65f100000000000000000103/65f100000000000000000203",
    url: "/media/artworks/65f100000000000000000103/65f100000000000000000203/display.webp",
    width: 3999,
    height: 3041,
    alt: "Study in Red",
  },
  {
    _id: imageVeilStudyId,
    artworkId: artworkVeilStudyId,
    storageKey: "artworks/65f100000000000000000104/65f100000000000000000204",
    url: "/media/artworks/65f100000000000000000104/65f100000000000000000204/display.webp",
    width: 3648,
    height: 5472,
    alt: "Veil Study",
  },
  {
    _id: imageWhiteAssemblyId,
    artworkId: artworkWhiteAssemblyId,
    storageKey: "artworks/65f100000000000000000105/65f100000000000000000205",
    url: "/media/artworks/65f100000000000000000105/65f100000000000000000205/display.webp",
    width: 3999,
    height: 3229,
    alt: "White Assembly",
  },
  {
    _id: imageStillWaterId,
    artworkId: artworkStillWaterId,
    storageKey: "artworks/65f100000000000000000106/65f100000000000000000206",
    url: "/media/artworks/65f100000000000000000106/65f100000000000000000206/display.webp",
    width: 2160,
    height: 2160,
    alt: "Still Water",
  },
];

for (const imageDoc of imageDocs) {
  db.ArtworkImage.replaceOne(
    { _id: imageDoc._id },
    {
      ...imageDoc,
      blurDataUrl: null,
      sortOrder: 0,
      isPrimary: true,
      createdAt: now,
    },
    { upsert: true },
  );
}

const artworkDocs = [
  {
    _id: artworkSilentFieldId,
    slug: "silent-field",
    title: "Тихое поле",
    titleRu: "Тихое поле",
    titleEn: "Silent Field",
    description: "Тестовая работа для витрины галереи и детальной страницы.",
    descriptionRu: "Тестовая работа для витрины галереи и детальной страницы.",
    descriptionEn: "Seeded work for validating the gallery and the artwork detail page.",
    year: 2026,
    medium: "Холст, масло",
    mediumRu: "Холст, масло",
    mediumEn: "Oil on canvas",
    dimensions: "120 x 180 cm",
    widthCm: 180,
    heightCm: 120,
    status: "AVAILABLE",
    isFeatured: true,
    isPublished: true,
    sortOrder: 1,
    seoTitle: "Тихое поле | Julia Komarova",
    seoTitleRu: "Тихое поле | Julia Komarova",
    seoTitleEn: "Silent Field | Julia Komarova",
    seoDescription: "Тестовая опубликованная работа для проверки карточек и SEO.",
    seoDescriptionRu: "Тестовая опубликованная работа для проверки карточек и SEO.",
    seoDescriptionEn: "Published seeded artwork used to validate cards and SEO metadata.",
    coverImageId: imageSilentFieldId,
    categoryIds: [categoryLandscapeId, categoryAtmosphericId],
    relatedArtworkIds: [artworkGreenFigureId, artworkStillWaterId],
  },
  {
    _id: artworkGreenFigureId,
    slug: "green-figure",
    title: "Зеленая фигура",
    titleRu: "Зеленая фигура",
    titleEn: "Green Figure",
    description: "Фигурная работа с темным зеленым полем и графичным ритмом ткани.",
    descriptionRu: "Фигурная работа с темным зеленым полем и графичным ритмом ткани.",
    descriptionEn: "Figurative work with a dark green field and a graphic textile rhythm.",
    year: 2025,
    medium: "Холст, масло",
    mediumRu: "Холст, масло",
    mediumEn: "Oil on canvas",
    dimensions: "150 x 100 cm",
    widthCm: 100,
    heightCm: 150,
    status: "AVAILABLE",
    isFeatured: true,
    isPublished: true,
    sortOrder: 2,
    seoTitle: "Зеленая фигура | Julia Komarova",
    seoTitleRu: "Зеленая фигура | Julia Komarova",
    seoTitleEn: "Green Figure | Julia Komarova",
    seoDescription: "Тестовая фигурная работа с загруженным изображением.",
    seoDescriptionRu: "Тестовая фигурная работа с загруженным изображением.",
    seoDescriptionEn: "Seeded figurative artwork with an uploaded image.",
    coverImageId: imageGreenFigureId,
    categoryIds: [categoryPortraitId, categoryAtmosphericId],
    relatedArtworkIds: [artworkSilentFieldId, artworkStudyInRedId],
  },
  {
    _id: artworkStudyInRedId,
    slug: "study-in-red",
    title: "Этюд в красном",
    titleRu: "Этюд в красном",
    titleEn: "Study in Red",
    description: "Камерная фигура на напряженном красном поле.",
    descriptionRu: "Камерная фигура на напряженном красном поле.",
    descriptionEn: "A compact figure study set against an intense red field.",
    year: 2024,
    medium: "Уголь, акрил, холст",
    mediumRu: "Уголь, акрил, холст",
    mediumEn: "Charcoal, acrylic on canvas",
    dimensions: "130 x 130 cm",
    widthCm: 130,
    heightCm: 130,
    status: "AVAILABLE",
    isFeatured: true,
    isPublished: true,
    sortOrder: 3,
    seoTitle: "Этюд в красном | Julia Komarova",
    seoTitleRu: "Этюд в красном | Julia Komarova",
    seoTitleEn: "Study in Red | Julia Komarova",
    seoDescription: "Фигурная работа с насыщенным красным фоном.",
    seoDescriptionRu: "Фигурная работа с насыщенным красным фоном.",
    seoDescriptionEn: "Figurative work with a saturated red background.",
    coverImageId: imageStudyInRedId,
    categoryIds: [categoryPortraitId],
    relatedArtworkIds: [artworkGreenFigureId, artworkVeilStudyId],
  },
  {
    _id: artworkVeilStudyId,
    slug: "veil-study",
    title: "Этюд с покровом",
    titleRu: "Этюд с покровом",
    titleEn: "Veil Study",
    description: "Вертикальная композиция с мягкой пластикой силуэта и насыщенным цветовым акцентом.",
    descriptionRu: "Вертикальная композиция с мягкой пластикой силуэта и насыщенным цветовым акцентом.",
    descriptionEn: "Vertical composition with a soft silhouette and a concentrated color accent.",
    year: 2023,
    medium: "Уголь, гуашь, бумага",
    mediumRu: "Уголь, гуашь, бумага",
    mediumEn: "Charcoal, gouache on paper",
    dimensions: "50 x 65 cm",
    widthCm: 50,
    heightCm: 65,
    status: "AVAILABLE",
    isFeatured: false,
    isPublished: true,
    sortOrder: 4,
    seoTitle: "Этюд с покровом | Julia Komarova",
    seoTitleRu: "Этюд с покровом | Julia Komarova",
    seoTitleEn: "Veil Study | Julia Komarova",
    seoDescription: "Вертикальный фигурный этюд на бумаге.",
    seoDescriptionRu: "Вертикальный фигурный этюд на бумаге.",
    seoDescriptionEn: "Vertical figurative study on paper.",
    coverImageId: imageVeilStudyId,
    categoryIds: [categoryPortraitId, categoryAtmosphericId],
    relatedArtworkIds: [artworkStudyInRedId, artworkWhiteAssemblyId],
  },
  {
    _id: artworkWhiteAssemblyId,
    slug: "white-assembly",
    title: "Белое собрание",
    titleRu: "Белое собрание",
    titleEn: "White Assembly",
    description: "Групповая фигура с большим светлым объемом и сдержанной синей средой.",
    descriptionRu: "Групповая фигура с большим светлым объемом и сдержанной синей средой.",
    descriptionEn: "Group composition with broad light volume and a restrained blue field.",
    year: 2022,
    medium: "Уголь, гуашь, бумага",
    mediumRu: "Уголь, гуашь, бумага",
    mediumEn: "Charcoal, gouache on paper",
    dimensions: "45 x 45 cm",
    widthCm: 45,
    heightCm: 45,
    status: "AVAILABLE",
    isFeatured: false,
    isPublished: true,
    sortOrder: 5,
    seoTitle: "Белое собрание | Julia Komarova",
    seoTitleRu: "Белое собрание | Julia Komarova",
    seoTitleEn: "White Assembly | Julia Komarova",
    seoDescription: "Квадратная композиция с фигурами в белом.",
    seoDescriptionRu: "Квадратная композиция с фигурами в белом.",
    seoDescriptionEn: "Square composition with figures dressed in white.",
    coverImageId: imageWhiteAssemblyId,
    categoryIds: [categoryPortraitId],
    relatedArtworkIds: [artworkVeilStudyId, artworkStudyInRedId],
  },
  {
    _id: artworkStillWaterId,
    slug: "still-water",
    title: "Тихая вода",
    titleRu: "Тихая вода",
    titleEn: "Still Water",
    description: "Круглая по настроению работа о тишине, отражении и приглушенном свете.",
    descriptionRu: "Круглая по настроению работа о тишине, отражении и приглушенном свете.",
    descriptionEn: "A meditative work about stillness, reflection, and diffused light.",
    year: 2025,
    medium: "Холст, масло",
    mediumRu: "Холст, масло",
    mediumEn: "Oil on canvas",
    dimensions: "110 x 110 cm",
    widthCm: 110,
    heightCm: 110,
    status: "AVAILABLE",
    isFeatured: false,
    isPublished: true,
    sortOrder: 6,
    seoTitle: "Тихая вода | Julia Komarova",
    seoTitleRu: "Тихая вода | Julia Komarova",
    seoTitleEn: "Still Water | Julia Komarova",
    seoDescription: "Медитативная пейзажная работа с мягкой световой средой.",
    seoDescriptionRu: "Медитативная пейзажная работа с мягкой световой средой.",
    seoDescriptionEn: "Meditative landscape work with a soft luminous atmosphere.",
    coverImageId: imageStillWaterId,
    categoryIds: [categoryLandscapeId, categoryAtmosphericId],
    relatedArtworkIds: [artworkSilentFieldId],
  },
];

for (const artworkDoc of artworkDocs) {
  db.Artwork.replaceOne(
    { _id: artworkDoc._id },
    {
      ...artworkDoc,
      depthCm: null,
      publishedAt,
      createdAt: now,
      updatedAt: now,
    },
    { upsert: true },
  );
}

printjson({
  ok: 1,
  categories: categorySlugs,
  exhibition: exhibitionSlugs[0],
  artworks: artworkSlugs,
});
