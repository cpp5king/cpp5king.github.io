const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/water-v2-ui.js'),'utf8');

function load(){
  const window={};
  const context=vm.createContext({window,console,setTimeout,clearTimeout});
  vm.runInContext(source,context,{filename:'water-v2-ui.js'});
  return window.WaterV2UI;
}
function baseState(traceNodes=[],inspections=[]){
  return {
    view:'home',
    caseInfo:{behaviorDate:'',inspectionDate:''},
    pollutionPoint:{presence:'',phenomena:[],otherPhenomenon:'',location:'',directionKnown:'',directionText:'',notes:''},
    baseScreening:{status:'',unavailableReason:'',ph:'',temperature:'',industry:'',processes:[],records:[]},
    traceNodes,sources:[],currentInspection:null,inspections,draftText:'',legalReviews:[]
  };
}

test('同一支點可同時保留多個疑似來源',()=>{
  const ui=load();
  ui.restore(baseState([{id:'node_1',parentId:null,branchNo:1,type:'ditch',location:'交會側溝',screenings:[],sourceCandidates:[
    {id:'src_a',status:'suspected',name:'A工廠',evidence:[],evidenceOther:''},
    {id:'src_b',status:'suspected',name:'B餐飲',evidence:[],evidenceOther:''}
  ]}]));
  const snap=ui.snapshot();
  assert.equal(snap.traceNodes[0].sourceCandidates.length,2);
  assert.deepEqual(Array.from(snap.sources,x=>x.candidateId),['src_a','src_b']);
  assert.ok(snap.sources.every(x=>x.nodeId==='node_1'));
});

test('確認其中一個來源不會改變同支點其他來源',()=>{
  const ui=load();
  ui.restore(baseState([{id:'node_1',parentId:null,branchNo:1,type:'ditch',location:'交會側溝',screenings:[],sourceCandidates:[
    {id:'src_a',status:'confirmed',name:'A工廠',evidence:['water_route'],evidenceOther:''},
    {id:'src_b',status:'suspected',name:'B餐飲',evidence:[],evidenceOther:''},
    {id:'src_c',status:'excluded',name:'C社區',evidence:[],evidenceOther:''}
  ]}]));
  const snap=ui.snapshot();
  const byId=Object.fromEntries(snap.sources.map(x=>[x.candidateId,x.status]));
  assert.deepEqual(byId,{src_a:'confirmed',src_b:'suspected',src_c:'excluded'});
});

test('5.0.0 舊單一來源欄位可遷移且舊查核關聯可銜接',()=>{
  const ui=load();
  ui.restore(baseState([{id:'node_old',parentId:null,branchNo:1,type:'outfall',location:'舊排水口',screenings:[],sourceStatus:'confirmed',sourceName:'舊來源',evidence:['direct_observation'],evidenceOther:''}],
    [{id:'inspection_old',sourceNodeId:'node_old',name:'舊來源',subjectType:''}]));
  const snap=ui.snapshot();
  assert.equal(snap.traceNodes[0].sourceCandidates.length,1);
  const candidate=snap.traceNodes[0].sourceCandidates[0];
  assert.equal(candidate.status,'confirmed');
  assert.equal(candidate.name,'舊來源');
  assert.deepEqual(Array.from(candidate.evidence),['direct_observation']);
  assert.equal(snap.inspections[0].sourceCandidateId,candidate.id);
});

test('對象查核以 sourceCandidateId 回寫單一來源關聯',()=>{
  assert.match(source,/sourceCandidateId:prefill\.sourceCandidateId\|\|''/);
  assert.match(source,/findSourceCandidate\(i\.sourceNodeId,i\.sourceCandidateId\)/);
  assert.match(source,/對象查核只回寫這一個來源關聯，不影響同支點的其他候選來源/);
});
