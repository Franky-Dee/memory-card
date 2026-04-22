from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


Visibility = Literal["public", "followers", "private"]
LibraryStatus = Literal["want_to_play", "playing", "paused", "finished", "dropped", "replaying"]
ActivityType = Literal["started", "finished", "reviewed", "updated_score", "status_update"]


class AuthUser(BaseModel):
    id: str
    username: str
    display_name: str
    email: EmailStr
    avatar_url: str
    banner_url: str
    shareable_id: str
    accent_color: str = "#8b5cf6"


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser


class SignupRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=24)
    display_name: str = Field(min_length=2, max_length=40)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class ScoreBreakdown(BaseModel):
    gameplay: int = Field(ge=0, le=10)
    story: int = Field(ge=0, le=10)
    visuals: int = Field(ge=0, le=10)
    art_direction: int = Field(ge=0, le=10)
    audio: int = Field(ge=0, le=10)
    performance: int = Field(ge=0, le=10)
    world_design: int = Field(ge=0, le=10)
    replayability: int = Field(ge=0, le=10)
    innovation: int = Field(ge=0, le=10)
    emotional_impact: int = Field(ge=0, le=10)


class CommentItem(BaseModel):
    id: str
    author_name: str
    author_handle: str
    author_avatar_url: str
    body: str
    created_at: datetime


class ReviewHighlight(BaseModel):
    id: str
    game_id: str
    game_title: str
    author_id: str = ""
    author_name: str = ""
    author_handle: str = ""
    title: str
    verdict: str
    body: str = ""
    scores: ScoreBreakdown | None = None
    total_score: int = Field(ge=0, le=100)
    visibility: Visibility = "public"
    spoiler: bool = False
    comment_count: int = 0
    reaction_count: int = 0
    current_user_reacted: bool = False
    current_user_reaction: str | None = None
    recent_reactions: list[str] = Field(default_factory=list)
    comments: list[CommentItem] = Field(default_factory=list)
    cover_url: str


class FeedItem(BaseModel):
    id: str
    activity_type: ActivityType
    actor_id: str = ""
    actor_name: str
    actor_handle: str
    actor_avatar_url: str
    game_id: str = ""
    game_title: str
    summary: str
    timestamp: datetime
    cover_url: str
    reaction_count: int = 0
    comment_count: int = 0
    current_user_reacted: bool = False
    current_user_reaction: str | None = None
    recent_reactions: list[str] = Field(default_factory=list)
    comments: list[CommentItem] = Field(default_factory=list)


class DiscoverUser(BaseModel):
    id: str
    display_name: str
    username: str
    shareable_id: str
    tagline: str
    favorite_games: list[str]
    follower_count: int
    avatar_url: str
    banner_url: str
    accent_color: str = "#8b5cf6"
    is_following: bool = False


class GameSearchResult(BaseModel):
    id: str
    title: str
    platforms: list[str]
    cover_url: str
    release_year: int | None = None
    summary: str | None = None


class LibraryEntry(BaseModel):
    id: str
    game_id: str
    game_title: str
    status: LibraryStatus
    platform: str
    hours_played: int
    playthroughs: int
    progress_percent: int = Field(ge=0, le=100)
    cover_url: str
    note: str


class ProfileStats(BaseModel):
    total_games: int
    total_reviews: int
    average_score: int
    total_hours: int
    followers: int
    following: int


class FeaturedList(BaseModel):
    id: str
    title: str
    description: str
    items: list[str]


class ProfileResponse(BaseModel):
    user: AuthUser
    is_viewer_profile: bool = True
    stats: ProfileStats
    tagline: str
    favorite_games: list[str]
    featured_lists: list[FeaturedList]
    review_highlights: list[ReviewHighlight]
    followers: list[DiscoverUser]
    following_users: list[DiscoverUser]
    most_played_games: list[LibraryEntry]


class DashboardResponse(BaseModel):
    current_user: AuthUser
    feed: list[FeedItem]
    explore_posts: list[FeedItem]
    discover_users: list[DiscoverUser]
    library: list[LibraryEntry]
    reviews: list[ReviewHighlight]
    suggested_games: list[GameSearchResult]


class AddLibraryEntryRequest(BaseModel):
    game_id: str
    platform: str = Field(min_length=1, max_length=40)
    status: LibraryStatus = "want_to_play"


class UpdateLibraryEntryRequest(BaseModel):
    status: LibraryStatus | None = None
    hours_played: int | None = Field(default=None, ge=0)
    progress_percent: int | None = Field(default=None, ge=0, le=100)
    playthroughs: int | None = Field(default=None, ge=0)
    note: str | None = Field(default=None, max_length=500)


class SubmitGameRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    platforms: list[str] = Field(default_factory=list)


class ReviewDraft(BaseModel):
    id: str
    game_id: str
    game_title: str
    game_cover_url: str
    verdict: str
    body: str
    scores: ScoreBreakdown
    total_score: int = Field(ge=0, le=100)
    updated_at: datetime
    spoiler: bool = False
    published: bool = False


class ReviewDraftUpdateRequest(BaseModel):
    game_id: str
    verdict: str = Field(min_length=1, max_length=140)
    body: str = Field(min_length=1, max_length=4000)
    scores: ScoreBreakdown
    total_score: int = Field(ge=0, le=100)
    spoiler: bool = False


class NotificationItem(BaseModel):
    id: str
    title: str
    body: str
    created_at: datetime
    read: bool = False


class PrivacySettings(BaseModel):
    profile_visibility: Visibility = "public"
    review_visibility: Visibility = "public"
    activity_visibility: Visibility = "public"


class ProfileCustomizationRequest(BaseModel):
    tagline: str = Field(min_length=1, max_length=180)
    avatar_url: str = Field(min_length=1, max_length=500)
    banner_url: str = Field(min_length=1, max_length=500)
    accent_color: str = Field(min_length=4, max_length=20)
    favorite_games: list[str] = Field(default_factory=list)


class FeaturedListCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=240)
    items: list[str] = Field(default_factory=list)


class CommentCreateRequest(BaseModel):
    body: str = Field(min_length=1, max_length=400)


class ReactionCreateRequest(BaseModel):
    emoji: str = Field(min_length=1, max_length=16)


class GameDetailResponse(BaseModel):
    game: GameSearchResult
    average_score: int
    review_count: int
    top_platforms: list[str]
    reviews: list[ReviewHighlight]
