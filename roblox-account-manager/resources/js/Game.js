/**
 * Game class for managing Roblox games
 */
class Game {
    constructor(data = {}) {
        this.id = data.id || null;
        this.universeId = data.universeId || null;
        this.placeId = data.placeId || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.creator = data.creator || null;
        this.thumbnail = data.thumbnail || null;
        this.playerCount = data.playerCount || 0;
        this.maxPlayers = data.maxPlayers || 0;
        this.rating = data.rating || null;
        this.favorites = data.favorites || 0;
        this.visits = data.visits || 0;
        this.created = data.created || null;
        this.updated = data.updated || null;
        this.genre = data.genre || 'All';
        this.isVipServersEnabled = data.isVipServersEnabled || false;
        this.price = data.price || null;
        this.servers = data.servers || [];
    }

    /**
     * Update game data
     * @param {Object} updates - Object containing updates
     */
    update(updates) {
        Object.keys(updates).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = updates[key];
            }
        });
    }

    /**
     * Get game thumbnail URL
     * @param {string} size - Thumbnail size
     */
    getThumbnailUrl(size = '768x432') {
        if (this.thumbnail) {
            return this.thumbnail;
        }
        
        if (this.universeId) {
            return `https://thumbnails.roblox.com/v1/games/icons?universeIds=${this.universeId}&size=${size}&format=Png`;
        }
        
        return '/images/default-game.png';
    }

    /**
     * Get game URL
     */
    getGameUrl() {
        if (this.placeId) {
            return `https://www.roblox.com/games/${this.placeId}/`;
        }
        return null;
    }

    /**
     * Get launch URL for Roblox client
     * @param {string} serverId - Optional server ID to join specific server
     */
    getLaunchUrl(serverId = null) {
        if (!this.placeId) return null;
        
        let url = `roblox://placeId=${this.placeId}`;
        if (serverId) {
            url += `&gameId=${serverId}`;
        }
        
        return url;
    }

    /**
     * Get formatted player count
     */
    getFormattedPlayerCount() {
        if (this.playerCount < 1000) {
            return this.playerCount.toString();
        } else if (this.playerCount < 1000000) {
            return (this.playerCount / 1000).toFixed(1) + 'K';
        } else {
            return (this.playerCount / 1000000).toFixed(1) + 'M';
        }
    }

    /**
     * Get formatted visit count
     */
    getFormattedVisits() {
        if (this.visits < 1000) {
            return this.visits.toString();
        } else if (this.visits < 1000000) {
            return (this.visits / 1000).toFixed(1) + 'K';
        } else if (this.visits < 1000000000) {
            return (this.visits / 1000000).toFixed(1) + 'M';
        } else {
            return (this.visits / 1000000000).toFixed(1) + 'B';
        }
    }

    /**
     * Get rating percentage
     */
    getRatingPercentage() {
        if (!this.rating) return 0;
        return Math.round((this.rating.upVotes / (this.rating.upVotes + this.rating.downVotes)) * 100);
    }

    /**
     * Check if game is available (not private/deleted)
     */
    isAvailable() {
        return this.placeId && this.name;
    }

    /**
     * Get available servers
     */
    getAvailableServers() {
        return this.servers.filter(server => 
            server.playerCount < server.maxPlayers && 
            server.ping < 1000
        );
    }

    /**
     * Get best server (lowest ping with available slots)
     */
    getBestServer() {
        const availableServers = this.getAvailableServers();
        if (availableServers.length === 0) return null;
        
        return availableServers.reduce((best, current) => 
            current.ping < best.ping ? current : best
        );
    }

    /**
     * Add server to server list
     * @param {Object} serverData - Server data
     */
    addServer(serverData) {
        const server = new GameServer(serverData);
        this.servers.push(server);
        return server;
    }

    /**
     * Remove server from server list
     * @param {string} serverId - Server ID to remove
     */
    removeServer(serverId) {
        this.servers = this.servers.filter(server => server.id !== serverId);
    }

    /**
     * Update server in server list
     * @param {string} serverId - Server ID to update
     * @param {Object} updates - Updates to apply
     */
    updateServer(serverId, updates) {
        const server = this.servers.find(s => s.id === serverId);
        if (server) {
            server.update(updates);
        }
    }

    /**
     * Get game genre icon
     */
    getGenreIcon() {
        const genreIcons = {
            'All': 'fas fa-globe',
            'Adventure': 'fas fa-mountain',
            'Building': 'fas fa-hammer',
            'Comedy': 'fas fa-laugh',
            'Fantasy': 'fas fa-magic',
            'Fighting': 'fas fa-fist-raised',
            'FPS': 'fas fa-crosshairs',
            'Horror': 'fas fa-ghost',
            'Military': 'fas fa-shield-alt',
            'Multiplayer': 'fas fa-users',
            'Naval': 'fas fa-ship',
            'Ninja': 'fas fa-user-ninja',
            'Pirate': 'fas fa-skull-crossbones',
            'Racing': 'fas fa-car',
            'RPG': 'fas fa-dice-d20',
            'Sci-Fi': 'fas fa-rocket',
            'Sports': 'fas fa-football-ball',
            'Town and City': 'fas fa-city',
            'War': 'fas fa-bomb',
            'Western': 'fas fa-hat-cowboy'
        };
        
        return genreIcons[this.genre] || 'fas fa-gamepad';
    }

    /**
     * Export game data
     */
    exportData() {
        return {
            id: this.id,
            universeId: this.universeId,
            placeId: this.placeId,
            name: this.name,
            description: this.description,
            creator: this.creator,
            thumbnail: this.thumbnail,
            playerCount: this.playerCount,
            maxPlayers: this.maxPlayers,
            rating: this.rating,
            favorites: this.favorites,
            visits: this.visits,
            created: this.created,
            updated: this.updated,
            genre: this.genre,
            isVipServersEnabled: this.isVipServersEnabled,
            price: this.price
        };
    }

    /**
     * Create game from Roblox API data
     * @param {Object} apiData - Data from Roblox API
     */
    static fromApiData(apiData) {
        return new Game({
            id: apiData.id,
            universeId: apiData.universeId,
            placeId: apiData.rootPlaceId || apiData.placeId,
            name: apiData.name,
            description: apiData.description,
            creator: apiData.creator,
            playerCount: apiData.playing || apiData.playerCount || 0,
            maxPlayers: apiData.maxPlayers || 0,
            visits: apiData.visits || 0,
            favorites: apiData.favoritedCount || 0,
            genre: apiData.genre || 'All',
            isVipServersEnabled: apiData.isVipServersEnabled || false,
            price: apiData.price,
            created: apiData.created,
            updated: apiData.updated
        });
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return this.exportData();
    }
}

