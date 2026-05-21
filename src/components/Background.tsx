import { useContext, useEffect, useRef } from 'react';

import styled from 'styled-components';

import { AppContext } from 'App/AppContext';
import { Theme } from 'types';

interface PaletteColor {
  hue: number;
  lightness: number;
  saturation: number;
}

interface Particle {
  hue: number;
  life: number;
  lightness: number;
  maxLife: number;
  previousX: number;
  previousY: number;
  saturation: number;
  speed: number;
  width: number;
  x: number;
  y: number;
}

interface Swirl {
  decay: number;
  radius: number;
  strength: number;
  x: number;
  y: number;
}

const palettes: PaletteColor[][] = [
  [
    { hue: 12, lightness: 64, saturation: 88 },
    { hue: 340, lightness: 66, saturation: 80 },
    { hue: 28, lightness: 70, saturation: 92 },
    { hue: 300, lightness: 62, saturation: 60 },
  ],
  [
    { hue: 170, lightness: 58, saturation: 72 },
    { hue: 196, lightness: 62, saturation: 78 },
    { hue: 260, lightness: 68, saturation: 64 },
    { hue: 142, lightness: 56, saturation: 60 },
  ],
  [
    { hue: 272, lightness: 66, saturation: 70 },
    { hue: 318, lightness: 70, saturation: 74 },
    { hue: 232, lightness: 64, saturation: 66 },
    { hue: 206, lightness: 64, saturation: 70 },
  ],
  [
    { hue: 46, lightness: 66, saturation: 92 },
    { hue: 88, lightness: 58, saturation: 62 },
    { hue: 160, lightness: 58, saturation: 66 },
    { hue: 22, lightness: 66, saturation: 90 },
  ],
  [
    { hue: 210, lightness: 60, saturation: 78 },
    { hue: 188, lightness: 58, saturation: 74 },
    { hue: 248, lightness: 66, saturation: 62 },
    { hue: 166, lightness: 56, saturation: 64 },
  ],
];

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const cssPixels = (value: number) => `${String(value)}px`;

const hsla = (
  hue: number,
  saturation: number,
  lightness: number,
  alpha: number | string,
) =>
  `hsla(${String(hue)}, ${String(saturation)}%, ${String(lightness)}%, ${String(alpha)})`;

const B = {
  Container: styled.div<{ $theme: Theme }>`
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    transition: background-color 0.5s linear;
    background-color: ${({ $theme }) => $theme.background};
  `,
  Canvas: styled.canvas`
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  `,
};

