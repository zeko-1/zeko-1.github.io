(() => {
  const TAU = 2 * Math.PI;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 800px)');
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const mix = (a, b, t) => a + (b - a) * t;
  let seed = 241;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const stars = Array.from({ length: 255 }, () => [random(), random(), random()]);
  const dust = Array.from({ length: 2350 }, (_, i) => {
    const r = random() ** 1.65;
    return [r, i % 4 * TAU / 4 + r * 5.5 + (random() - .5) * (.8 + r * .9), random()];
  });

  function glow(ctx, x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function ellipse(ctx, x, y, rx, ry, angle, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, angle, 0, TAU);
    ctx.stroke();
  }

  function wire(ctx, rows, project, color, skip = () => false) {
    function trace(points, row) {
      ctx.beginPath();
      points.forEach((point, index) => {
        const [x, y] = project(point);
        if (!index || skip(row, index)) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = .68;
    rows.forEach(trace);
    for (let col = 0; col < rows[0].length - 1; col++) {
      trace(rows.map(row => row[col]), col + rows.length);
    }
  }

  const head = Array.from({ length: 36 }, (_, row) => {
    const theta = .06 + row / 35 * 3;
    return Array.from({ length: 61 }, (_, col) => {
      const phi = col / 60 * TAU;
      const front = Math.max(0, Math.cos(phi));
      const jaw = 1 - .27 * Math.max(0, -Math.cos(theta));
      const x = Math.sin(theta) * Math.sin(phi) * .81 * jaw;
      const z = Math.sin(theta) * Math.cos(phi) * .75 +
        .13 * front ** 14 * Math.exp(-((theta - 1.69) ** 2) / .05);
      return [x, -Math.cos(theta) * 1.17, z];
    });
  });

  function face(ctx, w, h, time) {
    const small = narrow.matches;
    const x = w * (small ? .63 : .74);
    const y = h * (small ? .73 : .52);
    const s = Math.min(w * (small ? .32 : .245), h * (small ? .23 : .35));
    glow(ctx, x, y, s * 1.45, '#7651be44');
    ellipse(ctx, x, y + s * .23, s * 1.46, s * .34, -.34, '#b893fa6b');
    ellipse(ctx, x, y + s * .23, s * 1.52, s * .36, -.34, '#537fca35');
    const angle = -.75 + Math.sin(time * .55) * .13;
    const project = ([px, py, pz]) => {
      const depth = Math.sin(angle) * px + Math.cos(angle) * pz;
      const sx = Math.cos(angle) * px - Math.sin(angle) * pz;
      const glitch = Math.sin(py * 43 + time * 2) > .92 ? s * .035 : 0;
      return [x + sx * s + glitch, y + (py - depth * .055) * s];
    };
    wire(ctx, head, project, '#bba0f083', (row, col) => (row * 17 + col * 7) % 47 < 4);
    ctx.fillStyle = '#b8a3fc55';
    for (let i = 0; i < 16; i++) {
      const level = Math.sin(i * 31.7) * s;
      ctx.fillRect(x + Math.sin(i * 81) * s, y + level, 8 + i * 1.3, 1);
    }
    const horizonY = h + w * .30;
    const radius = w * .41;
    glow(ctx, w * .87, h * 1.04, w * .35, '#5162ce4c');
    ellipse(ctx, w * .87, horizonY, w * .57, radius, -.16, '#7f9aff7d');
    ellipse(ctx, w * .87, horizonY, w * .58, radius + 5, -.16, '#a46eef40');
  }

  // Each finger is a tapered tube along a joint chain. The palm is a flattened mesh.
  function tube(joints, radii) {
    const rows = [];
    for (let segment = 0; segment < joints.length - 1; segment++) {
      const a = joints[segment];
      const b = joints[segment + 1];
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (let row = 0; row <= 5; row++) {
        const t = row / 5;
        const radius = mix(radii[segment], radii[segment + 1], t);
        rows.push(Array.from({ length: 13 }, (_, col) => {
          const turn = col / 12 * TAU;
          const side = Math.cos(turn) * radius;
          return [
            mix(a[0], b[0], t) - Math.sin(angle) * side,
            mix(a[1], b[1], t) + Math.cos(angle) * side,
            mix(a[2], b[2], t) + Math.sin(turn) * radius
          ];
        }));
      }
    }
    return rows;
  }

  const palm = tube([[-2.2,.82,0], [-1.25,.39,0], [-.65,.12,0], [0,0,0], [.53,-.06,0]],
    [.27,.25,.38,.46,.36]);
  const open = [
    [[.14,-.27,0],[.55,-.64,.04],[.83,-.78,.1],[.91,-.77,.1]],
    [[.46,-.25,0],[.92,-.48,.03],[1.32,-.65,.08],[1.41,-.65,.08]],
    [[.51,-.04,.05],[1,-.15,.04],[1.45,-.33,.1],[1.55,-.32,.1]],
    [[.47,.17,.04],[.97,.14,.05],[1.36,.03,.09],[1.45,.02,.08]],
    [[.35,.32,0],[.75,.35,0],[1.11,.26,.06],[1.19,.23,.06]]
  ];
  const point = [
    [[-.15,-.27,0],[-.48,-.57,.03],[-.63,-.52,.4],[-.65,-.43,.43]],
    [[.36,-.27,0],[.74,-.48,.5],[1.19,-.69,1.15],[1.35,-.71,1.28]],
    [[.51,-.01,0],[.74,-.12,.27],[.67,.09,.46],[.59,.16,.47]],
    [[.46,.17,0],[.66,.17,.29],[.56,.35,.42],[.47,.36,.42]],
    [[.3,.31,0],[.49,.43,.22],[.37,.57,.36],[.29,.55,.36]]
  ];
  const openMeshes = open.map((joints, i) => tube(joints, [.14 - i * .008, .105, .072, .018]));
  const pointMeshes = point.map((joints, i) => tube(joints, [.16 - i * .008, .125, .082, .018]));

  function hand(ctx, x, y, scale, color, { flip = 1, reach = false, tilt = 0 } = {}) {
    const project = ([px, py, pz]) => {
      const perspective = 1 + pz * .15;
      return [
        x + (px * Math.cos(tilt) - py * Math.sin(tilt)) * scale * flip * perspective,
        y + (px * Math.sin(tilt) + py * Math.cos(tilt) - pz * .11) * scale * perspective
      ];
    };
    const meshes = reach ? pointMeshes : openMeshes;
    wire(ctx, palm, project, color);
    meshes.forEach(mesh => wire(ctx, mesh, project, color));
    return project(point[1].at(-1));
  }

  function touch(ctx, w, h, time, progress) {
    const small = narrow.matches;
    const t = motion.matches ? 1 : clamp(progress * 2, 0, 1);
    const s = Math.min(w * (small ? .22 : .16), h * .26) * mix(.68, 1, t);
    const x = w * (small ? .35 : .3);
    const y = h * mix(small ? .83 : .76, small ? .67 : .61, t);
    glow(ctx, x, y, s * 1.8, '#5c5bd343');
    const [tipX, tipY] = hand(ctx, x, y, s, '#bc9bfb96', { reach: true, tilt: -.13 });
    const impact = clamp((t - .72) * 3.6, 0, 1);
    if (impact) {
      ctx.save();
      ctx.globalAlpha = impact;
      glow(ctx, tipX, tipY, s * .72, '#d2b0ff72');
      glow(ctx, tipX, tipY, 14, '#f4e5ffd9');
      for (let i = 0; i < 4; i++) {
        const pulse = (i + 1 + (motion.matches ? 0 : time * .45 % 1)) / 4;
        ellipse(ctx, tipX, tipY, 15 + s * .38 * pulse, 28 + s * .75 * pulse, .35,
          ['#f0dcffc2','#ba8cfaa2','#7c9dfa75','#c9e98f65'][i]);
      }
      ctx.restore();
    }
  }

  function galaxy(ctx, w, h, time) {
    const small = narrow.matches;
    const x = w * (small ? .5 : .69);
    const y = h * (small ? .61 : .49);
    const rx = w * (small ? .36 : .245);
    const ry = rx * .35;
    const scale = Math.min(w * (small ? .21 : .159), h * .25);
    glow(ctx, x, y, rx * 1.2, '#8042c847');
    glow(ctx, x, y, ry * .92, '#f0acfb90');
    glow(ctx, x, y, ry * .44, '#ffdbd69e');
    hand(ctx, x - scale * .21, y + scale * .76, scale, '#9f9ef29c', { tilt: -.13 });
    for (let i = 0; i < 3; i++) {
      ellipse(ctx, x, y, rx * (1 + i * .09), ry * (1.08 + i * .13), -.12, '#a87df744');
    }
    for (const [r, a, size] of dust) {
      const angle = a + time * .1;
      const px = Math.cos(angle) * r * rx;
      const py = Math.sin(angle) * r * ry;
      ctx.fillStyle = r < .15 ? '#ffe2e5a5' : size > .85 ? '#b8c8ffb5' : '#ad7bf484';
      ctx.fillRect(x + px + py * .12, y + py - px * .12, .55 + size * 1.45, .55 + size);
    }
    return { x, y, rx: rx * 1.12, ry: ry * 1.48 };
  }

  function why(ctx, w, h, time, progress) {
    const t = motion.matches ? 1 : clamp(progress * 1.7, 0, 1);
    const s = Math.min(w * .148, h * .27);
    const y = h * .55 + Math.sin(time) * 3;
    glow(ctx, w / 2, y, s * 1.5, '#9868df31');
    hand(ctx, w * mix(.07, .27, t), y, s, '#a7baffac', { tilt: .05 });
    hand(ctx, w * mix(.93, .73, t), y, s, '#c495f2ad', { flip: -1, tilt: .05 });
  }

  const draw = { face, touch, galaxy, why };
  const scenes = [...document.querySelectorAll('[data-scene]')].map(canvas => ({
    canvas, ctx: canvas.getContext('2d'), visible: false, width: 0, height: 0
  }));
  const sceneByCanvas = new Map(scenes.map(scene => [scene.canvas, scene]));
  let frame;
  let lastFrame;
  let orbitAngle = 0;
  function schedule() {
    if (frame === undefined) frame = requestAnimationFrame(render);
  }

  function render(now) {
    frame = undefined;
    const time = motion.matches ? 0 : now / 1000;
    const elapsed = lastFrame === undefined ? 0 : Math.min((now - lastFrame) / 1000, .05);
    lastFrame = now;
    for (const scene of scenes) {
      if (!scene.visible || !scene.ctx || !scene.width || !scene.height) continue;
      const { canvas, ctx, width, height, ratio } = scene;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const [x, y, size] of stars) {
        ctx.fillStyle = size > .96 ? '#c4caffc0' : '#a69edb54';
        ctx.fillRect(x * width, y * height, .5 + size * 1.25, .5 + size * 1.25);
      }
      const rect = canvas.getBoundingClientRect();
      const progress = (innerHeight - rect.top) / (innerHeight + height);
      const geometry = draw[canvas.dataset.scene](ctx, width, height, time, progress);
      if (geometry) {
        const orbit = canvas.parentElement.querySelector('.orbit-controls');
        const nodes = [...orbit.children];
        const frozen = orbit.matches(':focus-within') || orbit.querySelector(':hover');
        if (!frozen && !motion.matches) orbitAngle += elapsed * .1;
        nodes.forEach((node, i) => {
          const a = i / nodes.length * TAU + (motion.matches ? 0 : orbitAngle);
          node.style.setProperty('--x', (geometry.x + Math.cos(a) * geometry.rx) + 'px');
          node.style.setProperty('--y', (geometry.y + Math.sin(a) * geometry.ry) + 'px');
        });
      }
    }
    if (!motion.matches && scenes.some(scene => scene.visible)) schedule();
  }

  const sizeObserver = new ResizeObserver(entries => {
    for (const { target, contentRect } of entries) {
      const scene = sceneByCanvas.get(target);
      scene.width = contentRect.width;
      scene.height = contentRect.height;
      scene.ratio = Math.min(devicePixelRatio || 1, 1.75);
      target.width = Math.round(scene.width * scene.ratio);
      target.height = Math.round(scene.height * scene.ratio);
    }
    schedule();
  });
  const visibilityObserver = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) sceneByCanvas.get(target).visible = isIntersecting;
    schedule();
  });
  for (const { canvas } of scenes) {
    sizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);
  }
  motion.addEventListener('change', schedule);
  narrow.addEventListener('change', schedule);
})();
