const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1440,height:900} });
  await p.goto('http://localhost:8123/'); await p.waitForTimeout(2500);
  await p.screenshot({path:'/tmp/scr/f_hero.jpg', quality:70, type:'jpeg'});
  const y = await p.evaluate(()=>{const s=document.getElementById('products')||document.getElementById('about'); return s? s.offsetTop:2000;});
  await p.evaluate(y=>scrollTo(0,y), y); await p.waitForTimeout(1500);
  await p.screenshot({path:'/tmp/scr/f_prod.jpg', quality:70, type:'jpeg'});
  console.log(await p.evaluate(()=>getComputedStyle(document.querySelector('h1')).fontFamily));
  await b.close();
})();
