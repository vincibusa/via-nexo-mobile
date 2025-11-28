export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  text_overlay?: string;
  place_id?: string;
  created_at: string;
  expires_at: string;
  is_viewed?: boolean;
}

export interface StoryGroup {
  user_id: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  stories: Story[];
  has_unseen: boolean;
}

export class StoriesService {
  /**
   * Fetch stories from users you follow
   */
  static async getFollowingStories(): Promise<StoryGroup[]> {
    try {
      const response = await fetch('/api/social/stories/following');

      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching following stories:', error);
      return [];
    }
  }

  /**
   * Create a new story
   */
  static async createStory(data: {
    media_url: string;
    media_type?: 'image' | 'video';
    text_overlay?: string;
    place_id?: string;
  }): Promise<Story | null> {
    try {
      const response = await fetch('/api/social/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create story');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating story:', error);
      return null;
    }
  }

  /**
   * Get a single story
   */
  static async getStory(storyId: string): Promise<Story | null> {
    try {
      const response = await fetch(`/api/social/stories/${storyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch story');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching story:', error);
      return null;
    }
  }

  /**
   * Mark a story as viewed
   */
  static async markAsViewed(storyId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/social/stories/${storyId}/view`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark story as viewed');
      }

      return true;
    } catch (error) {
      console.error('Error marking story as viewed:', error);
      return false;
    }
  }

  /**
   * Delete a story
   */
  static async deleteStory(storyId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/social/stories/${storyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }

      return true;
    } catch (error) {
      console.error('Error deleting story:', error);
      return false;
    }
  }
}
