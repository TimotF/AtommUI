import axe from 'axe-core';
export function installAccessibilityAudit(){
 const button=document.createElement('button');button.textContent='Audit accessibility';button.id='run-accessibility';button.style.cssText='position:fixed;right:340px;bottom:12px;z-index:10;padding:8px;background:white;color:black;border:1px solid black';document.body.append(button);
 const output=document.createElement('pre');output.id='accessibility-results';output.hidden=true;document.body.append(output);
 const run=async()=>{
  button.hidden=true;
  try{const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}});output.textContent=JSON.stringify({url:location.href,violations:result.violations,passes:result.passes.length,incomplete:result.incomplete.map(({id,nodes})=>({id,nodes:nodes.map(node=>({target:node.target,summary:node.failureSummary}))}))});}
  finally{button.hidden=false;}
 };
 button.onclick=run;document.addEventListener('keydown',event=>{if(event.key==='F8'&&event.ctrlKey&&event.shiftKey){event.preventDefault();void run();}});
}
