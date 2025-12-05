/**
 * API Service for Hypnos Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token refresh on 401
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        return fetch(url, { ...options, headers });
      }
    }

    return response;
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.refreshToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access_token;
        localStorage.setItem('accessToken', data.access_token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  // Auth endpoints
  async register(email, password) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      this.setTokens(data.access_token, data.refresh_token);
      return { success: true, user: data.user };
    }

    return { success: false, error: data.error || 'Registration failed' };
  }

  async login(email, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      this.setTokens(data.access_token, data.refresh_token);
      return { success: true, user: data.user };
    }

    return { success: false, error: data.error || 'Login failed' };
  }

  async logout() {
    this.clearTokens();
  }

  async getMe() {
    const response = await this.request('/api/auth/me');

    if (response.ok) {
      return await response.json();
    }

    return null;
  }

  // Categories
  async getCategories() {
    const response = await this.request('/api/categories');

    if (response.ok) {
      return await response.json();
    }

    return [];
  }

  // Affirmations
  async getAffirmations() {
    const response = await this.request('/api/affirmations');

    if (response.ok) {
      return await response.json();
    }

    return [];
  }

  async getDefaultAffirmations() {
    // Public endpoint - no auth required, bypass cache
    const url = `${API_BASE_URL}/api/affirmations/default?_t=${Date.now()}`;
    console.log('[API] Fetching default affirmations from:', url);

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      console.log('[API] Response status:', response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        const withAudio = data?.filter(a => a.audio_url) || [];
        console.log('[API] Got', data?.length, 'affirmations,', withAudio.length, 'with audio_url');
        if (withAudio.length > 0) {
          console.log('[API] Sample audio_url:', withAudio[0].audio_url);
        }
        return data;
      }

      console.log('[API] Response not OK, status:', response.status);
      return [];
    } catch (err) {
      console.error('[API] Fetch error:', err.message, err);
      return [];
    }
  }

  async updateAffirmation(id, data) {
    const response = await this.request(`/api/affirmations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return await response.json();
    }

    return null;
  }

  async batchUpdateAffirmations(updates) {
    const response = await this.request('/api/affirmations/batch', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      return await response.json();
    }

    return null;
  }

  // Audio
  async uploadAudio(affirmationId, audioBlob, durationMs) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('duration_ms', durationMs);

    const response = await fetch(`${API_BASE_URL}/api/audio/upload/${affirmationId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    if (response.ok) {
      return await response.json();
    }

    const error = await response.json();
    return { success: false, error: error.error || 'Upload failed' };
  }

  async deleteAudio(affirmationId) {
    const response = await this.request(`/api/audio/${affirmationId}`, {
      method: 'DELETE',
    });

    return response.ok;
  }

  // Get full audio URL
  getAudioUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  }

  // Check if authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }
}

const api = new ApiService();
export default api;
