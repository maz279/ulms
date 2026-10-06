/* ============================================================
   ULMS shell — Dynamics-365 model-driven chrome.
   Renders: topbar · sitemap nav · mega menu · tab strip + tab
   rail · Tell-ME search (arrow-key navigable) · copilot panel ·
   status bar · toasts. All prefs persisted in localStorage.
   Exposes: LMSRenderShell LMSRoute LMSOpenTab LMSToast LMSSearch
            LMSIcon LMST LMS_T LMS_SHELL LMSCrumb
   ============================================================ */
(function(){
"use strict";
var LS = {
  get:function(k,d){ try{ var v=localStorage.getItem("lms-"+k); return v===null?d:JSON.parse(v);}catch(e){return d;} },
  set:function(k,v){ try{ localStorage.setItem("lms-"+k, JSON.stringify(v)); }catch(e){} }
};

var S = {
  tabs: [], activeTab: null,
  lang: LS.get("lang","en"),
  density: LS.get("density","comfortable"),
  theme: LS.get("theme","light"),
  collapsed: LS.get("collapsed",false),
  fav: LS.get("fav",[]),
  recents: LS.get("recents",[])
};

window.LMS_SHELL = S;

/* ---------- i18n ---------- */
window.LMS_T = function(k){
  var I=window.LMS_I18N||{};
  return (I[S.lang]&&I[S.lang][k]) || (I.en&&I.en[k]) || k;
};
window.LMST = window.LMS_T;

/* ---------- helpers ---------- */
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
window.LMSEsc = esc;
function el(html){ var d=document.createElement("div"); d.innerHTML=html.trim(); return d.firstChild; }

var TYPE_GLYPH={g:"▤",f:"✎",x:"◉",c:"⚙",d:"▦",r:"📄",s:"▫"};
window.LMSTypeIcon=function(t){ return TYPE_GLYPH[t]||"▫"; };

/* Icon set: compact glyph system (no external fonts needed, file:// safe) */
window.LMSIcon=function(name){
  var map={
    menu:"☰", search:"⌕", bell:"🔔", star:"★", starO:"☆", pin:"📌",
    home:"⌂", user:"👤", lang:"🌐", density:"◷", theme:"☾", sun:"☀",
    copilot:"✦", close:"✕", chev:"›", back:"‹", grid:"▤", doc:"📄",
    plus:"＋", check:"✓", warn:"⚠", info:"ⓘ", money:"৳", chart:"▦",
    dir:"☰", refresh:"⟳", export:"⤓", filter:"☰"
  };
  return map[name]||"•";
};

/* ---------- module lookup ---------- */
function findScreen(sid){
  var out=null;
  Object.keys(window.LMS_MODULES).forEach(function(k){
    if(out) return;
    window.LMS_MODULES[k].groups.forEach(function(g){
      g.screens.forEach(function(s){ if(s.id===sid) out={mod:window.LMS_MODULES[k],grp:g,scr:s}; });
    });
  });
  return out;
}
window.LMSFindScreen=findScreen;

function modOfRoute(route){
  var hit=null;
  Object.keys(window.LMS_MODULES).forEach(function(k){
    var m=window.LMS_MODULES[k];
    m.groups.forEach(function(g){ g.screens.forEach(function(s){
      if(s.route && s.route.split("?")[0]===route.split("?")[0]) hit=m;
    });});
  });
  return hit;
}
window.LMSModOfRoute=modOfRoute;

/* ---------- breadcrumbs derived from nav data ---------- */
window.LMSCrumb=function(route){
  route=(route||"").split("?")[0];
  var area=null,mod=null;
  Object.keys(window.LMS_MODULES).forEach(function(k){
    var m=window.LMS_MODULES[k];
    m.groups.forEach(function(g){ g.screens.forEach(function(s){
      var r=s.route?s.route.split("?")[0]:("#/screen/"+s.id);
      if(r===route){ mod=m; area=window.LMS_AREAS.filter(function(a){return a.id===m.area;})[0]; }
    });});
  });
  return area? [area.en, mod.en] : null;
};

/* ---------- Tabs ---------- */
var MAX_TABS=12;
window.LMSOpenTab=function(id,title,route,icon,pin){
  var exists=S.tabs.filter(function(t){return t.id===id;})[0];
  if(exists){ exists.route=route; exists.title=title; if(pin!==undefined) exists.pin=!!pin; }
  else{
    var unpinned=S.tabs.filter(function(t){return !t.pin;});
    if(S.tabs.length>=MAX_TABS && unpinned.length){ // LRU evict
      var victim=unpinned[0];
      S.tabs.splice(S.tabs.indexOf(victim),1);
    }
    S.tabs.push({id:id,title:title,route:route,icon:icon||"▤",pin:!!pin});
  }
  S.activeTab=id;
  // recents
  S.recents=[{id:id,title:title,route:route,icon:icon||"▤"}].concat(
    S.recents.filter(function(r){return r.id!==id;})).slice(0,6);
  LS.set("recents",S.recents);
  LS.set("session",S.tabs.map(function(t){return [t.id,t.title,t.route,t.icon,t.pin?1:0];}));
  paintTabs(); paintRail(); paintNav();
};
function closeTab(id){
  var i=S.tabs.findIndex(function(t){return t.id===id;});
  if(i<0) return;
  var wasActive=S.activeTab===id;
  S.tabs.splice(i,1);
  if(wasActive){
    var next=S.tabs[Math.min(i,S.tabs.length-1)];
    if(next){ S.activeTab=next.id; location.hash=next.route; }
    else { S.activeTab=null; location.hash="#/home"; }
  }
  LS.set("session",S.tabs.map(function(t){return [t.id,t.title,t.route,t.icon,t.pin?1:0];}));
  paintTabs(); paintRail(); paintNav();
}
window.LMSCloseTab=closeTab;

function paintTabs(){
  var host=document.querySelector(".tabstrip"); if(!host) return;
  host.innerHTML=S.tabs.map(function(t){
    return '<div class="tab'+(t.id===S.activeTab?" on":"")+(t.pin?" pin":"")+'" data-tab="'+esc(t.id)+'" role="tab" tabindex="0" aria-selected="'+(t.id===S.activeTab)+'" title="'+esc(t.title)+' · '+esc(t.route)+'">'+
      '<span class="tab-pin" data-pin="'+esc(t.id)+'" title="'+(t.pin?"Unpin":"Pin")+'">📌</span>'+
      '<span class="trunc" style="max-width:150px">'+esc(t.title)+'</span>'+
      '<span class="tab-x" data-close="'+esc(t.id)+'" title="Close (Ctrl+W)">✕</span></div>';
  }).join("");
}

/* ---------- Right tab rail ---------- */
function paintRail(){
  var panel=document.querySelector(".rail-panel"); if(!panel) return;
  var pinned=S.tabs.filter(function(t){return t.pin;});
  var open=S.tabs.filter(function(t){return !t.pin;});
  panel.innerHTML=
    '<div class="rp-h">'+esc(window.LMS_T("pinned"))+'</div>'+
    (pinned.length?pinned.map(function(t){return rpItem(t);}).join(""):'<div class="small" style="padding:4px 8px">'+esc(window.LMS_T("no_fav"))+'</div>')+
    '<div class="rp-h" style="margin-top:8px">'+esc(window.LMS_T("open_tabs"))+' ('+open.length+')</div>'+
    open.map(function(t){return rpItem(t);}).join("")+
    '<div style="padding:8px"><button class="btn btn-sm btn-2nd" id="rp-restore">'+esc(window.LMS_T("reopen"))+'</button></div>';
  function rpItem(t){
    return '<div class="rp-item'+(t.id===S.activeTab?" on":"")+'" data-tab="'+esc(t.id)+'">'+esc(t.icon)+' <span class="trunc grow">'+esc(t.title)+'</span></div>';
  }
  var rb=document.getElementById("rp-restore");
  if(rb) rb.onclick=function(){ restoreSession(true); };
}
function restoreSession(){
  var sess=LS.get("session",null);
  if(sess&&sess.length){
    sess.forEach(function(a){ if(!S.tabs.filter(function(t){return t.id===a[0];}).length) S.tabs.push({id:a[0],title:a[1],route:a[2],icon:a[3]||"▤",pin:!!a[4]}); });
    if(!S.activeTab&&S.tabs.length) S.activeTab=S.tabs[S.tabs.length-1].id;
  }
  if(!S.tabs.length){ S.tabs=[{id:"home",title:window.LMS_T("home"),route:"#/home",icon:"⌂",pin:true}]; S.activeTab="home"; }
  paintTabs(); paintRail();
}
window.LMSRestoreSession=restoreSession;

/* ---------- Sitemap nav ---------- */
function paintNav(){
  var host=document.querySelector(".nav-body"); if(!host) return;
  var activeMod=modOfRoute(location.hash);
  var html="";
  html+='<div class="nav-zone-h">⌂ '+esc(window.LMS_T("home"))+'</div>';
  html+='<button class="ni'+(location.hash==="#/home"?" on":"")+'" data-go="#/home"><span class="ni-ico">⌂</span><span class="grow">'+esc(window.LMS_T("home"))+'</span></button>';
  // favorites
  var favs=S.fav.map(function(id){return window.LMS_MODULES[id];}).filter(Boolean);
  if(favs.length){
    html+='<div class="nav-zone-h">★ '+esc(window.LMS_T("favorites"))+'</div>';
    favs.forEach(function(m){ html+=navMod(m,activeMod); });
  }
  html+='<div class="nav-zone-h">▼ '+esc(window.LMS_T("areas"))+'</div>';
  window.LMS_AREAS.forEach(function(a){
    var open=activeMod&&activeMod.area===a.id;
    html+='<button class="ni nav-area" data-area="'+a.id+'" aria-expanded="'+(!!open)+'"><span class="ni-ico" style="color:'+a.rail+'">▮</span><span class="grow">'+esc(S.lang==="bn"?a.bn:a.en)+'</span><span class="chev">›</span></button>';
    html+='<div class="nav-sub'+(open?" open":"")+'" id="sub-'+a.id+'">';
    a.mods.forEach(function(mid){ html+=navMod(window.LMS_MODULES[mid],activeMod); });
    html+='</div>';
  });
  // recents
  if(S.recents.length){
    html+='<div class="nav-zone-h">🕘 '+esc(window.LMS_T("recents"))+'</div>';
    S.recents.forEach(function(r){
      html+='<button class="ni" data-go="'+esc(r.route)+'"><span class="ni-ico">'+esc(r.icon)+'</span><span class="trunc grow">'+esc(r.title)+'</span></button>';
    });
  }
  html+='<div class="nav-zone-h">⚙ '+esc(window.LMS_T("system"))+'</div>';
  [["#/reports","📄",window.LMS_T("reports_lbl")],["#/directory","☰","Module Directory"],["#/coverage","✓","Coverage"],["portals.html","🌐","Portals"],["mobile.html","📱","Field App"],["#/designsystem","🎨","Design System"],["#/shortcuts","⌨",window.LMS_T("shortcuts")],["#/settings","⚙",window.LMS_T("settings")]]
    .forEach(function(x){
      html+='<button class="ni" data-go="'+x[0]+'"><span class="ni-ico">'+x[1]+'</span><span class="grow">'+esc(x[2])+'</span></button>';
    });
  html+='<div style="height:70px"></div>';
  host.innerHTML=html;

  host.querySelectorAll(".nav-area").forEach(function(b){
    b.addEventListener("click",function(e){
      if(e.target.closest("[data-go]")) return;
      var id=b.getAttribute("data-area");
      var sub=document.getElementById("sub-"+id);
      var open=sub.classList.toggle("open");
      b.setAttribute("aria-expanded",open?"true":"false");
      if(open) megaOpen(id);
    });
  });
  host.querySelectorAll("[data-go]").forEach(function(b){
    b.addEventListener("click",function(){ go(b.getAttribute("data-go")); });
  });
  host.querySelectorAll("[data-fav]").forEach(function(b){
    b.addEventListener("click",function(e){
      e.stopPropagation();
      var id=b.getAttribute("data-fav");
      var i=S.fav.indexOf(id);
      if(i>=0) S.fav.splice(i,1); else S.fav.push(id);
      LS.set("fav",S.fav); paintNav();
      LMSToast((i>=0?"Removed from":"Pinned to")+" favorites · "+id,"ok");
    });
  });
}
function navMod(m,activeMod){
  var on=activeMod&&m.en===activeMod.en;
  var fav=S.fav.indexOf(Object.keys(window.LMS_MODULES).filter(function(k){return window.LMS_MODULES[k]===m;})[0])>=0;
  var mid=Object.keys(window.LMS_MODULES).filter(function(k){return window.LMS_MODULES[k]===m;})[0];
  return '<div style="display:flex;align-items:center">'+
    '<button class="ni'+(on?" on":"")+'" style="flex:1;min-width:0" data-go="#/workspace/'+mid+'"><span class="ni-ico">'+esc(m.icon)+'</span><span class="trunc grow">'+esc(S.lang==="bn"?m.bn:m.en)+'</span><span class="ni-badge">'+mid+'</span></button>'+
    '<button class="ni" style="flex:none;padding:6px 6px" data-fav="'+mid+'" title="Favorite" aria-label="Toggle favorite">'+(fav?"★":"☆")+'</button></div>';
}

/* ---------- Mega menu ---------- */
var megaEl=null;
function closeMega(){ if(megaEl){ megaEl.remove(); megaEl=null; } }
function megaOpen(areaId){
  closeMega();
  var a=window.LMS_AREAS.filter(function(x){return x.id===areaId;})[0]; if(!a) return;
  var counts={screens:0,groups:0};
  var cols="";
  a.mods.forEach(function(mid){
    var m=window.LMS_MODULES[mid];
    m.groups.forEach(function(g){
      counts.groups++; counts.screens+=g.screens.length;
      var links=g.screens.map(function(s){
        var r=s.route||("#/screen/"+s.id);
        return '<a class="mega-link" href="'+esc(r)+'"><span>'+esc(window.LMSTypeIcon(s.t))+'</span><span class="trunc grow">'+esc(S.lang==="bn"&&s.bn?s.bn:s.en)+'</span><span class="sc-type">'+s.t+'</span></a>';
      }).join("");
      cols+='<div class="mega-col"><h6>'+esc(mid+" · "+m.en+" — "+g.en)+'</h6>'+links+'</div>';
    });
    if(m.reports.length){
      var rl=m.reports.slice(0,4).map(function(rn,i){
        return '<a class="mega-link" href="'+esc("#/report/"+mid+"/"+i)+'"><span>📄</span><span class="trunc grow">'+esc(rn)+'</span><span class="sc-type">r</span></a>';
      }).join("");
      cols+='<div class="mega-col"><h6>'+esc(mid+" · Reports")+'</h6>'+rl+'<a class="mega-link" href="#/reports"><span>⋯</span><span>View all reports</span></a></div>';
    }
  });
  var chips=a.mods.map(function(mid){
    var m=window.LMS_MODULES[mid];
    return '<a class="mega-chip" href="#/workspace/'+mid+'"><span>'+esc(m.icon)+'</span><b>'+mid+'</b> '+esc(S.lang==="bn"?m.bn:m.en)+'</a>';
  }).join("");
  megaEl=el('<div class="usl-mega" id="megamenu" role="menu" aria-label="'+esc(a.en)+' mega menu">'+
    '<div class="mega-head"><div class="mega-title">'+esc(S.lang==="bn"?a.bn:a.en)+
    '<small>'+esc(a.mods.length+" modules · module → group → screen · "+window.LMS_COUNTS.screens+" screens bank-wide")+'</small></div>'+
    '<div class="mega-mods">'+chips+'<a class="mega-chip" href="#/directory"><span>☰</span> Module Directory (A–Z)</a></div></div>'+
    '<div class="mega-cols">'+cols+'</div>'+
    '<div class="mega-foot"><span>'+a.mods.length+' modules</span><span>'+counts.groups+' screen groups</span><span>'+counts.screens+' screens</span><span>Esc to close</span></div></div>');
  document.body.appendChild(megaEl);
  megaEl.addEventListener("keydown",function(e){ if(e.key==="Escape"){ closeMega(); }});
  setTimeout(function(){
    megaEl.querySelectorAll("a").forEach(function(a2){ a2.addEventListener("click",function(){ closeMega(); }); });
  },0);
}
window.LMSMegaOpen=megaOpen; window.LMSMegaClose=closeMega;

/* ---------- Tell-ME search ---------- */
function searchIndex(){
  var pages=[],acts=[],reps=[],forms=[];
  Object.keys(window.LMS_MODULES).forEach(function(mid){
    var m=window.LMS_MODULES[mid];
    pages.push([mid+" · "+LMSPick(m.en,m.bn), "#/workspace/"+mid, m.icon]);
    m.groups.forEach(function(g){ g.screens.forEach(function(s){
      pages.push([LMSPick(s.en,s.bn)+"  ·  "+mid, s.route||("#/screen/"+s.id), window.LMSTypeIcon(s.t)]);
    });});
    m.reports.forEach(function(rn,i){ reps.push([rn+" · "+mid,"#/report/"+mid+"/"+i,"📄"]); });
    m.forms.forEach(function(fn){ forms.push([fn+" · "+mid,"#/form/"+mid+"/"+encodeURIComponent(fn),"✎"]); });
  });
  [["New Application","#/apply","✚"],["New Customer","#/form/A1/New%20Individual%20Customer","✚"],
   ["My Approvals","#/approvals","✅"],["Post a Payment","#/form/E2/Post%20payment","৳"],
   ["Run CL-1","#/report/F1/0","📄"],["Collections Workbench","#/collections","🎧"],
   ["BRPD Board","#/classification","🏷"],["Report Writer","#/writer","✎"],
   ["Keyboard Shortcuts","#/shortcuts","⌨"],["Design System","#/designsystem","🎨"]].forEach(function(a){ acts.push(a); });
  var records=(window.LMS_D&&window.LMS_D.records)||[];
  // RECORDS rows are [id, title, subtitle, route] — normalize to [label, route, icon]
  records=records.map(function(r){
    return [r[0]+" · "+r[1]+"  ·  "+r[2], r[3], /CIF/.test(r[0])?"👤":"◉"];
  });
  return {pages:pages,reps:reps,forms:forms,acts:acts,records:records};
}
window.LMSSearch=function(q){
  q=(q||"").toLowerCase().trim(); if(!q) return [];
  var ix=searchIndex(), out=[];
  function match(arr,type){ arr.forEach(function(r){
    if(r[0].toLowerCase().indexOf(q)>=0) out.push({g:type,t:r[0],route:r[1],ico:r[2]});
  });}
  match(ix.pages,"Pages"); match(ix.acts,"Actions"); match(ix.reps,"Reports");
  match(ix.forms,"Forms"); match(ix.records,"Records");
  return out.slice(0,24);
};
var tmHL=-1, tmItems=[];
function paintTellMe(q){
  var drop=document.querySelector(".tm-drop"); if(!drop) return;
  var res=window.LMSSearch(q);
  tmItems=res; tmHL=-1;
  if(!q.trim()){ drop.classList.remove("open"); drop.innerHTML=""; return; }
  if(!res.length){ drop.innerHTML='<div class="tm-empty">No matches for “'+esc(q)+'” — try an account no (LN-…), CIF id, report name or “new application”.</div>'; drop.classList.add("open"); return; }
  var lastG="", html="";
  res.forEach(function(r,i){
    if(r.g!==lastG){ html+='<div class="tm-group">'+esc(r.g)+'</div>'; lastG=r.g; }
    html+='<div class="tm-item" data-i="'+i+'" role="option" tabindex="-1"><span class="t-ico">'+esc(r.ico)+'</span><span class="trunc grow">'+esc(r.t)+'</span><small>↵</small></div>';
  });
  drop.innerHTML=html; drop.classList.add("open");
  drop.querySelectorAll(".tm-item").forEach(function(it){
    it.addEventListener("click",function(){ tmGo(parseInt(it.getAttribute("data-i"),10)); });
  });
}
function tmGo(i){
  var r=tmItems[i]; if(!r) return;
  var drop=document.querySelector(".tm-drop");
  if(drop){ drop.classList.remove("open"); }
  var inp=document.querySelector(".tb-search input"); if(inp) inp.value="";
  go(r.route);
}
function tmMove(d){
  var drop=document.querySelector(".tm-drop"); if(!drop||!drop.classList.contains("open")) return;
  var items=drop.querySelectorAll(".tm-item"); if(!items.length) return;
  tmHL=(tmHL+d+items.length)%items.length;
  items.forEach(function(x,i){ x.classList.toggle("hl",i===tmHL); });
  items[tmHL].scrollIntoView({block:"nearest"});
}

/* ---------- Toast ---------- */
window.LMSToast=function(msg,type){
  var host=document.getElementById("toasts"); if(!host) return;
  var t=el('<div class="toast '+(type||"")+'" role="status">'+esc(msg)+'</div>');
  host.appendChild(t);
  setTimeout(function(){ t.style.opacity="0"; setTimeout(function(){t.remove();},200); },4200);
};

/* ---------- Copilot ---------- */
function toggleCopilot(force){
  var p=document.getElementById("copilot"); if(!p) return;
  var open=force!==undefined?force:!p.classList.contains("open");
  p.classList.toggle("open",open);
  var btn=document.querySelector("[data-copilot]"); if(btn) btn.classList.toggle("on",open);
  if(open&&!p.dataset.init){ p.dataset.init="1"; initCopilot(p); }
}
function initCopilot(p){
  p.innerHTML=
    '<div class="cp-h"><span class="cp-ico">✦</span><b>ULMS Copilot</b><small class="muted">preview</small>'+
    '<button class="tb-btn" style="margin-left:auto" data-cp-close aria-label="Close">✕</button></div>'+
    '<div class="cp-b" id="cp-body">'+
    '<div class="cp-msg ai"><span class="who">✦</span><div class="cp-bub">Good morning. I reviewed overnight portfolio movement. <b>4 accounts migrated to SMA</b> at Gulshan branch and approval SLA is at risk on <b>APP-7239</b>. Ask me anything, or pick a suggestion.</div></div>'+
    ['Why did NPL move this week?','Summarise APP-7239 for approval','Draft collection strategy for 61–90 DPD','Which branches beat disbursement target?']
      .map(function(s){ return '<button class="cp-sugg" data-cp-q="'+esc(s)+'">'+esc(s)+'</button>'; }).join("")+
    '</div>'+
    '<div class="cp-f"><input id="cp-in" placeholder="Ask about loans, risk, reports…" aria-label="Ask copilot"><button class="btn btn-primary" id="cp-send">Ask</button></div>';
  function answer(q){
    var body=document.getElementById("cp-body");
    body.insertAdjacentHTML("beforeend",'<div class="cp-msg me"><span class="who">'+esc(LMSPick("RA","আ"))+'</span><div class="cp-bub">'+esc(q)+'</div></div>');
    var reply = /NPL/i.test(q) ? "Gross NPL is 4.6% (↓0.2pp m/m). The improvement came from ৳1.8 Cr write-off at Bogura and SMA cures after the dunning campaign. Watch item: 61–90 DPD bucket grew 6%."
      : /APP-7239/i.test(q) ? "APP-7239 · Md. Rafiqul Islam · SME Term Loan ৳45 L · score 781 (AA) · DBR 38% · CPV cleared. At L3 Regional Manager for 46h (SLA 48h). Recommendation: approve — precedent case APP-7180 matches profile."
      : /61–90|strateg/i.test(q) ? "For 61–90 DPD (SMA): field-visit-first strategy yields 2.3× promise conversion vs SMS. 23 accounts qualify; 8 already have officers within 5 km. Draft sequence: visit → PTP with date → auto SMS confirmation."
      : /branch|disburse/i.test(q) ? "Disbursement target beaters: Chattogram (118%), Uttara (106%), Sylhet (103%). Laggards: Khulna (81%) — driven by 2 pending collateral valuations. Full ranking: Branch Performance dashboard."
      : "I can explain portfolio movements, summarise applications, draft collection strategies and compose report queries. Try one of the suggestions above.";
    setTimeout(function(){
      body.insertAdjacentHTML("beforeend",'<div class="cp-msg ai"><span class="who">✦</span><div class="cp-bub">'+esc(reply)+'</div></div>');
      body.scrollTop=body.scrollHeight;
    },350);
    body.scrollTop=body.scrollHeight;
  }
  p.querySelector("[data-cp-close]").onclick=function(){ toggleCopilot(false); };
  p.querySelectorAll("[data-cp-q]").forEach(function(b){ b.onclick=function(){ answer(b.getAttribute("data-cp-q")); }; });
  var send=function(){ var i=document.getElementById("cp-in"); if(i&&i.value.trim()){ answer(i.value.trim()); i.value=""; } };
  p.querySelector("#cp-send").onclick=send;
  p.querySelector("#cp-in").addEventListener("keydown",function(e){ if(e.key==="Enter") send(); });
}

/* ---------- Navigation ---------- */
function go(route){
  if(/\.html/.test(route)){ location.href=route; return; }
  if(location.hash===route){ LMSRoute(); } else { location.hash=route; }
}
window.LMSGo=go;

/* ---------- Render shell ---------- */
window.LMSRenderShell=function(root){
  document.documentElement.setAttribute("data-theme",S.theme);
  document.documentElement.setAttribute("data-density",S.density);
  document.documentElement.setAttribute("lang",S.lang==="bn"?"bn":"en");
  document.documentElement.classList.toggle("lang-bn",S.lang==="bn");

  root.innerHTML=
  '<div id="usl-shell" class="'+(S.collapsed?"collapsed":"")+'">'+
  '<header class="usl-topbar" role="banner">'+
    '<button class="tb-btn" id="btn-nav" aria-label="Toggle navigation" title="Navigation (Ctrl+B)">☰</button>'+
    '<div class="tb-brand"><span class="tb-logo">U</span><div class="tb-app"><b>ULMS <span style="font-weight:400">· Unisoft Loan Management</span></b><span>ABC Bank Bangladesh · Fineract core</span></div></div>'+
    '<span class="tb-portal">STAGING</span>'+
    '<div class="tb-search"><span class="s-ico">⌕</span><input id="tellme" type="search" placeholder="'+esc(window.LMS_T("search_ph"))+'" aria-label="Tell-ME search" autocomplete="off" role="combobox" aria-expanded="false"><kbd>Alt+Q</kbd><div class="tm-drop" role="listbox"></div></div>'+
    '<div style="display:flex;align-items:center;gap:2px;margin-left:auto">'+
      '<button class="tb-btn" data-go="#/directory" title="Module Directory (A–Z)" aria-label="Directory">☰</button>'+
      '<button class="tb-btn" data-go="#/notifications" title="Notifications" aria-label="Notifications">🔔<span class="tb-badge">6</span></button>'+
      '<button class="tb-btn" id="btn-lang" title="'+esc(LMSPick("Switch to Bangla","ইংরেজিতে যান"))+'" aria-label="Language">'+esc(window.LMS_T("lang_btn"))+'</button>'+
      '<button class="tb-btn" id="btn-density" title="Density: compact / comfortable / spacious" aria-label="Density">◷</button>'+
      '<button class="tb-btn" id="btn-theme" title="Toggle dark mode" aria-label="Theme">'+(S.theme==="dark"?"☀":"☾")+'</button>'+
      '<button class="tb-btn" data-copilot title="ULMS Copilot" aria-label="Copilot">✦</button>'+
      '<div class="tb-btn" style="width:auto;padding:0 10px;cursor:default" title="'+esc(window.LMS_T("company"))+'"><span style="width:22px;height:22px;border-radius:50%;background:var(--primary-tint);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600">RA</span><span class="small" style="margin-left:6px">'+esc(LMSPick("Rezaul…","রাহাত…"))+'</span></div>'+
    '</div>'+
  '</header>'+
  '<nav class="usl-nav" id="sitemap" aria-label="Sitemap">'+
    '<div class="nav-filter"><input id="nav-filter" placeholder="'+esc(window.LMS_T("filter_nav"))+'" aria-label="Filter navigation"></div>'+
    '<div class="nav-body"></div>'+
  '</nav>'+
  '<div class="usl-main">'+
    '<div class="tabstrip" role="tablist" aria-label="Open records"></div>'+
    '<div id="page" role="main" tabindex="-1"></div>'+
  '</div>'+
  '<aside class="usrail" aria-label="Tab rail">'+
    '<button class="rail-ico" data-rail="tabs" title="Open tabs" aria-label="Open tabs">▤<span class="tb-badge" id="rail-n">0</span></button>'+
    '<button class="rail-ico" data-rail="fav" title="Favorites" aria-label="Favorites">★</button>'+
    '<button class="rail-ico" data-go="#/shortcuts" title="Shortcuts" aria-label="Shortcuts">⌨</button>'+
    '<button class="rail-ico" data-go="#/settings" title="Settings" aria-label="Settings">⚙</button>'+
  '</aside>'+
  '<div class="rail-panel" id="rail-panel"></div>'+
  '<footer class="usl-statusbar" role="contentinfo">'+
    '<span class="sb-pill">'+esc(window.LMS_T("env_staging"))+'</span><span class="sb-sep"></span>'+
    '<span>'+esc(window.LMS_T("company"))+' · FY 2026-27</span><span class="sb-sep"></span>'+
    '<span id="sb-save">✓ '+esc(window.LMS_T("autosave"))+'</span><span class="sb-sep"></span>'+
    '<span class="mono" id="sb-route"></span>'+
    '<span style="margin-left:auto" class="flex">'+
      '<button class="sb-btn" id="sb-density">'+esc(window.LMS_T("density"))+': '+S.density+'</button>'+
      '<button class="sb-btn" data-go="#/shortcuts"><kbd class="k">Ctrl</kbd>+<kbd class="k">/</kbd></button>'+
    '</span>'+
  '</footer>'+
  '<div class="copilot-panel" id="copilot" role="complementary" aria-label="Copilot panel"></div>'+
  '</div>'+
  '<div id="toasts" aria-live="polite"></div>'+
  '<a class="skip-link" href="#page">Skip to main content</a>';

  // wire topbar
  document.getElementById("btn-nav").onclick=function(){
    if(window.innerWidth<=1024){ document.getElementById("sitemap").classList.toggle("open"); }
    else { S.collapsed=!S.collapsed; LS.set("collapsed",S.collapsed); document.getElementById("usl-shell").classList.toggle("collapsed",S.collapsed); }
  };
  root.querySelectorAll("[data-go]").forEach(function(b){ b.addEventListener("click",function(){ go(b.getAttribute("data-go")); }); });
  root.querySelectorAll("[data-copilot]").forEach(function(b){ b.onclick=function(){ toggleCopilot(); }; });
  document.getElementById("btn-lang").onclick=function(){
    S.lang=S.lang==="en"?"bn":"en"; LS.set("lang",S.lang);
    document.documentElement.setAttribute("lang",S.lang==="bn"?"bn":"en");
    document.documentElement.classList.toggle("lang-bn",S.lang==="bn");
    renderShellBits(); paintNav(); LMSRoute();
    LMSToast(S.lang==="bn"?"ভাষা বাংলায় পরিবর্তিত":"Language switched to English","ok");
  };
  var cycD=function(){
    S.density=S.density==="compact"?"comfortable":S.density==="comfortable"?"spacious":"compact";
    LS.set("density",S.density); document.documentElement.setAttribute("data-density",S.density);
    var sb=document.getElementById("sb-density"); if(sb) sb.textContent=window.LMS_T("density")+": "+S.density;
    LMSToast("Density: "+S.density,"ok");
  };
  document.getElementById("btn-density").onclick=cycD;
  var sbD=document.getElementById("sb-density"); if(sbD) sbD.onclick=cycD;
  document.getElementById("btn-theme").onclick=function(){
    S.theme=S.theme==="dark"?"light":"dark"; LS.set("theme",S.theme);
    document.documentElement.setAttribute("data-theme",S.theme);
    this.textContent=S.theme==="dark"?"☀":"☾";
    LMSToast(S.theme==="dark"?"Dark theme on (charts restyled)":"Light theme on","ok");
  };

  // rail
  root.querySelectorAll("[data-rail]").forEach(function(b){
    b.onclick=function(){
      var panel=document.getElementById("rail-panel");
      var wasOpen=panel.classList.contains("open") && panel.getAttribute("data-mode")===b.getAttribute("data-rail");
      panel.classList.remove("open");
      if(!wasOpen){ panel.setAttribute("data-mode",b.getAttribute("data-rail")); panel.classList.add("open");
        if(b.getAttribute("data-rail")==="tabs") paintRail();
        else { panel.innerHTML='<div class="rp-h">'+esc(window.LMS_T("favorites"))+'</div>'+
          (S.fav.length?S.fav.map(function(mid){ var m=window.LMS_MODULES[mid]; return m?'<div class="rp-item" data-go="#/workspace/'+mid+'">'+esc(m.icon)+' <span class="trunc grow">'+esc(m.en)+'</span><span class="ni-badge">'+mid+'</span></div>':""; }).join("")
          :'<div class="small" style="padding:6px 8px">'+esc(window.LMS_T("no_fav"))+'</div>');
          panel.querySelectorAll("[data-go]").forEach(function(x){ x.onclick=function(){ go(x.getAttribute("data-go")); panel.classList.remove("open"); }; });
        }
      }
    };
  });

  // tabs events (delegate)
  var strip=document.querySelector(".tabstrip");
  strip.addEventListener("click",function(e){
    var x=e.target.closest("[data-close]");
    if(x){ e.stopPropagation(); closeTab(x.getAttribute("data-close")); return; }
    var p=e.target.closest("[data-pin]");
    if(p){ e.stopPropagation(); var t=S.tabs.filter(function(z){return z.id===p.getAttribute("data-pin");})[0];
      if(t){ t.pin=!t.pin; LS.set("session",S.tabs.map(function(z){return [z.id,z.title,z.route,z.icon,z.pin?1:0];})); paintTabs(); } return; }
    var tab=e.target.closest("[data-tab]");
    if(tab){ var t2=S.tabs.filter(function(z){return z.id===tab.getAttribute("data-tab");})[0];
      if(t2 && S.activeTab!==t2.id){ S.activeTab=t2.id; location.hash=t2.route; } }
  });
  strip.addEventListener("keydown",function(e){
    if(e.key==="Enter"||e.key===" "){ var tab=e.target.closest("[data-tab]"); if(tab) tab.click(); }
  });
  document.getElementById("rail-panel").addEventListener("click",function(e){
    var it=e.target.closest("[data-tab]");
    if(it){ var t=S.tabs.filter(function(z){return z.id===it.getAttribute("data-tab");})[0];
      if(t){ S.activeTab=t.id; location.hash=t.route; this.classList.remove("open"); } }
  });

  // nav filter
  document.getElementById("nav-filter").addEventListener("input",function(){
    var q=this.value.toLowerCase();
    document.querySelectorAll(".nav-body .ni[data-go], .nav-body .ni[data-fav]").forEach(function(b){
      var t=b.textContent.toLowerCase();
      var wrap=b.closest(".nav-sub")||b.parentElement;
      b.style.display = !q||t.indexOf(q)>=0 ? "" : "none";
    });
    document.querySelectorAll(".nav-sub").forEach(function(s){
      if(q){ var any=s.querySelector(".ni:not([style*='display: none'])"); s.classList.toggle("open",!!any);
        var areaBtn=document.querySelector('.nav-area[data-area="'+s.id.replace("sub-","")+'"]');
        if(areaBtn) areaBtn.setAttribute("aria-expanded",any?"true":"false");
      } else if(!modOfRoute(location.hash)||window.LMS_MODULES[Object.keys(window.LMS_MODULES)[0]]){
        s.classList.remove("open");
      }
    });
  });

  // Tell-ME
  var inp=document.getElementById("tellme"), drop=root.querySelector(".tm-drop");
  inp.addEventListener("input",function(){ paintTellMe(this.value); inp.setAttribute("aria-expanded",!!this.value.trim()); });
  inp.addEventListener("keydown",function(e){
    if(e.key==="ArrowDown"){ e.preventDefault(); tmMove(1); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); tmMove(-1); }
    else if(e.key==="Enter"){ e.preventDefault(); tmGo(tmHL>=0?tmHL:0); }
    else if(e.key==="Escape"){ drop.classList.remove("open"); inp.value=""; }
  });
  document.addEventListener("click",function(e){
    if(!e.target.closest(".tb-search")) drop.classList.remove("open");
    if(!e.target.closest(".usl-mega")&&!e.target.closest(".nav-area")) closeMega();
    if(!e.target.closest(".rail-panel")&&!e.target.closest(".usrail")){ var rp=document.getElementById("rail-panel"); if(rp) rp.classList.remove("open"); }
  });

  // global keys
  document.addEventListener("keydown",function(e){
    if(e.altKey&&(e.key==="q"||e.key==="Q")){ e.preventDefault(); inp.focus(); inp.select(); }
    else if(e.ctrlKey&&(e.key==="b"||e.key==="B")){ e.preventDefault(); document.getElementById("btn-nav").click(); }
    else if(e.ctrlKey&&e.shiftKey&&(e.key==="?"||e.key==="/")){ e.preventDefault(); go("#/shortcuts"); }
    else if(e.ctrlKey&&(e.key==="/" )){ e.preventDefault(); go("#/shortcuts"); }
    else if(e.ctrlKey&&(e.key==="k"||e.key==="K")){ e.preventDefault(); inp.focus(); inp.select(); }
    else if(e.ctrlKey&&(e.key==="w"||e.key==="W")){ e.preventDefault(); if(S.activeTab) closeTab(S.activeTab); }
    else if(e.ctrlKey&&e.shiftKey&&(e.key==="T")){ e.preventDefault(); restoreSession(); }
    else if(e.key==="Escape"){ closeMega(); var rp=document.getElementById("rail-panel"); if(rp) rp.classList.remove("open"); toggleCopilot(false); }
    else if(e.ctrlKey&&(e.key==="PageUp"||e.key==="PageDown")){
      e.preventDefault();
      var i=S.tabs.findIndex(function(t){return t.id===S.activeTab;});
      if(i>=0){ var n=S.tabs[(i+(e.ctrlKey&&e.key==="PageUp"?-1:1)+S.tabs.length)%S.tabs.length]; if(n){ S.activeTab=n.id; location.hash=n.route; } }
    }
  });

  function renderShellBits(){
    document.getElementById("btn-lang").textContent=window.LMS_T("lang_btn");
    var inp2=document.getElementById("tellme"); inp2.placeholder=window.LMS_T("search_ph");
    var sb2=document.getElementById("sb-density"); if(sb2) sb2.textContent=window.LMS_T("density")+": "+S.density;
  }

  paintNav(); restoreSession();
  LMSToast("ULMS prototype ready · "+window.LMS_COUNTS.modules+" modules · "+window.LMS_COUNTS.screens+" screens","ok");
};

/* expose route (app.js defines LMSRoute) */
window.LMSRoute=function(){ if(typeof window.__lmsRoute==="function") window.__lmsRoute(); };
})();
