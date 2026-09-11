import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
const stage=process.argv[2]||'baseline';
const origin=process.env.AUDIT_ORIGIN||'https://calculatorst.com';
await fs.mkdir(`audit/${stage}`,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext();
// Do not serve or interact with live ads during the tracking test.
await context.route(/pagead2|doubleclick|googlesyndication/,r=>r.abort());
const page=await context.newPage(),events=[],consoleErrors=[];
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
page.on('request',r=>{if(/google-analytics|googletagmanager/.test(r.url())){const u=new URL(r.url());events.push({phase,host:u.host,path:u.pathname,measurementId:u.searchParams.get('tid')||u.searchParams.get('id'),event:u.searchParams.get('en'),consent:u.searchParams.get('gcs')});}});
page.on('requestfailed',r=>{if(/google-analytics|googletagmanager/.test(r.url()))events.push({phase,failed:new URL(r.url()).host,error:r.failure()?.errorText});});
let phase='new-visitor';
await page.goto(origin,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(2500);
async function snapshot(){return page.evaluate(()=>({consent:localStorage.getItem('cookieConsent'),dataLayer:(window.dataLayer||[]).map(v=>Array.from(v)).filter(v=>v[0]==='consent'||v[0]==='config'),scripts:[...document.scripts].map(s=>s.src).filter(s=>/google/.test(s))}));}
const first=await snapshot();
phase='accept';
await page.locator('#cookie-accept').click();
await page.waitForTimeout(2500);
const accepted=await snapshot();
phase='returning-visitor';
await page.goto(origin+'/concrete-slab-calculator/',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(2500);
const returning=await snapshot();
await fs.writeFile(`audit/${stage}/tracking.json`,JSON.stringify({origin,first,accepted,returning,events,consoleErrors},null,2));
console.log(JSON.stringify({first,accepted,returning,events,consoleErrors},null,2));
await browser.close();