export const Background = () => {
  const { theme } = useContext(AppContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    let animationFrame = 0;
    let colorFrame = 0;
    let dpr = 1;
    let fieldTime = 0;
    let height = 1;
    let lastDropTime = 0;
    let paletteIndex = Math.floor(Math.random() * palettes.length);
    let pointerId: null | number = null;
    let width = 1;
    const particles: Particle[] = [];
    const swirls: Swirl[] = [];

    const currentPalette = () => palettes[paletteIndex];

    const randomColor = () => {
      const palette = currentPalette();
      const color = palette[Math.floor(Math.random() * palette.length)];

      return {
        hue: color.hue + randomBetween(-12, 12),
        lightness: color.lightness + randomBetween(-8, 10),
        saturation: color.saturation,
      };
    };

    const resetParticle = (particle: Particle, x: number, y: number) => {
      const color = randomColor();

      particle.x = x;
      particle.y = y;
      particle.previousX = x;
      particle.previousY = y;
      particle.speed = randomBetween(0.7, 1.7);
      particle.life = randomBetween(140, 380);
      particle.maxLife = particle.life;
      particle.hue = color.hue;
      particle.saturation = color.saturation;
      particle.lightness = color.lightness;
      particle.width = randomBetween(0.6, 2.4);
    };

    const createParticle = (x: number, y: number): Particle => {
      const color = randomColor();
      const life = randomBetween(140, 380);

      return {
        hue: color.hue,
        life,
        lightness: color.lightness,
        maxLife: life,
        previousX: x,
        previousY: y,
        saturation: color.saturation,
        speed: randomBetween(0.7, 1.7),
        width: randomBetween(0.6, 2.4),
        x,
        y,
      };
    };

    const paintBackground = () => {
      const gradient = context.createRadialGradient(
        width * 0.5,
        height * 0.5,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75,
      );

      if (theme.key === 'dark') {
        gradient.addColorStop(0, '#15101c');
        gradient.addColorStop(1, '#080610');
      } else {
        gradient.addColorStop(0, '#fff7fb');
        gradient.addColorStop(1, '#eaf7ff');
      }

      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    };

    const spawnParticles = () => {
      const target = Math.max(
        160,
        Math.min(620, Math.round((width * height) / 2600)),
      );
      particles.length = 0;

      for (let i = 0; i < target; i += 1) {
        const particle = createParticle(
          Math.random() * width,
          Math.random() * height,
        );
        particle.life = Math.random() * particle.maxLife;
        particles.push(particle);
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = cssPixels(width);
      canvas.style.height = cssPixels(height);

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBackground();
      spawnParticles();
    };

    const fieldAngle = (x: number, y: number) => {
      const normalizedX = x * 0.0021;
      const normalizedY = y * 0.0021;
      const wave =
        Math.sin(normalizedX + normalizedY * 0.6 + fieldTime * 0.3) +
        Math.sin(normalizedY * 1.7 - normalizedX * 0.9 + fieldTime * 0.21) *
          0.8 +
        Math.sin(
          (normalizedX + normalizedY) * 1.3 +
            Math.cos(normalizedX * 0.7 - fieldTime * 0.12) * 1.6,
        ) *
          0.7 +
        Math.cos(normalizedX * 2.3 - normalizedY * 1.1 + fieldTime * 0.16) *
          0.45;
      let angle = wave * 1.35;

      for (const swirl of swirls) {
        const dx = x - swirl.x;
        const dy = y - swirl.y;
        const influence =
          swirl.strength *
          Math.exp(-(dx * dx + dy * dy) / (swirl.radius * swirl.radius));

        if (influence > 0.001) {
          const swirlAngle = Math.atan2(dy, dx) + Math.PI * 0.5;
          angle += Math.sin(swirlAngle - angle) * influence * 3;
        }
      }

      return angle;
    };

    const bloom = (x: number, y: number) => {
      swirls.push({
        decay: randomBetween(0.004, 0.008),
        radius: Math.min(width, height) * randomBetween(0.16, 0.26),
        strength: randomBetween(0.7, 1),
        x,
        y,
      });
      if (swirls.length > 6) swirls.shift();

      for (let i = 0; i < 70; i += 1) {
        const angle = (i / 70) * Math.PI * 2 + randomBetween(-0.2, 0.2);
        const radius = randomBetween(0, Math.min(width, height) * 0.06);
        const xOffset = x + Math.cos(angle) * radius;
        const yOffset = y + Math.sin(angle) * radius;
        const particle =
          particles.length > 0 && i % 2 === 0
            ? particles[Math.floor(Math.random() * particles.length)]
            : createParticle(xOffset, yOffset);

        resetParticle(particle, xOffset, yOffset);
        particle.speed = randomBetween(1.3, 2.6);
        if (!particles.includes(particle)) particles.push(particle);
      }

      if (particles.length > 700) particles.splice(0, particles.length - 700);

      const color = currentPalette()[0];
      const flash = context.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        Math.min(width, height) * 0.14,
      );
      flash.addColorStop(
        0,
        hsla(
          color.hue,
          color.saturation,
          80,
          theme.key === 'dark' ? 0.45 : 0.24,
        ),
      );
      flash.addColorStop(1, hsla(color.hue, color.saturation, 80, 0));
      context.fillStyle = flash;
      context.beginPath();
      context.arc(x, y, Math.min(width, height) * 0.14, 0, Math.PI * 2);
      context.fill();
    };

    const cyclePalette = () => {
      paletteIndex = (paletteIndex + 1) % palettes.length;
      for (const particle of particles) {
        if (Math.random() < 0.55) particle.life = Math.random() * 30;
      }
      colorFrame = window.setTimeout(cyclePalette, 6500);
    };

    const frame = () => {
      fieldTime += 0.016;

      context.globalCompositeOperation = 'source-over';
      context.fillStyle =
        theme.key === 'dark'
          ? 'rgba(8, 6, 16, 0.012)'
          : 'rgba(248, 250, 252, 0.018)';
      context.fillRect(0, 0, width, height);

      for (let i = swirls.length - 1; i >= 0; i -= 1) {
        swirls[i].strength -= swirls[i].decay;
        if (swirls[i].strength <= 0) swirls.splice(i, 1);
      }

      context.globalCompositeOperation =
        theme.key === 'dark' ? 'lighter' : 'source-over';
      context.lineCap = 'round';

      for (const particle of particles) {
        const angle = fieldAngle(particle.x, particle.y);
        particle.previousX = particle.x;
        particle.previousY = particle.y;
        particle.x += Math.cos(angle) * particle.speed;
        particle.y += Math.sin(angle) * particle.speed;
        particle.life -= 1;

        const lifeFraction =
          particle.maxLife > 0 ? particle.life / particle.maxLife : 0;
        const alpha =
          Math.min(1, lifeFraction * 4) *
          Math.min(1, (1 - lifeFraction) * 4 + 0.15);
        const outOfBounds =
          particle.x < -10 ||
          particle.x > width + 10 ||
          particle.y < -10 ||
          particle.y > height + 10;

        if (particle.life <= 0 || outOfBounds) {
          resetParticle(
            particle,
            Math.random() * width,
            Math.random() * height,
          );
          continue;
        }

        context.strokeStyle = hsla(
          particle.hue,
          particle.saturation,
          particle.lightness,
          (alpha * (theme.key === 'dark' ? 0.34 : 0.24)).toFixed(3),
        );
        context.lineWidth = particle.width;
        context.beginPath();
        context.moveTo(particle.previousX, particle.previousY);
        context.lineTo(particle.x, particle.y);
        context.stroke();
      }

      context.globalCompositeOperation = 'source-over';
      animationFrame = window.requestAnimationFrame(frame);
    };

    const pointFromEvent = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();

      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const onPointerDown = (event: PointerEvent) => {
      const point = pointFromEvent(event);
      pointerId = event.pointerId;
      bloom(point.x, point.y);
      lastDropTime = performance.now();

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort for older browsers.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;

      const now = performance.now();
      if (now - lastDropTime > 110) {
        const point = pointFromEvent(event);
        bloom(point.x, point.y);
        lastDropTime = now;
      }
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (pointerId === event.pointerId) pointerId = null;
    };

    resize();
    bloom(width * 0.34, height * 0.42);
    bloom(width * 0.66, height * 0.58);
    animationFrame = window.requestAnimationFrame(frame);
    colorFrame = window.setTimeout(cyclePalette, 6500);

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerEnd);
    canvas.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(colorFrame);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerEnd);
      canvas.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('resize', resize);
    };
  }, [theme.key]);

  return (
    <B.Container data-v2="background" $theme={theme} aria-hidden="true">
      <B.Canvas ref={canvasRef} />
    </B.Container>
  );
};
