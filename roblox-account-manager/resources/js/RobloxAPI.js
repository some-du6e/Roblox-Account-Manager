/**
 * Roblox API integration class
 */
class RobloxAPI {
    constructor() {
        this.baseUrl = 'https://api.roblox.com';
        this.authUrl = 'https://auth.roblox.com';
        this.thumbnailUrl = 'https://thumbnails.roblox.com';
        this.presenceUrl = 'https://presence.roblox.com';
        this.catalogUrl = 'https://catalog.roblox.com';
        
        this.endpoints = {
            login: '/v2/login',
            logout: '/v1/authentication/logout',
            userInfo: '/v1/users/{userId}',
            presence: '/v1/presence/users',
            thumbnail: '/v1/users/avatar-headshot',
            games: '/v1/games',
            universes: '/v1/universes'
        };
    }

    /**
     * Make HTTP request with error handling
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     */
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('API Request failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user information by username
     * @param {string} username - Roblox username
     */
    async getUserByUsername(username) {
        try {
            // First, get user ID from username
            const userResponse = await this.makeRequest(
                `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`
            );

            if (!userResponse.success) {
                return { success: false, error: 'Failed to search for user' };
            }

            const users = userResponse.data.data || [];
            const user = users.find(u => u.name.toLowerCase() === username.toLowerCase());

            if (!user) {
                return { success: false, error: 'User not found' };
            }

            return { success: true, data: user };
        } catch (error) {
            console.error('Failed to get user by username:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user information by ID
     * @param {number} userId - Roblox user ID
     */
    async getUserById(userId) {
        try {
            const response = await this.makeRequest(
                `https://users.roblox.com/v1/users/${userId}`
            );

            if (response.success) {
                return { success: true, data: response.data };
            }

            return { success: false, error: 'User not found' };
        } catch (error) {
            console.error('Failed to get user by ID:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user avatar thumbnail
     * @param {number} userId - Roblox user ID
     * @param {string} size - Thumbnail size (e.g., '100x100')
     */
    async getUserAvatar(userId, size = '100x100') {
        try {
            const response = await this.makeRequest(
                `${this.thumbnailUrl}/v1/users/avatar-headshot?userIds=${userId}&size=${size}&format=Png&isCircular=false`
            );

            if (response.success && response.data.data && response.data.data.length > 0) {
                return { success: true, url: response.data.data[0].imageUrl };
            }

            return { success: false, error: 'Avatar not found' };
        } catch (error) {
            console.error('Failed to get user avatar:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user presence information
     * @param {Array} userIds - Array of user IDs
     */
    async getUserPresence(userIds) {
        try {
            if (!Array.isArray(userIds)) {
                userIds = [userIds];
            }

            const response = await this.makeRequest(
                `${this.presenceUrl}/v1/presence/users`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        userIds: userIds
                    })
                }
            );

            if (response.success) {
                return { success: true, data: response.data.userPresences || [] };
            }

            return { success: false, error: 'Failed to get presence' };
        } catch (error) {
            console.error('Failed to get user presence:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get game information
     * @param {number} gameId - Roblox game/place ID
     */
    async getGameInfo(gameId) {
        try {
            const response = await this.makeRequest(
                `https://games.roblox.com/v1/games?universeIds=${gameId}`
            );

            if (response.success && response.data.data && response.data.data.length > 0) {
                return { success: true, data: response.data.data[0] };
            }

            return { success: false, error: 'Game not found' };
        } catch (error) {
            console.error('Failed to get game info:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get game thumbnail
     * @param {number} universeId - Roblox universe ID
     * @param {string} size - Thumbnail size
     */
    async getGameThumbnail(universeId, size = '768x432') {
        try {
            const response = await this.makeRequest(
                `${this.thumbnailUrl}/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=${size}&format=Png&isCircular=false`
            );

            if (response.success && response.data.data && response.data.data.length > 0) {
                return { success: true, url: response.data.data[0].imageUrl };
            }

            return { success: false, error: 'Thumbnail not found' };
        } catch (error) {
            console.error('Failed to get game thumbnail:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get popular games
     * @param {number} limit - Number of games to fetch
     */
    async getPopularGames(limit = 50) {
        try {
            const response = await this.makeRequest(
                `https://games.roblox.com/v1/games/list?model=Popular&timeFilter=Now&genreFilter=all&exclusiveStartKey=&sortToken=&maxRows=${limit}`
            );

            if (response.success) {
                return { success: true, data: response.data.games || [] };
            }

            return { success: false, error: 'Failed to get popular games' };
        } catch (error) {
            console.error('Failed to get popular games:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Search for games
     * @param {string} query - Search query
     * @param {number} limit - Number of results to return
     */
    async searchGames(query, limit = 20) {
        try {
            const response = await this.makeRequest(
                `https://games.roblox.com/v1/games/list?model=Popular&timeFilter=Now&genreFilter=all&exclusiveStartKey=&sortToken=&maxRows=${limit}&keyword=${encodeURIComponent(query)}`
            );

            if (response.success) {
                return { success: true, data: response.data.games || [] };
            }

            return { success: false, error: 'Failed to search games' };
        } catch (error) {
            console.error('Failed to search games:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get server list for a game
     * @param {number} placeId - Roblox place ID
     * @param {number} limit - Number of servers to fetch
     */
    async getGameServers(placeId, limit = 10) {
        try {
            const response = await this.makeRequest(
                `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Asc&limit=${limit}`
            );

            if (response.success) {
                return { success: true, data: response.data.data || [] };
            }

            return { success: false, error: 'Failed to get game servers' };
        } catch (error) {
            console.error('Failed to get game servers:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate account credentials (simulated)
     * Note: Real authentication would require OAuth or other secure methods
     * @param {string} username - Username
     * @param {string} password - Password
     */
    async validateCredentials(username, password) {
        try {
            // In a real implementation, this would attempt to authenticate
            // For demo purposes, we'll just check if the user exists
            const userResult = await this.getUserByUsername(username);
            
            if (userResult.success) {
                // Simulate validation (in real app, this would be actual authentication)
                return {
                    success: true,
                    data: {
                        valid: true,
                        userId: userResult.data.id,
                        displayName: userResult.data.displayName,
                        description: userResult.data.description
                    }
                };
            }

            return { success: false, error: 'User not found' };
        } catch (error) {
            console.error('Failed to validate credentials:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get account premium status (simulated)
     * @param {number} userId - User ID
     */
    async getPremiumStatus(userId) {
        try {
            // This would typically require authentication to get premium status
            // For demo purposes, we'll return a random status
            return {
                success: true,
                data: {
                    isPremium: Math.random() > 0.7, // 30% chance of premium
                    premiumType: Math.random() > 0.5 ? 'Premium' : 'Premium+'
                }
            };
        } catch (error) {
            console.error('Failed to get premium status:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate Roblox game launch URL
     * @param {number} placeId - Place ID
     * @param {string} gameId - Game instance ID (optional)
     * @param {Object} options - Launch options
     */
    generateLaunchUrl(placeId, gameId = null, options = {}) {
        let url = `roblox://placeId=${placeId}`;
        
        if (gameId) {
            url += `&gameId=${gameId}`;
        }
        
        if (options.accessCode) {
            url += `&accessCode=${options.accessCode}`;
        }
        
        if (options.linkCode) {
            url += `&linkCode=${options.linkCode}`;
        }
        
        return url;
    }

    /**
     * Launch Roblox game
     * @param {number} placeId - Place ID
     * @param {string} gameId - Game instance ID (optional)
     * @param {Object} options - Launch options
     */
    async launchGame(placeId, gameId = null, options = {}) {
        try {
            const launchUrl = this.generateLaunchUrl(placeId, gameId, options);
            
            if (typeof Neutralino !== 'undefined') {
                // Use Neutralino to open the URL
                await Neutralino.os.open(launchUrl);
            } else {
                // Fallback to browser
                window.location.href = launchUrl;
            }
            
            return { success: true, url: launchUrl };
        } catch (error) {
            console.error('Failed to launch game:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get rate limit information
     */
    getRateLimitInfo() {
        return {
            requestsPerMinute: 60,
            burstLimit: 100,
            cooldownPeriod: 60000 // 1 minute
        };
    }

    /**
     * Check if API is available
     */
    async checkApiStatus() {
        try {
            const response = await fetch('https://users.roblox.com/v1/users/1', {
                method: 'HEAD'
            });
            
            return {
                success: true,
                status: response.status,
                available: response.status < 500
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                available: false
            };
        }
    }
}

// Create global instance
window.robloxAPI = new RobloxAPI();
