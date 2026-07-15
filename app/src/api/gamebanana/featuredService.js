export class FeaturedService {
  constructor({ url, cacheKey, getTimeAgo, getEngineIdForCategory }) {
    this.url = url;
    this.cacheKey = cacheKey;
    this.getTimeAgo = getTimeAgo;
    this.getEngineIdForCategory = getEngineIdForCategory;
  }

  async getCarousel() {
    const cached = this.getCached();
    if (cached && Date.parse(cached.expiresAt) > Date.now()) {
      return this.flatten(cached);
    }

    try {
      const response = await fetch(this.url, { cache: "no-store" });
      if (!response.ok) throw new Error("Featured request failed");
      const featured = await response.json();
      if (!this.isSupported(featured))
        throw new Error("Unsupported featured schema");
      const mods = this.flatten(featured);
      if (mods.length === 0) throw new Error("No featured mods");
      localStorage.setItem(this.cacheKey, JSON.stringify(featured));
      return mods;
    } catch (error) {
      return cached ? this.flatten(cached) : [];
    }
  }

  getCached() {
    try {
      const value = localStorage.getItem(this.cacheKey);
      const featured = value ? JSON.parse(value) : null;
      return this.isSupported(featured) ? featured : null;
    } catch (error) {
      return null;
    }
  }

  isSupported(featured) {
    return (
      featured?.schemaVersion === 2 &&
      Array.isArray(featured.rankings) &&
      featured.rankings.every(
        (ranking) =>
          Array.isArray(ranking?.mods) &&
          ranking.mods.every((mod) => Number.isFinite(Number(mod?.categoryId))),
      )
    );
  }

  flatten(featured) {
    if (!Array.isArray(featured?.rankings)) return [];
    return featured.rankings.flatMap((ranking) =>
      ranking.mods.map((mod) => {
        const categoryId = Number(mod.categoryId) || null;
        return {
          ...mod,
          label: ranking.label,
          timeAgo: this.getTimeAgo(mod.publishedAt),
          categoryId,
          engineId: mod.engineId || this.getEngineIdForCategory(categoryId),
        };
      }),
    );
  }
}
