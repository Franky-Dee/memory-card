import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { SectionCard } from "../components/SectionCard";
import { useAppData } from "../lib/app-data";
import {
  api,
  type DiscoverUser,
  type FeedItem,
  type GameDetailResponse,
  type ProfileResponse,
  type ReviewHighlight,
  type ScoreBreakdown,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { avatarPresets, bannerPresets, getDisplayBanner } from "../lib/presets";

const REACTION_OPTIONS = ["🔥", "😍", "😂", "😮", "🎮"] as const;

const libraryStatuses = [
  { value: "want_to_play", label: "Want to Play" },
  { value: "playing", label: "Playing" },
  { value: "paused", label: "Paused" },
  { value: "finished", label: "Finished" },
  { value: "dropped", label: "Dropped" },
  { value: "replaying", label: "Replaying" },
];

const reviewCategories = [
  { key: "gameplay", label: "Gameplay" },
  { key: "story", label: "Story" },
  { key: "visuals", label: "Visual Design" },
  { key: "art_direction", label: "Art Direction" },
  { key: "audio", label: "Audio" },
  { key: "performance", label: "Performance" },
  { key: "world_design", label: "World Design" },
  { key: "replayability", label: "Replayability" },
  { key: "innovation", label: "Innovation" },
  { key: "emotional_impact", label: "Emotional Impact" },
] as const;

type ReviewCardProps = {
  review: ReviewHighlight;
  accentColor?: string;
  allowDelete?: boolean;
  onDelete?: () => void;
  onReact?: (emoji: string) => Promise<void>;
  onComment?: (body: string) => Promise<void>;
  commentDraft?: string;
  onCommentDraftChange?: (value: string) => void;
  showComposer?: boolean;
  previewLength?: number;
  showAuthor?: boolean;
};

function Avatar({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="avatar" />;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function previewText(value: string, length = 220) {
  if (value.length <= length) {
    return value;
  }
  return `${value.slice(0, length).trimEnd()}…`;
}

function useInfiniteReveal(totalItems: number, initialCount: number, step: number) {
  const [visibleCount, setVisibleCount] = useState(Math.min(totalItems, initialCount));

  useEffect(() => {
    setVisibleCount(Math.min(totalItems, initialCount));
  }, [initialCount, totalItems]);

  useEffect(() => {
    if (!totalItems || visibleCount >= totalItems) {
      return;
    }

    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 640) {
        setVisibleCount((current) => Math.min(totalItems, current + step));
      }
    };

    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [step, totalItems, visibleCount]);

  return visibleCount;
}

function DetailModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="detail-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="detail-modal__header">
          <div>
            <p className="eyebrow">Detail view</p>
            <h2>{title}</h2>
            {subtitle ? <p className="subtle-text">{subtitle}</p> : null}
          </div>
          <button className="ghost-button ghost-button--compact" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="detail-modal__content">{children}</div>
      </div>
    </div>
  );
}

function ReactionStack({ recentReactions, reactionCount }: { recentReactions: string[]; reactionCount: number }) {
  const visibleReactions = recentReactions.slice(-5);

  return (
    <div className="reaction-stack" aria-label={`${reactionCount} reactions`}>
      {visibleReactions.map((emoji, index) => (
        <span key={`${emoji}-${index}`} className="reaction-stack__chip" style={{ marginLeft: index === 0 ? 0 : -10 }}>
          {emoji}
        </span>
      ))}
      <span className="reaction-stack__count">{reactionCount}</span>
    </div>
  );
}

function ReactionPicker({
  currentReaction,
  recentReactions,
  reactionCount,
  onSelect,
}: {
  currentReaction: string | null;
  recentReactions: string[];
  reactionCount: number;
  onSelect: (emoji: string) => void;
}) {
  return (
    <div className="reaction-row">
      <div className="reaction-picker">
        {REACTION_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            className={currentReaction === emoji ? "reaction-picker__button reaction-picker__button--active" : "reaction-picker__button"}
            type="button"
            onClick={() => onSelect(emoji)}
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <ReactionStack recentReactions={recentReactions} reactionCount={reactionCount} />
    </div>
  );
}

function EmojiInsertRow({ onInsert }: { onInsert: (emoji: string) => void }) {
  return (
    <div className="emoji-insert-row">
      {REACTION_OPTIONS.map((emoji) => (
        <button key={emoji} className="emoji-insert-row__button" type="button" onClick={() => onInsert(emoji)}>
          {emoji}
        </button>
      ))}
    </div>
  );
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  placeholder: string;
}) {
  return (
    <div className="comment-compose">
      <EmojiInsertRow onInsert={(emoji) => onChange(`${value}${value ? " " : ""}${emoji}`)} />
      <div className="comment-entry">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
        <button
          className="primary-button primary-button--compact"
          type="button"
          onClick={() => void onSubmit()}
          disabled={!value.trim()}
        >
          Post
        </button>
      </div>
    </div>
  );
}

function UserCard({
  person,
  onToggleFollow,
  compact = false,
}: {
  person: DiscoverUser;
  onToggleFollow?: (userId: string, isFollowing: boolean) => void;
  compact?: boolean;
}) {
  return (
    <article className={compact ? "mini-card mini-card--interactive" : "person-card"}>
      <div className="person-card__banner" style={{ backgroundImage: `url(${getDisplayBanner(person.banner_url, person.accent_color, person.id)})` }} />
      <div className="person-card__content">
        <Link to={`/app/profile/${person.id}`} className="identity-row identity-row--link">
          <Avatar src={person.avatar_url} alt={person.display_name} />
          <div>
            <h3>{person.display_name}</h3>
            <p className="subtle-text">
              @{person.username} · {person.shareable_id}
            </p>
          </div>
        </Link>
        <p>{person.tagline}</p>
        <p className="subtle-text">{person.follower_count} followers</p>
        <div className="tag-row">
          {person.favorite_games.slice(0, 3).map((game) => (
            <span key={game} className="score-tag score-tag--soft">
              {game}
            </span>
          ))}
        </div>
      </div>
      {onToggleFollow ? (
        <button
          className={person.is_following ? "ghost-button ghost-button--compact" : "primary-button primary-button--compact"}
          type="button"
          onClick={() => onToggleFollow(person.id, person.is_following)}
        >
          {person.is_following ? "Following" : "Follow"}
        </button>
      ) : null}
    </article>
  );
}

