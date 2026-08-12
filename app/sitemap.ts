import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-07-29T00:00:00.000Z");
  return [
    { url: "https://jumpinfortacos.com/", lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: "https://jumpinfortacos.com/game/", lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://jumpinfortacos.com/game/level1-2", lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://jumpinfortacos.com/game/level1-3", lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://jumpinfortacos.com/game/level2", lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://jumpinfortacos.com/game/level2-2", lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: "https://jumpinfortacos.com/game/level2-3", lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://jumpinfortacos.com/game/level3", lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://jumpinfortacos.com/game/level3-2", lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://jumpinfortacos.com/game/level3-3", lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
  ];
}
