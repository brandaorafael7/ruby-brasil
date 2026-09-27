const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,860'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 860 });

  console.log('Navegando para Home...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const artifactDir = 'C:\\Users\\55799\\.gemini\\antigravity\\brain\\c376a2f3-1660-47c8-ab23-c88fce0aee19';
  const homeShot = path.join(artifactDir, 'ruby-brasil-home.png');
  await page.screenshot({ path: homeShot });
  console.log('Screenshot Home salvo em:', homeShot);

  console.log('Navegando para Admin...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const adminShot = path.join(artifactDir, 'ruby-brasil-admin.png');
  await page.screenshot({ path: adminShot });
  console.log('Screenshot Admin salvo em:', adminShot);

  await browser.close();
  console.log('Capturas concluídas com sucesso!');
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
