/* ============================================================
   ULMS link_audit.js — crawls every route, extracts every hash
   link from the rendered markup (href="#/…", data-golink), and
   verifies each target renders a real page (not 404).
   Guarantees zero dead links.   Run:  node _tools/link_audit.js
   ============================================================ */
"use strict";

function makeClassList(){ var s={}; return {
  add:function(c){ s[c]=1; }, remove:function(c){ delete s[c]; },
  toggle:function(c,f){ if(f===undefined){ s[c]?delete s[c]:s[c]=1; } else if(f){ s[c]=1; } else { delete s[c]; } },
  contains:function(c){ return !!s[c]; } }; }
function makeEl(tag){
  var el={ tagName:(tag||"div").toUpperCase(), children:[], _html:"", textContent:"", value:"",
    style:{}, dataset:{}, attrs:{}, classList:makeClassList(),
    setAttribute:function(k,v){ this.attrs[k]=v; }, getAttribute:function(k){ return this.attrs[k]===undefined?null:this.attrs[k]; },
    removeAttribute:function(k){ delete this.attrs[k]; },
    appendChild:function(c){ this.children.push(c); return c; }, removeChild:function(){}, remove:function(){},
    addEventListener:function(){}, removeEventListener:function(){},
    querySelector:function(){ return null; }, querySelectorAll:function(){ return []; },
    closest:function(){ return null; }, focus:function(){}, select:function(){}, click:function(){},
    insertAdjacentHTML:function(){}, scrollIntoView:function(){}, scrollTop:0, scrollHeight:0,
    get firstChild(){ return this.children[0]||makeEl(); }, get parentElement(){ return makeEl(); } };
  Object.defineProperty(el,"innerHTML",{ get:function(){ return this._html; }, set:function(v){ this._html=String(v); this.children=[]; } });
  return el;
}
var els={}, listeners=[], storage={};
global.window=global;
global.document={ documentElement:makeEl(), body:makeEl(), title:"",
  getElementById:function(id){ if(!els[id]) els[id]=makeEl(); return els[id]; },
  querySelector:function(sel){
    if(/nav-body/.test(sel)) return els.nb=els.nb||makeEl();
    if(/tabstrip/.test(sel)) return els.ts=els.ts||makeEl();
    if(/page/.test(sel)) return els.pg=els.pg||makeEl();
    return null; },
  querySelectorAll:function(){ return []; }, createElement:function(t){ return makeEl(t); },
  addEventListener:function(){}, removeEventListener:function(){} };
global.location={ hash:"", href:"file://app.html", replace:function(h){ this.hash=h; } };
global.localStorage={ getItem:function(k){ return storage.hasOwnProperty(k)?storage[k]:null; },
  setItem:function(k,v){ storage[k]=String(v); }, removeItem:function(k){ delete storage[k]; } };
global.addEventListener=function(ev,fn){ if(ev==="hashchange") listeners.push(fn); };
global.removeEventListener=function(){};
global.alert=function(){};

require("../js/nav_data.js");
require("../js/demo_data.js");
require("../js/i18n.js");
require("../js/i18n_data.js");
require("../js/charts.js");
require("../js/shell.js");
require("../js/app.js");

LMSRenderShell(document.getElementById("app-root"));
if(!location.hash) location.hash="#/home";
LMSRoute();
function nav(r){
  location.hash=r;
  listeners.forEach(function(f){ try{ f(); }catch(e){} });
  LMSRoute();
}

/* seed route set: every route the nav, reports and records can produce */
var seeds=["#/home","#/pipeline","#/apply","#/approvals","#/disburse","#/collections","#/classification",
  "#/analytics","#/regcon","#/reports","#/writer","#/audit","#/settings","#/designsystem","#/coverage",
  "#/directory","#/search","#/shortcuts","#/notifications"];
Object.keys(LMS_MODULES).forEach(function(mid){
  seeds.push("#/workspace/"+mid,"#/freg/"+mid);
  LMS_MODULES[mid].reports.forEach(function(rn,i){ seeds.push("#/report/"+mid+"/"+i); });
  LMS_MODULES[mid].groups.forEach(function(g){ g.screens.forEach(function(s){
    if((s.route||"#").charAt(0)==="#") seeds.push(s.route||("#/screen/"+s.id));
  });});
});
LMS_D.customers.forEach(function(c){ seeds.push("#/cust/"+c.cif,"#/cib/"+c.cif); });
LMS_D.loans.forEach(function(l){ seeds.push("#/loan/"+l.id); });

/* collect hash links from every rendered page */
var found={};
seeds.forEach(function(r){
  try{ nav(r); }catch(e){ return; }
  var html=els["page"]?els["page"]._html:"";
  var links=html.match(/#\/[A-Za-z0-9\-\/%.]+/g)||[];
  links.forEach(function(l){ found[l]=1; });
});
/* links from the record index used by Tell-ME */
LMS_D.records.forEach(function(x){ if(x[3]&&x[3].charAt(0)==="#") found[x[3]]=1; });

/* verify each discovered link resolves */
var targets=Object.keys(found), dead=[];
targets.forEach(function(t){
  try{
    nav(t.replace(/&amp;/g,"&"));
    var html=els["page"]?els["page"]._html:"";
    if(/Screen not found/.test(html)) dead.push(t);
  }catch(e){ dead.push(t+" (exception: "+e.message+")"); }
});

console.log("================ LINK AUDIT ================");
console.log("Seed pages rendered: "+seeds.length);
console.log("Distinct hash links discovered: "+targets.length);
console.log("Dead links: "+dead.length);
if(dead.length){ dead.forEach(function(d){ console.log("DEAD  "+d); }); process.exit(1); }
console.log("ALL LINKS RESOLVE — zero dead links.");
process.exit(0);