/**
 * Game Server class for managing individual game servers
 */
class GameServer {
    constructor(data = {}) {
        this.id = data.id || '';
        this.playerCount = data.playerCount || 0;
        this.maxPlayers = data.maxPlayers || 0;
        this.ping = data.ping || 0;
        this.fps = data.fps || 60;
        this.accessCode = data.accessCode || null;
        this.vipServerId = data.vipServerId || null;
        this.canJoin = data.canJoin !== false;
        this.slowGame = data.slowGame || false;
        this.players = data.players || [];
    }

    /**
     * Update server data
     * @param {Object} updates - Updates to apply
     */
    update(updates) {
        Object.keys(updates).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = updates[key];
            }
        });
    }

    /**
     * Check if server has available slots
     */
    hasAvailableSlots() {
        return this.playerCount < this.maxPlayers;
    }

    /**
     * Get server fill percentage
     */
    getFillPercentage() {
        if (this.maxPlayers === 0) return 0;
        return Math.round((this.playerCount / this.maxPlayers) * 100);
    }

    /**
     * Get ping quality indicator
     */
    getPingQuality() {
        if (this.ping < 50) return 'excellent';
        if (this.ping < 100) return 'good';
        if (this.ping < 200) return 'fair';
        return 'poor';
    }

    /**
     * Get ping color for display
     */
    getPingColor() {
        const quality = this.getPingQuality();
        const colors = {
            'excellent': '#28a745',
            'good': '#ffc107',
            'fair': '#fd7e14',
            'poor': '#dc3545'
        };
        return colors[quality];
    }

    /**
     * Check if server is VIP
     */
    isVipServer() {
        return this.vipServerId !== null;
    }

    /**
     * Export server data
     */
    exportData() {
        return {
            id: this.id,
            playerCount: this.playerCount,
            maxPlayers: this.maxPlayers,
            ping: this.ping,
            fps: this.fps,
            accessCode: this.accessCode,
            vipServerId: this.vipServerId,
            canJoin: this.canJoin,
            slowGame: this.slowGame,
            players: this.players
        };
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return this.exportData();
    }
}
