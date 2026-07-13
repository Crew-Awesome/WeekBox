export const gameBananaApi = {
    baseUrl: "https://gamebanana.com/apiv11",
    gameId: 8694,
    categoryRoots: [34764, 28367, 29202],
    featuredUrl: "https://raw.githubusercontent.com/Crew-Awesome/weekbox.featured/main/public/featured.json",
    featuredCacheKey: "weekbox-featured-v1",
    freshPopularRecords: [],
    freshPopularNextPage: 1,
    freshPopularFallbackPage: 1,
    freshPopularUsingFallback: false,
    freshPopularExhausted: false,
    freshPopularPages: new Map(),
    freshPopularSeenIds: new Set(),

    getImageUrl(mod) {
        if (mod._aPreviewMedia && mod._aPreviewMedia._aImages && mod._aPreviewMedia._aImages.length > 0) {
            const img = mod._aPreviewMedia._aImages[0];
            return `${img._sBaseUrl}/${img._sFile}`;
        }
        return "https://images.gamebanana.com/img/ss/mods/default.jpg";
    },

    getValidRecords(data) {
        if (data && Array.isArray(data._aRecords)) return data._aRecords;
        if (Array.isArray(data)) return data;
        return [];
    },

    getTimeAgo(timestamp) {
        if (!timestamp) return "N/A";
        const seconds = Math.floor(Date.now() / 1000) - timestamp;
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo";
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        
        return Math.floor(seconds) + "s";
    },

    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    async getModDetails(modId) {
        try {
            const res = await fetch(`${this.baseUrl}/Mod/${modId}/ProfilePage`);
            const data = await res.json();

            let images = [];
            if (data._aPreviewMedia && data._aPreviewMedia._aImages) {
                images = data._aPreviewMedia._aImages.map(img => `${img._sBaseUrl}/${img._sFile}`);
            }
            if (images.length === 0) images.push("https://images.gamebanana.com/img/ss/mods/default.jpg");

            let fileSize = 0;
            let downloadUrl = "";
            if (data._aFiles) {
                const filesArray = Object.values(data._aFiles);
                if (filesArray.length > 0) {
                    fileSize = filesArray[0]._nFilesize || 0;
                    downloadUrl = filesArray[0]._sDownloadUrl || "";
                }
            }

            return {
                id: data._idRow,
                title: data._sName,
                author: data._aSubmitter?._sName || "Unknown Creator",
                description: data._sText || "<p>No description available.</p>",
                likes: data._nLikeCount || 0,
                views: data._nViewCount || 0,
                timeAgo: this.getTimeAgo(data._tsDateAdded),
                images: images,
                fileSizeStr: this.formatBytes(fileSize),
                downloadUrl: downloadUrl
            };
        } catch (error) {
            console.error("Error loading mod details:", error);
            return null;
        }
    },

    async getFeaturedCarousel() {
        const cachedData = this.getCachedFeatured();
        if (cachedData && Date.parse(cachedData.expiresAt) > Date.now()) {
            return this.flattenFeatured(cachedData);
        }

        try {
            const response = await fetch(this.featuredUrl, { cache: "no-store" });
            if (!response.ok) throw new Error(`Featured feed returned ${response.status}`);

            const featuredData = await response.json();
            const mods = this.flattenFeatured(featuredData);
            if (mods.length === 0) throw new Error("Featured feed contains no mods");

            localStorage.setItem(this.featuredCacheKey, JSON.stringify(featuredData));
            return mods;
        } catch (error) {
            console.error("Error loading featured feed:", error);
            return cachedData ? this.flattenFeatured(cachedData) : [];
        }
    },

    getCachedFeatured() {
        try {
            const cached = localStorage.getItem(this.featuredCacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            return null;
        }
    },

    flattenFeatured(featuredData) {
        if (!Array.isArray(featuredData?.rankings)) return [];

        return featuredData.rankings.flatMap(ranking =>
            (ranking.mods || []).map(mod => ({
                ...mod,
                label: ranking.label,
                timeAgo: this.getTimeAgo(mod.publishedAt)
            }))
        );
    },

    async getCategoryRecords({ page = 1, perPage = 20, sort } = {}) {
        const responses = await Promise.allSettled(this.categoryRoots.map(async categoryId => {
            const params = new URLSearchParams({
                _nPage: String(page),
                _nPerpage: String(perPage)
            });
            params.set('_aFilters[Generic_Game]', String(this.gameId));
            params.set('_aFilters[Generic_Category]', String(categoryId));
            if (sort) params.set('_sSort', sort);

            const response = await fetch(`${this.baseUrl}/Mod/Index?${params}`);
            if (!response.ok) throw new Error(`GameBanana returned ${response.status}`);
            return this.getValidRecords(await response.json());
        }));

        const records = responses
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => result.value);
        if (records.length === 0) throw new Error('GameBanana returned no category results');

        return [...new Map(records.map(mod => [mod._idRow, mod])).values()];
    },

    toGridMod(mod) {
        return {
            id: mod._idRow,
            title: mod._sName,
            author: mod._aSubmitter?._sName || "Unknown",
            image: this.getImageUrl(mod),
            likes: mod._nLikeCount || 0,
            views: mod._nViewCount || 0,
            timeAgo: this.getTimeAgo(mod._tsDateAdded)
        };
    },

    getPopularScore(mod) {
        const likes = mod._nLikeCount || 0;
        const views = mod._nViewCount || 0;
        const ageDays = Math.max(0, (Date.now() / 1000 - (mod._tsDateAdded || 0)) / 86400);
        const likeRate = likes / Math.max(views, 1);
        const momentum = Math.log1p(likes / Math.sqrt(Math.max(ageDays, 1))) + 0.4 * Math.log1p(likes);
        const qualityMultiplier = 0.7 + Math.min(0.5, likeRate * 30);
        const freshnessMultiplier = Math.exp(-ageDays / 45);

        return momentum * qualityMultiplier * freshnessMultiplier;
    },

    isFreshPopularMod(mod) {
        const ageDays = (Date.now() / 1000 - (mod._tsDateAdded || 0)) / 86400;
        const likes = mod._nLikeCount || 0;
        const views = mod._nViewCount || 0;
        const likeRate = likes / Math.max(views, 1);

        return ageDays <= 90 && likes >= 4 && views >= 250 && likeRate >= 0.0125;
    },

    isEstablishedPopularMod(mod) {
        const likes = mod._nLikeCount || 0;
        const views = mod._nViewCount || 0;
        const likeRate = likes / Math.max(views, 1);

        return likes >= 8 && views >= 500 && likeRate >= 0.01;
    },

    async getFreshPopularMods(page) {
        if (page === 1) {
            this.freshPopularRecords = [];
            this.freshPopularNextPage = 1;
            this.freshPopularFallbackPage = 1;
            this.freshPopularUsingFallback = false;
            this.freshPopularExhausted = false;
            this.freshPopularPages = new Map();
            this.freshPopularSeenIds = new Set();
        }

        if (this.freshPopularPages.has(page)) return this.freshPopularPages.get(page);

        let available = [];
        while (!this.freshPopularExhausted) {
            available = [...this.freshPopularRecords]
                .filter(mod => !this.freshPopularSeenIds.has(mod._idRow))
                .sort((left, right) => this.getPopularScore(right) - this.getPopularScore(left));
            if (available.length >= 12) break;

            const isFallback = this.freshPopularUsingFallback;
            const records = await this.getCategoryRecords({
                page: isFallback ? this.freshPopularFallbackPage++ : this.freshPopularNextPage++,
                perPage: 50,
                sort: isFallback ? 'Generic_MostLiked' : 'Generic_Newest'
            });
            const eligibleRecords = records.filter(mod => isFallback
                ? this.isEstablishedPopularMod(mod)
                : this.isFreshPopularMod(mod));
            const knownIds = new Set(this.freshPopularRecords.map(mod => mod._idRow));
            this.freshPopularRecords.push(...eligibleRecords.filter(mod => !knownIds.has(mod._idRow)));

            if (records.length === 0 || eligibleRecords.length === 0) {
                if (isFallback) this.freshPopularExhausted = true;
                else this.freshPopularUsingFallback = true;
            }
        }

        const mods = available.slice(0, 12).map(mod => this.toGridMod(mod));
        mods.forEach(mod => this.freshPopularSeenIds.add(mod.id));
        this.freshPopularPages.set(page, mods);
        return mods;
    },

    async getGridMods(filter = 'ripe', page = 1) {
        try {
            if (filter === 'popular') return await this.getFreshPopularMods(page);

            const sort = {
                new: 'Generic_Newest',
                updated: 'Generic_LatestUpdated'
            }[filter];
            const records = await this.getCategoryRecords({ page, sort });
            return records.slice(0, 12).map(mod => this.toGridMod(mod));
        } catch (error) {
            console.error("Error loading grid mods:", error);
            return [];
        }
    },

    getSearchScore(mod, query, terms) {
        const title = (mod._sName || '').toLowerCase();
        const tags = (mod._aTags || []).join(' ').toLowerCase();
        const likes = mod._nLikeCount || 0;
        const views = mod._nViewCount || 0;
        const ageDays = Math.max(0, (Date.now() / 1000 - (mod._tsDateAdded || 0)) / 86400);
        let relevance = 0;

        if (title === query) relevance += 1_000;
        else if (title.startsWith(query)) relevance += 700;
        else if (title.includes(query)) relevance += 400;

        terms.forEach(term => {
            if (title.includes(term)) relevance += 120;
            else if (tags.includes(term)) relevance += 35;
        });

        return relevance
            + Math.log1p(likes) * 18
            + Math.log1p(views) * 3
            + 12 * Math.exp(-ageDays / 180);
    },

    async searchMods(query, page = 1, perPage = 50) {
        try {
            const searchQuery = encodeURIComponent(query + ' fnf');
            const res = await fetch(`${this.baseUrl}/Util/Search/Results?_sModelName=Mod&_sSearchString=${searchQuery}&_nPage=${page}&_nPerpage=${perPage}`);
            const data = await res.json();
            const records = this.getValidRecords(data);

            const normalizedQuery = query.trim().toLowerCase();
            const terms = normalizedQuery.split(/\s+/).filter(Boolean);

            return records
                .map(mod => ({ mod, score: this.getSearchScore(mod, normalizedQuery, terms) }))
                .sort((left, right) => right.score - left.score)
                .map(({ mod }) => this.toGridMod(mod));
        } catch (error) {
            console.error("Error searching mods:", error);
            return [];
        }
    }
};
