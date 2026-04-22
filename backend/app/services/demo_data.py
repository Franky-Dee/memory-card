from datetime import UTC, datetime, timedelta

from app.models.schemas import (
    AuthResponse,
    AuthUser,
    DashboardResponse,
    DiscoverUser,
    FeaturedList,
    FeedItem,
    LibraryEntry,
    ProfileResponse,
    ProfileStats,
    ReviewHighlight,
)


def _now(hours_ago: int) -> datetime:
    return datetime.now(UTC) - timedelta(hours=hours_ago)


CURRENT_USER = AuthUser(
    id="user-1",
    username="francbyte",
    display_name="Franc",
    email="franc@example.com",
    avatar_url="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=320&q=80",
    banner_url="https://images.unsplash.com/photo-1520034475321-cbe63696469a?auto=format&fit=crop&w=1280&q=80",
    shareable_id="MC-4F9C",
)

FEED = [
    FeedItem(
        id="feed-1",
        activity_type="reviewed",
        actor_name="Franc",
        actor_handle="@francbyte",
        actor_avatar_url=CURRENT_USER.avatar_url,
        game_title="Metaphor: ReFantazio",
        summary="Published a 91/100 review and called it the most stylish RPG menuing in years.",
        timestamp=_now(3),
        cover_url="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=640&q=80",
        reactions=48,
        comments=12,
    ),
    FeedItem(
        id="feed-2",
        activity_type="started",
        actor_name="Kei Morgan",
        actor_handle="@keim",
        actor_avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
        game_title="Hades II",
        summary="Started a fresh run and tagged it as a likely top-five roguelike replay.",
        timestamp=_now(7),
        cover_url="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=640&q=80",
        reactions=29,
        comments=6,
    ),
    FeedItem(
        id="feed-3",
        activity_type="finished",
        actor_name="Mika Reed",
        actor_handle="@mikareed",
        actor_avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
        game_title="Alan Wake II",
        summary="Finished a second playthrough and updated their total time to 31 hours.",
        timestamp=_now(14),
        cover_url="https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=640&q=80",
        reactions=34,
        comments=9,
    ),
]

DISCOVER_USERS = [
    DiscoverUser(
        id="user-2",
        display_name="Kei Morgan",
        username="keim",
        shareable_id="MC-89LQ",
        tagline="Chasing stylish combat systems and perfect parries.",
        favorite_games=["Sekiro", "Bayonetta 3", "Hi-Fi Rush"],
        follower_count=482,
        avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
        banner_url="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1280&q=80",
    ),
    DiscoverUser(
        id="user-3",
        display_name="Mika Reed",
        username="mikareed",
        shareable_id="MC-A2DM",
        tagline="Narrative-first horror and weird indies.",
        favorite_games=["Alan Wake II", "Control", "Outer Wilds"],
        follower_count=361,
        avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
        banner_url="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1280&q=80",
    ),
]

LIBRARY = [
    LibraryEntry(
        id="library-1",
        game_title="Metaphor: ReFantazio",
        status="playing",
        platform="PC",
        hours_played=42,
        playthroughs=1,
        progress_percent=78,
        cover_url="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=640&q=80",
        note="Currently writing a full draft review after the final major dungeon.",
    ),
    LibraryEntry(
        id="library-2",
        game_title="Alan Wake II",
        status="replaying",
        platform="PS5",
        hours_played=31,
        playthroughs=2,
        progress_percent=100,
        cover_url="https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=640&q=80",
        note="Replay run focused on collecting cleaner story notes.",
    ),
    LibraryEntry(
        id="library-3",
        game_title="Hades II",
        status="want_to_play",
        platform="PC",
        hours_played=0,
        playthroughs=0,
        progress_percent=0,
        cover_url="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=640&q=80",
        note="Queued for the next deep-dive review cycle.",
    ),
]

REVIEWS = [
    ReviewHighlight(
        id="review-1",
        game_title="Metaphor: ReFantazio",
        title="Style, conviction, and systems that never lose momentum",
        verdict="A massive RPG that still feels intensely personal.",
        total_score=91,
        cover_url="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=640&q=80",
        reaction_count=48,
        comment_count=12,
    ),
    ReviewHighlight(
        id="review-2",
        game_title="Alan Wake II",
        title="The rare horror sequel that gets stranger and better",
        verdict="Brilliant atmosphere, all-time presentation, unforgettable set pieces.",
        total_score=94,
        cover_url="https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=640&q=80",
        spoiler=True,
        reaction_count=39,
        comment_count=10,
    ),
]

PROFILE = ProfileResponse(
    user=CURRENT_USER,
    stats=ProfileStats(
        total_games=34,
        total_reviews=12,
        average_score=86,
        total_hours=411,
        followers=238,
        following=174,
    ),
    tagline="Reviewing games like a notebook you can share.",
    favorite_games=["Outer Wilds", "Persona 5 Royal", "Sekiro", "Alan Wake II"],
    featured_lists=[
        FeaturedList(
            id="list-1",
            title="Top 10 narrative swings",
            description="Games that took a big creative shot and landed.",
            items=["Alan Wake II", "Outer Wilds", "NieR: Automata"],
        ),
        FeaturedList(
            id="list-2",
            title="Current backlog pressure",
            description="The games most likely to steal the next weekend.",
            items=["Hades II", "Animal Well", "1000xRESIST"],
        ),
    ],
    review_highlights=REVIEWS,
)


def demo_dashboard() -> DashboardResponse:
    return DashboardResponse(
        current_user=CURRENT_USER,
        feed=FEED,
        discover_users=DISCOVER_USERS,
        library=LIBRARY,
        reviews=REVIEWS,
    )


def auth_response() -> AuthResponse:
    return AuthResponse(access_token="demo-token", user=CURRENT_USER)

