import { MetadataRoute } from "next";

const baseUrl = "https://evoverses.com" as const;

const sitemap = (): MetadataRoute.Sitemap => {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.9,
    },
    {
      url: "${baseUrl}/signin",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "${baseUrl}/assets",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "${baseUrl}/assets",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "${baseUrl}/assets/evo",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.8,
    },
    {
      url: "${baseUrl}/assets/evo",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.8,
    },
  ];
};

export default sitemap;
