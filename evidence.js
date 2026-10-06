(function(root,factory) {
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.AuditEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function() {
  'use strict';
  function number(value) {
    if(value===null || value===undefined) return null;
    const text=String(value).replace(/[%,$]/g,'').trim();
    if(!text) return null;
    const n=Number(text);return Number.isFinite(n)?n:null;
  }
  function supplied(value) {return value!==null&&value!==undefined&&String(value).trim()!=='';}
  function valid(row) {
    const n=number(row.trades),r=number(row.netReturn),dd=number(row.maxDD),pf=number(row.profitFactor);
    return typeof row.symbol==='string' && row.symbol.trim() && Number.isInteger(n)&&n>0&&r!==null&&r>=-100
      && ['yes','no'].includes(row.oos)&&['yes','no'].includes(row.exits)
      && (!supplied(row.maxDD)||(dd!==null&&dd>=0&&dd<=100))
      && (!supplied(row.profitFactor)||(pf!==null&&pf>=0))
      && (!supplied(row.benchmark)||number(row.benchmark)!==null);
  }
  function summarize(input) {
    const entered=input.filter(r=>supplied(r.symbol)||supplied(r.trades)||supplied(r.netReturn));
    const rows=entered.filter(valid), incomplete=entered.length-rows.length;
    const symbols=rows.map(r=>r.symbol.toUpperCase().replace(/\s+/g,''));
    const duplicates=symbols.length-new Set(symbols).size;
    const returns=rows.map(r=>number(r.netReturn)).sort((a,b)=>a-b),m=Math.floor(returns.length/2);
    const median=returns.length?(returns.length%2?returns[m]:(returns[m-1]+returns[m])/2):null;
    const benchmarkRows=rows.filter(r=>number(r.benchmark)!==null);
    const beatBenchmark=benchmarkRows.filter(r=>number(r.netReturn)>number(r.benchmark)).length;
    const profitable=rows.filter(r=>number(r.netReturn)>0).length,oos=rows.filter(r=>r.oos==='yes').length;
    const exitFailures=entered.filter(r=>r.exits==='no'),weakSamples=rows.filter(r=>number(r.trades)<30);
    const weakPF=rows.filter(r=>supplied(r.profitFactor)&&number(r.profitFactor)<=1);
    const findings=[];let level='review',title='More evidence needed';
    if(!rows.length) findings.push('Add at least three complete, distinct market results.');
    else if(new Set(symbols).size<3) findings.push('Fewer than three distinct markets were tested. Repeated symbols do not establish transferability.');
    if(incomplete) findings.push(`${incomplete} entered result(s) are incomplete or invalid. Trade counts must be positive integers, return at least −100%, drawdown 0–100%, and profit factor non-negative.`);
    if(duplicates) findings.push('Repeated market symbols are counted separately in descriptive statistics, but cannot pass the distinct-market gate.');
    if(exitFailures.length) findings.push(`Exit activity stopped on ${exitFailures.map(r=>r.symbol||'an incomplete row').join(', ')}. The result may have silently become buy-and-hold.`);
    if(weakSamples.length) findings.push(`${weakSamples.map(r=>r.symbol).join(', ')} have fewer than 30 trades.`);
    if(rows.length&&!oos) findings.push('No complete result is marked as genuinely unseen data.');
    if(rows.length&&profitable/rows.length<.5) findings.push('Fewer than half of the tested markets are profitable.');
    if(median!==null&&median<=0) findings.push('Median return across complete markets is not positive.');
    if(rows.length&&benchmarkRows.length<rows.length) findings.push('Every complete market needs a benchmark before the evidence check can pass.');
    if(benchmarkRows.length&&beatBenchmark/benchmarkRows.length<.5) findings.push('Fewer than half of benchmarked markets beat their benchmark.');
    if(weakPF.length) findings.push('A supplied profit factor is at or below 1; investigate the reported edge.');
    if(exitFailures.length) {level='fail';title='Reject: execution evidence is invalid';}
    else if(new Set(symbols).size>=3&&!duplicates&&!incomplete&&oos>0&&median>0&&profitable/rows.length>=.5&&!weakSamples.length&&benchmarkRows.length===rows.length&&beatBenchmark/rows.length>=.5&&!weakPF.length) {
      level='pass';title='Evidence check passed';findings.push('Distinct-market, unseen-data, benchmark, sample-size and exit checks pass. These aggregate statistics cannot establish return uncertainty or certify a tradable edge.');
    } else if(rows.length) title='Evidence needs review';
    return {rows,median,benchmarkRows,beatBenchmark,profitable,oos,exitFailures,weakSamples,findings,level,title,distinctMarkets:new Set(symbols).size,incomplete,duplicates};
  }
  return {number,valid,summarize};
});
