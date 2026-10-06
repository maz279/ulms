/* ============================================================
   ULMS route_test.js — headless quality harness (Node, no deps).
   Boots the real SPA against DOM stubs, then walks EVERY route:
   bespoke consoles + every workspace + every spec screen + freg
   + reports + record pages + customer/loan/cib records + 404.
   Asserts each renders >200 chars of markup with a page title,
   without throwing.  Run:  node _tools/route_test.js
   ============================================================ */
"use strict";

/* ---------- DOM stubs ---------- */
function makeClassList(){ var s={}; return {
  add:function(c){ s[c]=1; }, remove:function(c){ delete s[c]; },
  toggle:function(c,f){ if(f===undefined){ s[c]?delete s[c]:s[c]=1; } else if(f){ s[c]=1; } else { delete s[c]; } },
  contains:function(c){ return !!s[c]; }
};}
function makeEl(tag){
  var el = {
    tagName:(tag||"div").toUpperCase(), children:[], _html:"", textContent:"", value:"",
    style:{}, dataset:{}, attrs:{}, classList:makeClassList(),
    setAttribute:function(k,v){ this.attrs[k]=v; }, getAttribute:function(k){ return this.attrs[k]===undefined?null:this.attrs[k]; },
    removeAttribute:function(k){ delete this.attrs[k]; },
    appendChild:function(c){ this.children.push(c); return c; },
    removeChild:function(){}, remove:function(){},
    addEventListener:function(){}, removeEventListener:function(){},
    querySelector:function(){ return null; },
    querySelectorAll:function(){ return []; },
    closest:function(){ return null; },
    focus:function(){}, select:function(){}, click:function(){},
    insertAdjacentHTML:function(){}, scrollIntoView:function(){},
    scrollTop:0, scrollHeight:0,
    get firstChild(){ return this.children[0]||makeEl(); },
    get parentElement(){ return makeEl(); }
  };
  Object.defineProperty(el,"innerHTML",{
    get:function(){ return this._html; },
    set:function(v){ this._html=String(v); this.children=[]; }
  });
  return el;
}

var els = {};
var hashChangeListeners = [];
var storage = {};

global.window = global;
global.document = {
  documentElement: makeEl("html"),
  body: makeEl("body"),
  title:"",
  getElementById:function(id){ if(!els[id]) els[id]=makeEl(); return els[id]; },
  querySelector:function(sel){
    if(/nav-body/.test(sel)) return els["nav-body"]=els["nav-body"]||makeEl();
    if(/tabstrip/.test(sel)) return els["tabstrip"]=els["tabstrip"]||makeEl();
    if(/tm-drop/.test(sel)) return els["tmdrop"]=els["tmdrop"]||makeEl();
    if(/page/.test(sel)) return els["page"]=els["page"]||makeEl();
    return null;
  },
  querySelectorAll:function(){ return []; },
  createElement:function(t){ return makeEl(t); },
  addEventListener:function(){},
  removeEventListener:function(){}
};
global.location = { hash:"", href:"file://app.html", replace:function(h){ this.hash=h; } };
global.localStorage = {
  getItem:function(k){ return storage.hasOwnProperty(k)?storage[k]:null; },
  setItem:function(k,v){ storage[k]=String(v); }, removeItem:function(k){ delete storage[k]; }
};
global.addEventListener = function(ev,fn){ if(ev==="hashchange") hashChangeListeners.push(fn); };
global.removeEventListener = function(){};
global.alert = function(){};
/* getComputedStyle intentionally absent → charts use fallback palette */

function fireHashChange(){ hashChangeListeners.forEach(function(f){ try{ f(); }catch(e){ errs++; fails.push({r:"<listener>", note:e.message}); } }); }

/* ---------- load the real app (literal, static requires) ---------- */
require("../js/nav_data.js");
require("../js/demo_data.js");
require("../js/i18n.js");
require("../js/i18n_data.js");
require("../js/charts.js");
require("../js/shell.js");
require("../js/app.js");

/* ---------- route inventory (mirrors _selftest.html) ---------- */
var routes = ["#/home","#/pipeline","#/apply","#/approvals","#/disburse","#/collections",
  "#/classification","#/analytics","#/regcon","#/reports","#/writer","#/audit","#/settings",
  "#/designsystem","#/coverage","#/directory","#/search","#/shortcuts","#/notifications","#/nonsense-404"];
