import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  api,
  type AuthUser,
  type DashboardResponse,
  type DiscoverUser,
  type GameSearchResult,
  type NotificationItem,
  type PrivacySettings,
  type ProfileCustomizationRequest,
  type ProfileResponse,
  type ReviewDraft,
  type ScoreBreakdown,
} from "./api";
import { useAuth } from "./auth";

type SaveDraftPayload = {
  game_id: string;
  verdict: string;
  body: string;
  scores: ScoreBreakdown;
  total_score: number;
  spoiler: boolean;
};

type AppDataContextValue = {
  dashboard: DashboardResponse | null;
  profile: ProfileResponse | null;
  drafts: ReviewDraft[];
  notifications: NotificationItem[];
  privacySettings: PrivacySettings | null;
  loading: boolean;
  error: string | null;
  gameSearchResults: GameSearchResult[];
  peopleSearchResults: DiscoverUser[];
  searchGames: (query: string) => Promise<void>;
  searchPeople: (query: string) => Promise<void>;
  addGameToLibrary: (payload: { game_id: string; platform: string; status: string }) => Promise<void>;
  updateLibraryEntry: (
    entryId: string,
    payload: { status?: string; hours_played?: number; progress_percent?: number; playthroughs?: number; note?: string },
  ) => Promise<void>;
  toggleFollow: (userId: string, isFollowing: boolean) => Promise<void>;
  updatePrivacySettings: (payload: PrivacySettings) => Promise<void>;
  updateCustomization: (payload: ProfileCustomizationRequest) => Promise<AuthUser | null>;
  createList: (payload: { title: string; description: string; items: string[] }) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  saveDraft: (payload: SaveDraftPayload, draftId?: string) => Promise<void>;
  publishDraft: (draftId: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  reactToFeed: (feedId: string, emoji: string) => Promise<void>;
  commentOnFeed: (feedId: string, body: string) => Promise<void>;
  reactToReview: (reviewId: string, emoji: string) => Promise<void>;
  commentOnReview: (reviewId: string, body: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const { token, updateUser } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [drafts, setDrafts] = useState<ReviewDraft[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [gameSearchResults, setGameSearchResults] = useState<GameSearchResult[]>([]);
  const [peopleSearchResults, setPeopleSearchResults] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setDashboard(null);
      setProfile(null);
      setDrafts([]);
      setNotifications([]);
      setPrivacySettings(null);
      setGameSearchResults([]);
      setPeopleSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [nextDashboard, nextProfile, nextDrafts, nextNotifications, nextPrivacy] = await Promise.all([
        api.getDashboard(token),
        api.getMyProfile(token),
        api.getReviewDrafts(token),
        api.getNotifications(token),
        api.getPrivacySettings(token),
      ]);
      setDashboard(nextDashboard);
      setProfile(nextProfile);
      setDrafts(nextDrafts);
      setNotifications(nextNotifications);
      setPrivacySettings(nextPrivacy);
      setPeopleSearchResults(nextDashboard.discover_users);
      setGameSearchResults(nextDashboard.suggested_games);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load app data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const searchGames = useCallback(
    async (query: string) => {
      if (!token) {
        return;
      }
      try {
        setGameSearchResults(await api.searchGames(token, query));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to search games.");
      }
    },
    [token],
  );

  const searchPeople = useCallback(
    async (query: string) => {
      if (!token) {
        return;
      }
      try {
        setPeopleSearchResults(await api.searchUsers(token, query));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to search people.");
      }
    },
    [token],
  );

  const addGameToLibrary = useCallback(
    async (payload: { game_id: string; platform: string; status: string }) => {
      if (!token) {
        return;
      }
      await api.addLibraryEntry(token, payload);
      await refresh();
    },
    [refresh, token],
  );

  const updateLibraryEntry = useCallback(
    async (
      entryId: string,
      payload: { status?: string; hours_played?: number; progress_percent?: number; playthroughs?: number; note?: string },
    ) => {
      if (!token) {
        return;
      }
      await api.updateLibraryEntry(token, entryId, payload);
      await refresh();
    },
    [refresh, token],
  );

  const toggleFollow = useCallback(
    async (userId: string, isFollowing: boolean) => {
      if (!token) {
        return;
      }
      const users = isFollowing ? await api.unfollowUser(token, userId) : await api.followUser(token, userId);
      setPeopleSearchResults(users);
      setDashboard((current) => (current ? { ...current, discover_users: users } : current));
      await refresh();
    },
    [refresh, token],
  );

  const updatePrivacy = useCallback(
    async (payload: PrivacySettings) => {
      if (!token) {
        return;
      }
      const next = await api.updatePrivacySettings(token, payload);
      setPrivacySettings(next);
    },
    [token],
  );

  const updateCustomization = useCallback(
    async (payload: ProfileCustomizationRequest) => {
      if (!token) {
        return null;
      }
      const updatedUser = await api.updateCustomization(token, payload);
      updateUser(updatedUser);
      await refresh();
      return updatedUser;
    },
    [refresh, token, updateUser],
  );

  const createList = useCallback(
    async (payload: { title: string; description: string; items: string[] }) => {
      if (!token) {
        return;
      }
      await api.createList(token, payload);
      await refresh();
    },
    [refresh, token],
  );

  const deleteList = useCallback(
    async (listId: string) => {
      if (!token) {
        return;
      }
      await api.deleteList(token, listId);
      await refresh();
    },
    [refresh, token],
  );

  const saveDraft = useCallback(
    async (payload: SaveDraftPayload, draftId?: string) => {
      if (!token) {
        return;
      }
      await api.saveReviewDraft(token, payload, draftId);
      await refresh();
    },
    [refresh, token],
  );

  const publishDraft = useCallback(
    async (draftId: string) => {
      if (!token) {
        return;
      }
      await api.publishReviewDraft(token, draftId);
      await refresh();
    },
    [refresh, token],
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      if (!token) {
        return;
      }
      await api.deleteReview(token, reviewId);
      await refresh();
    },
    [refresh, token],
  );

  const reactToFeed = useCallback(
    async (feedId: string, emoji: string) => {
      if (!token) {
        return;
      }
      await api.reactToFeed(token, feedId, emoji);
      await refresh();
    },
    [refresh, token],
  );

  const commentOnFeed = useCallback(
    async (feedId: string, body: string) => {
      if (!token) {
        return;
      }
      await api.commentOnFeed(token, feedId, body);
      await refresh();
    },
    [refresh, token],
  );

  const reactToReview = useCallback(
    async (reviewId: string, emoji: string) => {
      if (!token) {
        return;
      }
      await api.reactToReview(token, reviewId, emoji);
      await refresh();
    },
    [refresh, token],
  );

  const commentOnReview = useCallback(
    async (reviewId: string, body: string) => {
      if (!token) {
        return;
      }
      await api.commentOnReview(token, reviewId, body);
      await refresh();
    },
    [refresh, token],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      dashboard,
      profile,
      drafts,
      notifications,
      privacySettings,
      loading,
      error,
      gameSearchResults,
      peopleSearchResults,
      searchGames,
      searchPeople,
      addGameToLibrary,
      updateLibraryEntry,
      toggleFollow,
      updatePrivacySettings: updatePrivacy,
      updateCustomization,
      createList,
      deleteList,
      saveDraft,
      publishDraft,
      deleteReview,
      reactToFeed,
      commentOnFeed,
      reactToReview,
      commentOnReview,
      refresh,
    }),
    [
      addGameToLibrary,
      commentOnFeed,
      commentOnReview,
      createList,
      dashboard,
      deleteList,
      deleteReview,
      drafts,
      error,
      gameSearchResults,
      loading,
      notifications,
      peopleSearchResults,
      privacySettings,
      profile,
      publishDraft,
      reactToFeed,
      reactToReview,
      refresh,
      saveDraft,
      searchGames,
      searchPeople,
      toggleFollow,
      updateCustomization,
      updateLibraryEntry,
      updatePrivacy,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
