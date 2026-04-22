import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { TopNav } from "./components/TopNav";
import {
  DiscoverPage,
  FeedPage,
  LibraryPage,
  NotificationsPage,
  ProfilePage,
  ReviewStudioPage,
  SettingsPage,
} from "./pages/AppPages";
import { AuthPage } from "./pages/AuthPages";
import { LandingPage } from "./pages/LandingPage";
import { AuthProvider, useAuth } from "./lib/auth";
import { AppDataProvider } from "./lib/app-data";

function ProtectedShell() {
  const { user, ready } = useAuth();

  if (!ready) {
    return <main className="auth-shell">Loading session...</main>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppDataProvider>
      <div className="app-shell">
        <TopNav />
        <main className="content-shell">
          <Outlet />
        </main>
      </div>
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/app" element={<ProtectedShell />}>
            <Route index element={<Navigate to="/app/feed" replace />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="review-studio" element={<ReviewStudioPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

