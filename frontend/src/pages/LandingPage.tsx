import { Link } from "react-router-dom";
import { landingCoverArt } from "../lib/presets";

export function LandingPage() {
  return (
    <main className="landing-shell landing-shell--enhanced">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Memory Card</p>
          <h1>Give every game a better memory.</h1>
          <p className="hero-text">
            Track playtime, rank favorites, build custom lists, publish deep ten-category reviews, and
            follow people whose taste actually matters to you.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="primary-button">
              Create account
            </Link>
            <Link to="/login" className="ghost-button">
              Log in
            </Link>
          </div>
          <div className="landing-auth-strip">
            <span>New here?</span>
            <Link to="/signup">Start your profile</Link>
            <span>Already joined?</span>
            <Link to="/login">Sign in instantly</Link>
          </div>
          <div className="hero-badges">
            <span>10 category scoring</span>
            <span>custom profiles</span>
            <span>lists and rankings</span>
            <span>followers and feed</span>
          </div>
        </div>

        <div className="landing-media">
          <div className="moving-grid">
            {landingCoverArt.concat(landingCoverArt).map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="moving-grid__cell"
                style={{ backgroundImage: `url(${image})`, animationDelay: `${index * 0.8}s` }}
              />
            ))}
          </div>
          <div className="landing-overlay-card">
            <p className="eyebrow">What it feels like</p>
            <h2>A premium gaming journal with social momentum.</h2>
            <p>
              Rich profile identity, game art everywhere, real discovery, and a feed built around meaningful
              updates instead of empty noise.
            </p>
          </div>
        </div>
      </section>

      <section className="feature-grid feature-grid--wide">
        <article className="feature-card">
          <h2>Profiles worth showing off</h2>
          <p>Banner art, avatar, accent color, favorite games, featured lists, rankings, and game-time charts.</p>
        </article>
        <article className="feature-card">
          <h2>Actual game-centric reviews</h2>
          <p>Select a real game, score it across ten categories, save drafts, publish, react, and discuss.</p>
        </article>
        <article className="feature-card">
          <h2>Discovery that is useful</h2>
          <p>Search for people, follow them, browse suggested games, and build a feed around shared taste.</p>
        </article>
      </section>
    </main>
  );
}
