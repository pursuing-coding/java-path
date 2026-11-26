import { after, before, beforeEach, describe, test as nodeTest } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import { Builder, By, Key } from "selenium-webdriver";
import safari from "selenium-webdriver/safari.js";
import { setTimeout as delay } from "node:timers/promises";

export function suite(register) {
  describe("Safari", { concurrency: false }, () => {
    for (const width of [1440, 1024, 390]) describe(`Safari ${width}px`, { concurrency: false }, () => {
      let driver, service, origin, proxy, app, appUrl, run, confirm;
      const page = {
        evaluate: (fn, ...args) => driver.executeScript(fn, ...args),
        press: key => driver.actions().sendKeys(Key[key]).perform(),
        async reload() {
          await driver.navigate().refresh();
          // A navigated document can expose the static controls before app.js
          // has restored the lesson and attached the input and click handlers.
          await check(() => page.evaluate(() => document.querySelector(".level-item.is-active") !== null), true);
        },
        mockRun: handler => { run = handler; },
        confirm: handler => { confirm = handler; },
        locator(selector, index = 0) {
          const elements = () => driver.findElements(By.css(selector));
          const element = async () => (await elements())[index];
          return {
            nth: i => page.locator(selector, i),
            async click() { await click(await element()); },
            async fill(text) {
              // Seed exact multiline source fixtures without invoking editor auto-indent.
              const el = await element();
              await driver.executeScript("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', {bubbles:true}));", el, text);
            },
            async type(text) {
              const el = await element();
              await el.clear();
              const keys = text.split("\n").flatMap((line, i) => i ? [Key.RETURN, line] : [line]);
              await el.sendKeys(...keys);
            },
            count: async () => (await elements()).length,
            value: async () => (await element()).getProperty("value"),
            text: async () => (await element()).getText(),
            attribute: async name => (await element()).getAttribute(name),
            enabled: async () => (await element()).isEnabled(),
            visible: async () => Boolean(await element()) && (await element()).isDisplayed(),
          };
        },
        title: () => driver.getTitle()
      };
      async function click(target) {
        assert.ok(target, "Click target is missing");
        await driver.executeScript("arguments[0].scrollIntoView({block:'center', inline:'center', behavior:'instant'})", target);
        await check(() => driver.executeScript(function (node) {
          const rect = node.getBoundingClientRect();
          const left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right);
          const top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom);
          return left < right && top < bottom &&
            node.contains(document.elementFromPoint((left + right) / 2, (top + bottom) / 2));
        }, target), true);
        const handle = confirm;
        confirm = undefined;
        try {
          await target.click();
        } catch (error) {
          if (!handle || error.name !== "UnexpectedAlertOpenError") throw error;
        }
        if (handle) await handle(await driver.wait(() => driver.switchTo().alert().catch(error => {
          if (error.name !== "NoSuchAlertError") throw error;
          return false;
        }), 5000, "Expected the reset confirmation"));
      }
      before(async () => {
        const probe = http.createServer();
        await new Promise(resolve => probe.listen(0, "127.0.0.1", resolve));
        const port = probe.address().port;
        await new Promise(resolve => probe.close(resolve));
        appUrl = "http://127.0.0.1:" + port;
        app = spawn(process.execPath, ["server.js"], {env: {...process.env, PORT:String(port)}});
        await check(async () => (await fetch(appUrl)).ok, true);
        proxy = http.createServer(async (req, res) => {
          try {
            if (req.method === "POST" && req.url === "/api/run" && run) {
              const body = [];
              for await (const chunk of req) body.push(chunk);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(await run(JSON.parse(Buffer.concat(body)))));
              return;
            }
            const headers = { ...req.headers, host: new URL(appUrl).host };
            if (headers.origin === origin) headers.origin = appUrl;
            const request = http.request(new URL(req.url, appUrl), {
              method: req.method,
              headers
            }, (response) => {
              res.writeHead(response.statusCode, response.headers);
              response.pipe(res);
            });
            request.on("error", (error) => {
              if (!res.headersSent) res.writeHead(502);
              res.end(String(error));
            });
            res.on("close", () => request.destroy());
            req.pipe(request);
          } catch (error) { res.writeHead(500); res.end(String(error)); }
        });
        await new Promise(resolve => proxy.listen(0, "127.0.0.1", resolve));
        origin = "http://127.0.0.1:" + proxy.address().port;
        service = new safari.ServiceBuilder("/usr/bin/safaridriver").build();
        driver = await new Builder().disableEnvironmentOverrides().usingServer(await service.start()).forBrowser("safari").build();
        const [dx,dy] = await page.evaluate(() => [outerWidth-innerWidth, outerHeight-innerHeight]);
        await driver.manage().window().setRect({x:0,y:0,width:width+dx,height:(width === 390 ? 844 : 980)+dy});
      });
      beforeEach(async () => {
        run = confirm = undefined;
        await driver.get(origin);
        await check(() => page.evaluate(() => document.querySelector(".level-item.is-active") !== null), true);
        await page.evaluate(() => localStorage.clear());
        await page.reload();
      });
      after(async () => {
        try { await driver?.quit(); } finally {
          await service?.kill();
          app?.kill();
          if (proxy) {
            proxy.closeAllConnections();
            await new Promise(resolve => proxy.close(resolve));
          }
        }
      });
      register((name, fn) => nodeTest(name, () => fn({page})));
    });
  });
}
export async function check(read, expected, mode = "equal") {
  const deadline = Date.now() + 5000;
  while (true) {
    try {
      const value = await read();
      if (mode === "contains") assert.ok(value.includes(expected), JSON.stringify({value,expected}));
      else if (mode === "notMatch") assert.doesNotMatch(value, expected);
      else if (expected instanceof RegExp) assert.match(value, expected);
      else assert.deepEqual(value, expected);
      return;
    } catch (error) { if (Date.now() >= deadline) throw error; await delay(80); }
  }
}
