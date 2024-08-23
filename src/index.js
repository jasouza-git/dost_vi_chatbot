
/* ----- MODULES TO IMPORT ----- */
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs').promises;
const puppeteer = require('puppeteer-core');
const path = require('node:path');
const {default: ollama} = require('ollama');
const showdown = require('showdown');

/* ----- CONFIGURATIONS ----- */
const config = {
  'browser': 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'userdat': path.join(process.env.APPDATA, 'dost-vi-chatbot'), //path.join(__dirname, 'userdata'),
  'prefers': '{"browser":{"window_placement":{"bottom":925,"left":544,"maximized":false,"right":1365,"top":179,"work_area_bottom":1032,"work_area_left":0,"work_area_right":1920,"work_area_top":0}}}',
  'inboxid': '?asset_id=382494194953080&selected_item_id=100077581671764&mailbox_id=&thread_type=FB_MESSAGE',
  'sleepms': 2000,
  'timeout': 0,
  'fmodels': ['tinyllama'],
  'aigreet': "😊 Hi there! I'm Chatbot by DOST, your helpful assistant for all things related to the Department of Science and Technology (DOST). I'd be delighted to assist you with any questions or concerns about DOST programs, scholarships, and services. What's on your mind? 🤔",
  'devtool': true,
};

/* ----- VARIABLES ----- */
var main, web, browser, chats = {
  '': [ {'role':'assistant', 'content':config['aigreet']} ] // Conversation by no user but the interface
};
var md2html = new showdown.Converter();

