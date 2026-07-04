export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  date_of_birth: string | null;
  email?: string;
  is_private: boolean;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_urls: string[];
  media_type: 'image' | 'video' | 'text' | null;
  post_type: 'original' | 'repost' | 'quote';
  repost_id: string | null;
  feeling: string | null;
  feeling_icon: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  song_title: string | null;
  song_artist: string | null;
  song_artwork_url: string | null;
  hashtags: string[];
  tagged_users: string[];
  bg_color: string | null;
  visibility: 'public' | 'friends' | 'private';
  view_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  // joined
  profile?: Profile;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
  // joined
  profile?: Profile;
  is_liked?: boolean;
  replies?: Comment[];
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  duration: number;
  is_viewed: boolean;
  expires_at: string;
  created_at: string;
  // joined
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'mention' | 'tag' | 'share' | 'message' | 'security_login' | 'security_location';
  post_id: string | null;
  comment_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  // joined
  actor?: Profile;
  post?: Pick<Post, 'id' | 'media_urls' | 'content'>;
  meta?: Record<string, string>;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_muted: boolean;
  created_at: string;
  // joined
  participant1?: Profile;
  participant2?: Profile;
  other_user?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'audio' | null;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker';
  is_read: boolean;
  is_deleted: boolean;
  reactions: Record<string, string>;
  reply_to_id: string | null;
  created_at: string;
  // joined
  sender?: Profile;
}

export interface Follower {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Song {
  trackId: number;
  trackName: string;
  artistName: string;
  albumName: string;
  artworkUrl100: string;
  previewUrl: string;
  trackTimeMillis: number;
}
