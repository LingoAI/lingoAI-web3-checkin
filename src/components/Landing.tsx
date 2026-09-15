import type { CSSProperties } from 'react';

export function Landing({ onCheckin, onMotion, motionLabel }: { onCheckin: () => void; onMotion: () => void; motionLabel: string }) {
  return (<>

  <canvas id="space-canvas" aria-hidden="true"></canvas>
  <a className="skip-link" href="#main">Skip to main content</a>
  <header className="site-header">
    <a className="brand" href="#product" aria-label="Holon home"><img className="brand-symbol" src="assets/holon-logo.svg" alt="" width="30" height="30" /><span translate="no">Holon</span></a>
    <nav className="main-nav" aria-label="Main navigation"><a href="#product" aria-current="location">Product</a><a href="#community">Community</a></nav>
    <button className="button checkin-button nav-checkin" data-checkin onClick={onCheckin}><span>Check in</span></button>
  </header>
  <main id="main">
    <div className="story" id="product">
      <div className="visual-track" aria-hidden="true">
      <div className="visual-stage">
        <div className="ambient ambient-a"></div><div className="ambient ambient-b"></div>
        <canvas id="particle-canvas"></canvas>
        <div className="particle-fallback"><img src="assets/holon-logo.svg" alt="" /></div>
        <div className="stage-vignette"></div>
      </div>
      </div>

      <section className="story-section hero" aria-labelledby="hero-title" data-scene="0" data-label="PERSONAL AI TWIN">
        <div className="hero-heading">
          <h1 id="hero-title" className="intro-in">Your personal AI twin,<br /><span>growing with you.</span></h1>
          <p className="hero-subtitle intro-in">Connect your conversations, memories, and knowledge to build a personal AI that understands you. Powered by your knowledge graph, with your data in your hands.</p>
          <div className="hero-actions intro-in"><a className="button button-light" href="#knowledge">Explore Holon</a><button className="button checkin-button" data-checkin onClick={onCheckin}><span>Check in</span></button></div>
        </div>
        <div className="scene-art" aria-hidden="true"></div>
      </section>

      <section className="story-section feature-section knowledge-section" id="knowledge" aria-labelledby="knowledge-title" data-scene="1" data-art-side="left" data-label="PERSONAL KNOWLEDGE GRAPH">
        <div className="feature-heading reveal">
          <h2 id="knowledge-title">Personal knowledge graph</h2>
          <p className="feature-description">Connect scattered conversations, experiences, and ideas into a knowledge graph of your own. Turn isolated information into connections that help your personal AI understand you.</p>
        </div>
        <div className="scene-art" aria-hidden="true"></div>
        <div className="section-divider" aria-hidden="true"></div>
      </section>

      <section className="story-section feature-section memory-section" id="memory" aria-labelledby="memory-title" data-scene="2" data-art-side="left" data-label="LONG-TERM MEMORY">
        <div className="feature-heading reveal">
          <h2 id="memory-title">Long-term memory</h2>
          <p className="feature-description">Keep the context of meaningful experiences and conversations. Build on the moments that matter, so each new conversation begins with understanding and a sense of continuity.</p>
        </div>
        <div className="scene-art" aria-hidden="true"></div>
        <div className="section-divider" aria-hidden="true"></div>
      </section>

      <section className="story-section feature-section language-section" id="language" aria-labelledby="language-title" data-scene="3" data-label="MULTILINGUAL INTERACTION">
        <div className="feature-heading reveal">
          <h2 id="language-title">Multilingual interaction</h2>
          <p className="feature-description">Express yourself in the languages you know and talk naturally with your personal AI. Bring every way you communicate into your knowledge and memories.</p>
        </div>
        <div className="scene-art" aria-hidden="true"></div>
        <div className="section-divider" aria-hidden="true"></div>
      </section>

      <section className="story-section feature-section ownership-section" id="ownership" aria-labelledby="ownership-title" data-scene="4" data-label="DATA SOVEREIGNTY">
        <div className="feature-heading reveal">
          <h2 id="ownership-title">Your data, your control</h2>
          <p className="feature-description">Keep control of your data through your personal knowledge graph. Build an AI centered on you, shaped by your knowledge, memories, and choices.</p>
        </div>
        <div className="scene-art" aria-hidden="true"></div>
        <div className="section-divider" aria-hidden="true"></div>
      </section>
    </div>

    <section className="community" id="community" aria-labelledby="community-title">
      <div className="community-background" aria-hidden="true">
        <div className="community-aura"></div><div className="community-aura community-aura-cool"></div>
        <div className="community-ripples"><i></i><i></i><i></i></div>
        <div className="community-orbits"><div className="community-orbit-plane"><i><span></span></i><i><span></span></i><i><span></span></i><i><span></span></i></div></div>
        <div className="community-sparks">
          <i style={{'--x':'12%','--y':'32%','--delay':'-2s','--duration':'13s'} as CSSProperties}></i><i style={{'--x':'21%','--y':'62%','--delay':'-8s','--duration':'17s'} as CSSProperties}></i>
          <i style={{'--x':'9%','--y':'77%','--delay':'-5s','--duration':'15s'} as CSSProperties}></i><i style={{'--x':'30%','--y':'83%','--delay':'-11s','--duration':'19s'} as CSSProperties}></i>
          <i style={{'--x':'76%','--y':'33%','--delay':'-7s','--duration':'16s'} as CSSProperties}></i><i style={{'--x':'84%','--y':'56%','--delay':'-3s','--duration':'14s'} as CSSProperties}></i>
          <i style={{'--x':'91%','--y':'75%','--delay':'-12s','--duration':'18s'} as CSSProperties}></i><i style={{'--x':'70%','--y':'86%','--delay':'-6s','--duration':'15s'} as CSSProperties}></i>
          <i style={{'--x':'15%','--y':'90%','--delay':'-9s','--duration':'18s'} as CSSProperties}></i><i style={{'--x':'26%','--y':'17%','--delay':'-4s','--duration':'14s'} as CSSProperties}></i>
          <i style={{'--x':'78%','--y':'18%','--delay':'-10s','--duration':'17s'} as CSSProperties}></i><i style={{'--x':'89%','--y':'91%','--delay':'-1s','--duration':'13s'} as CSSProperties}></i>
        </div>
      </div>
      <div className="community-layout">
        <div className="reveal"><h2 id="community-title">Check in to support <span translate="no">Holon</span>.</h2><p className="community-copy">Check in to help the Holon community stay active and support its growth.</p></div>
        <div className="community-action reveal"><button className="button checkin-button" data-checkin onClick={onCheckin}><span>Check in</span></button></div>
      </div>
    </section>

  </main>
  <footer className="site-footer"><div className="footer-main"><button className="motion-toggle" onClick={onMotion}>{motionLabel}</button><a className="back-top" href="#product">Back to top</a></div><div className="footer-meta"><span>© 2026 Holon</span><span>KNOWLEDGE. MEMORY. YOU.</span></div></footer>


  </>);
}
