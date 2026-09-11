import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { hubCalculators } from '../src/data/hubCalculators.ts';
import { calculators } from '../src/data/calculators.ts';

const stage = process.argv[2] || 'baseline';
const origin = process.env.AUDIT_ORIGIN || 'https://calculatorst.com';
const directory = `audit/${stage}`;
await fs.mkdir(directory,{recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const slugs = [...new Set([...hubCalculators,...calculators].map(c=>c.slug))];
const pages = ['/', '/calculators/', '/construction/', '/about/', '/privacy/', ...slugs.map(s=>`/${s}/`)];
const results=[];
const representative = new Set(['/', '/calculators/', '/concrete-calculator/', '/concrete-slab-calculator/', '/gravel-calculator/', '/roof-pitch-calculator/', '/fence-cost-calculator/']);
await Promise.all(Array.from({length:3},async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  // Bulk audit visits must not inflate the owner's Analytics reports or request ads.
  await context.route(/google-analytics|googletagmanager|googlesyndication|doubleclick/,r=>r.abort());
  while(pages.length){
    const route=pages.shift(), page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try {
      const response=await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForTimeout(200);
      await page.locator('#cookie-decline').click({timeout:1000}).catch(()=>{});
      const state=await page.evaluate(()=>({
        width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        overflow:[...document.querySelectorAll('main *,header *,footer *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&getComputedStyle(el).position!=='absolute';}).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.trim().slice(0,70)})),
        forms:[...document.querySelectorAll('main form')].map(f=>({id:f.id,fields:[...f.querySelectorAll('input,select')].map(e=>({id:e.id,type:e.type,value:e.value,placeholder:e.placeholder,required:e.required,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>({value:o.value,text:o.text})):undefined}))})),
      }));
      const calcForm=page.locator('main form').first();
      if(await calcForm.count()){
        await calcForm.evaluate(form=>{
          for(const e of form.querySelectorAll('input[type=number]')){
            if(e.value==='')e.value=/price/.test(e.id)?'10':String(parseFloat((e.placeholder||'').replace(/^e\.g\.\s*/,''))||1);
            e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
          }
          form.requestSubmit();
        });
        await page.waitForTimeout(100);
        state.result=await page.locator('[id$="-results"], [data-results]').allTextContents();
        state.visibleErrors=await page.locator('[role=alert]:visible').allTextContents();
      }
      if(representative.has(route)){
        state.accessibility=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})).slice(0,10)}));
        const name=route==='/'?'home':route.split('/')[1];
        await page.screenshot({path:`${directory}/${name}-mobile.png`,fullPage:false});
        await page.evaluate(()=>document.documentElement.classList.add('dark'));
        await page.screenshot({path:`${directory}/${name}-dark.png`,fullPage:false});
        await page.setViewportSize({width:1440,height:1000});
        state.desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
        await page.screenshot({path:`${directory}/${name}-desktop.png`,fullPage:false});
      }
      results.push({route,status:response?.status(),...state,errors});
    }catch(error){results.push({route,error:error.message,errors});}
    await page.close();
    if(results.length%25===0)console.log(`${stage}: ${results.length} browser pages checked`);
  }
  await context.close();
}));
await browser.close();
await fs.writeFile(`${directory}/browser.json`,JSON.stringify(results.sort((a,b)=>a.route.localeCompare(b.route)),null,2));
console.log(JSON.stringify({checked:results.length,failed:results.filter(r=>r.error).length,runtimeErrors:results.filter(r=>r.errors.length).map(r=>({route:r.route,errors:r.errors})),overflow:results.filter(r=>r.scrollWidth>r.width).map(r=>r.route)},null,2));