/* ----- MAIN BROWSER ----- */
const browse = async (site, end='', func=()=>{}) => {
  if (web != undefined && web.close != undefined) web.close();
  browser = await puppeteer.launch({
    executablePath: config['browser'],
    userDataDir: config['userdat'],
    headless: typeof end == 'number',
    args: [ '--disable-infobars', '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu' ]
  });
  browser.on('disconnected', ()=> {
    console.log('Browser closed');
    main.webContents.send('action', 'browser closed');
    stage0();
  });
  const [page] = await browser.pages();
  await page.goto(site);
  if (typeof end == 'string' && end.length != 0) {
    await page.waitForFunction( title => document.title == title, {timeout: config['timeout']}, end);
    await browser.close();
    func(null, null);
  } else func(page, browser);
}
const stage0 = async () => {
  // Set chrome userdata
  await fs.mkdir(path.join(config['userdat'], 'Default'), { recursive: true });
  await fs.writeFile(path.join(config['userdat'], 'Default', 'Preferences'), config['prefers'], 'utf8');
  
  // Set config variable "browser"
  try {
    const f = await fs.readFile(path.join(config['userdat'], 'chrome_path.txt'), 'utf8');
    config['browser'] = f;
  } catch (err) {
    if (err.code == 'ENOENT') await fs.writeFile(path.join(config['userdat'], 'chrome_path.txt'), config['browser'], 'utf8');
  }
  main.webContents.send('config-browser', config['browser']);

  web = await puppeteer.launch({
      executablePath: config['browser'],
      userDataDir: config['userdat'],
      args: [ '--disable-infobars', '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu' ],
      //headless: false,
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
    main.webContents.send('login-status', 3);
  } catch (e) {
    main.webContents.send('login-status', 2);
  }

  // Wait for chats to load
  await page.waitForSelector('[data-pagelet=GenericBizInboxThreadListViewBody] [role=presentation]', {timeout:config['timeout']});
  
  // Set current chat has anchor chat
  await page.evaluate(() => {
    [...document.querySelectorAll('[data-pagelet=GenericBizInboxThreadListViewBody] [role=presentation]')].filter(x=>window.getComputedStyle(x).backgroundColor=='rgb(245, 246, 247)')[0].setAttribute('id','anchor_object');
  });

  // Keep on scanning for unread messages and reply
  var chat = null;
  main.webContents.send('login-status', 4);
  while (true) {
    // Get unread message
    chat = await page.evaluate(() => {
      var x = [...document.querySelectorAll('[data-pagelet=GenericBizInboxThreadListViewBody] [role=presentation]')].filter(x=>window.getComputedStyle(x.querySelector(':scope>div>div:nth-child(2)>div:first-child>div:first-child>div>div>div:nth-child(2)')).fontWeight == '700');
      if (x.length == 0) return null;
      x[0].click();
      return {
        'name': x[0].querySelector(':scope>div>div:nth-child(2)>div:first-child>div:first-child').innerText.trim(),
        //'img': x[0].querySelector(':scope>div>div:first-child>div>div>div:first-child>img').getAttribute('src'),
        'date': x[0].querySelector(':scope>div>div:nth-child(2)>div:nth-child(2)>div:first-child>div>div:first-child').innerText.replace(/(.*)\n((\d+:\d+).*(AM|PM))?.*/g, '$3 $4 $1').trim(),
      }
    });
    // No unread message, wait 1 second to try again
    if (chat == null) {
      await new Promise(res => setTimeout(res, config['sleepms']));
      continue;
    } else main.webContents.send('login-status', 5);
    // Wait for messaging area to load
    await page.waitForFunction(chat => {
      const dom = document.querySelector('[data-pagelet="BizInboxDetailViewHeaderSectionWrapper"] [style="-webkit-line-clamp: 1;"]');
      return dom != null && dom.innerText.trim() == chat['name'];
    }, {timeout:config['timeout']}, chat);

    // Ollama Chat
    await page.waitForSelector('[data-pagelet="BizInboxMessengerMessageListContainer"]>div>div>div:nth-child(2)>div>div', {timeout:config['timeout']});
    var msg = await page.evaluate(() => [...document.querySelectorAll('[data-pagelet="BizInboxMessengerMessageListContainer"]>div>div>div:nth-child(2)>div>div')].filter(x=>x.classList.length==10).slice(-1)[0].innerText);
    if (chats[chat['name']] == undefined) chats[chat['name']] = [{role:'user',content: msg}];
    else chats[chat['name']].push({role:'user',content: msg});
    const res = await ollama.chat({
      model: config['fmodels'][0],
      messages: chats[chat['name']],
    });
    chats[chat['name']].push(res.message);

    // Chat actions
    if (res.message.content.indexOf('<|END|>') != -1) {
      res.message.content.replace('<|END|>','');
      res.message.content += '--- Chat terminated, cleared memory ---';
      delete chats[chat['name']];
    }

    // Record log
    var date = new Date();
    main.webContents.send('log', [`${date.getFullYear()}/${String(date.getMonth()).padStart(2,'0')}/${String(date.getDate())} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`, chat['name'], res.message.content]);

    // Send message
    await page.waitForSelector('[data-pagelet="BizP13NInboxMessengerDetailView"] textarea', {timeout:config['timeout']});
    var lines = res.message.content.split('\n');
    for(var n = 0; n < lines.length; n++){
      await page.type('[data-pagelet="BizP13NInboxMessengerDetailView"] textarea', lines[n]);
      if (n+1 != lines.length) {
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
      }
    }
    await page.click('[aria-label="Send"]');
    main.webContents.send('login-status', 4);

    // Go to anchor account to wait again
    console.log(`Replied to ${chat['name']}`)
    await page.click('#anchor_object');
    await new Promise(res => setTimeout(res, config['sleepms']));
  }
}

/* ----- Creates the Graphical Window ----- */
const create_window = () => {
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
  main.setIcon('asset/dost.png');
  main.loadFile('index.html');
  stage0();

  main.webContents.send('chatbot', config['aigreet']);

  ipcMain.on('action', async (event, action) => {
    if (action == 'login') browse('https://business.facebook.com/login/?next=https%3A%2F%2Fbusiness.facebook.com%2F%3Fnav_ref%3Dbiz_unified_f3_login_page_to_mbs%26biz_login_source%3Dbiz_unified_f3_fb_login_button%26join_id%3Dd6177472-2033-4acc-8051-61defc4532b2', 'Meta Business Suite', stage0);
    else if (action == 'browser') {
      main.webContents.send('login-status', 0);
      browse('https://business.facebook.com/login/?next=https%3A%2F%2Fbusiness.facebook.com%2F%3Fnav_ref%3Dbiz_unified_f3_login_page_to_mbs%26biz_login_source%3Dbiz_unified_f3_fb_login_button%26join_id%3Dd6177472-2033-4acc-8051-61defc4532b2');
    } else if (action == 'browser closed' && browser != undefined && browser.close != undefined) browser.close();
    else if (action == 'resetchat') {
      chats[''] = [{'role':'assistant', 'content':config['aigreet']}];
      main.webContents.send('chatbot', config['aigreet']);
    } else if (action == 'logout') {
      main.webContents.send('login-status', 0);
      browse('https://business.facebook.com/', 0, async (page,browser) => {
        // Check if logged in
        var title = await page.title();
        if (title == 'Facebook') return await browser.close();
        // Click account options
        await page.waitForSelector('[data-pagelet="BizKitPresenceSelector"] a[href]', {timeout:config['timeout']});
        await page.click('[data-pagelet="BizKitPresenceSelector"] a[href]');
        // Click logout button
        await page.waitForSelector('.uiContextualLayerPositioner  [data-surface="/bizweb:home"] div:last-child>[role="button"]', {timeout:config['timeout']});
        await page.click('.uiContextualLayerPositioner  [data-surface="/bizweb:home"] div:last-child>[role="button"]');
        // Success
        var title = await page.title();
        if (title != 'Facebook') main.webContents.send('log-status', 2);
        else await browser.close();
      });
    }
  });
  ipcMain.on('chatbot', async (event, msg) => {
    chats[''].push({role:'user',content: msg});
    console.log('Making request to ollama');
    const res = await ollama.chat({
      model: config['fmodels'][0],
      messages: chats[''],
    });
    chats[''].push(res.message);
    main.webContents.send('chatbot', md2html.makeHtml(res.message.content));
  });
  ipcMain.on('config-browser', async (event, data) => {
    await fs.writeFile(path.join(config['userdat'], 'chrome_path.txt'), data, 'utf8')
    config['browser'] = data;
  })
  if (config['devtool']) main.webContents.openDevTools();
}


/* ----- WINDOW EVENTS ----- */
app.whenReady().then(() => {
  create_window()
  app.on('activate', () => { // For MacOS
    if (BrowserWindow.getAllWindows().length === 0) create_window()
  })
})
app.on('window-all-closed', async () => { // For MacOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
})
