const {test}=require('node:test');const assert=require('node:assert/strict');
const E=require('../evidence.js');const fs=require('node:fs'),vm=require('node:vm');
const row=(symbol,extra={})=>({symbol,trades:100,netReturn:20,benchmark:10,maxDD:10,profitFactor:1.5,oos:'yes',exits:'yes',...extra});
const good=()=>['BTC','ETH','XAU'].map(s=>row(s));
test('complete distinct market evidence passes, with honest limits',()=>{
 const s=E.summarize(good());assert.equal(s.level,'pass');assert.equal(s.distinctMarkets,3);assert.equal(s.beatBenchmark,3);
});
test('repeated symbols cannot manufacture transferability',()=>{
 const s=E.summarize([row('btc'),row(' BTC '),row('BTC')]);assert.equal(s.distinctMarkets,1);assert.equal(s.level,'review');
});
test('missing benchmarks and market beta do not pass',()=>{
 for(const benchmark of ['',null,30]){const rows=good().map(r=>({...r,benchmark}));assert.equal(E.summarize(rows).level,'review');}
});
test('invalid counts, returns, drawdowns and profit factors cannot pass',()=>{
 for(const extra of [{trades:2.5},{trades:-1},{netReturn:-101},{maxDD:101},{maxDD:-1},{profitFactor:-1},{benchmark:'bad'}]){
   assert.equal(E.valid(row('BTC',extra)),false);assert.equal(E.summarize([...good(),row('SOL',extra)]).level,'review');
 }
 assert.equal(E.summarize(good().map(r=>({...r,profitFactor:1}))).level,'review');
});
test('a stopped exit rejects even an incomplete evidence row',()=>{
 assert.equal(E.summarize([...good(),{symbol:'SOL',exits:'no'}]).level,'fail');
});
test('blank numeric input is missing; flat and negative values remain meaningful',()=>{
 assert.equal(E.number('  '),null);assert.equal(E.number('%'),null);assert.equal(E.number('0'),0);assert.equal(E.number('-5%'),-5);
 assert.equal(E.valid(row('BTC',{netReturn:-100,maxDD:100,profitFactor:0})),true);
});
test('UI, report and JSON use the same evidence engine; inline scripts parse',()=>{
 const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');assert.match(html,/<script src="evidence.js"/);assert.match(html,/AuditEvidence.summarize\(state.evidenceRows\)/);assert.match(html,/const complete = AuditEvidence.valid\(row\)/);
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
