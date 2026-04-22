from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime, timedelta
from html import unescape
import re
from typing import Any
from urllib import error, parse, request
from uuid import uuid4
import json

import bcrypt
from fastapi import HTTPException, status
from pymongo import MongoClient
from pymongo.errors import PyMongoError

from app.core.config import get_settings
from app.models.schemas import (
    AddLibraryEntryRequest,
    AuthResponse,
    AuthUser,
    CommentCreateRequest,
    CommentItem,
    DashboardResponse,
    DiscoverUser,
    FeaturedList,
    FeaturedListCreateRequest,
    FeedItem,
    GameSearchResult,
    LibraryEntry,
    LoginRequest,
    NotificationItem,
    PrivacySettings,
    ProfileCustomizationRequest,
    ProfileResponse,
    ProfileStats,
    ReviewDraft,
    ReviewDraftUpdateRequest,
    ReviewHighlight,
    ScoreBreakdown,
    SignupRequest,
    SubmitGameRequest,
    UpdateLibraryEntryRequest,
)

settings = get_settings()


def _now(hours_ago: int = 0) -> datetime:
    return datetime.now(UTC) - timedelta(hours=hours_ago)


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _shareable_id() -> str:
    return f"MC-{uuid4().hex[:4].upper()}"


def _make_comment(author: AuthUser, body: str) -> CommentItem:
    return CommentItem(
        id=f"comment-{uuid4().hex[:8]}",
        author_name=author.display_name,
        author_handle=f"@{author.username}",
        author_avatar_url=author.avatar_url,
        body=body,
        created_at=_now(),
    )


def _normalize_cover_url(url: str | None) -> str:
    if not url:
        return _steam_asset(1145350, "library_600x900_2x.jpg")
    if url.startswith("//"):
        return f"https:{url}".replace("t_thumb", "t_cover_big")
    return url.replace("t_thumb", "t_cover_big")


def _steam_asset(app_id: int, asset_name: str) -> str:
    return f"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{app_id}/{asset_name}"


def _steam_cover(app_id: int, fallback: str | None = None) -> str:
    return fallback or _steam_asset(app_id, "library_600x900_2x.jpg")


def _steam_header(app_id: int) -> str:
    return _steam_asset(app_id, "header.jpg")


def _strip_html(text: str | None) -> str | None:
    if not text:
        return None
    plain = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", unescape(plain)).strip()


CATALOG: list[GameSearchResult] = [
    GameSearchResult(
        id="game-1",
        title="Hades II",
        platforms=["PC"],
        cover_url=_steam_cover(1145350),
        release_year=2024,
        summary="Supergiant's mythic roguelike sequel with incredible combat flow and gorgeous art.",
    ),
    GameSearchResult(
        id="game-2",
        title="Balatro",
        platforms=["PC", "Nintendo Switch", "PS5", "Xbox Series X|S"],
        cover_url=_steam_cover(2379780),
        release_year=2024,
        summary="A deckbuilding obsession with instant readability and one-more-run energy.",
    ),
    GameSearchResult(
        id="game-3",
        title="Outer Wilds",
        platforms=["PC", "PS5", "Switch"],
        cover_url=_steam_cover(753640),
        release_year=2019,
        summary="A solar-system mystery built on curiosity, discovery, and unforgettable reveals.",
    ),
    GameSearchResult(
        id="game-4",
        title="Hi-Fi RUSH",
        platforms=["PC", "PS5", "Xbox Series X|S"],
        cover_url=_steam_cover(1817230),
        release_year=2024,
        summary="Rhythm-driven action with huge style, fantastic animation, and pure momentum.",
    ),
    GameSearchResult(
        id="game-5",
        title="ELDEN RING",
        platforms=["PC", "PS5", "Xbox Series X|S"],
        cover_url=_steam_cover(1245620),
        release_year=2022,
        summary="Huge-scale world design, boss fights, and build variety with all-timer atmosphere.",
    ),
    GameSearchResult(
        id="game-6",
        title="Persona 3 Reload",
        platforms=["PC", "PS5", "Xbox Series X|S"],
        cover_url=_steam_cover(2161700),
        release_year=2024,
        summary="Stylish school-life RPG pacing, polished combat, and striking presentation.",
    ),
]

CURRENT_USER = AuthUser(
    id="user-1",
    username="francbyte",
    display_name="Franc",
    email="franc@example.com",
    avatar_url="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=320&q=80",
    banner_url=_steam_header(1145350),
    shareable_id="MC-4F9C",
    accent_color="#8b5cf6",
)

USERS: dict[str, dict[str, Any]] = {
    CURRENT_USER.email: {"user": CURRENT_USER, "password_hash": _hash_password("securepass123")}
}

TOKENS: dict[str, str] = {"demo-token": CURRENT_USER.email}

