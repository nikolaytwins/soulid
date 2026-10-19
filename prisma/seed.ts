import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateStarFromIso, canonicalMatchKey } from "../src/lib/engine";
import { buildDemoInterpretation } from "../src/lib/domain/demo-content";

const prisma = new PrismaClient();

const LOCALES = ["ru", "en", "ar"] as const;

const SPHERES = [
  {
    id: "personality",
    sku: "sphere_personality",
    sort: 0,
    free: false,
    price: 2500,
    names: { ru: "Таланты", en: "Talents", ar: "المواهب" },
    desc: {
      ru: "Способности и сильные стороны",
      en: "Abilities and strengths",
      ar: "القدرات ونقاط القوة"
    },
    part: { ru: "Левая часть звезды", en: "Left point of the star", ar: "الرأس الأيسر للنجمة" }
  },
  {
    id: "spirituality",
    sku: "sphere_spirituality",
    sort: 1,
    free: false,
    price: 2500,
    names: { ru: "Духовность", en: "Spirituality", ar: "الروحانية" },
    desc: {
      ru: "Внутренние установки и смыслы",
      en: "Inner attitudes and meanings",
      ar: "التوجهات الداخلية والمعاني"
    },
    part: { ru: "Верхняя часть звезды", en: "Top point of the star", ar: "الرأس العلوي للنجمة" }
  },
  {
    id: "money",
    sku: "sphere_money",
    sort: 2,
    free: false,
    price: 2500,
    names: { ru: "Реализация и деньги", en: "Realization & Money", ar: "المال وتحقيق الذات" },
    desc: {
      ru: "Реализация и деньги",
      en: "Realization and money",
      ar: "المال وتحقيق الذات"
    },
    part: { ru: "Правая часть звезды", en: "Right point of the star", ar: "الرأس الأيمن للنجمة" }
  },
  {
    id: "relationships",
    sku: "sphere_relationships",
    sort: 3,
    free: false,
    price: 2500,
    names: { ru: "Отношения", en: "Relationships", ar: "العلاقات" },
    desc: {
      ru: "Отношения и сценарии",
      en: "Relationships and scenarios",
      ar: "العلاقات والسيناريوهات"
    },
    part: { ru: "Нижняя правая часть звезды", en: "Lower-right point of the star", ar: "الرأس الأيمن السفلي" }
  },
  {
    id: "health",
    sku: "sphere_health",
    sort: 4,
    free: false,
    price: 0,
    names: { ru: "Здоровье", en: "Health", ar: "الصحة" },
    desc: {
      ru: "В подарок с полным Soul ID",
      en: "A gift with Complete Soul ID",
      ar: "هدية مع Soul ID الكامل"
    },
    part: { ru: "Нижняя левая часть звезды", en: "Lower-left point of the star", ar: "الرأس الأيسر السفلي" }
  }
] as const;

const POINTS = ["apex", "leftBase", "rightBase", "innerLeft", "innerRight", "innerBottom"] as const;

