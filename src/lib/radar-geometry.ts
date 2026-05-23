import type { Story } from './types';
import { TOPICS, categorizeTopic } from './topics';
import { isCritical } from './classification';

// Seeded PRNG for deterministic placement.
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

// Normal-ish distribution between min and max (average of two uniforms)
export function normalBetween(rng: () => number, min: number, max: number): number {
  return min + (rng() + rng()) / 2 * (max - min);
}

// SVG arc path for a sector wedge.
export function sectorPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
}

export interface PlottedStory {
  readonly story: Story;
  readonly topicIdx: number;
  readonly topicColor: string;
  readonly critical: boolean;
  readonly dotR: number;
  readonly x: number;
  readonly y: number;
}

// Mutable during the in-place relaxation; returned widened to readonly PlottedStory.
interface MutablePlottedStory extends Omit<PlottedStory, 'x' | 'y'> {
  x: number;
  y: number;
}

/**
 * Lays out stories as dots inside the radar: angle by topic sector, radius by
 * score (higher score → nearer center), then relaxes collisions and clamps
 * everything between the center dead-zone and the outer ring.
 */
export function plotStories(
  stories: readonly Story[],
  centerX: number,
  centerY: number,
  radius: number
): PlottedStory[] {
  const byTopic: Record<string, Story[]> = {};
  for (const topic of TOPICS) {
    byTopic[topic.id] = [];
  }
  for (const story of stories) {
    byTopic[categorizeTopic(story)].push(story);
  }
  for (const topic of TOPICS) {
    byTopic[topic.id].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  const sectorAngle = (2 * Math.PI) / TOPICS.length;
  const plotted: MutablePlottedStory[] = [];

  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    const topicStories = byTopic[topic.id];
    const baseAngle = i * sectorAngle - Math.PI / 2;
    const maxScore = topicStories[0]?.score ?? 1;

    for (let j = 0; j < topicStories.length; j++) {
      const story = topicStories[j];
      const rng = seededRandom(story.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
      const critical = isCritical(story);

      // Score-based radius: high score → inner, low → outer
      const normalizedScore = maxScore > 0 ? (story.score ?? 0) / maxScore : 0.5;
      const rMin = radius * 0.15;
      const rMax = radius * 0.92;
      const r = rMin + (1 - normalizedScore * 0.75) * (rMax - rMin);

      // Random angle within sector (normal distribution, clustered toward center of sector)
      const angleMargin = sectorAngle * 0.08;
      const angle = normalBetween(
        rng,
        baseAngle + angleMargin,
        baseAngle + sectorAngle - angleMargin
      );

      // Add radius jitter for organic feel
      const jitteredR = r + (rng() - 0.5) * radius * 0.12;

      // Dot size: bigger for higher score, critical stories larger
      const dotR = critical ? 6 : 3 + normalizedScore * 3;

      plotted.push({
        story,
        topicIdx: i,
        topicColor: topic.color,
        critical,
        dotR,
        x: centerX + jitteredR * Math.cos(angle),
        y: centerY + jitteredR * Math.sin(angle),
      });
    }
  }

  // Iterative collision relaxation (no D3).
  const padding = 2;
  for (let iter = 0; iter < 12; iter++) {
    for (let a = 0; a < plotted.length; a++) {
      for (let b = a + 1; b < plotted.length; b++) {
        const pa = plotted[a];
        const pb = plotted[b];
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = pa.dotR + pb.dotR + padding;
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          pa.x -= nx * overlap;
          pa.y -= ny * overlap;
          pb.x += nx * overlap;
          pb.y += ny * overlap;
        }
      }
    }

    // Clamp back into sector bounds after each iteration
    for (const p of plotted) {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Keep within radar circle
      if (dist > radius * 0.93) {
        const scale = (radius * 0.93) / dist;
        p.x = centerX + dx * scale;
        p.y = centerY + dy * scale;
      }
      // Keep outside center dead zone
      if (dist < radius * 0.1 && dist > 0) {
        const scale = (radius * 0.1) / dist;
        p.x = centerX + dx * scale;
        p.y = centerY + dy * scale;
      }
    }
  }

  return plotted;
}
