const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
function appMeta(){const context=vm.createContext({window:{}});vm.runInContext(read('data/app-meta.js'),context);return context.window.INSPECTION_APP_META;}

test('4.8.6 PWA 更新器與版本化資源同步',()=>{
  const meta=appMeta();
  const pwa=read('src/pwa.js');
  const sw=read('service-worker.js');
  const html=read('index.html');
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(meta.version,'4.8.6');
  assert.match(pwa,new RegExp("const VERSION='"+meta.version.replaceAll('.','\\.')+"'"));
  assert.match(pwa,/app-meta\.js\?update=/);
  assert.match(pwa,/cache:'no-store'/);
  assert.match(pwa,/updateViaCache:'none'/);
  assert.match(pwa,/location\.replace/);
  assert.match(sw,new RegExp("const VERSION='"+meta.version.replaceAll('.','\\.')+"'"));
  assert.match(sw,new RegExp('inspection-assistant-'+meta.version.replaceAll('.','\\.')+'-pp-7f3c9a21'));
  assert.equal(manifest.start_url,'./index.html?v='+meta.version);
  assert.match(html,new RegExp('src/pwa\\.js\\?v='+meta.version.replaceAll('.','\\.')));
});
