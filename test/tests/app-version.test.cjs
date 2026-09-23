const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),vm=require('vm');

test('應用程式版本集中管理並由首頁載入',()=>{
  const context=vm.createContext({window:{}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../data/app-meta.js'),'utf8'),context);
  const meta=context.window.INSPECTION_APP_META;
  assert.match(meta.version,/^\d+\.\d+\.\d+$/);
  assert.equal(meta.label,'稽查助手'+meta.version);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/data\/app-meta\.js/);
  assert.match(html,/id="app-version-title"/);
  assert.match(html,new RegExp('(?:app-meta\\.js|manifest\\.webmanifest)\\?v='+meta.version.replaceAll('.','\\.')));
  assert.doesNotMatch(html,/稽查助手3\.7\.1/);
});