async function main() {
  console.log("Seeding Soul ID…");

  await prisma.patternRule.deleteMany();
  await prisma.interpretation.deleteMany();
  await prisma.entitlement.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.productTranslation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.unlockRule.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.birthProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.webhookEvent.deleteMany();

  const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "ChangeMe_Admin_2026", 10);
  const demoHash = await bcrypt.hash("demo1234", 10);

  const admin = await prisma.user.create({
    data: {
      email: (process.env.ADMIN_EMAIL ?? "admin@soulstar.local").toLowerCase(),
      passwordHash: adminHash,
      name: "Admin",
      role: "admin",
      locale: "ru"
    }
  });

  const demo = await prisma.user.create({
    data: {
      email: "kamilla@example.com",
      passwordHash: demoHash,
      name: "Камилла",
      role: "user",
      locale: "ru"
    }
  });

  for (const s of SPHERES) {
    const product = await prisma.product.create({
      data: {
        sku: s.sku,
        sphere: s.id,
        kind: "sphere",
        sortOrder: s.sort,
        priceAmount: s.price,
        currency: "USD",
        isFree: s.free,
        isActive: true
      }
    });
    for (const locale of LOCALES) {
      await prisma.productTranslation.create({
        data: {
          productId: product.id,
          locale,
          name: s.names[locale],
          description: s.desc[locale]
        }
      });
    }
  }

  const bundle = await prisma.product.create({
    data: {
      sku: "unlock_everything",
      sphere: null,
      kind: "bundle",
      sortOrder: 99,
      priceAmount: 6900,
      currency: "USD",
      isFree: false
    }
  });
  await prisma.productTranslation.createMany({
    data: [
      { productId: bundle.id, locale: "ru", name: "Полный Soul ID", description: "Все четыре раздела + Здоровье в подарок" },
      { productId: bundle.id, locale: "en", name: "Complete Soul ID", description: "All four sections + Health as a gift" },
      { productId: bundle.id, locale: "ar", name: "Soul ID الكامل", description: "الأقسام الأربعة كلها + الصحة هدية" }
    ]
  });

  const rec = await prisma.product.create({
    data: {
      sku: "personal_recommendation",
      kind: "addon",
      sortOrder: 100,
      priceAmount: 199000,
      currency: "RUB",
      isFree: false,
      isActive: true
    }
  });
  await prisma.productTranslation.createMany({
    data: [
      { productId: rec.id, locale: "ru", name: "Персональная рекомендация", description: "Резюме открытых сфер и рекомендации по связям между ними" },
      { productId: rec.id, locale: "en", name: "Personal recommendation", description: "A summary of opened spheres and advice on how they connect" },
      { productId: rec.id, locale: "ar", name: "توصية شخصية", description: "ملخص للمجالات المفتوحة وتوصيات تراعي الروابط بينها" }
    ]
  });

  const order = ["personality", "spirituality", "money", "relationships", "health"] as const;
  const why = {
    ru: {
      title: (need: string) => `Сначала раскройте сферу ${need}`,
      body: (need: string, cur: string) =>
        `Невозможно перейти к сфере ${cur}, пока не раскрыта сфера ${need}.`,
      whyTitle: "Почему?",
      whyBody:
        "Порядок сфер задан методикой: каждая следующая сфера раскрывается на основе предыдущей. Поэтому сферы открываются по очереди, и пропустить сферу нельзя."
    },
    en: {
      title: (need: string) => `Open ${need} first`,
      body: (need: string, cur: string) => `You cannot enter ${cur} before ${need} is unlocked.`,
      whyTitle: "Why?",
      whyBody:
        "The method unfolds the star in order. Each next sphere is read on top of the previous one, so spheres cannot be skipped."
    },
    ar: {
      title: (need: string) => `افتح مجال ${need} أولاً`,
      body: (need: string, cur: string) => `لا يمكن الانتقال إلى ${cur} قبل فتح ${need}.`,
      whyTitle: "لماذا؟",
      whyBody: "المنهج يكشف النجمة بالترتيب. كل مجال يُقرأ فوق السابق، لذلك لا يمكن تخطي مجال."
    }
  };

  for (let i = 0; i < order.length; i++) {
    const sphere = order[i];
    const prev = i === 0 ? null : order[i - 1];
    const curNames = SPHERES[i].names;
    const prevNames = prev ? SPHERES[i - 1].names : curNames;
    await prisma.unlockRule.create({
      data: {
        sphere,
        sortOrder: i,
        requiredPrev: prev,
        whyTitleRu: why.ru.whyTitle,
        whyBodyRu: why.ru.whyBody,
        whyTitleEn: why.en.whyTitle,
        whyBodyEn: why.en.whyBody,
        whyTitleAr: why.ar.whyTitle,
        whyBodyAr: why.ar.whyBody,
        blockedTitleRu: prev ? why.ru.title(prevNames.ru) : "",
        blockedBodyRu: prev ? why.ru.body(prevNames.ru, curNames.ru) : "",
        blockedTitleEn: prev ? why.en.title(prevNames.en) : "",
        blockedBodyEn: prev ? why.en.body(prevNames.en, curNames.en) : "",
        blockedTitleAr: prev ? why.ar.title(prevNames.ar) : "",
        blockedBodyAr: prev ? why.ar.body(prevNames.ar, curNames.ar) : ""
      }
    });
  }

  const rows = [];
  for (const sphere of SPHERES) {
    for (const point of POINTS) {
      for (let arcana = 1; arcana <= 22; arcana++) {
        for (const locale of LOCALES) {
          const content = buildDemoInterpretation({
            sphere: sphere.id,
            point,
            value: arcana,
            locale
          });
          rows.push({
            sphere: sphere.id,
            point,
            arcanaValue: arcana,
            contentType: content.contentType,
            locale,
            title: content.title,
            body: content.body,
            isDemo: true
          });
        }
      }
    }
  }

  for (let arcana = 1; arcana <= 22; arcana++) {
    for (const locale of LOCALES) {
      const content = buildDemoInterpretation({ sphere: "soulMission", point: "apex", value: arcana, locale });
      rows.push({
        sphere: "soulMission",
        point: "apex",
        arcanaValue: arcana,
        contentType: content.contentType,
        locale,
        title: content.title,
        body: content.body,
        isDemo: true
      });
    }
  }

  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.interpretation.createMany({ data: rows.slice(i, i + CHUNK) });
  }

  const patternDefs = [
    {
      kind: "repeating" as const,
      values: [14],
      minCount: 2,
      titles: { ru: "Повтор 14", en: "Repeat of 14", ar: "تكرار 14" },
      bodies: {
        ru: "[DEMO] Число 14 встречается на звезде более одного раза. Автор методики заменит этот текст в админке «Комбинации».",
        en: "[DEMO] The number 14 appears more than once on the star. The author of the method will replace this text in Combinations admin.",
        ar: "[تجريبي] يظهر الرقم 14 أكثر من مرة على النجمة. سيستبدل مؤلف المنهج هذا النص من لوحة التراكيب."
      }
    },
    {
      kind: "combination" as const,
      values: [5, 3],
      minCount: 2,
      titles: { ru: "Комбинация 5 и 3", en: "Combination 5 and 3", ar: "تركيب 5 و 3" },
      bodies: {
        ru: "[DEMO] На звезде одновременно присутствуют значения 5 и 3. Это каркас CMS: текст заполнит автор, без правок кода.",
        en: "[DEMO] Values 5 and 3 are both present on the star. This is the CMS shell: the author fills the text without a code change.",
        ar: "[تجريبي] تظهر القيمتان 5 و 3 معاً على النجمة. هذه بنية CMS: يملأ المؤلف النص دون تعديل الكود."
      }
    }
  ];

  for (const def of patternDefs) {
    const matchKey = canonicalMatchKey(def.kind, def.values);
    for (const locale of LOCALES) {
      await prisma.patternRule.create({
        data: {
          kind: def.kind,
          matchKey,
          valuesJson: JSON.stringify(def.values),
          minCount: def.minCount,
          scope: "star",
          locale,
          title: def.titles[locale],
          body: JSON.stringify({ paragraphs: [def.bodies[locale]] }),
          contentType: "plain",
          isDemo: true,
          isActive: true
        }
      });
    }
  }

  await prisma.siteSetting.createMany({
    data: [
      { key: "show_unlock_everything", value: "true" },
      { key: "unlock_everything_after_sphere", value: "personality" },
      { key: "free_first_sphere", value: "personality" },
      { key: "default_locale", value: "ru" },
      { key: "brand_name", value: "Soul ID" }
    ]
  });

  async function seedStar(userId: string, iso: string, spheres: string[]) {
    const calc = calculateStarFromIso(iso);
    const profile = await prisma.birthProfile.create({
      data: {
        userId,
        dateOfBirth: iso,
        calculationJson: JSON.stringify(calc),
        locale: "ru"
      }
    });
    for (const sphere of spheres) {
      await prisma.entitlement.create({
        data: {
          userId,
          profileId: profile.id,
          sphere,
          source: "admin"
        }
      });
    }
    return profile;
  }

  await seedStar(demo.id, "1992-03-05", ["personality"]);

  const testerHash = await bcrypt.hash("tester1234", 10);
  const tester = await prisma.user.create({
    data: {
      email: "tester@soulstar.local",
      passwordHash: testerHash,
      name: "Tester",
      role: "user",
      locale: "ru"
    }
  });
  await seedStar(tester.id, "1992-03-05", ["personality"]);
  await seedStar(tester.id, "1988-07-12", ["personality", "spirituality"]);
  await seedStar(tester.id, "2000-01-01", ["personality", "spirituality", "money"]);
  await seedStar(tester.id, "1975-06-21", ["personality", "spirituality", "money", "relationships", "health"]);

  console.log(
    `Seeded admin=${admin.email} demo=${demo.email} tester=${tester.email} interpretations=${rows.length}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
