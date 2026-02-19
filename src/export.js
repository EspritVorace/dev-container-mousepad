/**
 * Dev Command Hub — Export haute résolution
 *
 * Exporte le cheatsheet HTML en 300 DPI au format 900 × 400 mm.
 *
 * Usage :
 *   npm run export:png
 *   npm run export:jpeg
 *   npm run export:tiff
 *   npm run export:pdf
 *   npm run export:all
 *
 * Options supplémentaires (après --) :
 *   --dpi <number>      Résolution (défaut : 300)
 *   --quality <number>  Qualité JPEG (1-100, défaut : 95)
 *   --output <dir>      Dossier de sortie (défaut : ./output)
 */

const { chromium } = require("playwright");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// ── Configuration ────────────────────────────────────────────
const WIDTH_MM = 900;
const HEIGHT_MM = 400;

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    format: "png",
    dpi: 300,
    quality: 95,
    outputDir: path.join(process.cwd(), "output"),
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--format":
        config.format = args[++i]?.toLowerCase();
        break;
      case "--dpi":
        config.dpi = parseInt(args[++i], 10);
        break;
      case "--quality":
        config.quality = parseInt(args[++i], 10);
        break;
      case "--output":
        config.outputDir = path.resolve(args[++i]);
        break;
    }
  }

  return config;
}

function mmToPixels(mm, dpi) {
  return Math.round((mm / 25.4) * dpi);
}

function mmToInches(mm) {
  return mm / 25.4;
}

async function exportPDF(page, outputPath) {
  const widthIn = mmToInches(WIDTH_MM);
  const heightIn = mmToInches(HEIGHT_MM);

  await page.pdf({
    path: outputPath,
    width: `${widthIn}in`,
    height: `${heightIn}in`,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    printBackground: true,
    scale: 1,
  });
}

async function captureScreenshot(page, dpi) {
  // Playwright screenshots are 1:1 pixel with viewport.
  // Pour obtenir du 300 DPI sur 900×400mm, on a besoin de :
  //   900mm / 25.4 * 300 = 10630 px
  //   400mm / 25.4 * 300 = 4724 px
  //
  // Stratégie : on utilise un viewport à 96 DPI natif (taille CSS)
  // puis deviceScaleFactor pour multiplier la résolution.

  const CSS_DPI = 96;
  const scaleFactor = dpi / CSS_DPI; // 300/96 ≈ 3.125

  const cssWidth = mmToPixels(WIDTH_MM, CSS_DPI);  // ~3402 px
  const cssHeight = mmToPixels(HEIGHT_MM, CSS_DPI); // ~1512 px

  // Recréer un contexte avec le bon deviceScaleFactor
  const browser = page.context().browser();
  const context = await browser.newContext({
    viewport: { width: cssWidth, height: cssHeight },
    deviceScaleFactor: scaleFactor,
  });
  const hiResPage = await context.newPage();

  const htmlPath = path.join(__dirname, "cheatsheet.html");
  await hiResPage.goto(`file://${htmlPath}`);
  await hiResPage.waitForTimeout(3000);

  const buffer = await hiResPage.screenshot({ type: "png", fullPage: false });

  await context.close();

  return buffer;
}

async function exportImage(page, format, dpi, quality, outputPath) {
  console.log(`  Capture screenshot à ${dpi} DPI...`);
  const pngBuffer = await captureScreenshot(page, dpi);

  const expectedWidth = mmToPixels(WIDTH_MM, dpi);
  const expectedHeight = mmToPixels(HEIGHT_MM, dpi);

  console.log(`  Dimensions : ${expectedWidth} × ${expectedHeight} px`);

  let pipeline = sharp(pngBuffer).resize(expectedWidth, expectedHeight, {
    fit: "fill",
  });

  // Injecter les métadonnées DPI (résolution en pixels/inch)
  const density = dpi;

  switch (format) {
    case "png":
      pipeline = pipeline.png({ compressionLevel: 6 });
      break;
    case "jpeg":
    case "jpg":
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case "tiff":
      pipeline = pipeline.tiff({
        compression: "lzw",
        quality,
      });
      break;
    default:
      throw new Error(`Format image non supporté : ${format}`);
  }

  // Sharp supporte withMetadata pour injecter la densité
  pipeline = pipeline.withMetadata({ density });

  await pipeline.toFile(outputPath);
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const config = parseArgs();
  const formats =
    config.format === "all"
      ? ["png", "jpeg", "tiff", "pdf"]
      : [config.format];

  // Validation
  const validFormats = ["png", "jpeg", "jpg", "tiff", "pdf", "all"];
  if (!validFormats.includes(config.format)) {
    console.error(
      `❌ Format "${config.format}" non reconnu. Formats valides : png, jpeg, tiff, pdf, all`
    );
    process.exit(1);
  }

  // Créer le dossier de sortie
  fs.mkdirSync(config.outputDir, { recursive: true });

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   Dev Command Hub — Export haute résolution  ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();
  console.log(`  Format(s)  : ${formats.join(", ").toUpperCase()}`);
  console.log(`  Dimensions : ${WIDTH_MM} × ${HEIGHT_MM} mm`);
  console.log(`  Résolution : ${config.dpi} DPI`);
  console.log(
    `  Pixels     : ${mmToPixels(WIDTH_MM, config.dpi)} × ${mmToPixels(HEIGHT_MM, config.dpi)}`
  );
  console.log(`  Sortie     : ${config.outputDir}`);
  console.log();

  // Lancer le navigateur
  console.log("⏳ Lancement de Chromium...");
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const htmlPath = path.join(__dirname, "cheatsheet.html");
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ Fichier introuvable : ${htmlPath}`);
    process.exit(1);
  }

  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(3000);
  console.log("✅ Page chargée\n");

  for (const format of formats) {
    const ext = format === "jpg" ? "jpeg" : format;
    const filename = `dev-command-hub-${config.dpi}dpi.${ext}`;
    const outputPath = path.join(config.outputDir, filename);

    console.log(`📄 Export ${ext.toUpperCase()}...`);

    if (format === "pdf") {
      await exportPDF(page, outputPath);
      console.log(`  Dimensions : ${WIDTH_MM} × ${HEIGHT_MM} mm (vectoriel)`);
    } else {
      await exportImage(page, format, config.dpi, config.quality, outputPath);
    }

    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`  ✅ ${filename} (${sizeMB} Mo)\n`);
  }

  await browser.close();

  console.log("🎉 Export terminé !");
}

main().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
