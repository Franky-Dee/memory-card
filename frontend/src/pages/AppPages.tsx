import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { SectionCard } from "../components/SectionCard";
import {
  api,
  type GameDetailResponse,
  type GameSearchResult,
  type ProfileResponse,
  type ReviewHighlight,
  type ScoreBreakdown,
} from "../lib/api";
import { useAppData } from "../lib/app-data";
import { useAuth } from "../lib/auth";
import { avatarPresets, bannerPresets } from "../lib/presets";

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

const reactionEmojiOptions = ["🔥", "😍", "😂", "😮", "🎮"];
const commentEmojiOptions = ["🔥", "🎮", "😭", "👏", "💜"];

function Avatar({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="avatar" />;
}

function IdentityLink({
  to,
  avatar,
  name,
  handle,
}: {
  to: string;
  avatar: string;
  name: string;
  handle: string;
}) {
  return (
    <Link to={to} className="identity-link">
      <Avatar src={avatar} alt={name} />
      <div>
        <strong>{name}</strong>
        <p className="subtle-text">{handle}</p>
      </div>
    </Link>
  );
}

function ReactionStack({ emojis }: { emojis: string[] }) {
  if (!emojis.length) {
    return null;
  }

  return (
    <div className="reaction-stack" aria-label="Recent reactions">
      {emojis.map((emoji, index) => (
        <span key={`${emoji}-${index}`} className="reaction-stack__item" style={{ marginLeft: index === 0 ? 0 : -8 }}>
          {emoji}
        </span>
      ))}
    </div>
  );
}

function ReactionBar({
  current,
  onSelect,
}: {
  current: string | null;
  onSelect: (emoji: string) => void;
}) {
  return (
    <div className="reaction-bar">
      {reactionEmojiOptions.map((emoji) => (
        <button
          key={emoji}
          className={current === emoji ? "reaction-chip reaction-chip--active" : "reaction-chip"}
          type="button"
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function CommentComposer({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="comment-composer">
      <div className="emoji-row">
        {commentEmojiOptions.map((emoji) => (
          <button key={emoji} className="emoji-button" type="button" onClick={() => setValue((current) => `${current}${emoji}`)}>
            {emoji}
          </button>
        ))}
      </div>
      <div className="comment-entry">
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
        <button
          className="primary-button"
          type="button"
          onClick={async () => {
            const trimmed = value.trim();
            if (!trimmed) {
              return;
            }
            await onSubmit(trimmed);
            setValue("");
          }}
        >
          Post
        </button>
      </div>
    </div>
  );
}

function useInfiniteReveal(total: number, step = 8) {
  const [visibleCount, setVisibleCount] = useState(step);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(step);
  }, [total, step]);

  useEffect(() => {
    if (!loadMoreRef.current) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleCount((current) => Math.min(total, current + step));
      }
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [step, total]);

  return { visibleCount, loadMoreRef };
}

function MomentumPanel({
  totalHours,
  topScore,
  totalGames,
  totalReviews,
}: {
  totalHours: number;
  topScore: number;
  totalGames: number;
  totalReviews: number;
}) {
  return (
    <SectionCard title="Your momentum" eyebrow="At a glance">
      <div className="metric-grid">
        <div>
          <span>{totalHours}h</span>
          <small>Tracked game time</small>
        </div>
        <div>
          <span>{topScore}</span>
          <small>Highest review score</small>
        </div>
        <div>
          <span>{totalGames}</span>
          <small>Games in library</small>
        </div>
        <div>
          <span>{totalReviews}</span>
          <small>Published reviews</small>
        </div>
      </div>
    </SectionCard>
  );
}

function ReviewPreviewCard({
  review,
  onReact,
  onComment,
  onDelete,
  showDelete,
}: {
  review: ReviewHighlight;
  onReact: (emoji: string) => void;
  onComment: (body: string) => Promise<void>;
  onDelete?: () => void;
  showDelete?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = expanded ? review.body : `${review.body.slice(0, 220)}${review.body.length > 220 ? "..." : ""}`;

  return (
    <article className="mini-card mini-card--review">
      <div className="identity-row">
        <Link to={`/app/games/${review.game_id}`}>
          <img src={review.cover_url} alt={review.game_title} className="game-cover game-cover--compact" />
        </Link>
        <div>
          <Link to={`/app/reviews/${review.id}`} className="mini-card__title-link">
            <h3>{review.game_title}</h3>
          </Link>
          <p>{review.title}</p>
          <p className="subtle-text">
            {review.total_score}/100 · <Link to={`/app/users/${review.author_id}`}>{review.author_name}</Link>
          </p>
        </div>
      </div>
      <p>{review.verdict}</p>
      <p>{preview}</p>
      {review.body.length > 220 ? (
        <button className="inline-button" type="button" onClick={() => setExpanded((current) => !current)}>
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
      <div className="meta-row meta-row--left">
        <ReactionStack emojis={review.recent_reactions} />
        <span>{review.reaction_count} reactions</span>
        <span>{review.comment_count} comments</span>
        <Link to={`/app/reviews/${review.id}`} className="inline-button">
          View full review
        </Link>
        {showDelete && onDelete ? (
          <button className="ghost-button" type="button" onClick={onDelete}>
            Delete review
          </button>
        ) : null}
      </div>
      <ReactionBar current={review.current_user_reaction} onSelect={onReact} />
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
      </div>
      <CommentComposer placeholder="Comment on this review" onSubmit={onComment} />
    </article>
  );
}

export function FeedPage() {
  const { dashboard, loading, error, reactToFeed, commentOnFeed } = useAppData();
  const { visibleCount, loadMoreRef } = useInfiniteReveal(dashboard?.feed.length ?? 0, 10);

  if (loading && !dashboard) {
    return <SectionCard title="Following feed">Loading your feed...</SectionCard>;
  }

  const items = dashboard?.feed.slice(0, visibleCount) ?? [];

  return (
    <div className="page-grid page-grid--split">
      <SectionCard title="Following feed" eyebrow="Main home">
        {error ? <p className="error-text">{error}</p> : null}
        <div className="stack-list">
          {items.map((entry) => (
            <article key={entry.id} className="activity-card activity-card--rich">
              <Link to={`/app/games/${entry.game_id}`}>
                <img src={entry.cover_url} alt={entry.game_title} className="game-cover game-cover--feed" />
              </Link>
              <div className="activity-card__body">
                <div className="activity-card__top">
                  <IdentityLink
                    to={`/app/users/${entry.actor_id}`}
                    avatar={entry.actor_avatar_url}
                    name={entry.actor_name}
                    handle={entry.actor_handle}
                  />
                  <span className="score-tag">{entry.activity_type.replace("_", " ")}</span>
                </div>
                <Link to={`/app/games/${entry.game_id}`} className="mini-card__title-link">
                  <h3>{entry.game_title}</h3>
                </Link>
                <p>{entry.summary}</p>
                <div className="meta-row meta-row--left">
                  <ReactionStack emojis={entry.recent_reactions} />
                  <span>{entry.reaction_count} reactions</span>
                  <span>{entry.comment_count} comments</span>
                </div>
                <ReactionBar current={entry.current_user_reaction} onSelect={(emoji) => void reactToFeed(entry.id, emoji)} />
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
                </div>
                <CommentComposer placeholder="Add a comment" onSubmit={(body) => commentOnFeed(entry.id, body)} />
              </div>
            </article>
          ))}
          <div ref={loadMoreRef} className="infinite-sentinel">
            Loading more from your following feed...
          </div>
        </div>
      </SectionCard>

      <MomentumPanel
        totalHours={dashboard?.library.reduce((sum, game) => sum + game.hours_played, 0) ?? 0}
        topScore={dashboard?.reviews[0]?.total_score ?? 0}
        totalGames={dashboard?.library.length ?? 0}
        totalReviews={dashboard?.reviews.length ?? 0}
      />
    </div>
  );
}

export function DiscoverPage() {
  const { dashboard, peopleSearchResults, searchPeople, toggleFollow } = useAppData();
  const [peopleQuery, setPeopleQuery] = useState("");
  const { visibleCount, loadMoreRef } = useInfiniteReveal(dashboard?.explore_posts.length ?? 0, 12);
  const explorePosts = useMemo(() => dashboard?.explore_posts.slice(0, visibleCount) ?? [], [dashboard?.explore_posts, visibleCount]);

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
        <div className="card-grid card-grid--people">
          {peopleSearchResults.map((person) => (
            <article key={person.id} className="person-card">
              <Link to={`/app/users/${person.id}`} className="person-card__banner" style={{ backgroundImage: `url(${person.banner_url})` }} />
              <div className="person-card__content">
                <IdentityLink to={`/app/users/${person.id}`} avatar={person.avatar_url} name={person.display_name} handle={`@${person.username}`} />
                <div>
                  <p>{person.tagline}</p>
                  <p className="subtle-text">{person.follower_count} followers</p>
                </div>
              </div>
              <button
                className={person.is_following ? "ghost-button" : "primary-button"}
                type="button"
                onClick={() => void toggleFollow(person.id, person.is_following)}
              >
                {person.is_following ? "Following" : "Follow"}
              </button>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Community discovery" eyebrow="Random posts">
        <div className="discover-grid">
          {explorePosts.map((post) => (
            <article key={post.id} className="discover-tile">
              <Link to={`/app/games/${post.game_id}`}>
                <img src={post.cover_url} alt={post.game_title} className="game-cover" />
              </Link>
              <div className="discover-tile__content">
                <IdentityLink to={`/app/users/${post.actor_id}`} avatar={post.actor_avatar_url} name={post.actor_name} handle={post.actor_handle} />
                <Link to={`/app/games/${post.game_id}`} className="mini-card__title-link">
                  <strong>{post.game_title}</strong>
                </Link>
                <p>{post.summary}</p>
                <div className="meta-row meta-row--left">
                  <ReactionStack emojis={post.recent_reactions} />
                  <span>{post.reaction_count}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div ref={loadMoreRef} className="infinite-sentinel">
          Pulling in more discovery posts...
        </div>
      </SectionCard>
    </div>
  );
}

export function LibraryPage() {
  const { dashboard, gameSearchResults, searchGames, addGameToLibrary, updateLibraryEntry } = useAppData();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, string>>({});

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const timeoutId = window.setTimeout(() => void searchGames(query), 250);
    return () => window.clearTimeout(timeoutId);
  }, [query, searchGames]);

  return (
    <div className="page-grid">
      <SectionCard title="Add games" eyebrow="Library builder">
        <div className="toolbar-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a game" />
          <button className="primary-button" type="button" onClick={() => void searchGames(query)}>
            Search
          </button>
        </div>
        <div className="card-grid">
          {gameSearchResults.map((game) => {
            const platform = selectedPlatforms[game.id] ?? game.platforms[0] ?? "PC";
            return (
              <article key={game.id} className="mini-card mini-card--game">
                <Link to={`/app/games/${game.id}`}>
                  <img src={game.cover_url} alt={game.title} className="game-cover" />
                </Link>
                <div>
                  <Link to={`/app/games/${game.id}`} className="mini-card__title-link">
                    <h3>{game.title}</h3>
                  </Link>
                  <div className="pill-row">
                    {game.platforms.map((gamePlatform) => (
                      <button
                        key={gamePlatform}
                        className={platform === gamePlatform ? "platform-pill platform-pill--active" : "platform-pill"}
                        type="button"
                        onClick={() => setSelectedPlatforms((current) => ({ ...current, [game.id]: gamePlatform }))}
                      >
                        {gamePlatform}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void addGameToLibrary({ game_id: game.id, platform, status: "want_to_play" })}
                >
                  Add to library
                </button>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Your library" eyebrow="Grid or list">
        <div className="toolbar-row">
          <button className={viewMode === "grid" ? "nav-tab nav-tab--active" : "nav-tab"} type="button" onClick={() => setViewMode("grid")}>
            Grid
          </button>
          <button className={viewMode === "list" ? "nav-tab nav-tab--active" : "nav-tab"} type="button" onClick={() => setViewMode("list")}>
            List
          </button>
        </div>
        <div className={viewMode === "grid" ? "card-grid" : "stack-list"}>
          {dashboard?.library.map((game) => (
            <article key={game.id} className={viewMode === "grid" ? "mini-card mini-card--game" : "activity-card activity-card--rich"}>
              <Link to={`/app/games/${game.game_id}`}>
                <img src={game.cover_url} alt={game.game_title} className={viewMode === "grid" ? "game-cover" : "game-cover game-cover--compact"} />
              </Link>
              <div>
                <Link to={`/app/games/${game.game_id}`} className="mini-card__title-link">
                  <h3>{game.game_title}</h3>
                </Link>
                <p className="subtle-text">
                  {game.platform} · {game.status.replace(/_/g, " ")}
                </p>
                <p>
                  {game.hours_played}h · {game.progress_percent}% complete · {game.playthroughs} playthroughs
                </p>
                <p>{game.note}</p>
                <div className="control-row">
                  <select value={game.status} onChange={(event) => void updateLibraryEntry(game.id, { status: event.target.value })}>
                    {libraryStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <button className="ghost-button" type="button" onClick={() => void updateLibraryEntry(game.id, { hours_played: game.hours_played + 1 })}>
                    +1h
                  </button>
                  <button className="ghost-button" type="button" onClick={() => void updateLibraryEntry(game.id, { hours_played: game.hours_played + 5 })}>
                    +5h
                  </button>
                  <button className="ghost-button" type="button" onClick={() => void updateLibraryEntry(game.id, { hours_played: game.hours_played + 10 })}>
                    +10h
                  </button>
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
    const timeoutId = window.setTimeout(() => void searchGames(query), 250);
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
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for a game" />
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
      </SectionCard>

      <SectionCard title="Scoring" eyebrow="10 category review">
        <div className="score-summary-card">
          <div>
            <p className="eyebrow">Live total</p>
            <strong>{totalScore}/100</strong>
          </div>
          <div className="chart-bar">
            <div className="chart-bar__fill chart-bar__fill--accent" style={{ width: `${totalScore}%` }} />
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
                await saveDraft({ game_id: selectedGameId, verdict, body, scores, total_score: totalScore, spoiler }, firstDraft?.id);
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
  const { userId } = useParams();
  const { token } = useAuth();
  const { profile: ownProfile, createList, deleteList, deleteReview, reactToReview, commentOnReview } = useAppData();
  const navigate = useNavigate();
  const [activeProfile, setActiveProfile] = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [listItems, setListItems] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }
    if (!userId) {
      setActiveProfile(ownProfile);
      return;
    }
    setLoadingProfile(true);
    void api
      .getUserProfile(token, userId)
      .then(setActiveProfile)
      .finally(() => setLoadingProfile(false));
  }, [ownProfile, token, userId]);

  const profile = userId ? activeProfile : ownProfile;
  if (!profile || loadingProfile) {
    return <SectionCard title="Profile">Loading profile...</SectionCard>;
  }

  const rankingBars = profile.review_highlights.slice(0, 5);
  const timeBars = profile.most_played_games.slice(0, 5);

  return (
    <div className="page-grid">
      <section className="profile-banner" style={{ backgroundImage: `url(${profile.user.banner_url})`, borderColor: profile.user.accent_color }}>
        <div className="profile-banner__overlay">
          <Avatar src={profile.user.avatar_url} alt={profile.user.display_name} />
          <div>
            <p className="eyebrow">Profile</p>
            <h1>{profile.user.display_name}</h1>
            <p className="subtle-text">
              @{profile.user.username} · {profile.user.shareable_id}
            </p>
            <p>{profile.tagline}</p>
          </div>
          <div className="profile-banner__stats">
            <div className="stat-tile">
              <span>{profile.stats.followers}</span>
              <small>followers</small>
            </div>
            <div className="stat-tile">
              <span>{profile.stats.following}</span>
              <small>following</small>
            </div>
            {profile.is_viewer_profile ? (
              <button className="icon-button" type="button" onClick={() => navigate("/app/profile/edit")} aria-label="Edit profile">
                ✏️
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <MomentumPanel
        totalHours={profile.stats.total_hours}
        topScore={profile.review_highlights[0]?.total_score ?? 0}
        totalGames={profile.stats.total_games}
        totalReviews={profile.stats.total_reviews}
      />

      <div className="page-grid page-grid--split">
        <SectionCard title="Review rankings" eyebrow="Main visual">
          <div className="chart-list">
            {rankingBars.map((review) => (
              <div key={review.id} className="chart-row">
                <div>
                  <Link to={`/app/reviews/${review.id}`}>{review.game_title}</Link>
                  <span className="subtle-text">{review.total_score}/100</span>
                </div>
                <div className="chart-bar">
                  <div className="chart-bar__fill chart-bar__fill--accent" style={{ width: `${review.total_score}%` }} />
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
                  <Link to={`/app/games/${game.game_id}`}>{game.game_title}</Link>
                  <span className="subtle-text">{game.hours_played}h</span>
                </div>
                <div className="chart-bar">
                  <div className="chart-bar__fill chart-bar__fill--accent" style={{ width: `${Math.min(100, game.hours_played * 2)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Featured lists" eyebrow={profile.is_viewer_profile ? "Add and remove" : "Collections"}>
        {profile.is_viewer_profile ? (
          <div className="editor-stack">
            <input value={listTitle} onChange={(event) => setListTitle(event.target.value)} placeholder="List title" />
            <input value={listDescription} onChange={(event) => setListDescription(event.target.value)} placeholder="What is this list about?" />
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
            <article key={list.id} className="mini-card">
              <h3>{list.title}</h3>
              <p>{list.description}</p>
              <p className="subtle-text">{list.items.join(" · ")}</p>
              {profile.is_viewer_profile ? (
                <button className="ghost-button" type="button" onClick={() => void deleteList(list.id)}>
                  Delete list
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Published reviews" eyebrow="Reactions and comments">
        <div className="stack-list">
          {profile.review_highlights.map((review) => (
            <ReviewPreviewCard
              key={review.id}
              review={review}
              onReact={(emoji) => void reactToReview(review.id, emoji)}
              onComment={(body) => commentOnReview(review.id, body)}
              onDelete={profile.is_viewer_profile ? () => void deleteReview(review.id) : undefined}
              showDelete={profile.is_viewer_profile}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function ReviewDetailPage() {
  const { reviewId } = useParams();
  const { token } = useAuth();
  const { reactToReview, commentOnReview } = useAppData();
  const [review, setReview] = useState<ReviewHighlight | null>(null);

  useEffect(() => {
    if (!token || !reviewId) {
      return;
    }
    void api.getReviewDetail(token, reviewId).then(setReview);
  }, [reviewId, token]);

  if (!review) {
    return <SectionCard title="Review">Loading review...</SectionCard>;
  }

  return (
    <div className="page-grid">
      <SectionCard title={review.game_title} eyebrow="Full review">
        <div className="detail-review">
          <Link to={`/app/games/${review.game_id}`}>
            <img src={review.cover_url} alt={review.game_title} className="game-cover detail-review__cover" />
          </Link>
          <div className="editor-stack">
            <IdentityLink
              to={`/app/users/${review.author_id}`}
              avatar={avatarPresets[0].url}
              name={review.author_name}
              handle={review.author_handle}
            />
            <h2>{review.title}</h2>
            <p>{review.verdict}</p>
            {review.body.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <ReactionStack emojis={review.recent_reactions} />
            <ReactionBar current={review.current_user_reaction} onSelect={(emoji) => void reactToReview(review.id, emoji)} />
            {review.scores ? (
              <div className="score-metrics">
                {Object.entries(review.scores).map(([key, value]) => (
                  <div key={key} className="stat-tile">
                    <span>{value}</span>
                    <small>{key.replace(/_/g, " ")}</small>
                  </div>
                ))}
              </div>
            ) : null}
            <CommentComposer placeholder="Add to the discussion" onSubmit={(body) => commentOnReview(review.id, body)} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function GameDetailPage() {
  const { gameId } = useParams();
  const { token } = useAuth();
  const [detail, setDetail] = useState<GameDetailResponse | null>(null);

  useEffect(() => {
    if (!token || !gameId) {
      return;
    }
    void api.getGameDetail(token, gameId).then(setDetail);
  }, [gameId, token]);

  if (!detail) {
    return <SectionCard title="Game">Loading game...</SectionCard>;
  }

  return (
    <div className="page-grid">
      <SectionCard title={detail.game.title} eyebrow="Game overview">
        <div className="detail-review">
          <img src={detail.game.cover_url} alt={detail.game.title} className="game-cover detail-review__cover" />
          <div className="editor-stack">
            <p>{detail.game.summary}</p>
            <div className="metric-grid">
              <div>
                <span>{detail.average_score}</span>
                <small>Community score</small>
              </div>
              <div>
                <span>{detail.review_count}</span>
                <small>Reviews logged</small>
              </div>
            </div>
            <div className="pill-row">
              {detail.top_platforms.map((platform) => (
                <span key={platform} className="platform-pill platform-pill--active">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Associated reviews" eyebrow="Consensus">
        <div className="stack-list">
          {detail.reviews.map((review) => (
            <ReviewPreviewCard
              key={review.id}
              review={review}
              onReact={() => undefined}
              onComment={async () => undefined}
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
  const { profile, updateCustomization } = useAppData();
  const [tagline, setTagline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  const [favoriteGames, setFavoriteGames] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!profile) {
      return;
    }
    setTagline(profile.tagline);
    setAvatarUrl(profile.user.avatar_url);
    setBannerUrl(profile.user.banner_url);
    setAccentColor(profile.user.accent_color);
    setFavoriteGames(profile.favorite_games.join(", "));
  }, [profile]);

  return (
    <div className="page-grid">
      <SectionCard title="Edit profile" eyebrow="Presets only">
        <div className="editor-stack">
          <input value={tagline} onChange={(event) => setTagline(event.target.value)} placeholder="Tagline" />
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
          <input value={accentColor} onChange={(event) => setAccentColor(event.target.value)} placeholder="#8b5cf6" />
          <input value={favoriteGames} onChange={(event) => setFavoriteGames(event.target.value)} placeholder="Favorite games separated by commas" />
          <div className="mini-card mini-card--interactive">
            <div className="person-card__banner" style={{ backgroundImage: `url(${bannerUrl})` }} />
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
            onClick={async () => {
              await updateCustomization({
                tagline,
                avatar_url: avatarUrl,
                banner_url: bannerUrl,
                accent_color: accentColor,
                favorite_games: favoriteGames.split(",").map((item) => item.trim()).filter(Boolean),
              });
              setStatusMessage("Saved profile changes.");
            }}
          >
            Save changes
          </button>
          {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
        </div>
      </SectionCard>
    </div>
  );
}
