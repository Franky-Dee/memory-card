import { Link } from "react-router-dom";

import { landingCoverArt } from "../lib/presets";

const artColumns = [
  landingCoverArt,
  [...landingCoverArt.slice(2), ...landingCoverArt.slice(0, 2)],
  [...landingCoverArt.slice(4), ...landingCoverArt.slice(0, 4)],
];

export function LandingPage() {
  return (
    <main className="landing-shell landing-shell--enhanced">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Memory Card</p>
          <h1>Give every game a better memory.</h1>
          <p className="hero-text">
            Track playtime, rank favorites, build custom lists, publish deep ten-category reviews, and follow
            people whose taste actually matters to you.
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
            <span>emoji reactions</span>
            <span>lists and rankings</span>
            <span>social discovery</span>
          </div>
        </div>

        <div className="landing-media landing-media--river">
          <div className="art-river" aria-hidden="true">
            {artColumns.map((column, columnIndex) => (
              <div key={`lane-${columnIndex}`} className="art-column">
                <div className="art-column__track" style={{ animationDuration: `${20 + columnIndex * 4}s` }}>
                  {[...column, ...column].map((image, index) => (
                    <div key={`${image}-${columnIndex}-${index}`} className="moving-grid__cell art-tile">
                      <img src={image} alt="" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="landing-overlay-card">
            <p className="eyebrow">What it feels like</p>
            <h2>A premium gaming journal with social momentum.</h2>
            <p>
              Rich profile identity, game art everywhere, reactions that feel alive, and a feed built around
              meaningful updates instead of empty noise.
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
          <p>Browse people, discover community posts, and move through a game graph that keeps pulling you forward.</p>
        </article>
      </section>
    </main>
  );
}
