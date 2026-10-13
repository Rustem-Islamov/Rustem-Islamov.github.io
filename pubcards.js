/* Paper cards: builds the tag row (venue, Oral, Preprint, counter) at the top of each .pub-list-item.
   Used on /publication/ and the research pages. */
(function(){
  var V={NeurIPS:1,ICML:1,ICLR:1,AISTATS:1,TMLR:1,UAI:1};
  function run(){
  document.querySelectorAll('.pub-list-item').forEach(function(it){
    if(it.querySelector('.vrow')) return;
    if(!it.querySelector(':scope > p .btn')){   /* some pages (Loss Landscape) put the venue line and buttons directly in the item: wrap them in a <p> */
      var t=it.querySelector('a.specialeffects'), col=it.querySelector(':scope > .collapse');
      if(t){
        var wp=document.createElement('p'), n=t.nextSibling;
        while(n && n!==col){var nx=n.nextSibling; wp.appendChild(n); n=nx;}
        it.insertBefore(wp, col||null);
      }
    }
    it.querySelectorAll('.li-cite-author a').forEach(function(a){if(/Rustem\s+Islamov/.test(a.textContent)) a.classList.add('me');});
    var btn=null;
    it.querySelectorAll('p .btn').forEach(function(b){var t=b.textContent.trim();if(V[t]&&!btn)btn=b;});
    var p=it.querySelector('p'), txt=p?p.textContent:'';
    var ym=txt.match(/(20\d\d)/g), year=ym?ym[ym.length-1]:'';
    var num='';
    var nm=it.querySelector('.pub-num');
    if(nm){num=nm.textContent.replace(/\D/g,'');}
    else{                                   /* research pages: the number is a bare "[23]" text node */
      for(var i=0;i<it.childNodes.length;i++){var n=it.childNodes[i];
        if(n.nodeType===3){var m=n.textContent.match(/^\s*\[(\d+)\]\s*$/); if(m){num=m[1];n.textContent='';break;}}}
    }
    var row=document.createElement('div'); row.className='vrow';
    if(btn){
      var name=btn.textContent.trim();
      var a=document.createElement('a'); a.className='vtag v-'+name.toLowerCase(); a.href=btn.href; a.target='_blank'; a.rel='noopener';
      a.title='Open on the venue page'; a.textContent=name+(year?' '+year:'');
      row.appendChild(a); btn.style.display='none';
    }
    if(!btn){var pp=document.createElement('span');pp.className='vtag preprint';pp.textContent='Preprint';row.appendChild(pp);}
    if(/Oral/.test(txt)){var o=document.createElement('span');o.className='vtag oral';o.textContent='Oral';row.appendChild(o);}
    if(num){var n2=document.createElement('span');n2.className='vnum';n2.textContent='#'+num;row.appendChild(n2);}
    if(row.children.length) it.insertBefore(row,it.firstChild);
  });
  }
  run();
})();
