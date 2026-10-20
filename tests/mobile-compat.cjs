// Run with Node and Playwright available through NODE_PATH; no runtime dependency.
const { chromium, firefox } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../erome-downloader.user.js'), 'utf8');
const fixture = `<meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture</title>
<style>body{margin:0} .media-group{height:160px} img{width:100px;height:80px}</style>` +
    Array.from({length: 18}, (_, i) => `<div class="media-group"><div class="img"><img src="https://media.erome.com/${i}.jpg"></div></div>`).join('');

(async () => {
    const firefoxSaveOnly = process.env.TEST_ENGINE === 'firefox';
    const browser = await (firefoxSaveOnly ? firefox : chromium).launch({headless:true, ...(process.env.TEST_BROWSER_PATH ? {executablePath:process.env.TEST_BROWSER_PATH} : {})});
    console.log('Browser:', browser.version());
    let checks = 0;
    async function setup({width=360,height=740,touch=true,storage=true,requests=true,mode='success',writeFails=false,lang='pt-BR',partial=false,readFails=false,hostButtonStyles=false,menuOnly=false,firefoxAndroid=false,invalidBlob=false,vmDownloadMode=null,manager='Violentmonkey',desktopManager=false}={}) {
        const context = await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:firefoxSaveOnly?false:touch,
            ...(firefoxAndroid ? {userAgent:'Mozilla/5.0 (Android 15; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0'} : {})});
        const page = await context.newPage();
        const errors=[];
        page.on('pageerror', e=>errors.push(e.message));
        await page.route('**/*', route => route.request().url() === 'https://erome.com/a/test' ? route.fulfill({contentType:'text/html',body:fixture}) : route.fulfill({status:200,body:''}));
        await page.goto('https://erome.com/a/test');
        if (hostButtonStyles) await page.addStyleTag({content:'button:empty { display: none !important; } button { overflow: hidden; }'});
        await page.evaluate(({storage, requests, mode, writeFails,lang,partial,readFails,invalidBlob,vmDownloadMode,manager,desktopManager}) => {
            window.stats={active:0,maxActive:0,downloads:0,albums:[],getActive:0,maxGet:0,gets:0,revoked:[],progress:[],syntheticSaves:0,downloadOptions:[]};
            if(vmDownloadMode!==null) window.GM_info={scriptHandler:manager,version:'2.49.0',downloadMode:vmDownloadMode,platform:desktopManager?{os:'win',browserName:'firefox'}:{os:'android',browserName:'firefox'}};
            document.addEventListener('click',event=>{
                if(event.target.matches('a.erome-save-file') && !event.isTrusted) {
                    stats.syntheticSaves++;
                    if(stats.syntheticSaves>1) event.preventDefault();
                }
            },true);
            const revoke=URL.revokeObjectURL.bind(URL);
            URL.revokeObjectURL=url=>{stats.revoked.push(url);revoke(url);};
            window.GM_registerMenuCommand=(label,callback)=>{window.managerMenu={label,callback};};
            const values={tg_bot_token:'123456789:'+ 'a'.repeat(35),tg_chat_id:'123456789',lang};
            if(storage) {
                window.GM_getValue=(k,d)=>{if(readFails)throw Error('Read denied');return values[k] ?? d;};
                window.GM_setValue=(k,v)=>{if(writeFails)throw Error('Storage denied');values[k]=v;};
            }
            if(mode !== 'missing') window.GM_download=opts=>{
                stats.downloadOptions.push({url:opts.url,name:opts.name,saveAs:opts.saveAs});
                stats.downloads++; stats.active++; stats.maxActive=Math.max(stats.maxActive,stats.active);
                setTimeout(()=>{
                    stats.active--;
                    if(mode==='success') {opts.onprogress({loaded:5,total:5});opts.onload();}
                    else if(mode==='timeout') opts.ontimeout();
                    else opts.onerror({message:'Permission denied'});
                    // Duplicate manager callbacks must not complete an item twice.
                    opts.onerror({message:'Late failure'});
                },15);
            };
            if(requests) window.GM_xmlhttpRequest=opts=>{
                if(opts.method==='HEAD') {setTimeout(()=>opts.onload({status:200,responseHeaders:'Content-Length: 5'}),1);return;}
                if(opts.method==='GET') {
                    stats.gets++;
                    if(opts.onprogress) {
                        opts.onprogress({loaded:2,total:5});
                        stats.progress.push(document.querySelector('#erome-progress-label')?.textContent);
                    }
                    stats.getActive++;stats.maxGet=Math.max(stats.maxGet,stats.getActive);
                    setTimeout(()=>{
                        stats.getActive--;
                        if(partial && opts.url.endsWith('/0.jpg')) opts.onerror({message:'Offline'});
                        else opts.onload({status:200,response:new Blob(['hello'],{type:invalidBlob?'text/html':'image/jpeg'})});
                    },5);
                    return;
                }
                const album=opts.data.get('media');
                stats.albums.push(album ? JSON.parse(album).length : 1);
                const denied = partial && stats.albums.length===1;
                setTimeout(()=>opts.onload({status:200,responseText:JSON.stringify({ok:!denied,description:denied?'Upload denied':undefined})}),5);
            };
        }, {storage,requests,mode,writeFails,lang,partial,readFails,invalidBlob,vmDownloadMode,manager,desktopManager});
        // Export only in the test copy to observe release of group references.
        const instrumented = source.replace('                    const releaseGroup = () => {', `                    const releaseGroup = () => {
                        const refs = [...mediaGroup];
                        queueMicrotask(() => { window.released = (window.released || 0) + refs.filter(item => item.blob === null).length; });`);
        await page.addScriptTag({content:instrumented});
        if (menuOnly) await page.evaluate(()=>window.managerMenu.callback());
        else await page.locator('#erome-sidebar-trigger').click({timeout:3000});
        await page.waitForTimeout(320);
        return {context,page,errors};
    }
    async function done(env,label) {
        assert.deepEqual(env.errors,[], label+' page errors');
        await env.context.close(); checks++; console.log('PASS',label);
    }
    try {
        {
            const e=await setup({firefoxAndroid:true,vmDownloadMode:'browser'});
            const downloads=[];
            e.page.on('download', download=>downloads.push(download));
            for(let i=0;i<3;i++) await e.page.locator('.erome-media-item').nth(i).click();
            await e.page.locator('#erome-download-selected').click();
            for(let i=1;i<3;i++) {
                await e.page.waitForFunction(name=>document.querySelector('.erome-save-file')?.download===name,`${i}.jpg`);
                assert(await e.page.locator('#erome-download-selected').isDisabled());
                assert(await e.page.locator('#erome-progress-bar-wrap').evaluate(el=>el.classList.contains('visible')));
                const url=await e.page.locator('.erome-save-file').getAttribute('href');
                await e.page.waitForTimeout(300);
                assert.equal(await e.page.evaluate(()=>stats.gets),i+1,'queue advances only after preparation');
                assert(!(await e.page.evaluate(url=>stats.revoked.includes(url),url)));
                await e.page.locator('.erome-save-file').click();
            }
            await e.page.waitForFunction(()=>!document.querySelector('#erome-download-selected').disabled);
            const stats=await e.page.evaluate(()=>stats);
            // Browser API mode cannot use GM_download on Firefox Android.
            assert.equal(stats.downloads,0);
            assert.equal(stats.gets,3);
            assert.equal(stats.maxGet,1);
            assert.equal(stats.syntheticSaves,0);
            assert.equal(downloads.length,3);
            for(let i=0;i<downloads.length;i++) {
                assert.equal(downloads[i].suggestedFilename(),`${i}.jpg`);
                assert.equal(fs.readFileSync(await downloads[i].path(),'utf8'),'hello');
            }
            assert.match(await e.page.locator('#erome-download-mode').textContent(),/Firefox Android/);
            assert.match(await e.page.locator('#erome-progress-label').textContent(),/^100%/);
            assert.match(await e.page.locator('#erome-notification').textContent(),/3 salvamento\(s\) solicitado\(s\), 0 erro/);
            assert.equal(await e.page.locator('.erome-save-file').count(),1);
            assert.equal(stats.revoked.length,0);
            await done(e,'Violentmonkey browser API uses the tab save queue on Firefox Android');
        }
        {
            const e=await setup({firefoxAndroid:true,vmDownloadMode:'browser',manager:'Tampermonkey'});
            const downloading=e.page.waitForEvent('download');
            await e.page.locator('.erome-media-item').first().click();
            await e.page.locator('#erome-download-selected').click();
            const download=await downloading;
            await e.page.waitForFunction(()=>!document.querySelector('#erome-download-selected').disabled);
            assert.equal(fs.readFileSync(await download.path(),'utf8'),'hello');
            const stats=await e.page.evaluate(()=>stats);
            assert.equal(stats.downloads,0);
            assert.equal(stats.gets,1);
            assert.match(await e.page.locator('#erome-download-mode').textContent(),/Firefox Android/);
            await done(e,'Tampermonkey browser API also avoids GM_download on Firefox Android');
        }
        {
            const e=await setup({firefoxAndroid:true,vmDownloadMode:'native',manager:'Tampermonkey'});
            assert.equal((await e.page.locator('#erome-capabilities').textContent()).trim(),'');
            assert.match(await e.page.locator('#erome-download-mode').textContent(),/Firefox Android/);
            await done(e,'Tampermonkey native mode shows the Firefox Android save mode');
        }
        {
            const e=await setup({vmDownloadMode:'native',desktopManager:true,mode:'denied'});
            assert.match(await e.page.locator('#erome-capabilities').textContent(),/Use browser download API/);
            assert.match(await e.page.locator('#erome-download-mode').textContent(),/assistido/);
            await e.page.locator('.erome-media-item').first().click();
            await e.page.locator('#erome-download-selected').click();
            await e.page.waitForFunction(()=>!document.querySelector('#erome-download-selected').disabled);
            assert.equal(await e.page.evaluate(()=>stats.downloads),1);
            assert.equal(await e.page.locator('#erome-manual-downloads a').count(),1);
            await done(e,'Violentmonkey native mode warns and retains fallback on desktop');
        }
        {
            const e=await setup({firefoxAndroid:true,mode:'missing'});
            const downloading=e.page.waitForEvent('download');
            await e.page.locator('.erome-media-item').first().click();
            await e.page.locator('#erome-download-selected').click();
            const download=await downloading;
            await e.page.waitForFunction(()=>!document.querySelector('#erome-download-selected').disabled);
            assert.equal(fs.readFileSync(await download.path(),'utf8'),'hello');
            const stats=await e.page.evaluate(()=>stats);
            assert.equal(stats.downloads,0);
            assert.equal(stats.gets,1);
            assert.equal(await e.page.locator('#erome-capabilities').isVisible(),false);
            await done(e,'Firefox Android saves through the tab even when GM_download is absent');
        }
        {
            const e=await setup({firefoxAndroid:true});
            const downloads=[];
            e.page.on('download', download=>downloads.push(download));
            for(let i=0;i<3;i++) await e.page.locator('.erome-media-item').nth(i).click();
            await e.page.locator('#erome-download-selected').click();
            for(let i=1;i<3;i++) {
                await e.page.waitForFunction(name=>document.querySelector('.erome-save-file')?.download===name,`${i}.jpg`);
                assert(await e.page.locator('#erome-download-selected').isDisabled());
                assert(await e.page.locator('#erome-progress-bar-wrap').evaluate(el=>el.classList.contains('visible')));
                const url=await e.page.locator('.erome-save-file').getAttribute('href');
                await e.page.waitForTimeout(1700);
                assert.equal(await e.page.evaluate(()=>stats.gets),i+1,'queue waits for real save gesture');
                assert(!(await e.page.evaluate(url=>stats.revoked.includes(url),url)));
                await e.page.locator('.erome-save-file').click();
            }
            await e.page.waitForFunction(()=>!document.querySelector('#erome-download-selected').disabled);
            assert.equal(downloads.length,3);
            assert.match(await e.page.locator('#erome-progress-label').textContent(),/^100%/);
            assert((await e.page.evaluate(()=>stats.progress)).includes('13% · 2 B / 15 B'));
            assert(!/Preparando arquivo/.test(await e.page.locator('#erome-modal').textContent()));
            assert.equal(await e.page.evaluate(()=>stats.syntheticSaves),0);
            for(let i=0;i<downloads.length;i++) {
                assert.equal(downloads[i].suggestedFilename(),`${i}.jpg`);
                assert.equal(fs.readFileSync(await downloads[i].path(),'utf8'),'hello');
            }
            assert.match(await e.page.locator('#erome-notification').textContent(),/3 salvamento\(s\) solicitado\(s\), 0 erro/);
            assert.equal(await e.page.locator('.erome-save-file').count(),1);
            assert.equal(await e.page.evaluate(()=>stats.revoked.length),0);
            assert.equal(await e.page.evaluate(()=>stats.downloads),0);
            assert.equal(await e.page.evaluate(()=>stats.gets),3);
            assert.equal(await e.page.evaluate(()=>stats.maxGet),1);
            await done(e,'Firefox Android separate saves survive synthetic-download blocking, preserve pending files and show byte progress');
        }
        {
            const e=await setup({firefoxAndroid:true});
            await e.page.locator('#erome-modal-close').click();
            await e.page.waitForTimeout(300);
            const downloading=e.page.waitForEvent('download');
            await e.page.locator('.erome-inline-btn.download').first().click();
            const download=await downloading;
            assert.equal(fs.readFileSync(await download.path(),'utf8'),'hello');
            assert.equal(await e.page.evaluate(()=>stats.downloads),0);
            assert.equal(await e.page.evaluate(()=>stats.gets),1);
            assert(!(await e.page.locator('#erome-modal-overlay').isVisible()));
            assert(await e.page.locator('#erome-progress-bar-wrap').evaluate(el=>el.classList.contains('visible')));
            await done(e,'Firefox Android inline requests saving without opening the sidebar');
        }
        for(const invalidBlob of [false,true]) {
            const e=await setup({firefoxAndroid:true,partial:!invalidBlob,invalidBlob});
            for(let i=0;i<2;i++) await e.page.locator('.erome-media-item').nth(i).click();
            await e.page.locator('#erome-download-selected').click();
            await e.page.waitForFunction(()=>!document.querySelector('#erome-download-selected').disabled);
            assert.equal(await e.page.locator('.erome-save-file').count(),invalidBlob?0:1);
            assert.match(await e.page.locator('#erome-manual-downloads small').first().textContent(),/Erro ao baixar/);
            assert.equal(await e.page.locator('#erome-manual-downloads a:not(.erome-save-file)').count(),2);
            assert.equal(await e.page.evaluate(()=>stats.gets),2);
            await done(e,'Firefox Android automatic queue continues after errors invalidBlob='+invalidBlob);
        }
        if (firefoxSaveOnly) {
            console.log(checks+' Firefox engine save scenarios passed (Android UA, simulated GM APIs).');
            return;
        }
        {
            const e=await setup();
            await e.page.evaluate(()=>{
                window.siteClicked=false;
                document.querySelector('.media-group img').onclick=()=>{window.siteClicked=true;};
            });
            await e.page.mouse.click(10,10);
            assert(await e.page.evaluate(()=>siteClicked));
            await e.page.evaluate(()=>window.scrollTo(0,500));
            assert.equal(await e.page.evaluate(()=>window.scrollY),500);
            assert.notEqual(await e.page.evaluate(()=>document.body.style.overflow),'hidden');
            await e.page.locator('#erome-modal-close').click();
            await e.page.waitForTimeout(300);
            assert.equal(await e.page.evaluate(()=>window.scrollY),500);
            await done(e,'nonmodal sidebar leaves page clickable and scrollable without jumping on close');
        }
        {
            const e=await setup({hostButtonStyles:true});
            assert(await e.page.locator('#erome-modal').isVisible());
            await e.page.locator('#erome-modal-close').click();
            await e.page.waitForTimeout(300);
            await e.page.locator('#erome-sidebar-trigger').focus();
            await e.page.keyboard.press('Enter');
            assert(await e.page.locator('#erome-modal-overlay').isVisible());
            await e.page.locator('#erome-modal-close').click();
            await e.page.waitForTimeout(300);
            await e.page.locator('#erome-sidebar-trigger').focus();
            await e.page.keyboard.press('Space');
            assert(await e.page.locator('#erome-modal-overlay').isVisible());
            await done(e,'launcher survives host button styles and opens with Enter/Space');
        }
        {
            const e=await setup({menuOnly:true});
            assert(await e.page.locator('#erome-modal').isVisible());
            await done(e,'manager menu opens panel without using launcher');
        }
        for(const [width,height,touch] of [[320,640,true],[360,740,true],[412,850,true],[740,360,true],[360,280,true],[1280,800,false]]) {
            const e=await setup({width,height,touch});
            const result=await e.page.evaluate(()=>{
                const modal=document.querySelector('#erome-modal').getBoundingClientRect();
                const inline=document.querySelector('.erome-inline-btn').getBoundingClientRect();
                return {left:modal.left,right:modal.right,bottom:modal.bottom,vh:visualViewport.height,vw:visualViewport.width,button:inline.width,font:getComputedStyle(document.querySelector('.erome-input')).fontSize,controls:document.querySelector('#erome-modal-controls').clientHeight};
            });
            assert(result.left>=-1 && result.right<=result.vw+1 && result.bottom<=result.vh+1,JSON.stringify(result));
            assert(result.left>=result.vw*0.14,'sidebar leaves part of the page visible');
            assert(result.controls>0);
            if(touch) {assert(result.button>=48);assert.equal(result.font,'16px');}
            await done(e,`layout ${width}x${height} touch=${touch}`);
        }
        {
            const e=await setup();
            await e.page.evaluate(()=>{window.row=document.querySelector('.erome-media-item');document.querySelector('#erome-modal-content').scrollTop=80;window.offset=document.querySelector('#erome-modal-content').scrollTop;row.click();});
            assert(await e.page.evaluate(()=>row===document.querySelector('.erome-media-item') && row.querySelector('input').checked && document.querySelector('#erome-modal-content').scrollTop===offset));
            await e.page.locator('#erome-select-all').click();
            assert.equal(await e.page.locator('.erome-checkbox:checked').count(),18);
            await e.page.locator('#erome-deselect-all').click();
            assert.equal(await e.page.locator('.erome-checkbox:checked').count(),0);
            await e.page.locator('#erome-modal-close').click();
            await e.page.waitForTimeout(300);
            await e.page.evaluate(()=>window.scrollTo(0,400));
            await e.page.locator('#erome-sidebar-trigger').click();
            await e.page.locator('#erome-modal-close').click();
            await e.page.waitForTimeout(300);
            assert.equal(await e.page.evaluate(()=>window.scrollY),400);
            await done(e,'selection DOM, scrolling and page restoration');
        }
        for(const mode of ['success','denied','timeout','missing']) {
            const e=await setup({mode,requests:false});
            await e.page.locator('#erome-select-all').click();
            await e.page.locator('#erome-download-selected').click();
            await e.page.waitForFunction(()=>!document.querySelector('#erome-download-selected').disabled);
            assert.equal(e.page.url(),'https://erome.com/a/test');
            assert.equal(e.context.pages().length,1);
            const stats=await e.page.evaluate(()=>stats);
            assert(stats.maxActive<=2);
            assert.equal(await e.page.locator('#erome-manual-downloads a').count(),mode==='success'?0:18);
            if(mode!=='success') assert.equal(await e.page.locator('#erome-manual-downloads a').first().getAttribute('target'),'_blank');
            await done(e,'download '+mode+' with request API absent');
        }
        for(const lang of ['pt-BR','en-US','es']) {
            const e=await setup({storage:false,requests:false,mode:'missing',lang});
            await e.page.locator('[data-tab="config"]').click();
            await e.page.locator('#erome-lang-select').selectOption(lang);
            assert(await e.page.locator('#erome-capabilities').isVisible());
            await e.page.locator('[data-tab="telegram"]').click();
            await e.page.locator('#erome-test-telegram').click();
            assert(await e.page.locator('#erome-notification.error').isVisible());
            await done(e,'missing capabilities '+lang);
        }
        {
            const e=await setup();
            await e.page.evaluate(()=>{
                Object.defineProperty(window.visualViewport,'height',{configurable:true,value:280});
                Object.defineProperty(window.visualViewport,'offsetTop',{configurable:true,value:50});
                window.visualViewport.dispatchEvent(new Event('resize'));
            });
            const bounds=await e.page.locator('#erome-modal').boundingBox();
            assert.equal(bounds.y,50);assert.equal(bounds.height,280);
            await e.page.setViewportSize({width:740,height:360});
            if (process.env.TEST_SCREENSHOT) await e.page.screenshot({path:process.env.TEST_SCREENSHOT});
            await done(e,'visual viewport resize and offset (simulated keyboard)');
        }
        {
            const e=await setup();
            const session=await e.context.newCDPSession(e.page);
            await session.send('Emulation.setPageScaleFactor',{pageScaleFactor:2});
            await e.page.waitForTimeout(150);
            const bounds=await e.page.evaluate(()=>{
                const r=document.querySelector('#erome-modal').getBoundingClientRect();
                return {width:r.width,height:r.height,viewWidth:visualViewport.width,viewHeight:visualViewport.height,scale:visualViewport.scale};
            });
            assert.equal(bounds.scale,2);
            assert(Math.abs(bounds.width-bounds.viewWidth*0.85)<1);
            assert(Math.abs(bounds.height-bounds.viewHeight)<1);
            await done(e,'pinch zoom remains enabled and panel follows visible area');
        }
        {
            const e=await setup({mode:'missing'});
            await e.page.locator('#erome-modal-close').click();
            await e.page.waitForTimeout(300);
            await e.page.locator('.erome-inline-btn.download').first().click();
            await e.page.waitForTimeout(320);
            assert(await e.page.locator('#erome-manual-downloads a').isVisible());
            const popup=e.page.waitForEvent('popup');
            await e.page.locator('#erome-manual-downloads a').click();
            const opened=await popup;
            assert.equal(e.page.url(),'https://erome.com/a/test');
            await opened.close();
            await done(e,'inline failure exposes manual user-triggered link');
        }
        {
            const e=await setup({readFails:true});
            assert(await e.page.locator('#erome-capabilities').isVisible());
            await done(e,'storage read failure does not prevent initialization');
        }
        {
            const e=await setup({writeFails:true});
            await e.page.locator('[data-tab="config"]').click();
            await e.page.locator('#erome-save-token').click();
            assert(await e.page.locator('#erome-notification.error').isVisible());
            await done(e,'storage exception is visible');
        }
        for(const touch of [true,false]) {
            const e=await setup({touch});
            await e.page.locator('#erome-select-all').click();
            await e.page.locator('[data-tab="telegram"]').click();
            await e.page.locator('#erome-send-telegram').click();
            await e.page.waitForFunction(()=>!document.querySelector('#erome-send-telegram').disabled,{},{timeout:20000});
            const stats=await e.page.evaluate(()=>stats);
            assert.equal(stats.albums.reduce((a,b)=>a+b,0),18);
            assert(stats.albums.every(n=>n<=(touch?2:10)));
            assert(stats.maxGet<=(touch?2:10));
            assert.equal(await e.page.evaluate(()=>released),18);
            await done(e,'Telegram batch limits touch='+touch);
        }
        {
            const e=await setup({partial:true});
            await e.page.locator('#erome-select-all').click();
            await e.page.locator('[data-tab="telegram"]').click();
            await e.page.locator('#erome-send-telegram').click();
            await e.page.waitForFunction(()=>!document.querySelector('#erome-send-telegram').disabled,{},{timeout:20000});
            assert.equal(await e.page.locator('#erome-transfer-errors p').count(),2);
            assert.match(await e.page.locator('#erome-transfer-errors').textContent(),/Upload denied/);
            assert.match(await e.page.locator('#erome-notification').textContent(),/16 enviado\(s\), 2 erro\(s\)/);
            assert.equal(await e.page.evaluate(()=>released),17);
            await done(e,'Telegram partial network/upload failures preserve details and release files');
        }
        console.log(checks+' integration scenarios passed.');
    } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
