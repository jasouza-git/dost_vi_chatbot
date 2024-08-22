
/* ----- MODULES TO IMPORT ----- */
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs').promises;
//const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const path = require('node:path');

/* ----- VARIABLES ----- */
var main, web;

/* ----- MAIN BROWSER ----- */
const loadLogin = async () => {
  web.close();
  const browser_login = await puppeteer.launch({
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      userDataDir: path.join(__dirname, 'userdata'),
      headless: false,
      args: [ '--disable-infobars' ]
  });
  const [page] = await browser_login.pages();
  //await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://business.facebook.com/login/?next=https%3A%2F%2Fbusiness.facebook.com%2F%3Fnav_ref%3Dbiz_unified_f3_login_page_to_mbs%26biz_login_source%3Dbiz_unified_f3_fb_login_button%26join_id%3Dd6177472-2033-4acc-8051-61defc4532b2');
  await page.waitForFunction( title => document.title == title, {timeout: 0}, 'Meta Business Suite');
  await browser_login.close();
  main.webContents.send('login-status', 0);
  loadBrowser();
}
const loadBrowser = async () => {
  await fs.writeFile(path.join(__dirname, 'userdata', 'Default', 'Preferences'), '{"browser":{"window_placement":{"bottom":925,"left":544,"maximized":false,"right":1365,"top":179,"work_area_bottom":1032,"work_area_left":0,"work_area_right":1920,"work_area_top":0}}}', 'utf8');
    web = await puppeteer.launch({
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        userDataDir: path.join(__dirname, 'userdata')
    });
    const page = await web.newPage();
    await page.goto('https://business.facebook.com/latest/inbox/all');
    const title = await page.title();
    if (title == 'Facebook') {
      main.webContents.send('login-status', 1);
      return;
    } else if (title != 'Meta Business Suite') {
      main.webContents.send('login-status', 2);
      return;
    }
    main.webContents.send('login-status', 3);
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
  loadBrowser();


  ipcMain.on('action', (event, action) => {
    if (action == 'login') loadLogin();
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
