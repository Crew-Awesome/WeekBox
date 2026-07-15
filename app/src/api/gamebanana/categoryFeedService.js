export class CategoryFeedService {
  constructor({ baseUrl, gameId, categoryRoots, getRecords, toGridMod }) {
    this.baseUrl = baseUrl;
    this.gameId = gameId;
    this.categoryRoots = categoryRoots;
    this.getRecords = getRecords;
    this.toGridMod = toGridMod;
    this.resetDiscovery();
  }

  getCategories(categoryId) {
    return this.categoryRoots.includes(categoryId)
      ? [categoryId]
      : this.categoryRoots;
  }

  getSortValue(mod, sort) {
    if (sort === "Generic_LatestUpdated") {
      return Number(
        mod._tsDateUpdated || mod._tsDateModified || mod._tsDateAdded || 0,
      );
    }
    if (sort === "Generic_MostLiked") return Number(mod._nLikeCount || 0);
    return Number(mod._tsDateAdded || 0);
  }

  async getCategoryRecords({ page = 1, perPage = 20, sort, categoryId } = {}) {
    const responses = await Promise.allSettled(
      this.getCategories(categoryId).map(async (id) => {
        const params = new URLSearchParams({
          _nPage: String(page),
          _nPerpage: String(perPage),
        });
        params.set("_aFilters[Generic_Game]", String(this.gameId));
        params.set("_aFilters[Generic_Category]", String(id));
        if (sort) params.set("_sSort", sort);
        const response = await fetch(`${this.baseUrl}/Mod/Index?${params}`);
        if (!response.ok) throw new Error("Category request failed");
        return this.getRecords(await response.json()).map((record) => ({
          ...record,
          __injectedCategoryId: id,
        }));
      }),
    );
    const records = responses
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);
    if (
      !records.length &&
      responses.every((result) => result.status === "rejected")
    ) {
      throw new Error("GameBanana category requests failed");
    }
    return [...new Map(records.map((mod) => [mod._idRow, mod])).values()].sort(
      (left, right) =>
        this.getSortValue(right, sort) - this.getSortValue(left, sort),
    );
  }

  resetDiscovery(categoryId) {
    this.discoveryCategoryId = categoryId;
    this.discoveryRecords = [];
    this.discoveryNextPage = 1;
    this.discoveryFallbackPage = 1;
    this.discoveryUsingFallback = false;
    this.discoveryExhausted = false;
    this.discoveryPages = new Map();
    this.discoverySeenIds = new Set();
  }

  getPopularScore(mod) {
    const likes = mod._nLikeCount || 0;
    const views = mod._nViewCount || 0;
    const ageDays = Math.max(
      0,
      (Date.now() / 1000 - (mod._tsDateAdded || 0)) / 86400,
    );
    const likeRate = likes / Math.max(views, 1);
    return (
      (Math.log1p(likes / Math.sqrt(Math.max(ageDays, 1))) +
        0.4 * Math.log1p(likes)) *
      (0.7 + Math.min(0.5, likeRate * 30)) *
      Math.exp(-ageDays / 45)
    );
  }

  isFreshPopular(mod) {
    const ageDays = (Date.now() / 1000 - (mod._tsDateAdded || 0)) / 86400;
    const likes = mod._nLikeCount || 0;
    const views = mod._nViewCount || 0;
    return (
      ageDays <= 90 &&
      likes >= 4 &&
      views >= 250 &&
      likes / Math.max(views, 1) >= 0.0125
    );
  }

  isEstablishedPopular(mod) {
    const likes = mod._nLikeCount || 0;
    const views = mod._nViewCount || 0;
    return likes >= 8 && views >= 500 && likes / Math.max(views, 1) >= 0.01;
  }

  async getDiscovery(page, categoryId) {
    if (page === 1 || this.discoveryCategoryId !== categoryId)
      this.resetDiscovery(categoryId);
    if (this.discoveryPages.has(page)) return this.discoveryPages.get(page);
    let available = [];
    while (!this.discoveryExhausted) {
      available = this.discoveryRecords
        .filter((mod) => !this.discoverySeenIds.has(mod._idRow))
        .sort(
          (left, right) =>
            this.getPopularScore(right) - this.getPopularScore(left),
        );
      if (available.length >= 12) break;
      try {
        const isFallback = this.discoveryUsingFallback;
        const records = await this.getCategoryRecords({
          page: isFallback
            ? this.discoveryFallbackPage++
            : this.discoveryNextPage++,
          perPage: 50,
          sort: isFallback ? "Generic_MostLiked" : "Generic_Newest",
          categoryId,
        });
        const eligible = records.filter((mod) =>
          isFallback
            ? this.isEstablishedPopular(mod)
            : this.isFreshPopular(mod),
        );
        const known = new Set(this.discoveryRecords.map((mod) => mod._idRow));
        this.discoveryRecords.push(
          ...eligible.filter((mod) => !known.has(mod._idRow)),
        );
        if (!records.length || !eligible.length) {
          if (isFallback) this.discoveryExhausted = true;
          else this.discoveryUsingFallback = true;
        }
      } catch (error) {
        this.discoveryExhausted = true;
      }
    }
    const mods = available.slice(0, 12).map(this.toGridMod);
    mods.forEach((mod) => this.discoverySeenIds.add(mod.id));
    this.discoveryPages.set(page, mods);
    return mods;
  }

  async getGridMods(filter = "popular", page = 1, categoryId = null) {
    try {
      if (filter === "popular") return this.getDiscovery(page, categoryId);
      const sort =
        { new: "Generic_Newest", updated: "Generic_LatestUpdated" }[filter] ||
        "Generic_Newest";
      return (await this.getCategoryRecords({ page, sort, categoryId }))
        .slice(0, 12)
        .map(this.toGridMod);
    } catch (error) {
      return [];
    }
  }
}
