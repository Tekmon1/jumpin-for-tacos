const xUrl = "https://x.com/TravisKingX";

const worlds = [
  {
    number: "1",
    name: "Sunset Salsa",
    blurb: "Spicy sunsets, bouncy platforms, and backyard fiestas where the adventure begins.",
    image: "/assets/jft-world-sunset-v4.webp",
    alt: "A painted sunset desert filled with mesas, cactus, bunting, and floating platforms",
    accent: "sunset",
    levels: [
      { number: "1-1", name: "Sunset Salsa Run", href: "/game/" },
      { number: "1-2", name: "Sky-High Salsa Rescue", href: "/game/level1-2" },
      { number: "1-3", name: "Sunset Salsa Showdown", href: "/game/level1-3" },
    ],
  },
  {
    number: "2",
    name: "Coconut Crunch Cove",
    blurb: "Tropical treats, tiki beats, and crunchy challenges served with island energy.",
    image: "/assets/jft-world-cove-v4.webp",
    alt: "A painted tropical cove with waterfalls, palm trees, island cliffs, and a taco truck",
    accent: "cove",
    levels: [
      { number: "2-1", name: "Coconut Crunch Cove", href: "/game/level2" },
      { number: "2-2", name: "Campfire Caldera Caper", href: "/game/level2-2" },
      { number: "2-3", name: "Neon Neckties: Turn the Sunset Up", href: "/game/level2-3" },
    ],
  },
  {
    number: "3",
    name: "Starlight Taco Carnival",
    blurb: "Float among the clouds, ride the midway, and shine in a cosmic taco celebration.",
    image: "/assets/jft-world-starlight-v4.webp",
    alt: "A painted purple and blue carnival city floating among clouds and stars",
    accent: "starlight",
    levels: [
      { number: "3-1", name: "Cloudtop Carnival Kickoff", href: "/game/level3" },
      { number: "3-2", name: "Midnight Midway Mayhem", href: "/game/level3-2" },
      { number: "3-3", name: "Taco Nova Firework Finale", href: "/game/level3-3" },
    ],
  },
];

const controls = [
  { icon: "✥", title: "Move", detail: "Arrow keys, A/D, stick, or touch" },
  { icon: "↟", title: "Jump", detail: "Space, W, controller A, or touch" },
  { icon: "🌮", title: "Collect", detail: "Build Taco Power" },
  { icon: "⚑", title: "Fiesta", detail: "Reach the finish" },
];