Object.keys(LMS_MODULES).forEach(function(mid){
  routes.push("#/workspace/"+mid);
  routes.push("#/freg/"+mid);
  routes.push("#/report/"+mid+"/0");
  routes.push("#/report/"+mid+"/2");
  routes.push("#/form/"+mid+"/New%20record");
  LMS_MODULES[mid].groups.forEach(function(g){
    g.screens.forEach(function(s){
      var r=s.route||("#/screen/"+s.id);
      if(r.charAt(0)==="#") routes.push(r);   // .html links are page navigations, not hash routes
    });
  });
});
LMS_D.customers.forEach(function(c){ routes.push("#/cust/"+c.cif); routes.push("#/cib/"+c.cif); });
LMS_D.loans.forEach(function(l){ routes.push("#/loan/"+l.id); });
routes.push("#/record/A1-s1/0","#/record/B1-s1/3","#/record/E1-s1/5");

/* ---------- run ---------- */
var fails=[], passes=0, errs=0;

console.log("Booting shell…");
try{ LMSRenderShell(document.getElementById("app-root")); }
catch(e){ console.error("SHELL BOOT FAILED:", e); process.exit(1); }
try{ LMSRoute(); }catch(e){ errs++; fails.push({r:"#/home", note:"EXCEPTION: "+e.message}); }

console.log("Walking "+routes.length+" routes…");
routes.forEach(function(r){
  var before = errs;
  try{
    location.hash = r;
    fireHashChange();
    LMSRoute();
  }catch(e){
    errs++; fails.push({r:r, note:"EXCEPTION: "+e.message});
    return;
  }
  var html = els["page"] ? els["page"].innerHTML : "";
  var notFound = /Screen not found/.test(html);
  var expect404 = /nonsense/.test(r);
  if(errs>before){ fails.push({r:r, note:"window error during render"}); return; }
  if(expect404){
    if(!notFound) fails.push({r:r, note:"expected 404 page, got something else"});
    else passes++;
    return;
  }
  if(notFound){ fails.push({r:r, note:"unexpected 404"}); return; }
  if(/Something went wrong/.test(html)){ fails.push({r:r, note:"error page (page builder threw)"}); return; }
  if(html.length<200){ fails.push({r:r, note:"rendered only "+html.length+" chars"}); return; }
  if(!/page-title/.test(html)){ fails.push({r:r, note:"no page title rendered"}); return; }
  passes++;
});

/* ---------- interactive smoke tests ---------- */
try{
  LMSModal('<div class="modal-h"><h3>test</h3></div>');
  if(!(els["lms-modal"] && els["lms-modal"].innerHTML.length>50)) fails.push({r:"modal", note:"modal did not mount"});
  else passes++;
}catch(e){ fails.push({r:"modal", note:"EXCEPTION: "+e.message}); }

[["CL-1","statutory report"],["LN-40118","loan record"],["CIF-100871","customer record"],["application","page"]].forEach(function(q){
  try{
    var res = LMSSearch(q[0]);
    if(!res.length) fails.push({r:"search:"+q[0], note:"Tell-ME found nothing ("+q[1]+")"});
    else passes++;
  }catch(e){ fails.push({r:"search:"+q[0], note:"EXCEPTION: "+e.message}); }
});

/* ---------- report ---------- */
console.log("\n================ ROUTE TEST SUMMARY ================");
console.log("Areas: "+LMS_COUNTS.areas+" · Modules: "+LMS_COUNTS.modules+" · Screens: "+LMS_COUNTS.screens+
  " · Reports: "+LMS_COUNTS.reports+" · Forms: "+LMS_COUNTS.forms+" · Functions: "+LMS_COUNTS.frs);
console.log("Routes walked: "+routes.length+" + "+5+" smoke tests");
console.log("PASS: "+passes+"   FAIL: "+fails.length+"   uncaught errors: "+errs);
if(fails.length){
  console.log("\n--- FAILURES ---");
  fails.forEach(function(f){ console.log("FAIL  "+f.r+"  ->  "+f.note); });
  process.exit(1);
}
console.log("\nALL PASS — every route reachable and rendering.");
process.exit(0);
