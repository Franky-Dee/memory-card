import { NavLink } from "react-router-dom";

import { useAppData } from "../lib/app-data";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/app/feed", label: "Feed" },
  { to: "/app/discover", label: "Discover" },
  { to: "/app/library", label: "Library" },
  { to: "/app/review-studio", label: "Reviews" },
  { to: "/app/profile", label: "Profile" },
];

function MemoryCardIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="6" y="8" width="36" height="32" rx="10" fill="rgba(255,255,255,0.14)" />
      <rect x="11" y="13" width="26" height="22" rx="7" fill="rgba(9,8,17,0.55)" stroke="rgba(255,255,255,0.2)" />
      <rect x="16" y="18" width="6" height="12" rx="3" fill="white" />
      <rect x="13" y="21" width="12" height="6" rx="3" fill="white" />
      <circle cx="31" cy="21" r="3" fill="#f5d0fe" />
      <circle cx="35" cy="27" r="3" fill="#c4b5fd" />
      <path d="M18 8V4m12 4V4" stroke="rgba(255,255,255,0.65)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18H5.5a1.5 1.5 0 0 1-1.1-2.52c1.37-1.48 2.1-3.44 2.1-5.45v-.53a5.5 5.5 0 1 1 11 0v.53c0 2.01.73 3.97 2.1 5.45A1.5 1.5 0 0 1 18.5 18H15Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function TopNav() {
  const { user, logout } = useAuth();
  const { notifications } = useAppData();
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <header className="shell-header">
      <NavLink to="/app/feed" className="brand-lockup" aria-label="Memory Card home">
        <div className="brand-mark">
          <MemoryCardIcon />
        </div>
        <div>
          <p className="eyebrow">Memory Card</p>
        </div>
      </NavLink>

      <nav className="shell-nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "top-nav__link top-nav__link--active" : "top-nav__link")}
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="shell-actions">
        <NavLink to="/app/notifications" className="notification-bell" aria-label="Notifications">
          <BellIcon />
          {unreadCount > 0 ? <span className="notification-bell__dot" /> : null}
        </NavLink>
        <NavLink to="/app/profile" className="profile-chip profile-chip--rich">
          <img src={user?.avatar_url} alt={user?.display_name} className="avatar avatar--small" />
          <div>
            <strong>{user?.display_name ?? "Player One"}</strong>
            <span>{user?.shareable_id ?? "MC-4F9C"}</span>
          </div>
        </NavLink>
        <button className="ghost-button ghost-button--compact" type="button" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
