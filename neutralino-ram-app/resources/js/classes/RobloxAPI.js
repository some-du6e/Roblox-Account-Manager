class RobloxAPI {
    constructor() {
        this.baseUrls = {
            api: 'https://api.roblox.com',
            users: 'https://users.roblox.com',
            auth: 'https://auth.roblox.com',
            avatar: 'https://avatar.roblox.com',
            friends: 'https://friends.roblox.com',
            presence: 'https://presence.roblox.com',
            games: 'https://games.roblox.com',
            economy: 'https://economy.roblox.com',
            thumbnails: 'https://thumbnails.roblox.com',
            catalog: 'https://catalog.roblox.com',
            accountsettings: 'https://accountsettings.roblox.com'
        };

        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }

    // Make authenticated request
    async makeRequest(url, options = {}, account = null) {
        const headers = {
            'User-Agent': this.userAgent,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (account && account.securityToken) {
            headers['Cookie'] = `.ROBLOSECURITY=${account.securityToken}`;
        }

        if (account && account.csrfToken) {
            headers['X-CSRF-TOKEN'] = account.csrfToken;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle CSRF token refresh
            if (response.status === 403 && account) {
                const csrfToken = response.headers.get('x-csrf-token');
                if (csrfToken) {
                    account.csrfToken = csrfToken;
                    headers['X-CSRF-TOKEN'] = csrfToken;
                    
                    // Retry request with new CSRF token
                    return await fetch(url, {
                        ...options,
                        headers
                    });
                }
            }

            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // User Authentication
    async authenticateUser(username, password) {
        try {
            const loginUrl = `${this.baseUrls.auth}/v2/login`;
            const response = await this.makeRequest(loginUrl, {
                method: 'POST',
                body: JSON.stringify({
                    ctype: 'Username',
                    cvalue: username,
                    password: password
                })
            });

            if (response.ok) {
                const cookies = response.headers.get('set-cookie');
                const securityToken = this.extractSecurityToken(cookies);
                const csrfToken = response.headers.get('x-csrf-token');

                return {
                    success: true,
                    securityToken,
                    csrfToken
                };
            } else {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.errors?.[0]?.message || 'Authentication failed'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get user info
    async getUserInfo(account) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.users}/v1/users/authenticated`,
                { method: 'GET' },
                account
            );

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Failed to get user info:', error);
            return null;
        }
    }

    // Get user avatar
    async getUserAvatar(userId, size = 150) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.thumbnails}/v1/users/avatar-headshot?userIds=${userId}&size=${size}x${size}&format=Png&isCircular=false`
            );

            if (response.ok) {
                const data = await response.json();
                return data.data?.[0]?.imageUrl || null;
            }
            return null;
        } catch (error) {
            console.error('Failed to get user avatar:', error);
            return null;
        }
    }

    // Get user presence
    async getUserPresence(userIds, account) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.presence}/v1/presence/users`,
                {
                    method: 'POST',
                    body: JSON.stringify({ userIds })
                },
                account
            );

            if (response.ok) {
                const data = await response.json();
                return data.userPresences || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get user presence:', error);
            return [];
        }
    }

    // Get game details
    async getGameDetails(gameId) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.games}/v1/games?universeIds=${gameId}`
            );

            if (response.ok) {
                const data = await response.json();
                return data.data?.[0] || null;
            }
            return null;
        } catch (error) {
            console.error('Failed to get game details:', error);
            return null;
        }
    }

    // Search games
    async searchGames(query, limit = 20, cursor = '') {
        try {
            let url = `${this.baseUrls.games}/v1/games/list?model.keyword=${encodeURIComponent(query)}&model.maxRows=${limit}`;
            if (cursor) {
                url += `&model.startRowIndex=${cursor}`;
            }

            const response = await this.makeRequest(url);

            if (response.ok) {
                const data = await response.json();
                return {
                    games: data.games || [],
                    nextPageCursor: data.nextPageCursor || null
                };
            }
            return { games: [], nextPageCursor: null };
        } catch (error) {
            console.error('Failed to search games:', error);
            return { games: [], nextPageCursor: null };
        }
    }

    // Get popular games
    async getPopularGames(limit = 20) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.games}/v1/games/list?model.sortType=1&model.maxRows=${limit}`
            );

            if (response.ok) {
                const data = await response.json();
                return data.games || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get popular games:', error);
            return [];
        }
    }

    // Get game thumbnails
    async getGameThumbnails(gameIds, size = '768x432') {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.thumbnails}/v1/games/multiget/thumbnails?universeIds=${gameIds.join(',')}&size=${size}&format=Png&isCircular=false`
            );

            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get game thumbnails:', error);
            return [];
        }
    }

    // Get game icons
    async getGameIcons(gameIds, size = '150x150') {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.thumbnails}/v1/games/icons?universeIds=${gameIds.join(',')}&size=${size}&format=Png&isCircular=false`
            );

            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get game icons:', error);
            return [];
        }
    }

    // Get user's friends
    async getUserFriends(userId, account) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.friends}/v1/users/${userId}/friends`,
                { method: 'GET' },
                account
            );

            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get user friends:', error);
            return [];
        }
    }

    // Get user's groups
    async getUserGroups(userId) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.api}/v2/users/${userId}/groups`
            );

            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get user groups:', error);
            return [];
        }
    }

    // Join game server
    async joinGameServer(placeId, account, jobId = null) {
        try {
            let url = `${this.baseUrls.games}/v1/games/${placeId}/servers/Public`;
            if (jobId) {
                url += `?jobId=${jobId}`;
            }

            const response = await this.makeRequest(
                url,
                { method: 'GET' },
                account
            );

            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get game servers:', error);
            return [];
        }
    }

    // Get game passes
    async getGamePasses(universeId) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.games}/v1/games/${universeId}/game-passes?sortOrder=Asc&limit=100`
            );

            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get game passes:', error);
            return [];
        }
    }

    // Get user's inventory
    async getUserInventory(userId, assetType, account) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.api}/v1/users/${userId}/inventory/${assetType}?limit=100`,
                { method: 'GET' },
                account
            );

            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get user inventory:', error);
            return [];
        }
    }

    // Logout user
    async logoutUser(account) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.auth}/v2/logout`,
                { method: 'POST' },
                account
            );

            return response.ok;
        } catch (error) {
            console.error('Failed to logout user:', error);
            return false;
        }
    }

    // Validate account
    async validateAccount(account) {
        try {
            const userInfo = await this.getUserInfo(account);
            if (userInfo && userInfo.id) {
                account.userId = userInfo.id;
                account.username = userInfo.name;
                account.valid = true;
                return true;
            } else {
                account.valid = false;
                return false;
            }
        } catch (error) {
            console.error('Failed to validate account:', error);
            account.valid = false;
            return false;
        }
    }

    // Extract security token from cookies
    extractSecurityToken(cookies) {
        if (!cookies) return null;
        
        const match = cookies.match(/\.ROBLOSECURITY=([^;]+)/);
        return match ? match[1] : null;
    }

    // Get CSRF token
    async getCSRFToken(account) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.auth}/v2/logout`,
                { method: 'POST' },
                account
            );

            return response.headers.get('x-csrf-token');
        } catch (error) {
            console.error('Failed to get CSRF token:', error);
            return null;
        }
    }

    // Check if user is premium
    async checkUserPremium(userId) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.api}/v1/users/${userId}/premium`
            );

            if (response.ok) {
                const data = await response.json();
                return data.isPremium || false;
            }
            return false;
        } catch (error) {
            console.error('Failed to check user premium:', error);
            return false;
        }
    }

    // Get user badges
    async getUserBadges(userId, limit = 100) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.api}/v1/users/${userId}/badges?limit=${limit}`
            );

            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get user badges:', error);
            return [];
        }
    }

    // Send friend request
    async sendFriendRequest(targetUserId, account) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrls.friends}/v1/users/${targetUserId}/request-friendship`,
                { method: 'POST' },
                account
            );

            return response.ok;
        } catch (error) {
            console.error('Failed to send friend request:', error);
            return false;
        }
    }

    // Get user's recent games
    async getUserRecentGames(userId, account) {
        try {
            // This endpoint might not exist in the actual API
            // This is a mock implementation
            const response = await this.makeRequest(
                `${this.baseUrls.games}/v1/users/${userId}/games?limit=10`,
                { method: 'GET' },
                account
            );

            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get user recent games:', error);
            return [];
        }
    }
}

// Create global instance
window.RobloxAPI = new RobloxAPI();
