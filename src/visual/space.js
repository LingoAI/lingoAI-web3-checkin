/* A small, independent star field continues through the product, community and footer. */

  export function createLingoSpace(canvas) {
    const ctx = canvas.getContext('2d', {alpha: true});
    if (!ctx) { canvas.hidden = true; return null; }
    const colors = ['176,232,220', '178,208,243', '185,178,236'];
    const glows = colors.map(color => {
      const sprite = document.createElement('canvas'); sprite.width = sprite.height = 48;
      const pen = sprite.getContext('2d');
      const glow = pen.createRadialGradient(24, 24, 0, 24, 24, 24);
      glow.addColorStop(0, `rgba(${color},.7)`);
      glow.addColorStop(.22, `rgba(${color},.2)`);
      glow.addColorStop(1, `rgba(${color},0)`);
      pen.fillStyle = glow; pen.fillRect(0, 0, 48, 48);
      return sprite;
    });
    let seed = 41039;
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    const pool = Array.from({length: 220}, (_, index) => {
      const layer = index % 10 < 6 ? 0 : index % 10 < 9 ? 1 : 2;
      return {x: random(), y: random(), depth: [.2, .55, 1][layer], layer,
        radius: [.45, .75, 1.15][layer] + random() * .25,
        phase: random() * Math.PI * 2, color: Math.floor(random() * colors.length)};
    });
    let width = 1, height = 1, dpr = 1, count = 0, scroll = scrollY;
    let time = 0, running = false, reducedMotion = false, raf = 0, previous = 0, frameCount = 0;
    let readingZones = [];
    canvas.dataset.running = 'false';
    canvas.dataset.reducedMotion = 'false';
    const wrap = (value, span) => ((value % span) + span) % span;
    const smoothstep = (start, end, value) => {
      const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
      return t * t * (3 - 2 * t);
    };
    function draw() {
      ctx.clearRect(0, 0, width, height);
      const zones = readingZones.map(zone => ({left: zone.left, right: zone.right,
        top: zone.top - (zone.fixed ? 0 : scroll), bottom: zone.bottom - (zone.fixed ? 0 : scroll)}))
        .filter(zone => zone.bottom > -28 && zone.top < height + 28);
      let sampleX = 0, sampleY = 0;
      for (let i = 0; i < count; i++) {
        const star = pool[i], depth = star.depth;
        const driftX = reducedMotion ? 0 : time * (.3 + depth * 1.8) + Math.sin(time * .09 + star.phase) * depth * 7;
        const driftY = reducedMotion ? 0 : -time * (.2 + depth * .7) + Math.cos(time * .07 + star.phase) * depth * 9 - scroll * depth * .045;
        const x = wrap(star.x * (width + 48) + driftX, width + 48) - 24;
        const y = wrap(star.y * (height + 48) + driftY, height + 48) - 24;
        let visibility = 1;
        for (const zone of zones) {
          const dx = Math.max(zone.left - x, 0, x - zone.right);
          const dy = Math.max(zone.top - y, 0, y - zone.bottom);
          if (dx < 28 && dy < 28) visibility = Math.min(visibility, .06 + .94 * smoothstep(0, 28, Math.hypot(dx, dy)));
        }
        const edge = smoothstep(-8, 18, x) * (1 - smoothstep(width - 18, width + 8, x))
          * smoothstep(-8, 18, y) * (1 - smoothstep(height - 18, height + 8, y));
        const twinkle = reducedMotion ? .85 : .8 + .2 * Math.sin(time * (.2 + depth * .15) + star.phase);
        const alpha = (.19 + depth * .4) * twinkle * visibility * edge;
        if (star.layer === 2) {
          const size = star.radius * 10;
          ctx.globalAlpha = alpha * .55;
          ctx.drawImage(glows[star.color], x - size / 2, y - size / 2, size, size);
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${colors[star.color]})`;
        ctx.beginPath(); ctx.arc(x, y, star.radius, 0, Math.PI * 2); ctx.fill();
        if (i === 9) { sampleX = x; sampleY = y; }
      }
      ctx.globalAlpha = 1;
      frameCount++;
      if (frameCount % 30 === 0 || !running) {
        canvas.dataset.frame = String(frameCount);
        canvas.dataset.sampleX = sampleX.toFixed(2); canvas.dataset.sampleY = sampleY.toFixed(2);
      }
    }
    function frame(now) {
      raf = 0;
      if (!running) return;
      // Cap the decorative layer at 30fps independently of the main WebGL scene.
      if (!previous || now - previous >= 1000 / 30) {
        if (previous) time += Math.min((now - previous) / 1000, .1);
        previous = now; draw();
      }
      raf = requestAnimationFrame(frame);
    }
    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(rect.width, 1); height = Math.max(rect.height, 1);
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      const mobile = width <= 700;
      count = Math.max(mobile ? 48 : 100, Math.min(mobile ? 72 : 220, Math.round(width * height / 6400)));
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.dataset.stars = String(count); canvas.dataset.renderer = 'canvas2d';
      draw();
    }
    resize();
    return {
      resize,
      setReadingZones(zones) { readingZones = zones; },
      setScroll(value) { scroll = value; if (!running) draw(); },
      setReducedMotion(value) {
        if (reducedMotion === value) return;
        reducedMotion = value; canvas.dataset.reducedMotion = String(value); draw();
      },
      setRunning(value) {
        const next = Boolean(value && !reducedMotion);
        if (next === running) return;
        running = next; canvas.dataset.running = String(running);
        if (running) { previous = 0; raf = requestAnimationFrame(frame); }
        else { cancelAnimationFrame(raf); raf = 0; previous = 0; draw(); }
      }
    };
  }
