import { NavLink } from "react-router-dom";

import { useAppData } from "../lib/app-data";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/app/feed", label: "Feed" },
  { to: "/app/discover", label: "Discover" },
  { to: "/app/library", label: "Library" },
  { to: "/app/review-studio", label: "Reviews" },
  { to: "/app/profile", label: "Profile" },
  { to: "/app/notifications", label: "Notifications" },
  { to: "/app/settings", label: "Settings" },
];

export function TopNav() {
  const { user, logout } = useAuth();
  const { notifications } = useAppData();
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <header className="shell-header">
      <div className="brand-lockup">
        <div className="brand-mark">MC</div>
        <div>
          <p className="eyebrow">Memory Card</p>
          <strong>Track, rank, and share your gaming life.</strong>
        </div>
      </div>

      <nav className="shell-nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "nav-pill nav-pill--active" : "nav-pill")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="shell-actions">
        <NavLink to="/app/notifications" className="notification-chip">
          <span>Inbox</span>
          <strong>{unreadCount}</strong>
        </NavLink>
        <div className="profile-chip profile-chip--rich">
          <img src={user?.avatar_url} alt={user?.display_name} className="avatar avatar--small" />
          <div>
            <strong>{user?.display_name ?? "Player One"}</strong>
            <span>{user?.shareable_id ?? "MC-4F9C"}</span>
          </div>
        </div>
        <button className="ghost-button" type="button" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
