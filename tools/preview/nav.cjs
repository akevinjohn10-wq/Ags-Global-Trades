const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [n,vp] of [['d',{width:1440,height:900}],['m',{width:390,height:844}]]) {
    const p = await b.newPage({ viewport:vp, isMobile:n==='m', hasTouch:n==='m', deviceScaleFactor:2 });
    await p.goto('http://localhost:8123/'); await p.waitForTimeout(2500);
    await p.screenshot({path:`/tmp/scr/nav_${n}.jpg`, quality:80, type:'jpeg', clip:{x:0,y:0,width:vp.width,height:n==='d'?300:400}});
    await p.close();
  }
  await b.close();
})();
