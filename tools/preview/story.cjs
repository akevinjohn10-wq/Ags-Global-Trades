const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader'] });
  for (const [n,vp] of [['d',{width:1440,height:900}],['m',{width:390,height:844}]]) {
    const p = await b.newPage({ viewport:vp, isMobile:n==='m', hasTouch:n==='m' });
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('http://localhost:8123/'); await p.waitForTimeout(2500);
    const top = await p.evaluate(()=>{const s=document.getElementById('services'); return [s.offsetTop, s.offsetHeight-innerHeight];});
    for (const f of [0.02,0.12,0.2,0.27,0.33,0.4,0.48,0.56]) {
      // walk gradually so frames load
      await p.evaluate(y=>scrollTo(0,y), top[0]+top[1]*f); await p.waitForTimeout(2500);
      await p.screenshot({path:`/tmp/scr/s_${n}_${String(Math.round(f*100)).padStart(2,'0')}.jpg`, quality:70, type:'jpeg'});
    }
    console.log(n, errs);
    await p.close();
  }
  await b.close();
})();
