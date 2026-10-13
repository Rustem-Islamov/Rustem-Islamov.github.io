/* Individual paper pages: tag row (number, venue, Oral, research area), full venue line without brackets,
   authors in grey with my name in bold, abstract + figure always visible. */
(function(){
  var NUM={"26_local_sgd": 24, "26_adam_sgd": 23, "26_byz_dp": 22, "26_bst": 21, "26_eos": 20, "26_dpsde": 19, "25_warmup": 18, "25_ngnm": 17, "25_l0l1sde": 16, "25_safe_ef": 15, "24_signsgd": 14, "25_clip21m": 13, "24_sde_adam": 12, "24_alphabeta": 11, "24_motef": 10, "23_econtrol": 9, "23_AsyncSGD": 8, "23_clip21": 7, "23_partial": 6, "22_ada3pc": 5, "22_3pc": 4, "21_bl": 3, "21_fednl": 2, "21_mn": 1};
  var AREA={"24_sde_adam": ["Large-Scale Optimization", "/research/largescaleopt/"], "25_ngnm": ["Large-Scale Optimization", "/research/largescaleopt/"], "26_adam_sgd": ["Large-Scale Optimization", "/research/largescaleopt/"], "26_bst": ["Large-Scale Optimization", "/research/largescaleopt/"], "24_alphabeta": ["Loss Landscape", "/research/losslandscape/"], "25_l0l1sde": ["Loss Landscape", "/research/losslandscape/"], "25_warmup": ["Loss Landscape", "/research/losslandscape/"], "26_eos": ["Loss Landscape", "/research/losslandscape/"], "21_bl": ["Federated Learning", "/research/fedlearning/"], "21_fednl": ["Federated Learning", "/research/fedlearning/"], "21_mn": ["Federated Learning", "/research/fedlearning/"], "22_3pc": ["Federated Learning", "/research/fedlearning/"], "22_ada3pc": ["Federated Learning", "/research/fedlearning/"], "23_AsyncSGD": ["Federated Learning", "/research/fedlearning/"], "23_clip21": ["Federated Learning", "/research/fedlearning/"], "23_econtrol": ["Federated Learning", "/research/fedlearning/"], "23_partial": ["Federated Learning", "/research/fedlearning/"], "24_motef": ["Federated Learning", "/research/fedlearning/"], "24_signsgd": ["Federated Learning", "/research/fedlearning/"], "25_clip21m": ["Federated Learning", "/research/fedlearning/"], "25_safe_ef": ["Federated Learning", "/research/fedlearning/"], "26_byz_dp": ["Federated Learning", "/research/fedlearning/"], "26_dpsde": ["Federated Learning", "/research/fedlearning/"], "26_local_sgd": ["Federated Learning", "/research/fedlearning/"]};
  var V={NeurIPS:1,ICML:1,ICLR:1,AISTATS:1,TMLR:1,UAI:1};
  var m=location.pathname.match(/publication\/([^\/]+)/); var slug=m?m[1]:'';
  var box=document.querySelector('.article-container'); var h1=document.querySelector('h1[itemprop="name"]');
  if(!h1||!slug) return;
  var meta=document.querySelector('.article-metadata');
  var spans=meta?meta.querySelectorAll(':scope > span'):[]; var vline=null;
  spans.forEach(function(s){ if(!vline && /Conference|Journal|Transactions|Symposium/i.test(s.textContent)) vline=s; });
  var vtxt=vline?vline.textContent:'';
  var btn=null;
  document.querySelectorAll('.btn-links .btn').forEach(function(b){var t=b.textContent.trim(); if(V[t]&&!btn) btn=b; if(t==='Abstract') b.style.display='none';});
  var ym=vtxt.match(/(20\d\d)/g), year=ym?ym[ym.length-1]:'';
  var row=document.createElement('div'); row.className='pp-tags vrow';
  if(NUM[slug]){var n=document.createElement('span');n.className='vnum';n.textContent='#'+NUM[slug];row.appendChild(n);}
  if(btn){var name=btn.textContent.trim();var a=document.createElement('a');a.className='vtag v-'+name.toLowerCase();a.href=btn.href;a.target='_blank';a.rel='noopener';a.title='Open on the venue page';a.textContent=name+(year?' '+year:'');row.appendChild(a);btn.style.display='none';}
  else{var p=document.createElement('span');p.className='vtag preprint';p.textContent='Preprint';row.appendChild(p);}
  if(/Oral/.test(vtxt)){var o=document.createElement('span');o.className='vtag oral';o.textContent='Oral';row.appendChild(o);}
  if(AREA[slug]){var r=document.createElement('a');r.className='vtag pp-area';r.href=AREA[slug][1];r.textContent=AREA[slug][0];r.title='Research area';row.appendChild(r);}
  h1.parentNode.insertBefore(row,h1.nextSibling);
  /* full conference name only: the short name and year are in the tag */
  if(vline){vline.textContent=vtxt.replace(/\s*\([^)]*\)/,'').replace(/\s+/g,' ').trim(); vline.classList.add('pp-venue');}
  /* my name in bold */
  document.querySelectorAll('.article-metadata a').forEach(function(a){ if(/Rustem\s+Islamov/.test(a.textContent)) a.classList.add('me'); });
  /* button order: PDF, arXiv, Cite, Poster, then anything else */
  var bl=document.querySelector('.btn-links');
  if(bl){
    var ORDER=['PDF','arXiv','Cite','Poster'], col=bl.querySelector(':scope > .collapse');
    var bs=Array.prototype.slice.call(bl.querySelectorAll(':scope > .btn'));
    function pos(b){var i=ORDER.indexOf(b.textContent.trim()); return i<0?99:i;}
    bs.map(function(b,i){return [b,i];}).sort(function(a,b){return pos(a[0])-pos(b[0])||a[1]-b[1];}).forEach(function(x){bl.insertBefore(x[0],col||null);});
  }
  /* abstract always visible */
  document.querySelectorAll('.btn-links .collapse').forEach(function(c){c.classList.add('show');});
})();
