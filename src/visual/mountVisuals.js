import { createLingoParticles } from './particles.js';
import { createLingoSpace } from './space.js';

export function mountVisuals(getSettings) {
  const abort = new AbortController();
  const observers = [];
  const listen = (target, event, fn, options = {}) => target.addEventListener(event, fn, {...options, signal: abort.signal});
  const root = document.documentElement;
  const story = document.querySelector('.story');
  const community = document.getElementById('community');
  const roadmap = document.getElementById('roadmap');
  let roadmapVisible = false;
  const stage = document.querySelector('.visual-stage');
  const canvas = document.getElementById('particle-canvas');
  const spaceCanvas = document.getElementById('space-canvas');

  const reduced = { get matches() { return getSettings().reduced; } };
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const mobile = matchMedia('(max-width: 700px)');
  let particles = null, space = null, stageVisible = true, communityVisible = true, layout = [], textBlocks = [], stageHeight = 1, stageWidth = 1, stageLeft = 0, storyTop = 0, storyBottom = 0, scrollFrame = 0;
  let artBoxes = [];
  const sections = [...document.querySelectorAll('.story-section[data-scene]')];
  const dividerElements = [...document.querySelectorAll('.section-divider,.footer-meta')];
  let dividers = [];
  let activeScene = -1;
  const smoothstep = (a, b, value) => { const t = Math.max(0, Math.min(1, (value - a) / (b - a))); return t * t * (3 - 2 * t); };
  function canAnimate() { return !reduced.matches && !document.hidden && stageVisible && !getSettings().paused; }
  function syncMotion() {
    const allowed = canAnimate();
    root.classList.toggle('motion-paused', reduced.matches);
    root.classList.toggle('art-sleeping', !allowed);
    root.classList.toggle('controls-sleeping', reduced.matches || document.hidden || getSettings().paused);
    // The community background keeps moving after the particle stage leaves view.
    root.classList.toggle('community-sleeping', reduced.matches || document.hidden || !communityVisible || getSettings().paused);
    root.classList.toggle('roadmap-sleeping', reduced.matches || document.hidden || !roadmapVisible || getSettings().paused);
    particles?.setRunning(allowed);
    space?.setReducedMotion(reduced.matches);
    space?.setRunning(!reduced.matches && !document.hidden && !getSettings().paused);
  }
  function measure() {
    const storyRect = story.getBoundingClientRect();
    storyTop = storyRect.top + scrollY; storyBottom = storyRect.bottom + scrollY;
    layout = sections.map(el => el.getBoundingClientRect().top + scrollY);
    textBlocks = sections.map(section => {
      const heading = section.querySelector('.hero-heading,.feature-heading');
      const rect = heading.getBoundingClientRect();
      // Measure the resting content box, excluding top padding and reveal transforms.
      const top = section.getBoundingClientRect().top + scrollY + heading.offsetTop;
      return {left: rect.left, right: rect.right, top: top + parseFloat(getComputedStyle(heading).paddingTop), bottom: top + heading.offsetHeight};
    });
    artBoxes = sections.map(section => {
      const rect = section.querySelector('.scene-art').getBoundingClientRect();
      return {x: rect.left + rect.width / 2, y: rect.top + scrollY + rect.height / 2, width: rect.width, height: rect.height};
    });
    const canvasRect = canvas.getBoundingClientRect();
    stageHeight = canvasRect.height || 1; stageWidth = canvasRect.width || 1; stageLeft = canvasRect.left;
    dividers = dividerElements.map(element => ({element, top: element.getBoundingClientRect().top + scrollY, opacity: -1}));
    const otherReadingZones = [...document.querySelectorAll('.site-header,.roadmap-inner,.community-layout,.back-top,.footer-meta')].map(element => {
      const rect = element.getBoundingClientRect(), fixed = element.classList.contains('site-header');
      const offset = fixed ? 0 : scrollY;
      return {left: rect.left, right: rect.right, top: rect.top + offset, bottom: rect.bottom + offset, fixed};
    });
    space?.setReadingZones([...textBlocks, ...otherReadingZones]);
    space?.resize();
    particles?.resize();
    updateScroll();
  }
  function updateScroll() {
    scrollFrame = 0;
    const y = scrollY;
    space?.setScroll(y);
    // Fade the line and its glow as the chapter leaves; reverse scrolling retraces the same values.
    // Only opacity changes, including with reduced motion. Positions are cached during measurement.
    const viewportHeight = innerHeight;
    dividers.forEach(divider => {
      const position = divider.top - y;
      const entering = 1 - smoothstep(viewportHeight - 8, viewportHeight + 32, position);
      const leaving = smoothstep(viewportHeight * .18, viewportHeight * .76, position);
      const opacity = (entering * leaving).toFixed(3);
      if (opacity !== divider.opacity) {
        divider.element.style.setProperty('--divider-opacity', opacity);
        divider.opacity = opacity;
      }
    });
    // Keep the transition near the next chapter even when enlarged text extends a section.
    let value = 0;
    for (let i = 0; i < layout.length - 1; i++) {
      value += smoothstep(layout[i + 1] - stageHeight * .52, layout[i + 1] - stageHeight * .20, y);
    }
    const index = Math.min(sections.length - 1, Math.max(0, Math.round(value)));
    // Protect the reading area while the cloud passes between chapters.
    const textRects = [[-3, -3, -3, -3], [-3, -3, -3, -3]];
    const canvasTop = Math.min(Math.max(y, storyTop), Math.max(storyTop, storyBottom - stageHeight));
    textBlocks.filter(block => block.bottom > y && block.top < y + stageHeight).slice(0, 2).forEach((block, i) => {
      textRects[i] = [(block.left - stageLeft) / stageWidth * 2 - 1, 1 - (block.top - canvasTop) / stageHeight * 2,
        (block.right - stageLeft) / stageWidth * 2 - 1, 1 - (block.bottom - canvasTop) / stageHeight * 2];
    });
    particles?.setTextRects(textRects);
    if (mobile.matches) {
      const visualState = reduced.matches ? index : value;
      const a = artBoxes[Math.floor(visualState)], b = artBoxes[Math.min(sections.length - 1, Math.ceil(visualState))];
      const t = visualState % 1;
      if (a && b) particles?.setArtFrame({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - canvasTop, width: a.width + (b.width - a.width) * t, height: a.height + (b.height - a.height) * t});
    }
    // Reduced motion changes at chapter boundaries without animated morphs.
    particles?.setState(reduced.matches ? index : value, reduced.matches);
    if (index !== activeScene) {
      activeScene = index; canvas.dataset.scene = String(index); story.dataset.scene = String(index);
      story.dataset.artSide = sections[index].dataset.artSide || 'right';
    }
  }
  listen(window, 'scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }, {passive: true});
  let resizeFrame = 0;
  function scheduleMeasure() { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(measure); }
  listen(window, 'resize', scheduleMeasure, {passive: true});
  if ('ResizeObserver' in window) {
    const textResize = new ResizeObserver(scheduleMeasure);
    sections.forEach(section => textResize.observe(section.querySelector('.hero-heading,.feature-heading')));
    observers.push(textResize);
    textResize.observe(community); textResize.observe(document.querySelector('.roadmap')); textResize.observe(document.querySelector('.site-footer'));
  }
  document.fonts?.ready.then(() => { if (!abort.signal.aborted) scheduleMeasure(); });
  listen(document, 'visibilitychange', syncMotion);
  listen(window, 'pagehide', () => { particles?.setRunning(false); space?.setRunning(false); });
  listen(window, 'pageshow', () => { measure(); syncMotion(); });

  listen(document, 'pointermove', event => {
    if (!canAnimate() || !finePointer.matches || event.pointerType !== 'mouse') return;
    const rect = canvas.getBoundingClientRect();
    particles?.setPointer((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2, true);
  }, {passive: true});
  listen(document, 'pointerleave', () => particles?.setPointer(2, 2, false));

  if ('IntersectionObserver' in window) {
    const checkinVisibility = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
    });
    observers.push(checkinVisibility);
    document.querySelectorAll('[data-checkin]').forEach(button => checkinVisibility.observe(button));
    const stageObserver = new IntersectionObserver(entries => { stageVisible = entries[0].isIntersecting; syncMotion(); }, {threshold: 0});
    stageObserver.observe(stage); observers.push(stageObserver);
    const communityObserver = new IntersectionObserver(entries => { communityVisible = entries[0].isIntersecting; syncMotion(); }, {threshold: 0});
    communityObserver.observe(community); observers.push(communityObserver);
    const roadmapObserver = new IntersectionObserver(entries => { roadmapVisible = entries[0].isIntersecting; syncMotion(); }, {threshold: 0});
    roadmapObserver.observe(roadmap); observers.push(roadmapObserver);
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('is-waiting'); reveal.unobserve(entry.target); } });
    }, {threshold: .1});
    observers.push(reveal);
    const targets = [...document.querySelectorAll('.reveal')];
    const waiting = reduced.matches ? [] : targets.filter(el => el.getBoundingClientRect().top > innerHeight);
    waiting.forEach(el => el.classList.add('is-waiting')); targets.forEach(el => reveal.observe(el));
    listen(document, 'focusin', event => event.target.closest('.is-waiting')?.classList.remove('is-waiting'));
    const links = [...document.querySelectorAll('.main-nav a')];
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin: '-15% 0px -55% 0px'});
    observers.push(navObserver);
    ['product','roadmap','community'].forEach(id => navObserver.observe(document.getElementById(id)));
  }

  space = createLingoSpace(spaceCanvas);
  particles = createLingoParticles(canvas);
  particles?.setSceneOrigins(sections.map(section => section.dataset.artSide === 'left' ? -.45 : .45));
  measure(); syncMotion();
  return {
    update() {
      if (reduced.matches) document.querySelectorAll('.is-waiting').forEach(el => el.classList.remove('is-waiting'));
      measure(); syncMotion();
    },
    destroy() {
      abort.abort(); observers.forEach(observer => observer.disconnect());
      cancelAnimationFrame(scrollFrame); cancelAnimationFrame(resizeFrame);
      particles?.destroy(); space?.setRunning(false);
      root.classList.remove('motion-paused', 'art-sleeping', 'controls-sleeping', 'community-sleeping', 'roadmap-sleeping');
    }
  };
}