DIRECTORY: dict[str, DiscoverUser] = {
    "user-2": DiscoverUser(
        id="user-2",
        display_name="Kei Morgan",
        username="keim",
        shareable_id="MC-89LQ",
        tagline="Chasing stylish combat systems and perfect parries.",
        favorite_games=["Sekiro", "Hi-Fi RUSH", "SIFU"],
        follower_count=482,
        avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
        banner_url=_steam_header(1817230),
        accent_color="#22c55e",
    ),
    "user-3": DiscoverUser(
        id="user-3",
        display_name="Mika Reed",
        username="mikareed",
        shareable_id="MC-A2DM",
        tagline="Narrative-first horror and weird indies.",
        favorite_games=["Outer Wilds", "INSIDE", "COCOON"],
        follower_count=361,
        avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
        banner_url=_steam_header(753640),
        accent_color="#f97316",
    ),
    "user-4": DiscoverUser(
        id="user-4",
        display_name="Jonah Vale",
        username="jonahvale",
        shareable_id="MC-77NX",
        tagline="Character action, secret bosses, and brutally honest rankings.",
        favorite_games=["Hi-Fi RUSH", "ELDEN RING", "Sekiro"],
        follower_count=229,
        avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=80",
        banner_url=_steam_header(1245620),
        accent_color="#06b6d4",
    ),
}

FOLLOWING_BY_USER: dict[str, set[str]] = {CURRENT_USER.id: {"user-2", "user-3"}}

PROFILE_DETAILS: dict[str, dict[str, Any]] = {
    CURRENT_USER.id: {
        "tagline": "Reviewing games like they deserve a proper memory.",
        "favorite_games": ["Outer Wilds", "Hades II", "ELDEN RING", "Persona 3 Reload"],
        "featured_lists": [
            FeaturedList(
                id="list-1",
                title="Top 10 late-night runs",
                description="Games that completely stole the evening.",
                items=["Hades II", "Balatro", "Outer Wilds"],
            ),
            FeaturedList(
                id="list-2",
                title="Current backlog pressure",
                description="The games most likely to steal the next weekend.",
                items=["Persona 3 Reload", "ELDEN RING", "Hi-Fi RUSH"],
            ),
        ],
    }
}

LIBRARIES: dict[str, list[LibraryEntry]] = {
    CURRENT_USER.id: [
        LibraryEntry(
            id="library-1",
            game_id="game-1",
            game_title="Hades II",
            status="playing",
            platform="PC",
            hours_played=42,
            playthroughs=2,
            progress_percent=78,
            cover_url=CATALOG[0].cover_url,
            note="Currently tweaking a high-heat build and writing a deeper review draft.",
        ),
        LibraryEntry(
            id="library-2",
            game_id="game-2",
            game_title="Balatro",
            status="replaying",
            platform="PC",
            hours_played=31,
            playthroughs=6,
            progress_percent=100,
            cover_url=CATALOG[1].cover_url,
            note="Perfect for a quick run that somehow becomes a two-hour session.",
        ),
        LibraryEntry(
            id="library-3",
            game_id="game-3",
            game_title="Outer Wilds",
            status="finished",
            platform="PC",
            hours_played=24,
            playthroughs=1,
            progress_percent=100,
            cover_url=CATALOG[4].cover_url,
            note="Permanent all-timer. No notes needed beyond 'wow'.",
        ),
    ]
}

REVIEW_DRAFTS: dict[str, list[ReviewDraft]] = {
    CURRENT_USER.id: [
        ReviewDraft(
            id="draft-1",
            game_id="game-1",
            game_title="Hades II",
            game_cover_url=CATALOG[0].cover_url,
            verdict="An all-time combat loop with absurd momentum.",
            body="Drafting a full spoiler-safe breakdown of weapon variety, build discovery, and how every run still feels sharp.",
            scores=ScoreBreakdown(
                gameplay=10,
                story=8,
                visuals=9,
                art_direction=10,
                audio=9,
                performance=9,
                world_design=9,
                replayability=10,
                innovation=8,
                emotional_impact=9,
            ),
            total_score=91,
            updated_at=_now(2),
            spoiler=False,
        )
    ]
}

PUBLISHED_REVIEWS: dict[str, list[ReviewHighlight]] = {
    CURRENT_USER.id: [
        ReviewHighlight(
            id="review-1",
            game_id="game-1",
            game_title="Hades II",
            title="The cleanest action loop I've touched this year",
            verdict="An early-access game that already feels impossibly confident.",
            body="Hades II keeps the instant readability of the first game while giving every build a little more experimentation space. The new weapons feel distinct, the presentation is outrageous, and even quick sessions generate stories worth logging.",
            total_score=91,
            cover_url=CATALOG[0].cover_url,
        ),
        ReviewHighlight(
            id="review-2",
            game_id="game-2",
            game_title="Balatro",
            title="The run-based game that quietly eats your entire week",
            verdict="Readable, compulsive, and somehow more dangerous than most live-service games.",
            body="Balatro is one of the sharpest feedback loops in recent memory. Every run makes the scoring language clearer, every joker choice feels dramatic, and the art direction sells the whole thing without ever overcomplicating it.",
            total_score=94,
            cover_url=CATALOG[1].cover_url,
            spoiler=False,
        ),
    ]
}

