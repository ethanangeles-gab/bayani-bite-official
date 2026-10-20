const { chromium } = require('C:/Users/Ethan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
 const browser = await chromium.launch({headless:true, channel:'msedge'});
 const context = await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 let page = await context.newPage();
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('BAYANI_BITE_Dashboard/BAYANI_BITE_Dashboard.html')).href);
 await page.waitForSelector('#impact');
 assert.match(await page.locator('#impact').innerText(),/6,000/);
 assert.match(await page.locator('#ongoing').innerText(),/−₱28,700/);
 assert.match(await page.locator('#forecast-value').innerText(),/1,430/);
 const all = await page.evaluate(() => packages().map(ids=>packageResult(ids)));
 for(const p of all){
  const costs={A:18,B:22,C:8,D:12,E:16}, lowers={A:6,B:4,C:1,D:2,E:3};
  const cost=p.ids.reduce((s,id)=>s+costs[id],0), sum=p.ids.reduce((s,id)=>s+lowers[id],0);
  const uplift=sum*(p.ids.length>1?.75:1);
  assert.equal(p.cost,cost);assert.equal(p.uplift,uplift);
  assert.equal(p.impact,4*uplift-cost);assert.equal(p.feasible,cost<=27);
 }
 await page.selectOption('#metric','rate');
 await page.selectOption('#from','10');
 assert.equal(await page.locator('#trend-table tbody tr').count(),3);
 await page.selectOption('#to','5');
 assert.equal(await page.locator('#from').inputValue(),'5');
 assert.equal(await page.locator('#trend-table tbody tr').count(),1);
 await page.selectOption('#branch','North Gate');
 assert.match(await page.locator('#branch-detail').innerText(),/42.4%/);
 await page.locator('#clear').click();
 assert.equal(await page.locator('#impact').innerText(),'₱0');
 assert.match(await page.locator('#comparison').innerText(),/C \(alternative\)/);
 await page.locator('#options input[value=A]').check();
 await page.locator('#options input[value=C]').check();
 assert.match(await page.locator('#impact').innerText(),/5,000/);
 assert.match(await page.locator('#uplift').innerText(),/5,250/);
 await page.locator('#options input[value=B]').check();
 assert.equal(await page.locator('#feasible').innerText(),'Over budget');
 await page.locator('#choose-c').click();
 await page.selectOption('#alternative','');
 assert.match(await page.locator('#comparison').innerText(),/Keep current operations \(alternative\)/);
 await page.locator('.bulletin summary').click();
 await page.fill('#budget-input','0');
 await page.click('#apply-scenario');
 assert.equal(await page.locator('#feasible').innerText(),'Over budget');
 await page.click('#clear');
 assert.equal(await page.locator('#alternative').isDisabled(),true);
 await page.fill('#budget-input','20');await page.fill('#lower-C','3');
 await page.click('#apply-scenario');await page.click('#choose-c');
 assert.equal(await page.locator('#impact').innerText(),'+₱4,000');
 assert.match(await page.locator('#top-status').innerText(),/What-if/);
 await page.fill('#bulletin-note','');await page.check('#bulletin-confirm');await page.click('#apply-scenario');
 assert.match(await page.locator('#scenario-message').innerText(),/Paste the actual bulletin/);
 // Export a hypothetical scenario and verify it survives a completely new browser context.
 await page.uncheck('#bulletin-confirm');
 await page.locator('summary').filter({hasText:'AI assistance'}).click();
 await page.fill('#ai-followup','QA test only, not a real student follow-up.');
 await page.fill('#ai-response','QA persistence test.');
 const downloadPromise=page.waitForEvent('download');
 await page.click('#download');
 const download=await downloadPromise;
 const temp=path.resolve('BAYANI_BITE_Dashboard/qa_snapshot.html');
 await download.saveAs(temp);
 const second=await browser.newContext();
 const loaded=await second.newPage();
 await loaded.goto(pathToFileURL(temp).href);
 assert.equal(await loaded.locator('#impact').innerText(),'+₱4,000');
 assert.equal(await loaded.locator('#ai-followup').inputValue(),'QA test only, not a real student follow-up.');
 await second.close();
 for (let i = 0; i < 10; i++) {
  try {
   require('node:fs').unlinkSync(temp);
   break;
  } catch (e) {
   if (i === 9) throw e;
   await new Promise(r => setTimeout(r, 200));
  }
 }
 // Restore pristine initial state for the delivered screenshots.
 await page.evaluate(()=>localStorage.clear());
 await page.close();
 page = await context.newPage();
 await page.goto(pathToFileURL(path.resolve('BAYANI_BITE_Dashboard/BAYANI_BITE_Dashboard.html')).href);
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});
 await page.screenshot({path:'BAYANI_BITE_Dashboard/Dashboard_Overview.png',fullPage:false});
 await page.screenshot({path:'BAYANI_BITE_Dashboard/Dashboard_Full.png',fullPage:true});
 await page.locator('#pilot').scrollIntoViewIfNeeded();
 await page.evaluate(()=>window.scrollTo(0,document.querySelector('#pilot').offsetTop-90));
 await page.screenshot({path:'BAYANI_BITE_Dashboard/Dashboard_Pilot.png',fullPage:false});
 await page.setViewportSize({width:390,height:844});
 await page.goto(pathToFileURL(path.resolve('BAYANI_BITE_Dashboard/BAYANI_BITE_Dashboard.html')).href);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 await page.screenshot({path:'BAYANI_BITE_Dashboard/Dashboard_Mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 await browser.close();
 console.log('PASS: all 32 packages; source formulas; filters; branch drill-down; zero, multi-option and over-budget choices; scenario edits; bulletin guard; standalone export persistence; mobile overflow; no browser errors. Screenshots captured.');
})().catch(e=>{console.error(e);process.exit(1)});


