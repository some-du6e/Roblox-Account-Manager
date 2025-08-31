class Game {
    constructor(data = {}) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.description = data.description || '';
        this.creator = data.creator || '';
        this.universeId = data.universeId || null;
        this.rootPlaceId = data.rootPlaceId || null;
        this.thumbnailUrl = data.thumbnailUrl || '';
        this.iconUrl = data.iconUrl || '';
        this.playing = data.playing || 0;
        this.visits = data.visits || 0;
        this.favorites = data.favorites || 0;
        this.rating = data.rating || 0;
        this.genre = data.genre || '';
        this.maxPlayers = data.maxPlayers || 0;
        this.created = data.created ? new Date(data.created) : null;
        this.updated = data.updated ? new Date(data.updated) : null;
        this.lastPlayed = data.lastPlayed ? new Date(data.lastPlayed) : null;
        this.playCount = data.playCount || 0;
        this.isFavorite = data.isFavorite || false;
        this.tags = data.tags || [];
        
        // Additional metadata
        this.price = data.price || 0;
        this.allowedGearGenres = data.allowedGearGenres || [];
        this.isGenreEnforced = data.isGenreEnforced || false;
        this.copyingAllowed = data.copyingAllowed || false;
        this.studioAccessToApisAllowed = data.studioAccessToApisAllowed || false;
    }

    // Get display name
    getDisplayName() {
        return this.name || `Game ${this.id}`;
    }

    // Get formatted player count
    getFormattedPlayerCount() {
        if (this.playing >= 1000000) {
            return `${(this.playing / 1000000).toFixed(1)}M`;
        } else if (this.playing >= 1000) {
            return `${(this.playing / 1000).toFixed(1)}K`;
        }
        return this.playing.toString();
    }

    // Get formatted visit count
    getFormattedVisitCount() {
        if (this.visits >= 1000000000) {
            return `${(this.visits / 1000000000).toFixed(1)}B`;
        } else if (this.visits >= 1000000) {
            return `${(this.visits / 1000000).toFixed(1)}M`;
        } else if (this.visits >= 1000) {
            return `${(this.visits / 1000).toFixed(1)}K`;
        }
        return this.visits.toString();
    }

    // Get rating percentage
    getRatingPercentage() {
        return Math.round(this.rating * 100);
    }

    // Get game URL
    getGameUrl() {
        return `https://www.roblox.com/games/${this.id}`;
    }

    // Get thumbnail URL with specific size
    getThumbnailUrl(width = 768, height = 432) {
        if (this.thumbnailUrl) {
            return this.thumbnailUrl;
        }
        return `https://www.roblox.com/asset-thumbnail/image?assetId=${this.id}&width=${width}&height=${height}&format=png`;
    }

    // Get icon URL with specific size
    getIconUrl(size = 150) {
        if (this.iconUrl) {
            return this.iconUrl;
        }
        return `https://www.roblox.com/asset-thumbnail/image?assetId=${this.id}&width=${size}&height=${size}&format=png`;
    }

    // Launch game with specific account
    async launch(account = null) {
        try {
            this.lastPlayed = new Date();
            this.playCount++;

            // Update in storage
            await AccountManager.instance.addRecentGame(this);

            const gameUrl = this.getGameUrl();

            if (account) {
                await account.launch(this.id);
            } else {
                // Launch without specific account
                await Neutralino.os.open(gameUrl);
            }

            Toast.show('Game Launched', `${this.getDisplayName()} launched successfully`, 'success');

        } catch (error) {
            console.error('Failed to launch game:', error);
            Toast.show('Launch Failed', `Failed to launch ${this.getDisplayName()}: ${error.message}`, 'error');
        }
    }

    // Fetch game details from Roblox API
    static async fetchGameDetails(gameId) {
        try {
            // In real implementation, this would fetch from Roblox API
            // For demo purposes, we'll return mock data
            
            const mockGames = {
                '606849621': {
                    id: '606849621',
                    name: 'Jailbreak',
                    description: 'Team up with friends to escape prison, or work as police to stop them!',
                    creator: 'Badimo',
                    universeId: 245411389,
                    rootPlaceId: 606849621,
                    playing: 45000,
                    visits: 5000000000,
                    rating: 0.92,
                    genre: 'Adventure',
                    maxPlayers: 30,
                    created: '2017-04-21T00:00:00Z',
                    updated: new Date().toISOString(),
                    price: 0,
                    tags: ['Adventure', 'Roleplay', 'Cars']
                },
                '286090429': {
                    id: '286090429',
                    name: 'Arsenal',
                    description: 'Competitive FPS game with various weapons and maps',
                    creator: 'ROLVe Community',
                    universeId: 111958650,
                    rootPlaceId: 286090429,
                    playing: 35000,
                    visits: 3000000000,
                    rating: 0.89,
                    genre: 'FPS',
                    maxPlayers: 30,
                    created: '2016-12-18T00:00:00Z',
                    updated: new Date().toISOString(),
                    price: 0,
                    tags: ['FPS', 'Competitive', 'Shooting']
                }
            };

            const gameData = mockGames[gameId];
            if (gameData) {
                return new Game(gameData);
            }

            // If not in mock data, create basic game object
            return new Game({
                id: gameId,
                name: `Game ${gameId}`,
                description: 'Game description not available',
                creator: 'Unknown',
                playing: Math.floor(Math.random() * 10000),
                visits: Math.floor(Math.random() * 1000000),
                rating: 0.7 + Math.random() * 0.3,
                genre: 'All Genres',
                maxPlayers: 50,
                created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
            });

        } catch (error) {
            console.error('Failed to fetch game details:', error);
            return new Game({ id: gameId, name: `Game ${gameId}` });
        }
    }

    // Search games
    static async searchGames(query, limit = 20, cursor = '') {
        try {
            // In real implementation, this would search Roblox games API
            // For demo purposes, return mock results
            
            const mockResults = [
                await Game.fetchGameDetails('606849621'),
                await Game.fetchGameDetails('286090429'),
                new Game({
                    id: '189707',
                    name: 'Natural Disaster Survival',
                    description: 'Survive natural disasters in this classic Roblox game',
                    creator: 'Stickmasterluke',
                    playing: 15000,
                    visits: 2000000000,
                    rating: 0.85,
                    genre: 'Adventure'
                })
            ];

            // Filter by query if provided
            let results = mockResults;
            if (query && query.trim()) {
                const searchTerm = query.toLowerCase();
                results = mockResults.filter(game => 
                    game.name.toLowerCase().includes(searchTerm) ||
                    game.description.toLowerCase().includes(searchTerm) ||
                    game.creator.toLowerCase().includes(searchTerm)
                );
            }

            return {
                data: results.slice(0, limit),
                nextPageCursor: results.length > limit ? 'next_page' : null
            };

        } catch (error) {
            console.error('Failed to search games:', error);
            return { data: [], nextPageCursor: null };
        }
    }

    // Get popular games
    static async getPopularGames(limit = 10) {
        try {
            const results = await Game.searchGames('', limit);
            return results.data.sort((a, b) => b.playing - a.playing);
        } catch (error) {
            console.error('Failed to get popular games:', error);
            return [];
        }
    }

    // Get recently updated games
    static async getRecentlyUpdatedGames(limit = 10) {
        try {
            const results = await Game.searchGames('', limit);
            return results.data.sort((a, b) => new Date(b.updated) - new Date(a.updated));
        } catch (error) {
            console.error('Failed to get recently updated games:', error);
            return [];
        }
    }

    // Toggle favorite status
    toggleFavorite() {
        this.isFavorite = !this.isFavorite;
        // In real implementation, would sync with Roblox favorites
    }

    // Add tag
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }
    }

    // Remove tag
    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
    }

    // Check if game has tag
    hasTag(tag) {
        return this.tags.includes(tag);
    }

    // Get time since last played
    getTimeSinceLastPlayed() {
        if (!this.lastPlayed) return 'Never';
        
        const now = new Date();
        const diff = now - this.lastPlayed;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    // Serialize for storage
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            creator: this.creator,
            universeId: this.universeId,
            rootPlaceId: this.rootPlaceId,
            thumbnailUrl: this.thumbnailUrl,
            iconUrl: this.iconUrl,
            playing: this.playing,
            visits: this.visits,
            favorites: this.favorites,
            rating: this.rating,
            genre: this.genre,
            maxPlayers: this.maxPlayers,
            created: this.created ? this.created.toISOString() : null,
            updated: this.updated ? this.updated.toISOString() : null,
            lastPlayed: this.lastPlayed ? this.lastPlayed.toISOString() : null,
            playCount: this.playCount,
            isFavorite: this.isFavorite,
            tags: this.tags,
            price: this.price,
            allowedGearGenres: this.allowedGearGenres,
            isGenreEnforced: this.isGenreEnforced,
            copyingAllowed: this.copyingAllowed,
            studioAccessToApisAllowed: this.studioAccessToApisAllowed
        };
    }

    // Create from storage data
    static fromJSON(data) {
        return new Game(data);
    }

    // Compare games for sorting
    compareTo(other, sortBy = 'name') {
        if (!other) return 1;

        switch (sortBy) {
            case 'name':
                return this.name.localeCompare(other.name);
            case 'playing':
                return other.playing - this.playing;
            case 'visits':
                return other.visits - this.visits;
            case 'rating':
                return other.rating - this.rating;
            case 'created':
                return new Date(other.created) - new Date(this.created);
            case 'updated':
                return new Date(other.updated) - new Date(this.updated);
            case 'lastPlayed':
                if (!this.lastPlayed && !other.lastPlayed) return 0;
                if (!this.lastPlayed) return 1;
                if (!other.lastPlayed) return -1;
                return new Date(other.lastPlayed) - new Date(this.lastPlayed);
            default:
                return this.name.localeCompare(other.name);
        }
    }
}