function ReviewCard({
  review,
  accentColor = "#8b5cf6",
  allowDelete = false,
  onDelete,
  onReact,
  onComment,
  commentDraft = "",
  onCommentDraftChange,
  showComposer = true,
  previewLength = 220,
  showAuthor = true,
}: ReviewCardProps) {
  const preview = review.body ? previewText(review.body, previewLength) : review.verdict;

  return (
    <article className="mini-card mini-card--review mini-card--interactive">
      <div className="review-card__top">
        <Link to={`/app/games/${review.game_id}`} className="review-card__cover-link">
          <img src={review.cover_url} alt={review.game_title} className="game-cover game-cover--compact" />
        </Link>
        <div className="review-card__content">
          {showAuthor && review.author_id ? (
            <Link to={`/app/profile/${review.author_id}`} className="review-card__author">
              {review.author_name || "Memory Card user"} <span>{review.author_handle}</span>
            </Link>
          ) : null}
          <Link to={`/app/reviews/${review.id}`} className="review-card__title-link">
            <h3>{review.game_title}</h3>
            <p>{review.title}</p>
          </Link>
          <p>{review.verdict}</p>
          <p className="subtle-text">{preview}</p>
        </div>
        <div className="score-pill" style={{ borderColor: accentColor }}>
          <strong>{review.total_score}</strong>
          <span>/100</span>
        </div>
      </div>

      {review.scores ? (
        <div className="tag-row tag-row--scores">
          {reviewCategories.slice(0, 4).map((category) => (
            <span key={category.key} className="score-tag score-tag--soft">
              {category.label}: {review.scores?.[category.key] ?? 0}
            </span>
          ))}
        </div>
      ) : null}

      <div className="meta-row meta-row--left meta-row--review">
        <Link className="primary-button primary-button--compact" to={`/app/reviews/${review.id}`}>
          {review.body.length > previewLength ? "Read more" : "View review"}
        </Link>
        {onReact ? (
          <ReactionPicker
            currentReaction={review.current_user_reaction}
            recentReactions={review.recent_reactions}
            reactionCount={review.reaction_count}
            onSelect={(emoji) => void onReact(emoji)}
          />
        ) : (
          <ReactionStack recentReactions={review.recent_reactions} reactionCount={review.reaction_count} />
        )}
        <span className="subtle-text">{review.comment_count} comments</span>
        {allowDelete && onDelete ? (
          <button className="ghost-button ghost-button--compact" type="button" onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>

      {showComposer ? (
        <div className="comment-stack">
          {review.comments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <Avatar src={comment.author_avatar_url} alt={comment.author_name} />
              <div>
                <strong>{comment.author_name}</strong>
                <p>{comment.body}</p>
              </div>
            </div>
          ))}
          {onComment && onCommentDraftChange ? (
            <CommentComposer
              value={commentDraft}
              onChange={onCommentDraftChange}
              placeholder="Drop a comment"
              onSubmit={async () => {
                const body = commentDraft.trim();
                if (!body) {
                  return;
                }
                await onComment(body);
                onCommentDraftChange("");
              }}
            />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function useProfileData(userId?: string) {
  const { token, user } = useAuth();
  const { profile: viewerProfile } = useAppData();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!token) {
      return;
    }

    if (!userId || userId === user?.id) {
      setProfileData(null);
      setProfileError(null);
      return;
    }

    setLoadingProfile(true);
    setProfileError(null);
    try {
      setProfileData(await api.getUserProfile(token, userId));
    } catch (requestError) {
      setProfileError(requestError instanceof Error ? requestError.message : "Unable to load profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [token, user?.id, userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return {
    loadProfile,
    profile: !userId || userId === user?.id ? viewerProfile : profileData,
    loadingProfile: userId && userId !== user?.id ? loadingProfile : false,
    profileError,
  };
}

export function FeedPage() {
  const { dashboard, loading, error, reactToFeed, commentOnFeed } = useAppData();
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const feedItems = useMemo(() => {
    if (!dashboard) {
      return [];
    }
    const unique = new Map<string, FeedItem>();
    [...dashboard.feed, ...dashboard.explore_posts].forEach((item) => {
      if (!unique.has(item.id)) {
        unique.set(item.id, item);
      }
    });
    return Array.from(unique.values()).sort(
      (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    );
  }, [dashboard]);

  const visibleCount = useInfiniteReveal(feedItems.length, 4, 3);

  if (loading && !dashboard) {
    return (
      <div className="page-grid">
        <SectionCard title="Following feed">Loading your feed...</SectionCard>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <SectionCard
        title="Following feed"
        eyebrow="Live now"
        action={<span className="notification-chip">{Math.min(visibleCount, feedItems.length)} cards loaded</span>}
      >
        {error ? <p className="error-text">{error}</p> : null}
        <div className="stack-list">
          {feedItems.slice(0, visibleCount).map((entry) => (
            <article key={entry.id} className="activity-card activity-card--rich">
              <Link to={`/app/games/${entry.game_id}`} className="activity-card__media">
                <img src={entry.cover_url} alt={entry.game_title} className="game-cover game-cover--feed" />
              </Link>
              <div className="activity-card__body">
                <div className="activity-card__top">
                  <Link to={`/app/profile/${entry.actor_id}`} className="identity-row identity-row--link">
                    <Avatar src={entry.actor_avatar_url} alt={entry.actor_name} />
                    <div>
                      <p className="activity-card__title">
                        <strong>{entry.actor_name}</strong> <span>{entry.actor_handle}</span>
                      </p>
                      <small className="subtle-text">{formatTimestamp(entry.timestamp)}</small>
                    </div>
                  </Link>
                  <span className="score-tag">{entry.activity_type.replace(/_/g, " ")}</span>
                </div>
                <Link to={`/app/games/${entry.game_id}`} className="activity-card__headline">
                  <h3>{entry.game_title}</h3>
                </Link>
                <p>{entry.summary}</p>
                <div className="meta-row meta-row--left meta-row--review">
                  <ReactionPicker
                    currentReaction={entry.current_user_reaction}
                    recentReactions={entry.recent_reactions}
                    reactionCount={entry.reaction_count}
                    onSelect={(emoji) => void reactToFeed(entry.id, emoji)}
                  />
                  <span className="subtle-text">{entry.comment_count} comments</span>
                </div>
                <div className="comment-stack">
                  {entry.comments.map((comment) => (
                    <div key={comment.id} className="comment-card">
                      <Avatar src={comment.author_avatar_url} alt={comment.author_name} />
                      <div>
                        <strong>{comment.author_name}</strong>
                        <p>{comment.body}</p>
                      </div>
                    </div>
                  ))}
                  <CommentComposer
                    value={commentDrafts[entry.id] ?? ""}
                    onChange={(value) => setCommentDrafts((current) => ({ ...current, [entry.id]: value }))}
                    placeholder="Add a comment"
                    onSubmit={async () => {
                      const body = commentDrafts[entry.id]?.trim();
                      if (!body) {
                        return;
                      }
                      await commentOnFeed(entry.id, body);
                      setCommentDrafts((current) => ({ ...current, [entry.id]: "" }));
                    }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
        {visibleCount < feedItems.length ? <p className="feed-load-hint">Keep scrolling — more posts are queued below.</p> : null}
      </SectionCard>
    </div>
  );
}

export function DiscoverPage() {
  const { dashboard, peopleSearchResults, searchPeople, toggleFollow } = useAppData();
  const [peopleQuery, setPeopleQuery] = useState("");

  const discoverBlocks = useMemo(() => {
    if (!dashboard) {
      return [] as Array<{ kind: "person" | "review" | "post"; key: string; size: string; payload: DiscoverUser | ReviewHighlight | FeedItem }>;
    }

    const blocks: Array<{ kind: "person" | "review" | "post"; key: string; size: string; payload: DiscoverUser | ReviewHighlight | FeedItem }> = [];
    const sizes = ["feature", "tall", "standard", "wide", "standard", "tall"];
    const people = peopleSearchResults.length ? peopleSearchResults : dashboard.discover_users;
    const reviews = dashboard.reviews;
    const posts = dashboard.explore_posts;
    const total = Math.max(people.length, reviews.length, posts.length);

    for (let index = 0; index < total; index += 1) {
      if (people[index]) {
        blocks.push({ kind: "person", key: `person-${people[index].id}`, size: sizes[index % sizes.length], payload: people[index] });
      }
      if (reviews[index]) {
        blocks.push({ kind: "review", key: `review-${reviews[index].id}`, size: sizes[(index + 2) % sizes.length], payload: reviews[index] });
      }
      if (posts[index]) {
        blocks.push({ kind: "post", key: `post-${posts[index].id}`, size: sizes[(index + 4) % sizes.length], payload: posts[index] });
      }
    }

    return blocks;
  }, [dashboard, peopleSearchResults]);

  return (
    <div className="page-grid">
      <SectionCard title="People search" eyebrow="Discovery">
        <div className="toolbar-row">
          <input
            value={peopleQuery}
            onChange={(event) => setPeopleQuery(event.target.value)}
            placeholder="Search by name, username, or shareable ID"
          />
          <button className="primary-button" type="button" onClick={() => void searchPeople(peopleQuery)}>
            Search
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Explore mix" eyebrow="Community stream">
        <div className="discover-stream">
          {discoverBlocks.map((block) => {
            if (block.kind === "person") {
              const person = block.payload as DiscoverUser;
              return (
                <div key={block.key} className={`discover-block discover-block--${block.size}`}>
                  <UserCard person={person} onToggleFollow={toggleFollow} />
                </div>
              );
            }

            if (block.kind === "review") {
              const review = block.payload as ReviewHighlight;
              return (
                <article key={block.key} className={`discover-block discover-block--${block.size} mini-card mini-card--interactive`}>
                  <img src={review.cover_url} alt={review.game_title} className="game-cover" />
                  <div className="discover-block__body">
                    <Link to={`/app/profile/${review.author_id}`} className="review-card__author">
                      {review.author_name} <span>{review.author_handle}</span>
                    </Link>
                    <Link to={`/app/reviews/${review.id}`}>
                      <h3>{review.game_title}</h3>
                    </Link>
                    <p>{review.verdict}</p>
                    <p className="subtle-text">{previewText(review.body, 180)}</p>
                    <div className="meta-row meta-row--left">
                      <ReactionStack recentReactions={review.recent_reactions} reactionCount={review.reaction_count} />
                      <span className="score-tag score-tag--soft">{review.total_score}/100</span>
                    </div>
                  </div>
                </article>
              );
            }

            const post = block.payload as FeedItem;
            return (
              <article key={block.key} className={`discover-block discover-block--${block.size} mini-card mini-card--interactive`}>
                <Link to={`/app/games/${post.game_id}`}>
                  <img src={post.cover_url} alt={post.game_title} className="game-cover" />
                </Link>
                <div className="discover-block__body">
                  <Link to={`/app/profile/${post.actor_id}`} className="review-card__author">
                    {post.actor_name} <span>{post.actor_handle}</span>
                  </Link>
                  <Link to={`/app/games/${post.game_id}`}>
                    <h3>{post.game_title}</h3>
                  </Link>
                  <p>{previewText(post.summary, 170)}</p>
                  <div className="meta-row meta-row--left">
                    <ReactionStack recentReactions={post.recent_reactions} reactionCount={post.reaction_count} />
                    <span className="subtle-text">{formatTimestamp(post.timestamp)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

export function LibraryPage() {
  const { dashboard, gameSearchResults, searchGames, addGameToLibrary, updateLibraryEntry } = useAppData();
  const [query, setQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, string>>({});
  const [libraryView, setLibraryView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void searchGames(query);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [query, searchGames]);

  return (
    <div className="page-grid">
      <SectionCard title="Search games" eyebrow="Library builder">
        <div className="toolbar-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void searchGames(query);
              }
            }}
            placeholder="Find a game"
          />
          <button className="primary-button" type="button" onClick={() => void searchGames(query)}>
            Search
          </button>
        </div>
        <div className="card-grid">
          {gameSearchResults.map((game) => {
            const selectedPlatform = selectedPlatforms[game.id] ?? game.platforms[0] ?? "PC";
            return (
              <article key={game.id} className="mini-card mini-card--game">
                <Link to={`/app/games/${game.id}`}>
                  <img src={game.cover_url} alt={game.title} className="game-cover" />
                </Link>
                <div>
                  <Link to={`/app/games/${game.id}`}>
                    <h3>{game.title}</h3>
                  </Link>
                  <p className="subtle-text">{game.release_year ?? "Upcoming"}</p>
                  <p>{game.summary ?? "No description available yet."}</p>
                </div>
                <div className="platform-pill-row">
                  {game.platforms.map((platform) => (
                    <button
                      key={platform}
                      className={selectedPlatform === platform ? "platform-pill platform-pill--active" : "platform-pill"}
                      type="button"
                      onClick={() => setSelectedPlatforms((current) => ({ ...current, [game.id]: platform }))}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
                <div className="control-row">
                  <button
                    className="primary-button primary-button--compact"
                    type="button"
                    onClick={() =>
                      void addGameToLibrary({
                        game_id: game.id,
                        platform: selectedPlatform,
                        status: "want_to_play",
                      })
                    }
                  >
                    Add to library
                  </button>
                  <Link className="ghost-button ghost-button--compact" to={`/app/games/${game.id}`}>
                    Open page
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        {!gameSearchResults.length && query.trim().length >= 2 ? (
          <p className="subtle-text">No games matched yet. Try a broader title or search another spelling.</p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Tracked library"
        eyebrow="Game shelves"
        action={
          <div className="segmented-toggle">
            <button
              className={libraryView === "grid" ? "platform-pill platform-pill--active" : "platform-pill"}
              type="button"
              onClick={() => setLibraryView("grid")}
            >
              Grid
            </button>
            <button
              className={libraryView === "list" ? "platform-pill platform-pill--active" : "platform-pill"}
              type="button"
              onClick={() => setLibraryView("list")}
            >
              List
            </button>
          </div>
        }
      >
        <div className={libraryView === "grid" ? "card-grid" : "stack-list"}>
          {dashboard?.library.map((game) => (
            <article key={game.id} className={libraryView === "grid" ? "mini-card mini-card--game" : "library-row"}>
              <Link to={`/app/games/${game.game_id}`}>
                <img src={game.cover_url} alt={game.game_title} className={libraryView === "grid" ? "game-cover" : "game-cover game-cover--row"} />
              </Link>
              <div className="library-row__body">
                <div>
                  <Link to={`/app/games/${game.game_id}`}>
                    <h3>{game.game_title}</h3>
                  </Link>
                  <p className="subtle-text">
                    {game.platform} · {game.status.replace(/_/g, " ")}
                  </p>
                  <p>
                    {game.hours_played}h · {game.progress_percent}% complete · {game.playthroughs} playthroughs
                  </p>
                  <p>{game.note}</p>
                </div>
                <div className="control-row control-row--stack">
                  <select value={game.status} onChange={(event) => void updateLibraryEntry(game.id, { status: event.target.value })}>
                    {libraryStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <div className="control-row">
                    <button
                      className="ghost-button ghost-button--compact"
                      type="button"
                      onClick={() => void updateLibraryEntry(game.id, { hours_played: game.hours_played + 5 })}
                    >
                      +5 hours
                    </button>
                    <button
                      className="ghost-button ghost-button--compact"
                      type="button"
                      onClick={() => void updateLibraryEntry(game.id, { hours_played: game.hours_played + 10 })}
                    >
                      +10 hours
                    </button>
                    <button
                      className="ghost-button ghost-button--compact"
                      type="button"
                      onClick={() => void updateLibraryEntry(game.id, { progress_percent: Math.min(100, game.progress_percent + 25) })}
                    >
                      +25% progress
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function ReviewStudioPage() {
  const { drafts, gameSearchResults, searchGames, saveDraft, publishDraft } = useAppData();
  const firstDraft = drafts[0];
  const [selectedGameId, setSelectedGameId] = useState(firstDraft?.game_id ?? "");
  const [verdict, setVerdict] = useState(firstDraft?.verdict ?? "");
  const [body, setBody] = useState(firstDraft?.body ?? "");
  const [spoiler, setSpoiler] = useState(firstDraft?.spoiler ?? false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [scores, setScores] = useState<ScoreBreakdown>(
    firstDraft?.scores ?? {
      gameplay: 8,
      story: 8,
      visuals: 8,
      art_direction: 8,
      audio: 8,
      performance: 8,
      world_design: 8,
      replayability: 8,
      innovation: 8,
      emotional_impact: 8,
    },
  );

  useEffect(() => {
    if (!firstDraft) {
      return;
    }
    setSelectedGameId(firstDraft.game_id);
    setVerdict(firstDraft.verdict);
    setBody(firstDraft.body);
    setSpoiler(firstDraft.spoiler);
    setScores(firstDraft.scores);
  }, [firstDraft]);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void searchGames(query);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [query, searchGames]);

  const selectedGame =
    gameSearchResults.find((game) => game.id === selectedGameId) ??
    (firstDraft && firstDraft.game_id === selectedGameId
      ? {
          id: firstDraft.game_id,
          title: firstDraft.game_title,
          cover_url: firstDraft.game_cover_url,
          platforms: ["Tracked game"],
          release_year: null,
          summary: null,
        }
      : undefined);
  const totalScore = Object.values(scores).reduce((sum, value) => sum + value, 0);

  return (
    <div className="page-grid">
      <SectionCard title="Choose the game first" eyebrow="Review setup">
        <div className="toolbar-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void searchGames(query);
              }
            }}
            placeholder="Search for a game"
          />
          <button className="primary-button" type="button" onClick={() => void searchGames(query)}>
            Search
          </button>
        </div>
        <div className="card-grid">
          {gameSearchResults.map((game) => (
            <button
              key={game.id}
              className={selectedGameId === game.id ? "select-card select-card--active" : "select-card"}
              type="button"
              onClick={() => setSelectedGameId(game.id)}
            >
              <img src={game.cover_url} alt={game.title} className="game-cover game-cover--compact" />
              <div>
                <strong>{game.title}</strong>
                <span>{game.platforms.join(" · ")}</span>
              </div>
            </button>
          ))}
        </div>
        {!gameSearchResults.length && query.trim().length >= 2 ? (
          <p className="subtle-text">No results yet. Try a broader title like `elden`, `persona`, or `outer`.</p>
        ) : null}
      </SectionCard>

      <SectionCard title="Scoring" eyebrow="10 category review">
        <div className="score-summary-card score-summary-card--live">
          <div>
            <p className="eyebrow">Live total</p>
            <strong>{totalScore}/100</strong>
          </div>
          <div className="score-summary-card__meter">
            <div className="score-summary-card__fill" style={{ width: `${totalScore}%` }} />
            <span className="score-summary-card__label">{totalScore}%</span>
          </div>
        </div>
        <div className="review-grid review-grid--scores">
          {reviewCategories.map((category) => (
            <label key={category.key} className="score-slider">
              <div className="score-slider__header">
                <span>{category.label}</span>
                <strong>{scores[category.key]}/10</strong>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={scores[category.key]}
                onChange={(event) =>
                  setScores((current) => ({
                    ...current,
                    [category.key]: Number(event.target.value),
                  }))
                }
              />
              <div className="score-slider__scale">
                <span>0</span>
                <span>10</span>
              </div>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Write the review" eyebrow="Draft and publish">
        {selectedGame ? (
          <div className="selected-game">
            <img src={selectedGame.cover_url} alt={selectedGame.title} className="game-cover game-cover--compact" />
            <div>
              <h3>{selectedGame.title}</h3>
              <p className="subtle-text">{selectedGame.platforms.join(" · ")}</p>
              <Link className="ghost-button ghost-button--compact" to={`/app/games/${selectedGame.id}`}>
                View game page
              </Link>
            </div>
          </div>
        ) : (
          <p className="error-text">Select a game from search results before saving.</p>
        )}
        <div className="editor-stack">
          <input value={verdict} onChange={(event) => setVerdict(event.target.value)} placeholder="Review title / verdict" />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} placeholder="Write the full review..." />
          <div className="control-row">
            <p className="score-total">Total score: {totalScore}/100</p>
            <label className="checkbox-row">
              <input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} />
              Hide spoilers behind click-to-reveal
            </label>
          </div>
          <div className="control-row">
            <button
              className="primary-button"
              type="button"
              onClick={async () => {
                if (!selectedGameId) {
                  setMessage("Choose a game before saving.");
                  return;
                }
                await saveDraft(
                  {
                    game_id: selectedGameId,
                    verdict,
                    body,
                    scores,
                    total_score: totalScore,
                    spoiler,
                  },
                  firstDraft?.id,
                );
                setMessage("Draft saved.");
              }}
            >
              Save draft
            </button>
            {firstDraft ? (
              <button
                className="ghost-button"
                type="button"
                onClick={async () => {
                  await publishDraft(firstDraft.id);
                  setMessage("Review published.");
                }}
              >
                Publish review
              </button>
            ) : null}
          </div>
          {message ? <p className="success-text">{message}</p> : null}
        </div>
      </SectionCard>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const { userId } = useParams();
  const { dashboard, createList, deleteList, deleteReview, reactToReview, commentOnReview, toggleFollow } = useAppData();
  const { profile, loadingProfile, profileError, loadProfile } = useProfileData(userId);
  const [activePanel, setActivePanel] = useState<"followers" | "following" | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [listItems, setListItems] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const viewedUser = profile?.user;
  const isViewerProfile = profile?.is_viewer_profile ?? viewedUser?.id === user?.id;
  const rankingBars = profile?.review_highlights.slice(0, 5) ?? [];
  const timeBars = profile?.most_played_games.slice(0, 5) ?? [];
  const selectedList = profile?.featured_lists.find((list) => list.id === selectedListId) ?? null;
  const displayedPerson = dashboard?.discover_users.find((person) => person.id === viewedUser?.id);

  if (loadingProfile) {
    return <SectionCard title="Profile">Loading profile...</SectionCard>;
  }

  if (profileError) {
    return <SectionCard title="Profile">{profileError}</SectionCard>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="page-grid">
      <section
        className="profile-banner"
        style={{ backgroundImage: `url(${getDisplayBanner(profile.user.banner_url, profile.user.accent_color, profile.user.id)})`, borderColor: profile.user.accent_color }}
      >
        <div className="profile-banner__overlay">
          <Avatar src={profile.user.avatar_url} alt={profile.user.display_name} />
          <div>
            <p className="eyebrow">Profile</p>
            <h1>{profile.user.display_name}</h1>
            <p className="subtle-text">
              @{profile.user.username} · {profile.user.shareable_id}
            </p>
            <p>{profile.tagline}</p>
            <div className="tag-row">
              {profile.favorite_games.map((game) => (
                <span key={game} className="score-tag score-tag--soft">
                  {game}
                </span>
              ))}
            </div>
          </div>
          <div className="profile-banner__stats">
            <button className="stat-tile" type="button" onClick={() => setActivePanel("followers")}>
              <span>{profile.stats.followers}</span>
              <small>followers</small>
            </button>
            <button className="stat-tile" type="button" onClick={() => setActivePanel("following")}>
              <span>{profile.stats.following}</span>
              <small>following</small>
            </button>
            <div className="stat-tile">
              <span>{profile.stats.total_hours}h</span>
              <small>total time</small>
            </div>
            <div className="stat-tile">
              <span>{profile.stats.average_score}</span>
              <small>avg review</small>
            </div>
          </div>
          <div className="profile-banner__actions">
            {isViewerProfile ? (
              <Link to="/app/settings" className="icon-button" aria-label="Edit profile">
                <PencilIcon />
              </Link>
            ) : displayedPerson ? (
              <button
                className={displayedPerson.is_following ? "ghost-button ghost-button--compact" : "primary-button primary-button--compact"}
                type="button"
                onClick={async () => {
                  await toggleFollow(displayedPerson.id, displayedPerson.is_following);
                  await loadProfile();
                }}
              >
                {displayedPerson.is_following ? "Following" : "Follow"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {isViewerProfile ? (
        <SectionCard title="Your momentum" eyebrow="At a glance">
          <div className="metric-grid metric-grid--four">
            <div className="stat-tile stat-tile--metric">
              <span>{profile.stats.total_hours}h</span>
              <small>Tracked playtime</small>
            </div>
            <div className="stat-tile stat-tile--metric">
              <span>{profile.review_highlights[0]?.total_score ?? 0}</span>
              <small>Highest review score</small>
            </div>
            <div className="stat-tile stat-tile--metric">
              <span>{profile.stats.total_games}</span>
              <small>Games in library</small>
            </div>
            <div className="stat-tile stat-tile--metric">
              <span>{profile.stats.total_reviews}</span>
              <small>Published reviews</small>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {activePanel ? (
        <SectionCard title={activePanel === "followers" ? "Followers" : "Following"} eyebrow="People">
          <div className="card-grid">
            {(activePanel === "followers" ? profile.followers : profile.following_users).map((person) => (
              <UserCard key={person.id} person={person} compact onToggleFollow={person.id !== user?.id ? toggleFollow : undefined} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      <div className="page-grid page-grid--split">
        <SectionCard title="Review rankings" eyebrow="Main visual">
          <div className="chart-list">
            {rankingBars.map((review) => (
              <div key={review.id} className="chart-row">
                <div>
                  <strong>{review.game_title}</strong>
                  <span className="subtle-text">{review.total_score}/100</span>
                </div>
                <div className="chart-bar">
                  <div className="chart-bar__fill" style={{ width: `${review.total_score}%`, background: profile.user.accent_color }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Game time" eyebrow="Main visual">
          <div className="chart-list">
            {timeBars.map((game) => (
              <div key={game.id} className="chart-row">
                <div>
                  <strong>{game.game_title}</strong>
                  <span className="subtle-text">{game.hours_played}h</span>
                </div>
                <div className="chart-bar">
                  <div
                    className="chart-bar__fill"
                    style={{ width: `${Math.min(100, game.hours_played * 2)}%`, background: profile.user.accent_color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Featured lists" eyebrow={isViewerProfile ? "Add and remove" : "Curated picks"}>
        {isViewerProfile ? (
          <div className="editor-stack">
            <input value={listTitle} onChange={(event) => setListTitle(event.target.value)} placeholder="List title" />
            <input
              value={listDescription}
              onChange={(event) => setListDescription(event.target.value)}
              placeholder="What is this list about?"
            />
            <input value={listItems} onChange={(event) => setListItems(event.target.value)} placeholder="Comma-separated games" />
            <button
              className="primary-button"
              type="button"
              onClick={async () => {
                await createList({
                  title: listTitle,
                  description: listDescription,
                  items: listItems.split(",").map((item) => item.trim()).filter(Boolean),
                });
                setListTitle("");
                setListDescription("");
                setListItems("");
              }}
            >
              Add list
            </button>
          </div>
        ) : null}
        <div className="card-grid">
          {profile.featured_lists.map((list) => (
            <article key={list.id} className="mini-card mini-card--interactive">
              <h3>{list.title}</h3>
              <p>{list.description}</p>
              <p className="subtle-text">{list.items.join(" · ")}</p>
              <div className="control-row">
                <button className="primary-button primary-button--compact" type="button" onClick={() => setSelectedListId(list.id)}>
                  Open list
                </button>
                {isViewerProfile ? (
                  <button className="ghost-button ghost-button--compact" type="button" onClick={() => void deleteList(list.id)}>
                    Delete list
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Published reviews" eyebrow="Read, react, and reply">
        <div className="stack-list">
          {profile.review_highlights.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              accentColor={profile.user.accent_color}
              allowDelete={isViewerProfile}
              onDelete={() => void deleteReview(review.id)}
              onReact={async (emoji) => {
                await reactToReview(review.id, emoji);
                if (!isViewerProfile) {
                  await loadProfile();
                }
              }}
              onComment={async (body) => {
                await commentOnReview(review.id, body);
                if (!isViewerProfile) {
                  await loadProfile();
                }
              }}
              commentDraft={commentDrafts[review.id] ?? ""}
              onCommentDraftChange={(value) => setCommentDrafts((current) => ({ ...current, [review.id]: value }))}
              showAuthor={!isViewerProfile}
              previewLength={260}
            />
          ))}
        </div>
      </SectionCard>

      {selectedList ? (
        <DetailModal title={selectedList.title} subtitle={selectedList.description} onClose={() => setSelectedListId(null)}>
          <div className="stack-list">
            {selectedList.items.map((item) => (
              <article key={item} className="mini-card">
                <strong>{item}</strong>
                <p className="subtle-text">Pinned in this custom collection.</p>
              </article>
            ))}
          </div>
        </DetailModal>
      ) : null}
    </div>
  );
}

export function ReviewDetailPage() {
  const { token } = useAuth();
  const { reviewId } = useParams();
  const { reactToReview, commentOnReview } = useAppData();
  const [review, setReview] = useState<ReviewHighlight | null>(null);
  const [loadingReview, setLoadingReview] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  const loadReview = useCallback(async () => {
    if (!token || !reviewId) {
      return;
    }
    setLoadingReview(true);
    setReviewError(null);
    try {
      setReview(await api.getPublishedReview(token, reviewId));
    } catch (requestError) {
      setReviewError(requestError instanceof Error ? requestError.message : "Unable to load review.");
    } finally {
      setLoadingReview(false);
    }
  }, [reviewId, token]);

  useEffect(() => {
    void loadReview();
  }, [loadReview]);

  if (loadingReview) {
    return <SectionCard title="Review page">Loading review...</SectionCard>;
  }

  if (reviewError || !review) {
    return <SectionCard title="Review page">{reviewError ?? "Review not found."}</SectionCard>;
  }

  return (
    <div className="page-grid">
      <section className="review-hero">
        <img src={review.cover_url} alt={review.game_title} className="game-cover review-hero__cover" />
        <div className="review-hero__body">
          <Link to={`/app/profile/${review.author_id}`} className="review-card__author">
            {review.author_name} <span>{review.author_handle}</span>
          </Link>
          <Link to={`/app/games/${review.game_id}`}>
            <h1>{review.game_title}</h1>
          </Link>
          <p>{review.title}</p>
          <p className="subtle-text">{review.spoiler ? "Spoiler-aware review" : "Spoiler-safe read"}</p>
          <div className="score-summary-card score-summary-card--live review-hero__score">
            <div>
              <p className="eyebrow">Total score</p>
              <strong>{review.total_score}/100</strong>
            </div>
            <div className="score-summary-card__meter">
              <div className="score-summary-card__fill" style={{ width: `${review.total_score}%` }} />
              <span className="score-summary-card__label">{review.total_score}%</span>
            </div>
          </div>
          <ReactionPicker
            currentReaction={review.current_user_reaction}
            recentReactions={review.recent_reactions}
            reactionCount={review.reaction_count}
            onSelect={async (emoji) => {
              await reactToReview(review.id, emoji);
              await loadReview();
            }}
          />
        </div>
      </section>

      <SectionCard title="Full review" eyebrow="Published write-up">
        <p>{review.verdict}</p>
        <p className="review-body">{review.body}</p>
      </SectionCard>

      {review.scores ? (
        <SectionCard title="Score breakdown" eyebrow="All ten categories">
          <div className="card-grid card-grid--scores">
            {reviewCategories.map((category) => (
              <div key={category.key} className="mini-card mini-card--score-metric">
                <strong>{category.label}</strong>
                <span>{review.scores?.[category.key] ?? 0}/10</span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Comments" eyebrow="Join the thread">
        <div className="comment-stack">
          {review.comments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <Avatar src={comment.author_avatar_url} alt={comment.author_name} />
              <div>
                <strong>{comment.author_name}</strong>
                <p>{comment.body}</p>
                <small className="subtle-text">{formatTimestamp(comment.created_at)}</small>
              </div>
            </div>
          ))}
          <CommentComposer
            value={commentDraft}
            onChange={setCommentDraft}
            placeholder="React in the comments"
            onSubmit={async () => {
              const body = commentDraft.trim();
              if (!body) {
                return;
              }
              await commentOnReview(review.id, body);
              setCommentDraft("");
              await loadReview();
            }}
          />
        </div>
      </SectionCard>
    </div>
  );
}

export function GameDetailPage() {
  const { token } = useAuth();
  const { gameId } = useParams();
  const { reactToReview, commentOnReview } = useAppData();
  const [detail, setDetail] = useState<GameDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const loadDetail = useCallback(async () => {
    if (!token || !gameId) {
      return;
    }
    setLoadingDetail(true);
    setDetailError(null);
    try {
      setDetail(await api.getGameDetail(token, gameId));
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : "Unable to load game page.");
    } finally {
      setLoadingDetail(false);
    }
  }, [gameId, token]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (loadingDetail) {
    return <SectionCard title="Game page">Loading game details...</SectionCard>;
  }

  if (detailError || !detail) {
    return <SectionCard title="Game page">{detailError ?? "Game not found."}</SectionCard>;
  }

  const { game } = detail;

  return (
    <div className="page-grid">
      <section className="game-page-hero">
        <img src={game.cover_url} alt={game.title} className="game-cover game-page-hero__cover" />
        <div className="game-page-hero__body">
          <p className="eyebrow">Game page</p>
          <h1>{game.title}</h1>
          <p className="subtle-text">
            {game.release_year ?? "Upcoming"} · {game.platforms.join(" · ")}
          </p>
          <p>{game.summary ?? "No summary has been added yet."}</p>
          <div className="metric-grid metric-grid--three">
            <div className="stat-tile stat-tile--metric">
              <span>{detail.average_score}</span>
              <small>Community score</small>
            </div>
            <div className="stat-tile stat-tile--metric">
              <span>{detail.review_count}</span>
              <small>Published reviews</small>
            </div>
            <div className="stat-tile stat-tile--metric">
              <span>{detail.top_platforms.join(" · ") || "TBD"}</span>
              <small>Top platforms</small>
            </div>
          </div>
        </div>
      </section>

      <SectionCard title="Consensus" eyebrow="How it lands with the community">
        <div className="score-summary-card score-summary-card--live">
          <div>
            <p className="eyebrow">Average score</p>
            <strong>{detail.average_score}/100</strong>
          </div>
          <div className="score-summary-card__meter">
            <div className="score-summary-card__fill" style={{ width: `${detail.average_score}%` }} />
            <span className="score-summary-card__label">{detail.review_count} reviews</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Associated reviews" eyebrow="Community coverage">
        <div className="stack-list">
          {detail.reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onReact={async (emoji) => {
                await reactToReview(review.id, emoji);
                await loadDetail();
              }}
              onComment={async (body) => {
                await commentOnReview(review.id, body);
                await loadDetail();
              }}
              commentDraft={commentDrafts[review.id] ?? ""}
              onCommentDraftChange={(value) => setCommentDrafts((current) => ({ ...current, [review.id]: value }))}
              showAuthor
              previewLength={240}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function NotificationsPage() {
  const { notifications } = useAppData();

  return (
    <SectionCard title="Notifications" eyebrow="Dedicated panel">
      <div className="stack-list">
        {notifications.map((notification) => (
          <article key={notification.id} className={notification.read ? "notification-card" : "notification-card notification-card--unread"}>
            <strong>{notification.title}</strong>
            <p>{notification.body}</p>
            <small className="subtle-text">{new Date(notification.created_at).toLocaleString()}</small>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

export function SettingsPage() {
  const { profile, notifications, privacySettings, updatePrivacySettings, updateCustomization } = useAppData();
  const [tagline, setTagline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(avatarPresets[0].url);
  const [bannerUrl, setBannerUrl] = useState(bannerPresets[0].url);
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  const [favoriteGames, setFavoriteGames] = useState("");

  useEffect(() => {
    if (!profile) {
      return;
    }
    setTagline(profile.tagline);
    setAvatarUrl(profile.user.avatar_url || avatarPresets[0].url);
    setBannerUrl(profile.user.banner_url.startsWith("data:image") ? profile.user.banner_url : bannerPresets[0].url);
    setAccentColor(profile.user.accent_color);
    setFavoriteGames(profile.favorite_games.join(", "));
  }, [profile]);

  const visibilityOptions = ["public", "followers", "private"] as const;

  return (
    <div className="page-grid">
      <SectionCard title="Profile customization" eyebrow="Banners, avatars, accents">
        <div className="editor-stack">
          <input value={tagline} onChange={(event) => setTagline(event.target.value)} placeholder="Tagline" />
          <div>
            <p className="eyebrow">Avatar styles</p>
            <div className="preset-grid">
              {avatarPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={avatarUrl === preset.url ? "preset-card preset-card--active" : "preset-card"}
                  type="button"
                  onClick={() => setAvatarUrl(preset.url)}
                >
                  <img src={preset.url} alt={preset.label} className="avatar" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow">Banner themes</p>
            <div className="preset-grid preset-grid--banners">
              {bannerPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={bannerUrl === preset.url ? "preset-card preset-card--active" : "preset-card"}
                  type="button"
                  onClick={() => setBannerUrl(preset.url)}
                >
                  <div className="preset-card__banner" style={{ backgroundImage: `url(${preset.url})` }} />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
          <input value={accentColor} onChange={(event) => setAccentColor(event.target.value)} placeholder="#8b5cf6" />
          <input
            value={favoriteGames}
            onChange={(event) => setFavoriteGames(event.target.value)}
            placeholder="Favorite games separated by commas"
          />
          <div className="mini-card mini-card--interactive">
            <div className="person-card__banner" style={{ backgroundImage: `url(${getDisplayBanner(bannerUrl, accentColor, profile?.user.id)})` }} />
            <div className="person-card__content">
              <Avatar src={avatarUrl} alt="Profile preview" />
              <div>
                <h3>{profile?.user.display_name ?? "Preview"}</h3>
                <p>{tagline || "Your tagline preview appears here."}</p>
              </div>
            </div>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() =>
              void updateCustomization({
                tagline,
                avatar_url: avatarUrl,
                banner_url: bannerUrl,
                accent_color: accentColor,
                favorite_games: favoriteGames.split(",").map((item) => item.trim()).filter(Boolean),
              })
            }
          >
            Save customization
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Privacy defaults" eyebrow="Visibility">
        <div className="card-grid">
          {(["profile_visibility", "review_visibility", "activity_visibility"] as const).map((field) => (
            <label key={field} className="field">
              <span>{field.replace(/_/g, " ")}</span>
              <select
                value={privacySettings?.[field] ?? "public"}
                onChange={(event) =>
                  void updatePrivacySettings({
                    profile_visibility:
                      field === "profile_visibility"
                        ? (event.target.value as "public" | "followers" | "private")
                        : (privacySettings?.profile_visibility ?? "public"),
                    review_visibility:
                      field === "review_visibility"
                        ? (event.target.value as "public" | "followers" | "private")
                        : (privacySettings?.review_visibility ?? "public"),
                    activity_visibility:
                      field === "activity_visibility"
                        ? (event.target.value as "public" | "followers" | "private")
                        : (privacySettings?.activity_visibility ?? "public"),
                  })
                }
              >
                {visibilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent notifications" eyebrow="Quick peek">
        <div className="stack-list">
          {notifications.slice(0, 3).map((notification) => (
            <article key={notification.id} className="notification-card">
              <strong>{notification.title}</strong>
              <p>{notification.body}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
