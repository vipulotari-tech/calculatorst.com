import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
await fs.mkdir('audit/research',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const urls=['https://ahrefs.com/keyword-generator','https://www.omnicalculator.com/construction/concrete','https://www.inchcalculator.com/rebar-calculator/'];
const results=[];
for(const url of urls){
  try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForTimeout(1500);
    const body=await page.locator('body').innerText();
    const inputs=await page.locator('input').evaluateAll(es=>es.map(e=>({placeholder:e.placeholder,type:e.type,name:e.name})));
    const buttons=await page.locator('button').allTextContents();
    results.push({url,status:response?.status(),inputs,buttons,text:body.slice(0,18000)});
    await page.screenshot({path:`audit/research/${new URL(url).hostname}.png`});
    if(url.includes('ahrefs')){
      const field=page.locator('input[type=text],input:not([type])').filter({visible:true}).first();
      if(await field.count()){
        await field.fill('concrete stair calculator');
        const find=page.getByRole('button',{name:/find keywords|generate keywords/i}).first();
        if(await find.count()){await find.click();await page.waitForTimeout(2500);results.push({url,query:'concrete stair calculator',afterSubmit:(await page.locator('body').innerText()).slice(0,18000)});}
      }
    }
  }catch(e){results.push({url,error:e.message});}
}
await fs.writeFile('audit/research/browser-research.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(r=>({...r,text:r.text?.slice(0,1200),afterSubmit:r.afterSubmit?.slice(0,1500)})),null,2));
await browser.close();
