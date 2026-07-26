import type { Story } from './types';
import { TOPICS, resolveTopic } from './topics';
import { rankStories } from './ranking';
import { isCritical } from './classification';

// LCG seeded from the story id, so a dot lands in the same spot on every render.
// Without this, each 60s poll would reshuffle the whole radar.
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

// Averaging two uniforms gives a rough bell curve, which clusters dots toward the
// middle of their sector instead of smearing them evenly across it.
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
 * blended rank (higher rank → nearer center), then relaxes collisions and
 * clamps everything between the center dead-zone and the outer ring.
 */
export function plotStories(
  stories: readonly Story[],
  centerX: number,
  centerY: number,
  radius: number
): PlottedStory[] {
  const ranks = rankStories(stories);

  const byTopic: Record<string, Story[]> = {};
  for (const topic of TOPICS) {
    byTopic[topic.id] = [];
  }
  for (const story of stories) {
    byTopic[resolveTopic(story)].push(story);
  }
  for (const topic of TOPICS) {
    byTopic[topic.id].sort(
      (a, b) => (ranks.get(b.id) ?? 0) - (ranks.get(a.id) ?? 0)
    );
  }

  const sectorAngle = (2 * Math.PI) / TOPICS.length;
  const plotted: MutablePlottedStory[] = [];

  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    const topicStories = byTopic[topic.id];
    const baseAngle = i * sectorAngle - Math.PI / 2;

    for (let j = 0; j < topicStories.length; j++) {
      const story = topicStories[j];
      const rng = seededRandom(story.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
      const critical = isCritical(story);

      // Rank maps to radius: the best-ranked story in a sector sits innermost. The
      // 0.75 factor stops a single top rank from flattening everything else to the rim.
      const rank = ranks.get(story.id) ?? 0;
      const rMin = radius * 0.15;
      const rMax = radius * 0.92;
      const r = rMin + (1 - rank * 0.75) * (rMax - rMin);

      // Angle within the sector, kept off the dividing lines by a small margin.
      const angleMargin = sectorAngle * 0.08;
      const angle = normalBetween(
        rng,
        baseAngle + angleMargin,
        baseAngle + sectorAngle - angleMargin
      );

      // Without jitter, stories with equal scores stack into visible arcs.
      const jitteredR = r + (rng() - 0.5) * radius * 0.12;

      // Critical stories get a fixed, larger radius so they read as urgent regardless
      // of how few upvotes they have.
      const dotR = critical ? 6 : 3 + rank * 3;

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

  // Pairwise relaxation, O(n^2) per pass. At a few hundred dots over 12 passes that
  // is a few hundred thousand comparisons, which is cheap enough not to justify
  // pulling in D3's force simulation. Revisit if a sector ever holds thousands.
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

    // Relaxation can push dots past the rim or into the middle, so re-clamp each pass.
    for (const p of plotted) {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Back inside the outer ring.
      if (dist > radius * 0.93) {
        const scale = (radius * 0.93) / dist;
        p.x = centerX + dx * scale;
        p.y = centerY + dy * scale;
      }
      // Out of the dead zone at the center, which holds the crosshair.
      if (dist < radius * 0.1 && dist > 0) {
        const scale = (radius * 0.1) / dist;
        p.x = centerX + dx * scale;
        p.y = centerY + dy * scale;
      }
    }
  }

  return plotted;
}
