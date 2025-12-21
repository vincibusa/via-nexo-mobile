import { API_CONFIG } from '../../lib/config';
import { storage } from '../../lib/storage';

export interface Follower {
  id: string;
  username?: string;
  full_name?: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  isFollowedByCurrentUser?: boolean;
}

class FollowersService {
  /**
   * Get list of followers for current user
   */
  async getMyFollowers(
    offset = 0,
    limit = 100
  ): Promise<{ data?: Follower[]; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/social/follows/followers?limit=${limit}&offset=${offset}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to fetch followers',
        };
      }

      const responseData = await response.json() as any;
      const followers: Follower[] = (responseData.followers || responseData.data || []).map((f: any) => ({
        id: f.id,
        username: f.username,
        full_name: f.full_name,
        display_name: f.display_name || 'Unknown',
        avatar_url: f.avatar_url,
        bio: f.bio,
        isFollowedByCurrentUser: f.isFollowedByCurrentUser,
      }));

      return { data: followers };
    } catch (error) {
      console.error('Get my followers error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Get list of users that current user follows
   */
  async getFollowing(
    offset = 0,
    limit = 100
  ): Promise<{ data?: Follower[]; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/social/follows/following?limit=${limit}&offset=${offset}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to fetch following list',
        };
      }

      const responseData = await response.json() as any;
      const following: Follower[] = (responseData.following || responseData.data || []).map((f: any) => ({
        id: f.id,
        username: f.username,
        full_name: f.full_name,
        display_name: f.display_name || 'Unknown',
        avatar_url: f.avatar_url,
        bio: f.bio,
        isFollowedByCurrentUser: f.isFollowedByCurrentUser,
      }));

      return { data: following };
    } catch (error) {
      console.error('Get following error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Get followers for a specific user
   */
  async getFollowersForUser(
    userId: string,
    offset = 0,
    limit = 100
  ): Promise<{ data?: Follower[]; error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/social/follows/followers?userId=${userId}&limit=${limit}&offset=${offset}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to fetch user followers',
        };
      }

      const responseData = await response.json() as any;
      const followers: Follower[] = (responseData.followers || responseData.data || []).map((f: any) => ({
        id: f.id,
        username: f.username,
        full_name: f.full_name,
        display_name: f.display_name || 'Unknown',
        avatar_url: f.avatar_url,
        bio: f.bio,
        isFollowedByCurrentUser: f.isFollowedByCurrentUser,
      }));

      return { data: followers };
    } catch (error) {
      console.error('Get user followers error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Follow a user
   */
  async followUser(
    userId: string
  ): Promise<{ error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/social/follows`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ followingId: userId }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to follow user',
        };
      }

      return {};
    } catch (error) {
      console.error('Follow user error:', error);
      return { error: 'Network error' };
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(
    userId: string
  ): Promise<{ error?: string }> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        return { error: 'Not authenticated' };
      }
      const token = session.accessToken;

      const url = `${API_CONFIG.BASE_URL}/api/social/follows?followingId=${userId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({})) as any;
        return {
          error:
            errorData.error ||
            'Failed to unfollow user',
        };
      }

      return {};
    } catch (error) {
      console.error('Unfollow user error:', error);
      return { error: 'Network error' };
    }
  }
}

export const followersService = new FollowersService();
