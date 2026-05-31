/**
 * AuthForge Integration Examples
 * 
 * These examples show how to integrate AuthForge with your applications.
 */

// ============================================
// JAVASCRIPT / TYPESCRIPT CLIENT
// ============================================

class AuthForgeClient {
    private baseUrl: string;
    private accessToken: string | null = null;

    constructor(baseUrl: string = 'http://localhost:3000/api/v1') {
        this.baseUrl = baseUrl;
    }

    // ============================================
    // Authentication
    // ============================================

    async signup(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<{ user: any; message: string }> {
        const response = await fetch(`${this.baseUrl}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error.message);
        return result.data;
    }

    async login(email: string, password: string): Promise<{ user: any; accessToken: string }> {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important for cookies
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error.message);

        this.accessToken = result.data.access_token;
        return { user: result.data.user, accessToken: result.data.access_token };
    }

    async logout(allSessions = false): Promise<void> {
        await this.authenticatedRequest('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ allSessions }),
        });
        this.accessToken = null;
    }

    async refreshToken(): Promise<string> {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error.message);

        this.accessToken = result.data.access_token;
        return result.data.access_token;
    }

    // ============================================
    // User Management
    // ============================================

    async getProfile(): Promise<any> {
        return this.authenticatedRequest('/users/me');
    }

    async updateProfile(data: { firstName?: string; lastName?: string }): Promise<any> {
        return this.authenticatedRequest('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // ============================================
    // Authenticated Request Helper
    // ============================================

    private async authenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        if (!this.accessToken) throw new Error('Not authenticated');

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`,
                ...options.headers,
            },
            credentials: 'include',
        });

        // Handle token expiration
        if (response.status === 401) {
            try {
                await this.refreshToken();
                return this.authenticatedRequest(endpoint, options);
            } catch {
                this.accessToken = null;
                throw new Error('Session expired');
            }
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.error.message);
        return result.data;
    }
}

// ============================================
// USAGE EXAMPLE
// ============================================

async function example() {
    const auth = new AuthForgeClient();

    try {
        // Signup
        await auth.signup({
            email: 'user@example.com',
            password: 'SecureP@ss123!',
            firstName: 'John',
            lastName: 'Doe',
        });
        console.log('✓ Signed up successfully');

        // Login
        const { user, accessToken } = await auth.login('user@example.com', 'SecureP@ss123!');
        console.log('✓ Logged in as:', user.email);

        // Get profile
        const profile = await auth.getProfile();
        console.log('✓ Profile:', profile);

        // Update profile
        await auth.updateProfile({ firstName: 'Jane' });
        console.log('✓ Profile updated');

        // Logout
        await auth.logout();
        console.log('✓ Logged out');
    } catch (error) {
        console.error('Error:', error);
    }
}

export default AuthForgeClient;
