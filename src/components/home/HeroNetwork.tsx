"use client";

import { useEffect, useRef, type RefObject } from "react";
import styles from "./hero-network.module.css";

/** Nodes in the field. Pairs are checked every frame, so this stays well under 100. */
const NODE_COUNT = 64;
/** Nodes closer than this (in CSS px) are joined by a line that fades with distance. */
const LINK_DISTANCE = 150;
/** The cursor pushes nodes away inside this radius. */
const POINTER_RADIUS = 170;
/** Caps the backing store so a 4K screen does not draw four times the pixels. */
const MAX_DPR = 1.5;

const VERTEX = `#version 300 es
in vec2 a_position;
in float a_alpha;
uniform vec2 u_resolution;
uniform float u_pointSize;
out float v_alpha;
void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = u_pointSize;
  v_alpha = a_alpha;
}`;

const FRAGMENT = `#version 300 es
precision mediump float;
uniform vec3 u_color;
uniform bool u_points;
in float v_alpha;
out vec4 color;
void main() {
  float alpha = v_alpha;
  if (u_points) {
    // Soft round node with a bright core.
    float d = length(gl_PointCoord - 0.5);
    alpha *= smoothstep(0.5, 0.0, d);
  }
  color = vec4(u_color * alpha, alpha);
}`;

type Node = { x: number; y: number; vx: number; vy: number; ox: number; oy: number };

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

/** Reads a "r g b" channel list such as --brand-mid-rgb into 0..1 floats. */
function brandColor(name: string): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw.split(/[\s,]+/).map(Number);
  return parts.length === 3 && parts.every(Number.isFinite)
    ? [parts[0] / 255, parts[1] / 255, parts[2] / 255]
    : [0.35, 0.9, 0.82];
}

/**
 * Desktop-only WebGL layer for the hero: a slow constellation of nodes and links, the site's
 * "infrastructure" motif. It drifts, parts around the cursor, and rises as the hero scrolls
 * away. Rendering stops whenever the hero is off screen or the tab is hidden.
 */
export function HeroNetwork({ section }: { section: RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = section.current;
    if (!canvas || !host) return;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uPointSize = gl.getUniformLocation(program, "u_pointSize");
    const uColor = gl.getUniformLocation(program, "u_color");
    const uPoints = gl.getUniformLocation(program, "u_points");
    const aPosition = gl.getAttribLocation(program, "a_position");
    const aAlpha = gl.getAttribLocation(program, "a_alpha");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(aAlpha);
    gl.vertexAttribPointer(aAlpha, 1, gl.FLOAT, false, 12, 8);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const lineColor = brandColor("--brand-mid-rgb");
    const nodeColor = brandColor("--brand-bright-rgb");
    // Worst case: every pair linked (2 vertices each) plus one vertex per node.
    const vertices = new Float32Array(
      ((NODE_COUNT * (NODE_COUNT - 1)) / 2) * 2 * 3 + NODE_COUNT * 3,
    );

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (nodes.length === 0) {
        nodes = Array.from({ length: NODE_COUNT }, () => {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.08 + Math.random() * 0.14;
          return { x, y, ox: x, oy: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
        });
      }
    };

    const pointer = { x: -9999, y: -9999 };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    let frame = 0;
    let visible = true;
    const draw = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      // Rise with the scroll so the field leaves with the hero instead of sliding under About.
      const lift = Math.min(window.scrollY, height) * 0.25;

      let count = 0;
      for (const node of nodes) {
        node.ox += node.vx;
        node.oy += node.vy;
        if (node.ox < -20 || node.ox > width + 20) node.vx *= -1;
        if (node.oy < -20 || node.oy > height + 20) node.vy *= -1;
        // Ease toward the drift position, pushed out of the cursor's radius.
        let tx = node.ox;
        let ty = node.oy - lift;
        const dx = tx - pointer.x;
        const dy = ty - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < POINTER_RADIUS && distance > 0.001) {
          const push = (1 - distance / POINTER_RADIUS) * 46;
          tx += (dx / distance) * push;
          ty += (dy / distance) * push;
        }
        node.x += (tx - node.x) * 0.08;
        node.y += (ty - node.y) * 0.08;
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance > LINK_DISTANCE) continue;
          const alpha = (1 - distance / LINK_DISTANCE) * 0.38;
          vertices.set([a.x * dpr, a.y * dpr, alpha, b.x * dpr, b.y * dpr, alpha], count * 3);
          count += 2;
        }
      }
      const lineVertices = count;
      for (const node of nodes) {
        const near = Math.max(0, 1 - Math.hypot(node.x - pointer.x, node.y - pointer.y) / 220);
        vertices.set([node.x * dpr, node.y * dpr, 0.45 + near * 0.55], count * 3);
        count += 1;
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bufferData(gl.ARRAY_BUFFER, vertices.subarray(0, count * 3), gl.DYNAMIC_DRAW);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1i(uPoints, 0);
      gl.uniform3f(uColor, ...lineColor);
      gl.drawArrays(gl.LINES, 0, lineVertices);
      gl.uniform1i(uPoints, 1);
      gl.uniform1f(uPointSize, 5 * dpr);
      gl.uniform3f(uColor, ...nodeColor);
      gl.drawArrays(gl.POINTS, lineVertices, count - lineVertices);

      frame = requestAnimationFrame(draw);
    };
    const start = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    intersection.observe(host);
    host.addEventListener("pointermove", onPointer);
    host.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", start);
    canvas.dataset.ready = "";
    start();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", onPointer);
      host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", start);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [section]);

  return <canvas ref={canvasRef} aria-hidden className={styles.canvas} />;
}

export default HeroNetwork;
