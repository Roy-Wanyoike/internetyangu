// Screenshot the architecture diagram at 2x device scale (300dpi-equivalent print quality).
// Diagram PNGs are sub-elements embedded into the ReportLab PDF (per SKILL.md diagram strategy).
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(__dirname, 'diagram_architecture.html'));
  await page.waitForTimeout(400);
  const el = await page.$('.canvas');
  await el.screenshot({ path: path.resolve(__dirname, 'assets/diagram_architecture.png') });
  await browser.close();
  console.log('diagram png done');
})();
