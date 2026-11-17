<script lang="ts">
  let canvas: HTMLCanvasElement;
  let failed = $state(false);

  const fragment = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_hover;
uniform vec3 u_a;
uniform vec3 u_b;
uniform vec3 u_bg;

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash(i + vec2(1.0)), f - vec2(1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2 m = (u_mouse - 0.5 * u_res) / u_res.y;
  float d = length(p - m);
  float t = u_time * 0.045;

  p += (p - m) * 0.35 * exp(-d * d * 5.0) * u_hover;

  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 1.3 + 2.2 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p * 1.3 + 2.2 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.3 + 2.6 * r);

  float v = clamp(f * 1.25 + 0.48, 0.0, 1.0);
  v *= smoothstep(1.45, 0.15, length((uv - vec2(0.85, 0.8)) * vec2(1.1, 1.4)));
  v += 0.28 * exp(-d * d * 9.0) * u_hover;

  float stepped = floor(v * 6.0 + bayer8(gl_FragCoord.xy)) / 6.0;

  vec3 col = u_bg;
  col = mix(col, u_a * 0.55, smoothstep(0.15, 0.55, stepped));
  col = mix(col, u_a, smoothstep(0.5, 0.85, stepped));
  col = mix(col, u_b, smoothstep(0.8, 1.0, stepped) * clamp(r.x * 2.0 + 0.6, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

  function readRgb(name: string): [number, number, number] {
    const parts = getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/).map(Number);
    return parts.length === 3 && parts.every((n) => !Number.isNaN(n))
      ? [parts[0] / 255, parts[1] / 255, parts[2] / 255]
      : [0, 0, 0];
  }

  $effect(() => {
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) {
      failed = true;
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(
      program,
      compile(gl.VERTEX_SHADER, "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }"),
    );
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      failed = true;
      return;
    }
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uRes = uniform("u_res");
    const uTime = uniform("u_time");
    const uMouse = uniform("u_mouse");
    const uHover = uniform("u_hover");
    const uA = uniform("u_a");
    const uB = uniform("u_b");
    const uBg = uniform("u_bg");

    const colors = { a: readRgb("--rgb-volt"), b: readRgb("--rgb-ember"), bg: readRgb("--rgb-ink") };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pixel = 3;
    const pointer = { x: 0.7, y: 0.6, tx: 0.7, ty: 0.6, hover: 0, thover: 0 };
    const start = performance.now() - 40000 * Math.random();
    let width = 1;
    let height = 1;
    let frame = 0;
    let visible = true;

    const draw = (now: number) => {
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      pointer.hover += (pointer.thover - pointer.hover) * 0.04;
      gl.uniform2f(uRes, width, height);
      gl.uniform1f(uTime, reduced ? 12 : (now - start) / 1000);
      gl.uniform2f(uMouse, pointer.x * width, (1 - pointer.y) * height);
      gl.uniform1f(uHover, pointer.hover);
      gl.uniform3fv(uA, colors.a);
      gl.uniform3fv(uB, colors.b);
      gl.uniform3fv(uBg, colors.bg);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      draw(now);
      frame = requestAnimationFrame(loop);
    };

    const resume = () => {
      if (!reduced && !frame && visible && !document.hidden) frame = requestAnimationFrame(loop);
    };

    const resize = () => {
      width = Math.max(1, Math.round(canvas.clientWidth / pixel));
      height = Math.max(1, Math.round(canvas.clientHeight / pixel));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      if (reduced || !frame) draw(performance.now());
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / rect.width;
      pointer.ty = (e.clientY - rect.top) / rect.height;
      pointer.thover = pointer.ty >= 0 && pointer.ty <= 1 ? 1 : 0;
    };
    const onPointerLeave = () => (pointer.thover = 0);

    const resizer = new ResizeObserver(resize);
    resizer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", resume);
    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
    }

    resize();
    resume();

    return () => {
      cancelAnimationFrame(frame);
      resizer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  });
</script>

<canvas bind:this={canvas} class="field" class:hidden={failed} aria-hidden="true"></canvas>
<div class="fallback" aria-hidden="true"></div>

<style>
  .field,
  .fallback {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .field {
    z-index: 1;
    image-rendering: pixelated;
  }

  .field.hidden {
    display: none;
  }

  .fallback {
    background:
      radial-gradient(60% 70% at 85% 20%, rgb(var(--rgb-volt) / 0.35), transparent 70%),
      radial-gradient(30% 40% at 70% 35%, rgb(var(--rgb-ember) / 0.15), transparent 70%), var(--ink);
  }
</style>
