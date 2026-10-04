// Spot-check screenshots of selected slides for visual QA.
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const targets = ['slide_01', 'slide_06', 'slide_07', 'slide_12'];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  for (const t of targets) {
    await page.goto('file:///home/z/my-project/download/slides/' + t + '.html');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/home/z/my-project/scripts/assets/deck_' + t + '.png' });
    console.log('shot', t);
  }
  await browser.close();
})();
