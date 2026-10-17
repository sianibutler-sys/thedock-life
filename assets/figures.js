(function(){
  var tip=document.createElement('div'); tip.className='dtip'; tip.setAttribute('role','status'); document.body.appendChild(tip);
  function show(el){ var r=el.getBoundingClientRect(); tip.textContent=el.getAttribute('data-tip'); tip.classList.add('on');
    var w=tip.offsetWidth, x=r.left+window.scrollX+r.width/2-w/2; x=Math.max(8+window.scrollX,Math.min(x,window.scrollX+document.documentElement.clientWidth-w-8));
    tip.style.left=x+'px'; tip.style.top=(r.top+window.scrollY-tip.offsetHeight-8)+'px'; }
  function hide(){ tip.classList.remove('on'); }
  document.querySelectorAll('[data-tip]').forEach(function(el){
    el.addEventListener('mouseenter',function(){show(el)}); el.addEventListener('mouseleave',hide);
    el.addEventListener('focus',function(){show(el)}); el.addEventListener('blur',hide);
    el.addEventListener('touchstart',function(){show(el); setTimeout(hide,2200)},{passive:true});
  });
})();
