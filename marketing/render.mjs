// Gera os PNGs (carrosséis/cards) e MP4s (reels) a partir de marketing/src.
// Uso: node marketing/render.mjs [pecas|videos|tudo] [filtro]
import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, "src");
const OUT = join(AQUI, "out");
const modo = process.argv[2] || "tudo";
const filtro = process.argv[3] || "";

// Usa o Chrome instalado no Windows (evita depender da versão baixada pelo Playwright).
const browser = await chromium.launch({ channel: "chrome" });

async function renderPecas() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(pathToFileURL(join(SRC, "pecas.html")).href);
  const nomes = await page.evaluate(() => window.SETS_NOMES);
  for (const nome of nomes.filter((n) => n.includes(filtro))) {
    await page.goto(pathToFileURL(join(SRC, "pecas.html")).href + `?set=${nome}`);
    await page.evaluate(() => document.fonts.ready);
    const destino = nome.startsWith("card") ? join(OUT, "cards") : join(OUT, nome);
    mkdirSync(destino, { recursive: true });
    const slides = await page.$$(".slide");
    for (let i = 0; i < slides.length; i++) {
      const arquivo = nome.startsWith("card") ? `${nome}.png` : `${String(i + 1).padStart(2, "0")}.png`;
      await slides[i].screenshot({ path: join(destino, arquivo) });
    }
    console.log(`ok ${nome}: ${slides.length} imagem(ns)`);
  }
  await page.close();
}

async function renderVideos() {
  const FPS = 30;
  const base = pathToFileURL(join(SRC, "videos.html")).href;
  const lista = await browser.newPage();
  await lista.goto(base);
  const nomes = (await lista.evaluate(() => window.VIDEOS_NOMES)).filter((n) => n.includes(filtro));
  await lista.close();
  mkdirSync(join(OUT, "videos"), { recursive: true });
  for (const arquivo of nomes) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    await page.goto(`${base}?v=${arquivo}`);
    await page.evaluate(() => document.fonts.ready);
    const duracao = await page.evaluate(() => window.DURACAO);
    if (process.env.PREVIA) {
      // só alguns quadros para conferência visual
      const previa = join(OUT, "previa");
      mkdirSync(previa, { recursive: true });
      for (const t of process.env.PREVIA.split(",").map(Number)) {
        await page.evaluate((x) => window.render(x), t);
        await page.screenshot({ path: join(previa, `${arquivo}-${t}s.jpg`), type: "jpeg", quality: 70 });
      }
      console.log(`previa ${arquivo}`);
      await page.close();
      continue;
    }
    const frames = join(tmpdir(), `guardiao-frames-${arquivo}`);
    rmSync(frames, { recursive: true, force: true });
    mkdirSync(frames, { recursive: true });
    const total = Math.round(duracao * FPS);
    for (let f = 0; f < total; f++) {
      await page.evaluate((t) => window.render(t), f / FPS);
      await page.screenshot({ path: join(frames, `${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
    }
    const saida = join(OUT, "videos", `${arquivo}.mp4`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(frames, "%05d.jpg"),
      "-c:v", "libopenh264", "-pix_fmt", "yuv420p", "-b:v", "8M", "-movflags", "+faststart", saida]);
    rmSync(frames, { recursive: true, force: true });
    console.log(`ok ${arquivo}: ${total} frames -> ${saida}`);
    await page.close();
  }
}

if (modo === "pecas" || modo === "tudo") await renderPecas();
if (modo === "videos" || modo === "tudo") await renderVideos();
await browser.close();
