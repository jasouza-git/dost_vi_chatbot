
/* ----- MODULES TO IMPORT ----- */
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs').promises;
const puppeteer = require('puppeteer-core');
const path = require('node:path');

/* ----- CONFIGURATIONS ----- */
const config = {
  'browser': 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'userdat': path.join(__dirname, 'userdata'),
  'prefers': '{"browser":{"window_placement":{"bottom":925,"left":544,"maximized":false,"right":1365,"top":179,"work_area_bottom":1032,"work_area_left":0,"work_area_right":1920,"work_area_top":0}}}',
  'inboxid': '?asset_id=382494194953080&selected_item_id=100077581671764&mailbox_id=&thread_type=FB_MESSAGE',
}

/* ----- VARIABLES ----- */
var main, web;

/* ----- MAIN BROWSER ----- */
const browse = async (site, end='', func=()=>{}) => {
  web.close();
  const browser = await puppeteer.launch({
    executablePath: config['browser'],
    userDataDir: config['userdat'],
    headless: false,
    args: [ '--disable-infobars', '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu' ]
  });
  const [page] = await browser.pages();
  await page.goto(site);
  if (end.length != 0) {
    await page.waitForFunction( title => document.title == title, {timeout: 0}, end);
    await browser.close();
  }
  func();
}
const stage0 = async () => {
  await fs.mkdir(path.join(config['userdat'], 'Default'), { recursive: true });
  await fs.writeFile(path.join(config['userdat'], 'Default', 'Preferences'), config['prefers'], 'utf8');
  web = await puppeteer.launch({
      executablePath: config['browser'],
      userDataDir: config['userdat'],
      args: [ '--disable-infobars', '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu' ],
      headless: false,
  });
  var page;
  try {
    page = await web.newPage();
    await page.goto(`https://business.facebook.com/latest/inbox/all/${config['inboxid']}`);
    const title = await page.title();
    if (title == 'Facebook') {
      main.webContents.send('login-status', 1);
      return;
    } else if (title != 'Meta Business Suite') {
      main.webContents.send('login-status', 2);
      return;
    }
  } catch (e) {
    main.webContents.send('log-status', 2);
  }
  main.webContents.send('login-status', 3);

  // Get chats
  await page.waitForSelector('[data-pagelet=GenericBizInboxThreadListViewBody] [role=presentation]');
  
  const chats = await page.evaluate(() => [...document.querySelectorAll('[data-pagelet=GenericBizInboxThreadListViewBody] [role=presentation]')].map(x=>{
    while (x.querySelector(':scope>div>div:first-child>div>div>div:first-child>img') == null);
    return {
      'name': x.querySelector(':scope>div>div:nth-child(2)>div:first-child>div:first-child').innerText.trim(),
      'unread': window.getComputedStyle(x.querySelector(':scope>div>div:nth-child(2)>div:first-child>div:first-child>div>div>div:nth-child(2)')).fontWeight == '700',
      'img': x.querySelector(':scope>div>div:first-child>div>div>div:first-child>img').getAttribute('src'),
      'date': x.querySelector(':scope>div>div:nth-child(2)>div:nth-child(2)>div:first-child>div>div:first-child').innerText.replace(/(.*)\n((\d+:\d+).*(AM|PM))?.*/g, '$3 $4 $1').trim(),
      //'dom': x
    }
  }));
  console.log(chats);

  
  for(var n = 0; n < chats.length; n++) {
    var chat = chats[n];
    if (!chat.unread) continue;
    // Click Account
    await page.evaluate(n => document.querySelectorAll('[data-pagelet=GenericBizInboxThreadListViewBody] [role=presentation]')[n].click(), n);
    await page.waitForFunction(chat => {
      const dom = document.querySelector('[data-pagelet="BizInboxDetailViewHeaderSectionWrapper"] [style="-webkit-line-clamp: 1;"]');
      return dom != null && dom.innerText.trim() == chat['name'];
    }, {}, chat);
    await page.waitForSelector('[data-pagelet="BizP13NInboxMessengerDetailView"] textarea');
    await page.type('[data-pagelet="BizP13NInboxMessengerDetailView"] textarea', 'Hello World');
    await page.click('[aria-label="Send"]');

  }
  console.log(chats);
}

/* ----- MAIN WINDOW ----- */
const createWindow = () => {
  main = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    }
  });
  main.setMenu(null);
  main.setTitle('DOST VI - Chatbot');
  main.setIcon('logo.png');
  main.loadFile('index.html');
  stage0();


  ipcMain.on('action', (event, action) => {
    if (action == 'login') browse('https://business.facebook.com/login/?next=https%3A%2F%2Fbusiness.facebook.com%2F%3Fnav_ref%3Dbiz_unified_f3_login_page_to_mbs%26biz_login_source%3Dbiz_unified_f3_fb_login_button%26join_id%3Dd6177472-2033-4acc-8051-61defc4532b2', 'Meta Business Suite', stage0);
    else if (action == 'browser') browse('https://business.facebook.com/login/?next=https%3A%2F%2Fbusiness.facebook.com%2F%3Fnav_ref%3Dbiz_unified_f3_login_page_to_mbs%26biz_login_source%3Dbiz_unified_f3_fb_login_button%26join_id%3Dd6177472-2033-4acc-8051-61defc4532b2');
  });
  //main.webContents.openDevTools();
}


app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { // For MacOS
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', async () => { // For MacOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
})