BASE_FEED: list[FeedItem] = [
    FeedItem(
        id="feed-1",
        activity_type="reviewed",
        actor_name="Franc",
        actor_handle="@francbyte",
        actor_avatar_url=CURRENT_USER.avatar_url,
        game_title="Hades II",
        summary="Dropped a full 91/100 review after a marathon run streak and immediately pushed it near the top of the yearly rankings.",
        timestamp=_now(3),
        cover_url=CATALOG[0].cover_url,
    ),
    FeedItem(
        id="feed-2",
        activity_type="started",
        actor_name="Kei Morgan",
        actor_handle="@keim",
        actor_avatar_url=DIRECTORY["user-2"].avatar_url,
        game_title="Hi-Fi RUSH",
        summary="Started a fresh playthrough and tagged it as a likely top-five action game revisit.",
        timestamp=_now(7),
        cover_url=CATALOG[3].cover_url,
    ),
    FeedItem(
        id="feed-3",
        activity_type="finished",
        actor_name="Mika Reed",
        actor_handle="@mikareed",
        actor_avatar_url=DIRECTORY["user-3"].avatar_url,
        game_title="Outer Wilds",
        summary="Finished a first playthrough and logged a spoiler-hidden review draft before writing the full reflection.",
        timestamp=_now(16),
        cover_url=CATALOG[2].cover_url,
    ),
]

FEED_REACTIONS: dict[str, set[str]] = {
    "feed-1": {CURRENT_USER.id, "user-2", "user-3"},
    "feed-2": {"user-2"},
    "feed-3": {CURRENT_USER.id, "user-3"},
}

FEED_COMMENTS: dict[str, list[CommentItem]] = {
    "feed-1": [
        CommentItem(
            id="comment-feed-1",
            author_name="Kei Morgan",
            author_handle="@keim",
            author_avatar_url=DIRECTORY["user-2"].avatar_url,
            body="That UI really does look absurdly good in motion.",
            created_at=_now(1),
        )
    ],
    "feed-2": [],
    "feed-3": [],
}

REVIEW_REACTIONS: dict[str, set[str]] = {
    "review-1": {CURRENT_USER.id, "user-2", "user-3"},
    "review-2": {"user-3"},
}

REVIEW_COMMENTS: dict[str, list[CommentItem]] = {
    "review-1": [
        CommentItem(
            id="comment-review-1",
            author_name="Mika Reed",
            author_handle="@mikareed",
            author_avatar_url=DIRECTORY["user-3"].avatar_url,
            body="The political angle is exactly what sold me on it too.",
            created_at=_now(5),
        )
    ],
    "review-2": [],
}

NOTIFICATIONS: dict[str, list[NotificationItem]] = {
    CURRENT_USER.id: [
        NotificationItem(
            id="notification-1",
            title="New follower",
            body="Jonah Vale started following your profile.",
            created_at=_now(4),
            read=False,
        ),
        NotificationItem(
            id="notification-2",
            title="New comment",
            body="Mika Reed commented on your Hades II review.",
            created_at=_now(9),
            read=False,
        ),
    ]
}

PRIVACY_SETTINGS: dict[str, PrivacySettings] = {CURRENT_USER.id: PrivacySettings()}


_MONGO_CLIENT = MongoClient(settings.mongo_url, serverSelectionTimeoutMS=1500, connectTimeoutMS=1500)
_STATE_DOCUMENT_ID = "memory-card-state"


def _mongo_collection():
    try:
        _MONGO_CLIENT.admin.command("ping")
    except PyMongoError:
        return None
    return _MONGO_CLIENT[settings.mongo_database]["app_state"]


def is_mongo_connected() -> bool:
    return _mongo_collection() is not None


