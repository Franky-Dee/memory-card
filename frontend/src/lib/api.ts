export type AuthUser = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  banner_url: string;
  shareable_id: string;
  accent_color: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type CommentItem = {
  id: string;
  author_name: string;
  author_handle: string;
  author_avatar_url: string;
  body: string;
  created_at: string;
};

export type FeedItem = {
  id: string;
  activity_type: string;
  actor_name: string;
  actor_handle: string;
  actor_avatar_url: string;
  game_title: string;
  summary: string;
  timestamp: string;
  cover_url: string;
  reaction_count: number;
  comment_count: number;
  current_user_reacted: boolean;
  comments: CommentItem[];
};

export type DiscoverUser = {
  id: string;
  display_name: string;
  username: string;
  shareable_id: string;
  tagline: string;
  favorite_games: string[];
  follower_count: number;
  avatar_url: string;
  banner_url: string;
  accent_color: string;
  is_following: boolean;
};

export type LibraryEntry = {
  id: string;
  game_id: string;
  game_title: string;
  status: string;
  platform: string;
  hours_played: number;
  playthroughs: number;
  progress_percent: number;
  cover_url: string;
  note: string;
};

export type ReviewHighlight = {
  id: string;
  game_id: string;
  game_title: string;
  title: string;
  verdict: string;
  body: string;
  total_score: number;
  visibility: string;
  spoiler: boolean;
  comment_count: number;
  reaction_count: number;
  current_user_reacted: boolean;
  comments: CommentItem[];
  cover_url: string;
};

export type FeaturedList = {
  id: string;
  title: string;
  description: string;
  items: string[];
};

export type GameSearchResult = {
  id: string;
  title: string;
  platforms: string[];
  cover_url: string;
  release_year: number | null;
  summary: string | null;
};

export type ProfileResponse = {
  user: AuthUser;
  stats: {
    total_games: number;
    total_reviews: number;
    average_score: number;
    total_hours: number;
    followers: number;
    following: number;
  };
  tagline: string;
  favorite_games: string[];
  featured_lists: FeaturedList[];
  review_highlights: ReviewHighlight[];
  followers: DiscoverUser[];
  following_users: DiscoverUser[];
  most_played_games: LibraryEntry[];
};

export type DashboardResponse = {
  current_user: AuthUser;
  feed: FeedItem[];
  discover_users: DiscoverUser[];
  library: LibraryEntry[];
  reviews: ReviewHighlight[];
  suggested_games: GameSearchResult[];
};

export type ReviewDraft = {
  id: string;
  game_id: string;
  game_title: string;
  game_cover_url: string;
  verdict: string;
  body: string;
  scores: Record<string, number>;
  total_score: number;
  updated_at: string;
  spoiler: boolean;
  published: boolean;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
};

export type PrivacySettings = {
  profile_visibility: "public" | "followers" | "private";
  review_visibility: "public" | "followers" | "private";
  activity_visibility: "public" | "followers" | "private";
};

export type ProfileCustomizationRequest = {
  tagline: string;
  avatar_url: string;
  banner_url: string;
  accent_color: string;
  favorite_games: string[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ detail: "Request failed." }))) as { detail?: string };
    throw new Error(payload.detail ?? "Request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signup: (displayName: string, email: string, password: string) =>
    apiRequest<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        display_name: displayName,
        username: displayName.replace(/\s+/g, "").toLowerCase().slice(0, 24) || "playerone",
        email,
        password,
      }),
    }),
  getDashboard: (token: string) => apiRequest<DashboardResponse>("/dashboard", { token }),
  getMyProfile: (token: string) => apiRequest<ProfileResponse>("/users/profile/me", { token }),
  searchUsers: (token: string, query: string) =>
    apiRequest<DiscoverUser[]>(`/users/search?q=${encodeURIComponent(query)}`, { token }),
  getPrivacySettings: (token: string) => apiRequest<PrivacySettings>("/users/settings/privacy", { token }),
  updatePrivacySettings: (token: string, payload: PrivacySettings) =>
    apiRequest<PrivacySettings>("/users/settings/privacy", {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    }),
  updateCustomization: (token: string, payload: ProfileCustomizationRequest) =>
    apiRequest<AuthUser>("/users/settings/customization", {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    }),
  createList: (token: string, payload: { title: string; description: string; items: string[] }) =>
    apiRequest<FeaturedList>("/users/lists", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
  deleteList: (token: string, listId: string) =>
    apiRequest<{ status: string }>(`/users/lists/${listId}`, {
      method: "DELETE",
      token,
    }),
  getDiscoverUsers: (token: string, query = "") =>
    apiRequest<DiscoverUser[]>(`/follows/discover?q=${encodeURIComponent(query)}`, { token }),
  followUser: (token: string, userId: string) =>
    apiRequest<DiscoverUser[]>(`/follows/${userId}`, {
      method: "POST",
      token,
    }),
  unfollowUser: (token: string, userId: string) =>
    apiRequest<DiscoverUser[]>(`/follows/${userId}`, {
      method: "DELETE",
      token,
    }),
  searchGames: (token: string, query: string) =>
    apiRequest<GameSearchResult[]>(`/games/search?q=${encodeURIComponent(query)}`, { token }),
  addLibraryEntry: (token: string, payload: { game_id: string; platform: string; status: string }) =>
    apiRequest<LibraryEntry>("/library", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
  updateLibraryEntry: (
    token: string,
    entryId: string,
    payload: { status?: string; hours_played?: number; progress_percent?: number; playthroughs?: number; note?: string },
  ) =>
    apiRequest<LibraryEntry>(`/library/${entryId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    }),
  reactToFeed: (token: string, feedId: string) =>
    apiRequest<FeedItem>(`/feed/${feedId}/react`, {
      method: "POST",
      token,
    }),
  commentOnFeed: (token: string, feedId: string, body: string) =>
    apiRequest<FeedItem>(`/feed/${feedId}/comments`, {
      method: "POST",
      token,
      body: JSON.stringify({ body }),
    }),
  getReviewDrafts: (token: string) => apiRequest<ReviewDraft[]>("/reviews/drafts", { token }),
  saveReviewDraft: (
    token: string,
    payload: {
      game_id: string;
      verdict: string;
      body: string;
      scores: Record<string, number>;
      total_score: number;
      spoiler: boolean;
    },
    draftId?: string,
  ) =>
    apiRequest<ReviewDraft>(draftId ? `/reviews/drafts/${draftId}` : "/reviews/drafts", {
      method: draftId ? "PUT" : "POST",
      token,
      body: JSON.stringify(payload),
    }),
  publishReviewDraft: (token: string, draftId: string) =>
    apiRequest<ReviewHighlight>(`/reviews/drafts/${draftId}/publish`, {
      method: "POST",
      token,
    }),
  deleteReview: (token: string, reviewId: string) =>
    apiRequest<{ status: string }>(`/reviews/published/${reviewId}`, {
      method: "DELETE",
      token,
    }),
  reactToReview: (token: string, reviewId: string) =>
    apiRequest<ReviewHighlight>(`/reviews/published/${reviewId}/react`, {
      method: "POST",
      token,
    }),
  commentOnReview: (token: string, reviewId: string, body: string) =>
    apiRequest<ReviewHighlight>(`/reviews/published/${reviewId}/comments`, {
      method: "POST",
      token,
      body: JSON.stringify({ body }),
    }),
  getNotifications: (token: string) => apiRequest<NotificationItem[]>("/notifications", { token }),
};