const faqs = [
  {
    question: "Is it free?",
    answer: "Yes. All nine current levels are free to play in your browser with no account or download.",
  },
  {
    question: "Does it work on iPhone?",
    answer: "Yes. Turn your iPhone sideways and use the touch controls. Adding it to your Home Screen gives you the roomiest app-style view.",
  },
  {
    question: "Can I use a controller?",
    answer: "Yes. Xbox and other standard gamepads work on supported computers and iPhones. Keyboard and touch controls are included too.",
  },
  {
    question: "How many levels?",
    answer: "Nine playable levels across three complete worlds, from Sunset Salsa to the Starlight Taco Carnival.",
  },
  {
    question: "Who made the game?",
    answer: "Jumpin’ For Tacos is a family-made browser adventure created by Travis and Olivia, with plenty of creative help from both sides of the taco truck.",
  },
];

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero" id="top" aria-labelledby="hero-title">
        <img
          className="hero-art"
          src="/assets/jft-landing-hero-v4.webp"
          alt="A painted Jumpin’ For Tacos adventure spanning a sunset desert, tropical cove, and starlight carnival, with Taco Hero and Olivia"
          fetchPriority="high"
        />
        <div className="hero-shade" aria-hidden="true" />

        <header className="topbar">
          <a className="brand" href="#top" aria-label="Jumpin’ For Tacos home">
            <span className="brand-taco" aria-hidden="true">🌮</span>
            <strong>Jumpin’ For Tacos</strong>
          </a>
          <nav aria-label="Primary navigation">
            <a className="nav-play" href="/game/">Play now</a>
            <a href="#worlds">Levels</a>
            <a href="#how-to-play">How to play</a>
            <a href="#about">About</a>
          </nav>
        </header>

        <div className="hero-copy">
          <p className="hero-ribbon">Free browser platformer <span>•</span> 9 playable levels</p>
          <h1 id="hero-title"><span>Jumpin’</span><span>For Tacos</span></h1>
          <p className="hero-subtitle">A Taco-Collecting Adventure</p>
          <p className="hero-deck">Run, jump, bounce, and collect glorious tacos across three colorful worlds in a family-made adventure by Travis and Olivia.</p>
          <div className="hero-actions">
            <a className="button button-gold" href="/game/"><span aria-hidden="true">▶</span> Start World 1-1</a>
            <a className="button button-purple" href="#worlds"><span aria-hidden="true">🗺</span> Choose a Level</a>
          </div>
          <div className="play-options" aria-label="Ways to play">
            <span><b aria-hidden="true">☁</b>No download</span>
            <span><b aria-hidden="true">☝</b>Touch controls</span>
            <span><b aria-hidden="true">⌨</b>Keyboard</span>
            <span><b aria-hidden="true">🎮</b>Xbox controller</span>
          </div>
          <p className="made-by"><span aria-hidden="true">♥</span> Made by <strong>Travis + Olivia</strong></p>
        </div>
      </section>

      <section className="adventure-section" id="worlds" aria-labelledby="worlds-title">
        <div className="ornament-heading">
          <span aria-hidden="true">❧</span>
          <div><h2 id="worlds-title">Adventure Map</h2><p>Three worlds. Maximum crunch.</p></div>
          <span aria-hidden="true">❧</span>
        </div>

        <div className="world-grid">
          {worlds.map((world) => (
            <article className={`world-card world-card-${world.accent}`} key={world.number}>
              <div className="world-art">
                <img src={world.image} alt={world.alt} loading="lazy" />
                <span className="level-count">3 playable levels</span>
              </div>
              <div className="world-copy">
                <h3>{world.name}</h3>
                <p>{world.blurb}</p>
                <div className="level-list" aria-label={`${world.name} levels`}>
                  {world.levels.map((level) => (
                    <a href={level.href} key={level.number}>
                      <span aria-hidden="true">▶</span><b>{level.number}</b><em>{level.name}</em>
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="controls-section" id="how-to-play" aria-labelledby="controls-title">
        <div className="ornament-heading compact">
          <span aria-hidden="true">❧</span><h2 id="controls-title">How to Play</h2><span aria-hidden="true">❧</span>
        </div>
        <div className="controls-grid">
          {controls.map((control) => (
            <div className="control-card" key={control.title}>
              <span className="control-icon" aria-hidden="true">{control.icon}</span>
              <h3>{control.title}</h3>
              <p>{control.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="story-faq-section" id="about">
        <article className="story-panel">
          <div className="story-copy">
            <p className="panel-kicker">Behind the tacos</p>
            <h2>A small game with a very big appetite.</h2>
            <p>Jumpin’ For Tacos is an original family-made browser platformer created by Travis and Olivia. It began with one joyful sunset run and keeps growing into new levels, worlds, characters, jokes, music, and increasingly ridiculous taco emergencies.</p>
            <div className="story-actions">
              <a className="button button-gold" href="/game/">Begin the Adventure</a>
              <a className="button button-dark" href={xUrl} target="_blank" rel="noreferrer">𝕏 &nbsp; Follow Travis on X</a>
            </div>
          </div>
          <figure className="story-art">
            <img src="/assets/jft-about-travis-olivia-v4.webp" alt="A warm painted scene of Olivia, Taco Hero, a sketchbook, and a tiny taco truck" loading="lazy" />
            <figcaption>Travis + Olivia <span aria-hidden="true">♥</span></figcaption>
          </figure>
        </article>

        <aside className="faq-panel" aria-labelledby="faq-title">
          <p className="panel-kicker">Frequently asked questions</p>
          <h2 id="faq-title">Taco questions, answered.</h2>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary><span aria-hidden="true">★</span>{faq.question}<b aria-hidden="true">⌄</b></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </aside>
      </section>

      <section className="soundtrack-section" aria-labelledby="soundtrack-title">
        <div><span aria-hidden="true">♫</span><p><b id="soundtrack-title">Play the theme</b><small>A little road music while you choose your next level.</small></p></div>
        <audio controls preload="none" src="/assets/jump-for-tacos.mp3">Your browser does not support the soundtrack player.</audio>
      </section>

      <footer className="site-footer">
        <p><strong>Free to play in your browser</strong><span>•</span>Made by <b>Travis + Olivia</b><span aria-hidden="true">♥</span></p>
        <nav aria-label="Footer navigation">
          <a href="/game/">Play</a><a href="#worlds">Levels</a><a href="#how-to-play">Controls</a><a href="#about">About</a><a href={xUrl} target="_blank" rel="noreferrer">Travis on X ↗</a>
        </nav>
        <small>© 2026 Jumpin’ For Tacos. All rights reserved.</small>
      </footer>
    </main>
  );
}
