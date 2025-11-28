export interface User {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  isFollowing?: boolean;
}

export class SocialSuggestionsService {
  /**
   * Fetch follow suggestions based on type
   * Types: taste (similar interests), events (same event attendance), popular (most followers)
   */
  static async getSuggestions(
    type: 'taste' | 'events' | 'popular' | 'all' = 'all',
    limit: number = 10
  ): Promise<User[]> {
    try {
      const response = await fetch(
        `/api/social/follows/suggestions?type=${type}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }

  /**
   * Search for users by username or full_name
   */
  static async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `/api/social/profiles/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      return Array.isArray(data)
        ? data.map((u: any) => ({
            id: u.id,
            username: u.username,
            full_name: u.full_name,
            avatar_url: u.avatar_url,
            bio: u.bio,
            isFollowing: u.isFollowing,
          }))
        : [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Follow a user
   */
  static async followUser(userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/social/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to follow user');
      }

      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/social/follows?followingId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unfollow user');
      }

      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  /**
   * Toggle follow status
   */
  static async toggleFollow(userId: string, isCurrentlyFollowing: boolean): Promise<boolean> {
    return isCurrentlyFollowing
      ? this.unfollowUser(userId)
      : this.followUser(userId);
  }
}
