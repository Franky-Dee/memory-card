import { useEffect, useMemo, useState, type ReactNode } from "react";

import { SectionCard } from "../components/SectionCard";
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

function Avatar({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="avatar" />;
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
          <button className="ghost-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="detail-modal__content">{children}</div>
      </div>
    </div>
  );
}

export function FeedPage() {
  const { dashboard, loading, error, reactToFeed, commentOnFeed } = useAppData();
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  if (loading && !dashboard) {
    return (
      <div className="page-grid">
        <SectionCard title="Following feed">Loading your feed...</SectionCard>
      </div>
    );
  }

  return (
    <div className="page-grid page-grid--split">
      <SectionCard title="Following feed" eyebrow="Main home">
        {error ? <p className="error-text">{error}</p> : null}
        <div className="stack-list">
          {dashboard?.feed.map((entry) => (
            <article key={entry.id} className="activity-card activity-card--rich">
              <img src={entry.cover_url} alt={entry.game_title} className="game-cover game-cover--feed" />
              <div className="activity-card__body">
                <div className="activity-card__top">
                  <div className="identity-row">
                    <Avatar src={entry.actor_avatar_url} alt={entry.actor_name} />
                    <div>
                      <p className="activity-card__title">
                        <strong>{entry.actor_name}</strong> <span>{entry.actor_handle}</span>
                      </p>
                      <small className="subtle-text">{new Date(entry.timestamp).toLocaleString()}</small>
                    </div>
                  </div>
                  <span className="score-tag">{entry.activity_type.replace("_", " ")}</span>
                </div>
                <h3>{entry.game_title}</h3>
                <p>{entry.summary}</p>
                <div className="meta-row meta-row--left">
                  <button className="ghost-button" type="button" onClick={() => void reactToFeed(entry.id)}>
                    {entry.current_user_reacted ? "Unreact" : "React"} · {entry.reaction_count}
                  </button>
                  <span>{entry.comment_count} comments</span>
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
                  <div className="comment-entry">
                    <input
                      value={commentDrafts[entry.id] ?? ""}
                      onChange={(event) => setCommentDrafts((current) => ({ ...current, [entry.id]: event.target.value }))}
                      placeholder="Add a comment"
                    />
                    <button
                      className="primary-button"
                      type="button"
                      onClick={async () => {
                        const body = commentDrafts[entry.id]?.trim();
                        if (!body) {
                          return;
                        }
                        await commentOnFeed(entry.id, body);
                        setCommentDrafts((current) => ({ ...current, [entry.id]: "" }));
                      }}
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Your momentum" eyebrow="At a glance">
        <div className="metric-grid">
          <div>
            <span>{dashboard?.library.reduce((sum, game) => sum + game.hours_played, 0) ?? 0}h</span>
            <small>Tracked game time</small>
          </div>
          <div>
            <span>{dashboard?.reviews[0]?.total_score ?? 0}</span>
            <small>Highest review score</small>
          </div>
          <div>
            <span>{dashboard?.library.length ?? 0}</span>
            <small>Games in library</small>
          </div>
          <div>
            <span>{dashboard?.reviews.length ?? 0}</span>
            <small>Published reviews</small>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function DiscoverPage() {
  const { dashboard, peopleSearchResults, gameSearchResults, searchPeople, searchGames, toggleFollow, addGameToLibrary } =
    useAppData();
  const { user } = useAuth();
  const [peopleQuery, setPeopleQuery] = useState("");
  const [gameQuery, setGameQuery] = useState("");

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
          {(peopleSearchResults.length ? peopleSearchResults : dashboard?.discover_users ?? []).map((person) => (
            <article key={person.id} className="person-card">
              <div className="person-card__banner" style={{ backgroundImage: `url(${person.banner_url})` }} />
              <div className="person-card__content">
                <Avatar src={person.avatar_url} alt={person.display_name} />
                <div>
                  <h3>{person.display_name}</h3>
                  <p className="subtle-text">
                    @{person.username} · {person.shareable_id}
                  </p>
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

      <SectionCard title="Suggested games" eyebrow="Clickable suggestions">
        <div className="toolbar-row">
          <input value={gameQuery} onChange={(event) => setGameQuery(event.target.value)} placeholder="Search games" />
          <button className="primary-button" type="button" onClick={() => void searchGames(gameQuery)}>
            Search games
          </button>
        </div>
        <div className="card-grid">
          {gameSearchResults.map((game) => (
            <article key={game.id} className="mini-card mini-card--game">
              <img src={game.cover_url} alt={game.title} className="game-cover" />
              <div>
                <h3>{game.title}</h3>
                <p className="subtle-text">
                  {game.release_year ?? "Upcoming"} · {game.platforms.join(" · ")}
                </p>
                <p>{game.summary ?? "No description available yet."}</p>
              </div>
              <div className="control-row">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    void addGameToLibrary({
                      game_id: game.id,
                      platform: game.platforms[0] ?? "PC",
                      status: "want_to_play",
                    })
                  }
                >
                  Add to library
                </button>
                <button className="ghost-button" type="button" onClick={() => setGameQuery(game.title)}>
                  Reuse search
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className="subtle-text">Your shareable profile ID is <strong>{user?.shareable_id}</strong>.</p>
      </SectionCard>
    </div>
  );
}

export function LibraryPage() {
  const { dashboard, gameSearchResults, searchGames, addGameToLibrary, updateLibraryEntry } = useAppData();
  const [query, setQuery] = useState("");

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
          {gameSearchResults.map((game) => (
            <article key={game.id} className="mini-card mini-card--game">
              <img src={game.cover_url} alt={game.title} className="game-cover" />
              <div>
                <h3>{game.title}</h3>
                <p className="subtle-text">{game.platforms.join(" · ")}</p>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  void addGameToLibrary({
                    game_id: game.id,
                    platform: game.platforms[0] ?? "PC",
                    status: "want_to_play",
                  })
                }
              >
                Add to library
              </button>
            </article>
          ))}
        </div>
        {!gameSearchResults.length && query.trim().length >= 2 ? (
          <p className="subtle-text">No games matched yet. Try a broader title or search another spelling.</p>
        ) : null}
      </SectionCard>

      <SectionCard title="Tracked library" eyebrow="Game shelves">
        <div className="card-grid">
          {dashboard?.library.map((game) => (
            <article key={game.id} className="mini-card mini-card--game">
              <img src={game.cover_url} alt={game.game_title} className="game-cover" />
              <div>
                <h3>{game.game_title}</h3>
                <p className="subtle-text">
                  {game.platform} · {game.status.replace(/_/g, " ")}
                </p>
                <p>{game.hours_played}h · {game.progress_percent}% complete · {game.playthroughs} playthroughs</p>
                <p>{game.note}</p>
              </div>
              <div className="control-row control-row--stack">
                <select
                  value={game.status}
                  onChange={(event) => void updateLibraryEntry(game.id, { status: event.target.value })}
                >
                  {libraryStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <div className="control-row">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => void updateLibraryEntry(game.id, { hours_played: game.hours_played + 1 })}
                  >
                    +1 hour
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      void updateLibraryEntry(game.id, {
                        progress_percent: Math.min(100, game.progress_percent + 10),
                      })
                    }
                  >
                    +10% progress
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
  const [scores, setScores] = useState<Record<string, number>>(
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
        <div className="score-summary-card">
          <div>
            <p className="eyebrow">Live total</p>
            <strong>{totalScore}/100</strong>
          </div>
          <div className="chart-bar">
            <div className="chart-bar__fill" style={{ width: `${totalScore}%` }} />
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
  const { profile, createList, deleteList, deleteReview, reactToReview, commentOnReview } = useAppData();
  const [activePanel, setActivePanel] = useState<"followers" | "following" | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [listItems, setListItems] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  if (!profile) {
    return null;
  }

  const rankingBars = profile.review_highlights.slice(0, 5);
  const timeBars = profile.most_played_games.slice(0, 5);
  const selectedList = profile.featured_lists.find((list) => list.id === selectedListId) ?? null;
  const selectedReview = profile.review_highlights.find((review) => review.id === selectedReviewId) ?? null;

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
          </div>
        </div>
      </section>

      {activePanel ? (
        <SectionCard title={activePanel === "followers" ? "Followers" : "Following"} eyebrow="People">
          <div className="card-grid">
            {(activePanel === "followers" ? profile.followers : profile.following_users).map((person) => (
              <article key={person.id} className="mini-card">
                <div className="identity-row">
                  <Avatar src={person.avatar_url} alt={person.display_name} />
                  <div>
                    <h3>{person.display_name}</h3>
                    <p className="subtle-text">@{person.username}</p>
                  </div>
                </div>
                <p>{person.tagline}</p>
              </article>
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

      <SectionCard title="Featured lists" eyebrow="Add and remove">
        <div className="editor-stack">
          <input value={listTitle} onChange={(event) => setListTitle(event.target.value)} placeholder="List title" />
          <input
            value={listDescription}
            onChange={(event) => setListDescription(event.target.value)}
            placeholder="What is this list about?"
          />
          <input
            value={listItems}
            onChange={(event) => setListItems(event.target.value)}
            placeholder="Comma-separated games"
          />
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
        <div className="card-grid">
          {profile.featured_lists.map((list) => (
            <article key={list.id} className="mini-card mini-card--interactive">
              <h3>{list.title}</h3>
              <p>{list.description}</p>
              <p className="subtle-text">{list.items.join(" · ")}</p>
              <div className="control-row">
                <button className="primary-button" type="button" onClick={() => setSelectedListId(list.id)}>
                  Open list
                </button>
                <button className="ghost-button" type="button" onClick={() => void deleteList(list.id)}>
                  Delete list
                </button>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Published reviews" eyebrow="Reactions and comments">
        <div className="stack-list">
          {profile.review_highlights.map((review) => (
            <article key={review.id} className="mini-card mini-card--review mini-card--interactive">
              <div className="identity-row">
                <img src={review.cover_url} alt={review.game_title} className="game-cover game-cover--compact" />
                <div>
                  <h3>{review.game_title}</h3>
                  <p>{review.title}</p>
                  <p className="subtle-text">{review.total_score}/100</p>
                </div>
              </div>
              <p>{review.verdict}</p>
              <div className="meta-row meta-row--left">
                <button className="primary-button" type="button" onClick={() => setSelectedReviewId(review.id)}>
                  Open review
                </button>
                <button className="ghost-button" type="button" onClick={() => void reactToReview(review.id)}>
                  {review.current_user_reacted ? "Unreact" : "React"} · {review.reaction_count}
                </button>
                <span>{review.comment_count} comments</span>
                <button className="ghost-button" type="button" onClick={() => void deleteReview(review.id)}>
                  Delete review
                </button>
              </div>
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
                <div className="comment-entry">
                  <input
                    value={commentDrafts[review.id] ?? ""}
                    onChange={(event) => setCommentDrafts((current) => ({ ...current, [review.id]: event.target.value }))}
                    placeholder="Comment on this review"
                  />
                  <button
                    className="primary-button"
                    type="button"
                    onClick={async () => {
                      const body = commentDrafts[review.id]?.trim();
                      if (!body) {
                        return;
                      }
                      await commentOnReview(review.id, body);
                      setCommentDrafts((current) => ({ ...current, [review.id]: "" }));
                    }}
                  >
                    Post
                  </button>
                </div>
              </div>
            </article>
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

      {selectedReview ? (
        <DetailModal
          title={selectedReview.game_title}
          subtitle={`${selectedReview.title} · ${selectedReview.total_score}/100`}
          onClose={() => setSelectedReviewId(null)}
        >
          <div className="detail-review">
            <img src={selectedReview.cover_url} alt={selectedReview.game_title} className="game-cover detail-review__cover" />
            <div className="editor-stack">
              <p>{selectedReview.verdict}</p>
              <p>{selectedReview.body}</p>
              <div className="meta-row meta-row--left">
                <span>{selectedReview.reaction_count} reactions</span>
                <span>{selectedReview.comment_count} comments</span>
                <span>{selectedReview.spoiler ? "Spoilers hidden" : "Spoiler-safe"}</span>
              </div>
            </div>
          </div>
        </DetailModal>
      ) : null}
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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  const [favoriteGames, setFavoriteGames] = useState("");

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

  const visibilityOptions = ["public", "followers", "private"] as const;

  return (
    <div className="page-grid">
      <SectionCard title="Profile customization" eyebrow="Banners, avatars, accents">
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
          <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="Avatar image URL" />
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
          <input value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} placeholder="Banner image URL" />
          <input value={accentColor} onChange={(event) => setAccentColor(event.target.value)} placeholder="#8b5cf6" />
          <input
            value={favoriteGames}
            onChange={(event) => setFavoriteGames(event.target.value)}
            placeholder="Favorite games separated by commas"
          />
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