def _serialize_state() -> dict[str, Any]:
    return {
        "_id": _STATE_DOCUMENT_ID,
        "catalog": [game.model_dump(mode="json") for game in CATALOG],
        "users": {
            email: {"user": record["user"].model_dump(mode="json"), "password_hash": record["password_hash"]}
            for email, record in USERS.items()
        },
        "tokens": deepcopy(TOKENS),
        "directory": {user_id: item.model_dump(mode="json") for user_id, item in DIRECTORY.items()},
        "following_by_user": {user_id: sorted(list(following)) for user_id, following in FOLLOWING_BY_USER.items()},
        "profile_details": {
            user_id: {
                "tagline": details.get("tagline", ""),
                "favorite_games": deepcopy(details.get("favorite_games", [])),
                "featured_lists": [featured_list.model_dump(mode="json") for featured_list in details.get("featured_lists", [])],
            }
            for user_id, details in PROFILE_DETAILS.items()
        },
        "libraries": {
            user_id: [entry.model_dump(mode="json") for entry in entries]
            for user_id, entries in LIBRARIES.items()
        },
        "review_drafts": {
            user_id: [draft.model_dump(mode="json") for draft in drafts]
            for user_id, drafts in REVIEW_DRAFTS.items()
        },
        "published_reviews": {
            user_id: [review.model_dump(mode="json") for review in reviews]
            for user_id, reviews in PUBLISHED_REVIEWS.items()
        },
        "base_feed": [item.model_dump(mode="json") for item in BASE_FEED],
        "feed_reactions": {item_id: sorted(list(user_ids)) for item_id, user_ids in FEED_REACTIONS.items()},
        "feed_comments": {
            item_id: [comment.model_dump(mode="json") for comment in comments]
            for item_id, comments in FEED_COMMENTS.items()
        },
        "review_reactions": {item_id: sorted(list(user_ids)) for item_id, user_ids in REVIEW_REACTIONS.items()},
        "review_comments": {
            item_id: [comment.model_dump(mode="json") for comment in comments]
            for item_id, comments in REVIEW_COMMENTS.items()
        },
        "notifications": {
            user_id: [notification.model_dump(mode="json") for notification in items]
            for user_id, items in NOTIFICATIONS.items()
        },
        "privacy_settings": {user_id: value.model_dump(mode="json") for user_id, value in PRIVACY_SETTINGS.items()},
    }


def _hydrate_state(document: dict[str, Any]) -> None:
    global CATALOG, USERS, TOKENS, DIRECTORY, FOLLOWING_BY_USER, PROFILE_DETAILS
    global LIBRARIES, REVIEW_DRAFTS, PUBLISHED_REVIEWS, BASE_FEED, FEED_REACTIONS
    global FEED_COMMENTS, REVIEW_REACTIONS, REVIEW_COMMENTS, NOTIFICATIONS, PRIVACY_SETTINGS

    CATALOG = [GameSearchResult.model_validate(item) for item in document.get("catalog", [])]
    USERS = {
        email: {"user": AuthUser.model_validate(record["user"]), "password_hash": record["password_hash"]}
        for email, record in document.get("users", {}).items()
    }
    TOKENS = {token: email for token, email in document.get("tokens", {}).items()}
    DIRECTORY = {
        user_id: DiscoverUser.model_validate(item)
        for user_id, item in document.get("directory", {}).items()
    }
    FOLLOWING_BY_USER = {
        user_id: set(following)
        for user_id, following in document.get("following_by_user", {}).items()
    }
    PROFILE_DETAILS = {
        user_id: {
            "tagline": details.get("tagline", ""),
            "favorite_games": details.get("favorite_games", []),
            "featured_lists": [FeaturedList.model_validate(item) for item in details.get("featured_lists", [])],
        }
        for user_id, details in document.get("profile_details", {}).items()
    }
    LIBRARIES = {
        user_id: [LibraryEntry.model_validate(item) for item in entries]
        for user_id, entries in document.get("libraries", {}).items()
    }
    REVIEW_DRAFTS = {
        user_id: [ReviewDraft.model_validate(item) for item in drafts]
        for user_id, drafts in document.get("review_drafts", {}).items()
    }
    PUBLISHED_REVIEWS = {
        user_id: [ReviewHighlight.model_validate(item) for item in reviews]
        for user_id, reviews in document.get("published_reviews", {}).items()
    }
    BASE_FEED = [FeedItem.model_validate(item) for item in document.get("base_feed", [])]
    FEED_REACTIONS = {
        item_id: set(user_ids)
        for item_id, user_ids in document.get("feed_reactions", {}).items()
    }
    FEED_COMMENTS = {
        item_id: [CommentItem.model_validate(item) for item in comments]
        for item_id, comments in document.get("feed_comments", {}).items()
    }
    REVIEW_REACTIONS = {
        item_id: set(user_ids)
        for item_id, user_ids in document.get("review_reactions", {}).items()
    }
    REVIEW_COMMENTS = {
        item_id: [CommentItem.model_validate(item) for item in comments]
        for item_id, comments in document.get("review_comments", {}).items()
    }
    NOTIFICATIONS = {
        user_id: [NotificationItem.model_validate(item) for item in items]
        for user_id, items in document.get("notifications", {}).items()
    }
    PRIVACY_SETTINGS = {
        user_id: PrivacySettings.model_validate(value)
        for user_id, value in document.get("privacy_settings", {}).items()
    }


