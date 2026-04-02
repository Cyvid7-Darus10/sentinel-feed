import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, readdirSync, writeFileSync, statSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = path.join(__dirname, '..', '.gif-frames');
const OUT_GIF = path.join(__dirname, '..', 'docs', 'screenshots', 'demo.gif');
const SITE = process.env.SITE_URL ?? 'http://localhost:3000';

// Capture a burst of frames (for animations like the radar sweep)
async function captureFrames(page, prefix, count, intervalMs) {
  const paths = [];
  for (let i = 0; i < count; i++) {
    const p = path.join(FRAMES_DIR, `${prefix}-${String(i).padStart(3, '0')}.png`);
    await page.screenshot({ path: p });
    paths.push(p);
    if (i < count - 1) await page.waitForTimeout(intervalMs);
  }
  return paths;
}

async function main() {
  // Clean and create frames directory
  rmSync(FRAMES_DIR, { recursive: true, force: true });
  mkdirSync(FRAMES_DIR, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1, // 1x for smaller GIF size
  });
  const page = await ctx.newPage();

  console.log('Loading site...');
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // ── Scene 1: Radar view (hold for sweep animation) ──
  console.log('Recording radar view...');
  await captureFrames(page, '01-radar', 8, 500); // 4s of radar

  // ── Scene 2: Hover a dot to show tooltip ──
  console.log('Recording radar tooltip...');
  const dots = page.locator('svg circle.radar-dot');
  const dotCount = await dots.count();
  if (dotCount > 5) {
    await dots.nth(5).hover({ force: true });
    await page.waitForTimeout(300);
  }
  await captureFrames(page, '02-tooltip', 3, 600); // 1.8s tooltip

  // Move mouse away to dismiss tooltip
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);

  // ── Scene 3: Switch to MAP view ──
  console.log('Recording map view...');
  await page.click('button:has-text("MAP")');
  await page.waitForTimeout(800);
  await captureFrames(page, '03-map', 5, 600); // 3s of map

  // ── Scene 4: Hover a story in map for tooltip ──
  console.log('Recording map tooltip...');
  const storyLinks = page.locator('.story-tooltip-wrap a');
  if (await storyLinks.count() > 2) {
    await storyLinks.nth(2).hover({ force: true });
    await page.waitForTimeout(400);
  }
  await captureFrames(page, '04-map-hover', 3, 600); // 1.8s tooltip

  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);

  // ── Scene 5: Switch to LIST view ──
  console.log('Recording list view...');
  await page.click('button:has-text("LIST")');
  await page.waitForTimeout(800);
  await captureFrames(page, '05-list', 4, 600); // 2.4s of list

  // ── Scene 6: Click AI/ML topic filter ──
  console.log('Recording topic filter...');
  const aiBtn = page.locator('nav button:has-text("AI")');
  if (await aiBtn.count() > 0) {
    await aiBtn.first().click();
    await page.waitForTimeout(600);
  }
  await captureFrames(page, '06-filter', 3, 600); // 1.8s filtered

  // ── Scene 7: Search ──
  console.log('Recording search...');
  const searchInput = page.locator('input[aria-label="Search stories"]').first();
  await searchInput.click();
  await searchInput.fill('');
  await page.waitForTimeout(200);

  // Click ALL to reset topic filter first
  const allBtn = page.locator('nav button:has-text("ALL")');
  if (await allBtn.count() > 0) await allBtn.first().click();
  await page.waitForTimeout(300);

  await searchInput.fill('rust');
  await page.waitForTimeout(600);
  await captureFrames(page, '07-search', 3, 600); // 1.8s search

  // ── Scene 8: Back to radar for a nice loop ──
  console.log('Recording final radar...');
  await searchInput.fill('');
  await page.waitForTimeout(200);
  await page.click('button:has-text("RADAR")');
  await page.waitForTimeout(1000);
  await captureFrames(page, '08-back', 4, 500); // 2s final radar

  await ctx.close();
  await browser.close();

  // ── Combine frames into GIF with ffmpeg ──
  console.log('\nCombining frames into GIF...');

  // Get all frame files sorted
  const frames = readdirSync(FRAMES_DIR)
    .filter((f) => f.endsWith('.png'))
    .sort();

  // Create a file list for ffmpeg concat
  const listFile = path.join(FRAMES_DIR, 'frames.txt');
  const listContent = frames
    .map((f) => `file '${path.join(FRAMES_DIR, f)}'\nduration 0.5`)
    .join('\n');
  writeFileSync(listFile, listContent + `\nfile '${path.join(FRAMES_DIR, frames[frames.length - 1])}'`);

  // Generate palette for better GIF quality
  const paletteFile = path.join(FRAMES_DIR, 'palette.png');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -vf "fps=2,scale=960:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff" "${paletteFile}"`,
    { stdio: 'pipe' }
  );

  // Generate GIF using palette
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -i "${paletteFile}" -lavfi "fps=2,scale=960:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" "${OUT_GIF}"`,
    { stdio: 'pipe' }
  );

  // Cleanup frames
  rmSync(FRAMES_DIR, { recursive: true, force: true });

  const size = (statSync(OUT_GIF).size / 1024 / 1024).toFixed(1);
  console.log(`\n✓ GIF saved to ${OUT_GIF} (${size} MB)`);
}

main().catch((err) => {
  console.error('GIF recording failed:', err.message);
  process.exit(1);
});
