const {app } = require("electron");
const fetch = require('node-fetch');

const puppeteer = require('puppeteer');

app.commandLine.appendSwitch('remote-debugging-port', '8315')

async function test() {
    const response = await fetch(`http://localhost:8315/json/versions/list?t=${Math.random()}`)
    const debugEndpoints = await response.json()

    let webSocketDebuggerUrl = debugEndpoints['webSocketDebuggerUrl ']

    const browser = await puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl
    })

    // use puppeteer APIs now!
}
test();