def _persist_state() -> None:
    collection = _mongo_collection()
    if collection is None:
        return
    collection.replace_one({"_id": _STATE_DOCUMENT_ID}, _serialize_state(), upsert=True)


def _load_state() -> None:
    collection = _mongo_collection()
    if collection is None:
        return
    document = collection.find_one({"_id": _STATE_DOCUMENT_ID})
    if document is None:
        _persist_state()
        return
    _hydrate_state(document)


def _cache_games(results: list[GameSearchResult]) -> None:
    existing_ids = {game.id for game in CATALOG}
    changed = False
    for game in results:
        if game.id not in existing_ids:
            CATALOG.append(game)
            existing_ids.add(game.id)
            changed = True
    if changed:
        _persist_state()


_load_state()


def _issue_token(email: str) -> str:
    token = uuid4().hex
    TOKENS[token] = email
    return token


def get_user_by_token(token: str) -> AuthUser | None:
    email = TOKENS.get(token)
    record = USERS.get(email) if email else None
    return None if record is None else record["user"]


def _discover_from_auth_user(user: AuthUser) -> DiscoverUser:
    details = PROFILE_DETAILS.setdefault(user.id, {"tagline": "New here.", "favorite_games": [], "featured_lists": []})
    follower_count = sum(1 for following in FOLLOWING_BY_USER.values() if user.id in following)
    return DiscoverUser(
        id=user.id,
        display_name=user.display_name,
        username=user.username,
        shareable_id=user.shareable_id,
        tagline=details["tagline"],
        favorite_games=details["favorite_games"],
        follower_count=follower_count,
        avatar_url=user.avatar_url,
        banner_url=user.banner_url,
        accent_color=user.accent_color,
    )


def _all_directory_users() -> dict[str, DiscoverUser]:
    users = deepcopy(DIRECTORY)
    for record in USERS.values():
        user = record["user"]
        if user.id != CURRENT_USER.id:
            users[user.id] = _discover_from_auth_user(user)
    return users


def _decorate_feed_item(item: FeedItem, user: AuthUser) -> FeedItem:
    reactions = FEED_REACTIONS.setdefault(item.id, set())
    comments = FEED_COMMENTS.setdefault(item.id, [])
    return item.model_copy(
        update={
            "reaction_count": len(reactions),
            "comment_count": len(comments),
            "current_user_reacted": user.id in reactions,
            "comments": comments[-3:],
        }
    )


def _decorate_review(review: ReviewHighlight, user: AuthUser) -> ReviewHighlight:
    reactions = REVIEW_REACTIONS.setdefault(review.id, set())
    comments = REVIEW_COMMENTS.setdefault(review.id, [])
    return review.model_copy(
        update={
            "reaction_count": len(reactions),
            "comment_count": len(comments),
            "current_user_reacted": user.id in reactions,
            "comments": comments[-3:],
        }
    )


def _find_game(game_id: str) -> GameSearchResult:
    game = next((item for item in CATALOG if item.id == game_id), None)
    if game is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found.")
    return game


def _igdb_search(query: str) -> list[GameSearchResult]:
    if not query or not settings.igdb_client_id or not settings.igdb_access_token:
        return []

    payload = (
        f'search "{query.replace(chr(34), "")}"; '
        "fields name,cover.url,platforms.name,first_release_date,summary; limit 10;"
    ).encode("utf-8")
    req = request.Request(
        "https://api.igdb.com/v4/games",
        data=payload,
        headers={
            "Client-ID": settings.igdb_client_id,
            "Authorization": f"Bearer {settings.igdb_access_token}",
            "Content-Type": "text/plain",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=8) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except (error.URLError, TimeoutError, json.JSONDecodeError):
        return []

    results: list[GameSearchResult] = []
    for item in raw:
        results.append(
            GameSearchResult(
                id=f"igdb-{item['id']}",
                title=item.get("name", "Unknown title"),
                platforms=[platform.get("name", "Unknown") for platform in item.get("platforms", [])] or ["Unknown"],
                cover_url=_normalize_cover_url(item.get("cover", {}).get("url") if isinstance(item.get("cover"), dict) else None),
                release_year=datetime.fromtimestamp(item["first_release_date"], UTC).year if item.get("first_release_date") else None,
                summary=item.get("summary"),
            )
        )
    return results


def _steam_search(query: str) -> list[GameSearchResult]:
    if not query:
        return []

    search_url = (
        "https://store.steampowered.com/api/storesearch/"
        f"?term={parse.quote(query)}&l=english&cc=us"
    )
    req = request.Request(search_url, headers={"User-Agent": "MemoryCard/1.0"})
    try:
        with request.urlopen(req, timeout=8) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except (error.URLError, TimeoutError, json.JSONDecodeError):
        return []

    items = raw.get("items", [])
    results: list[GameSearchResult] = []
    for item in items[:8]:
        app_id = item.get("id")
        if not app_id:
            continue
        platforms: list[str] = []
        if item.get("platforms", {}).get("windows"):
            platforms.append("PC")
        if item.get("platforms", {}).get("mac"):
            platforms.append("macOS")
        if item.get("platforms", {}).get("linux"):
            platforms.append("Linux")
        if not platforms:
            platforms.append("PC")
        results.append(
            GameSearchResult(
                id=f"steam-{app_id}",
                title=item.get("name", "Unknown title"),
                platforms=platforms,
                cover_url=_steam_cover(int(app_id), item.get("tiny_image")),
                release_year=None,
                summary=f"Live Steam catalog result{f' · Metascore {item['metascore']}' if item.get('metascore') else ''}.",
            )
        )
    return results


def list_games(query: str) -> list[GameSearchResult]:
    igdb_results = _igdb_search(query)
    if igdb_results:
        _cache_games(igdb_results)
        return igdb_results

    steam_results = _steam_search(query)
    if steam_results:
        _cache_games(steam_results)
        return steam_results

    if not query:
        return deepcopy(CATALOG)
    lowered = query.lower()
    return [game.model_copy(deep=True) for game in CATALOG if lowered in game.title.lower()]


def signup_user(payload: SignupRequest) -> AuthResponse:
    if payload.email in USERS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists.")
    if any(record["user"].username.lower() == payload.username.lower() for record in USERS.values()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists.")

    user = AuthUser(
        id=f"user-{uuid4().hex[:8]}",
        username=payload.username,
        display_name=payload.display_name,
        email=payload.email,
        avatar_url="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80",
        banner_url=_steam_header(2161700),
        shareable_id=_shareable_id(),
        accent_color="#8b5cf6",
    )
    USERS[payload.email] = {"user": user, "password_hash": _hash_password(payload.password)}
    LIBRARIES[user.id] = []
    REVIEW_DRAFTS[user.id] = []
    PUBLISHED_REVIEWS[user.id] = []
    PROFILE_DETAILS[user.id] = {"tagline": "Fresh profile. Ready to log the next obsession.", "favorite_games": [], "featured_lists": []}
    PRIVACY_SETTINGS[user.id] = PrivacySettings()
    FOLLOWING_BY_USER[user.id] = set()
    token = _issue_token(payload.email)
    _persist_state()
    return AuthResponse(access_token=token, user=user)


def login_user(payload: LoginRequest) -> AuthResponse:
    record = USERS.get(payload.email)
    if record is None or not _check_password(payload.password, record["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    token = _issue_token(payload.email)
    _persist_state()
    return AuthResponse(access_token=token, user=record["user"])


def list_discover_users(user: AuthUser, query: str = "") -> list[DiscoverUser]:
    following = FOLLOWING_BY_USER.setdefault(user.id, set())
    all_users = _all_directory_users()
    results: list[DiscoverUser] = []
    for discover_user in all_users.values():
        if discover_user.id == user.id:
            continue
        if query:
            haystack = " ".join([discover_user.display_name, discover_user.username, discover_user.shareable_id]).lower()
            if query.lower() not in haystack:
                continue
        results.append(
            discover_user.model_copy(
                update={
                    "is_following": discover_user.id in following,
                    "follower_count": discover_user.follower_count + (1 if discover_user.id in following else 0),
                }
            )
        )
    return results


def _list_followers(target_user_id: str, viewer: AuthUser) -> list[DiscoverUser]:
    all_users = _all_directory_users()
    follower_ids = [user_id for user_id, followed in FOLLOWING_BY_USER.items() if target_user_id in followed]
    followers: list[DiscoverUser] = []
    for user_id in follower_ids:
        if user_id == viewer.id:
            followers.append(_discover_from_auth_user(viewer))
        elif user_id in all_users:
            followers.append(all_users[user_id])
    return followers


def _list_following(user: AuthUser) -> list[DiscoverUser]:
    discover_map = {item.id: item for item in list_discover_users(user)}
    return [discover_map[user_id] for user_id in FOLLOWING_BY_USER.get(user.id, set()) if user_id in discover_map]


def get_dashboard(user: AuthUser) -> DashboardResponse:
    library = deepcopy(LIBRARIES.get(user.id, []))
    feed = [_decorate_feed_item(item, user) for item in deepcopy(BASE_FEED)]
    reviews = [_decorate_review(review, user) for review in deepcopy(PUBLISHED_REVIEWS.get(user.id, []))]
    return DashboardResponse(
        current_user=user,
        feed=feed,
        discover_users=list_discover_users(user),
        library=library,
        reviews=reviews,
        suggested_games=deepcopy(CATALOG[:4]),
    )


def get_profile(user: AuthUser) -> ProfileResponse:
    details = PROFILE_DETAILS.setdefault(user.id, {"tagline": "", "favorite_games": [], "featured_lists": []})
    library = deepcopy(LIBRARIES.get(user.id, []))
    reviews = [_decorate_review(review, user) for review in deepcopy(PUBLISHED_REVIEWS.get(user.id, []))]
    total_hours = sum(entry.hours_played for entry in library)
    average_score = int(sum(review.total_score for review in reviews) / len(reviews)) if reviews else 0
    return ProfileResponse(
        user=user,
        stats=ProfileStats(
            total_games=len(library),
            total_reviews=len(reviews),
            average_score=average_score,
            total_hours=total_hours,
            followers=len(_list_followers(user.id, user)),
            following=len(FOLLOWING_BY_USER.get(user.id, set())),
        ),
        tagline=details["tagline"],
        favorite_games=details["favorite_games"],
        featured_lists=deepcopy(details["featured_lists"]),
        review_highlights=reviews,
        followers=_list_followers(user.id, user),
        following_users=_list_following(user),
        most_played_games=sorted(library, key=lambda item: item.hours_played, reverse=True)[:5],
    )


def get_privacy_settings(user: AuthUser) -> PrivacySettings:
    return PRIVACY_SETTINGS.setdefault(user.id, PrivacySettings()).model_copy(deep=True)


def update_privacy_settings(user: AuthUser, payload: PrivacySettings) -> PrivacySettings:
    PRIVACY_SETTINGS[user.id] = payload
    _persist_state()
    return payload.model_copy(deep=True)


def update_profile_customization(user: AuthUser, payload: ProfileCustomizationRequest) -> AuthUser:
    record = USERS[user.email]
    updated_user = user.model_copy(
        update={
            "avatar_url": payload.avatar_url,
            "banner_url": payload.banner_url,
            "accent_color": payload.accent_color,
        }
    )
    record["user"] = updated_user
    PROFILE_DETAILS.setdefault(user.id, {"featured_lists": []}).update(
        {
            "tagline": payload.tagline,
            "favorite_games": payload.favorite_games,
        }
    )
    _persist_state()
    return updated_user


def create_featured_list(user: AuthUser, payload: FeaturedListCreateRequest) -> FeaturedList:
    profile = PROFILE_DETAILS.setdefault(user.id, {"tagline": "", "favorite_games": [], "featured_lists": []})
    new_list = FeaturedList(id=f"list-{uuid4().hex[:8]}", title=payload.title, description=payload.description, items=payload.items)
    profile["featured_lists"].insert(0, new_list)
    _persist_state()
    return new_list.model_copy(deep=True)


def delete_featured_list(user: AuthUser, list_id: str) -> None:
    profile = PROFILE_DETAILS.setdefault(user.id, {"tagline": "", "favorite_games": [], "featured_lists": []})
    profile["featured_lists"] = [featured_list for featured_list in profile["featured_lists"] if featured_list.id != list_id]
    _persist_state()


def submit_custom_game(payload: SubmitGameRequest) -> dict[str, Any]:
    game = GameSearchResult(
        id=f"game-{uuid4().hex[:8]}",
        title=payload.title,
        platforms=payload.platforms or ["TBD"],
        cover_url=_steam_cover(1245620),
        summary="Community-submitted title awaiting moderation.",
    )
    CATALOG.append(game)
    _persist_state()
    return {"message": "Custom game submission accepted for moderation.", "submitted": game.model_dump(mode="json"), "profanity_filter": "enabled"}


def list_library(user: AuthUser) -> list[LibraryEntry]:
    return deepcopy(LIBRARIES.get(user.id, []))


def add_library_entry(user: AuthUser, payload: AddLibraryEntryRequest) -> LibraryEntry:
    game = _find_game(payload.game_id)
    entries = LIBRARIES.setdefault(user.id, [])
    if any(entry.game_id == payload.game_id and entry.platform == payload.platform for entry in entries):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Game is already in your library for that platform.")
    entry = LibraryEntry(
        id=f"library-{uuid4().hex[:8]}",
        game_id=game.id,
        game_title=game.title,
        status=payload.status,
        platform=payload.platform,
        hours_played=0,
        playthroughs=0,
        progress_percent=0,
        cover_url=game.cover_url,
        note="Added from search.",
    )
    entries.insert(0, entry)
    _persist_state()
    return entry.model_copy(deep=True)


def update_library_entry(user: AuthUser, entry_id: str, payload: UpdateLibraryEntryRequest) -> LibraryEntry:
    entry = next((item for item in LIBRARIES.setdefault(user.id, []) if item.id == entry_id), None)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library entry not found.")
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(entry, key, value)
    _persist_state()
    return entry.model_copy(deep=True)


def list_review_drafts(user: AuthUser) -> list[ReviewDraft]:
    return deepcopy(REVIEW_DRAFTS.setdefault(user.id, []))


def save_review_draft(user: AuthUser, draft_id: str | None, payload: ReviewDraftUpdateRequest) -> ReviewDraft:
    game = _find_game(payload.game_id)
    drafts = REVIEW_DRAFTS.setdefault(user.id, [])
    if draft_id is None:
        draft = ReviewDraft(
            id=f"draft-{uuid4().hex[:8]}",
            game_id=game.id,
            game_title=game.title,
            game_cover_url=game.cover_url,
            verdict=payload.verdict,
            body=payload.body,
            scores=payload.scores,
            total_score=payload.total_score,
            updated_at=_now(),
            spoiler=payload.spoiler,
        )
        drafts.insert(0, draft)
        _persist_state()
        return draft.model_copy(deep=True)

    draft = next((item for item in drafts if item.id == draft_id), None)
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found.")
    draft.game_id = game.id
    draft.game_title = game.title
    draft.game_cover_url = game.cover_url
    draft.verdict = payload.verdict
    draft.body = payload.body
    draft.scores = payload.scores
    draft.total_score = payload.total_score
    draft.spoiler = payload.spoiler
    draft.updated_at = _now()
    _persist_state()
    return draft.model_copy(deep=True)


def publish_review_draft(user: AuthUser, draft_id: str) -> ReviewHighlight:
    draft = next((item for item in REVIEW_DRAFTS.setdefault(user.id, []) if item.id == draft_id), None)
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found.")
    draft.published = True
    review = ReviewHighlight(
        id=f"review-{uuid4().hex[:8]}",
        game_id=draft.game_id,
        game_title=draft.game_title,
        title=draft.verdict,
        verdict=draft.body[:160],
        body=draft.body,
        total_score=draft.total_score,
        spoiler=draft.spoiler,
        cover_url=draft.game_cover_url,
    )
    PUBLISHED_REVIEWS.setdefault(user.id, []).insert(0, review)
    REVIEW_REACTIONS[review.id] = set()
    REVIEW_COMMENTS[review.id] = []
    _persist_state()
    return _decorate_review(review, user)


def delete_review(user: AuthUser, review_id: str) -> None:
    reviews = PUBLISHED_REVIEWS.setdefault(user.id, [])
    PUBLISHED_REVIEWS[user.id] = [review for review in reviews if review.id != review_id]
    REVIEW_REACTIONS.pop(review_id, None)
    REVIEW_COMMENTS.pop(review_id, None)
    _persist_state()


def react_to_feed(user: AuthUser, feed_id: str) -> FeedItem:
    item = next((feed_item for feed_item in BASE_FEED if feed_item.id == feed_id), None)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feed item not found.")
    reactions = FEED_REACTIONS.setdefault(feed_id, set())
    if user.id in reactions:
        reactions.remove(user.id)
    else:
        reactions.add(user.id)
    _persist_state()
    return _decorate_feed_item(item, user)


def comment_on_feed(user: AuthUser, feed_id: str, payload: CommentCreateRequest) -> FeedItem:
    item = next((feed_item for feed_item in BASE_FEED if feed_item.id == feed_id), None)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feed item not found.")
    FEED_COMMENTS.setdefault(feed_id, []).append(_make_comment(user, payload.body))
    _persist_state()
    return _decorate_feed_item(item, user)


def react_to_review(user: AuthUser, review_id: str) -> ReviewHighlight:
    review = next((item for item in PUBLISHED_REVIEWS.setdefault(user.id, []) if item.id == review_id), None)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")
    reactions = REVIEW_REACTIONS.setdefault(review_id, set())
    if user.id in reactions:
        reactions.remove(user.id)
    else:
        reactions.add(user.id)
    _persist_state()
    return _decorate_review(review, user)


def comment_on_review(user: AuthUser, review_id: str, payload: CommentCreateRequest) -> ReviewHighlight:
    review = next((item for item in PUBLISHED_REVIEWS.setdefault(user.id, []) if item.id == review_id), None)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")
    REVIEW_COMMENTS.setdefault(review_id, []).append(_make_comment(user, payload.body))
    _persist_state()
    return _decorate_review(review, user)


def list_notifications(user: AuthUser) -> list[NotificationItem]:
    return deepcopy(NOTIFICATIONS.setdefault(user.id, []))


def follow_user(user: AuthUser, user_id: str) -> None:
    FOLLOWING_BY_USER.setdefault(user.id, set()).add(user_id)
    _persist_state()


def unfollow_user(user: AuthUser, user_id: str) -> None:
    FOLLOWING_BY_USER.setdefault(user.id, set()).discard(user_id)
    _persist_state()
