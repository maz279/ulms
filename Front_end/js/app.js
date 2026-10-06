/* ============================================================
   ULMS app — hash router + page renderers.
   Route grammar:
     #/home                      executive role center
     #/workspace/{mid}           module landing
     #/screen/{sid}              spec screen (archetype g/f/x/c/d/r)
     #/record/{sid}/{rid}        generic record (BPF + tabs + factbox)
     #/freg/{mid}                function register
     #/form/{mid}/{name}         modal form (validated)
     #/apply                     6-step loan application wizard
     #/pipeline  #/cust/{cif}  #/loan/{id}  #/cib/{cif}
     #/approvals #/disburse    #/collections #/classification
     #/analytics #/regcon      #/reports #/report/{mid}/{i} #/writer
     #/audit    #/settings     #/designsystem #/coverage #/directory
     #/search   #/shortcuts    #/notifications
   ============================================================ */
(function(){
"use strict";
var esc=window.LMSEsc, T=window.LMS_T;
var D=window.LMS_D, F=window.LMSF, CH=window.LMSCharts, BRPD=window.LMS_BRPD;
var MODS=window.LMS_MODULES, AREAS=window.LMS_AREAS, CNT=window.LMS_COUNTS;

/* ---------- tiny utils ---------- */
function h(str){ var x=0; for(var i=0;i<str.length;i++){ x=(x*31+str.charCodeAt(i))>>>0; } return x; }
function rng(seed){ var s=h(String(seed))||1; return function(){ s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0; return s/4294967296; }; }
function pickW(r,a){ return a[Math.floor(r()*a.length)]; }
function stageChip(st){ var b=BRPD[st]; return '<span class="'+b.chip+'">'+b.k+'</span>'; }
function kbd(k){ return '<kbd class="k">'+k+'</kbd>'; }

/* ---------- shared builders ---------- */
function head(crumb,title,sub,actions){
  var c=crumb.map(function(x,i){ return (i?'<span class="sep">›</span>':'')+(x[1]?'<a href="'+esc(x[1])+'"'+(x[2]?' data-area="'+esc(x[2])+'"':'')+'>'+esc(x[0])+'</a>':esc(x[0])); }).join(" ");
  return '<div class="page-crumb">'+c+'</div>'+
    '<div class="page-head"><div class="grow"><h1 class="page-title">'+title+'</h1>'+(sub?'<div class="page-sub">'+sub+'</div>':'')+'</div>'+
    '<div class="page-actions">'+(actions||"")+'</div></div>';
}
function btn(label,cls,id,attrs){ return '<button class="btn '+(cls||"btn-2nd")+'" '+(id?'id="'+id+'" ':'')+(attrs||"")+'>'+label+'</button>'; }
function kpiCard(l,v,d,st,spark){
  return '<a class="kpi status-'+(st||"info")+'" href="javascript:void 0" data-kpi="'+esc(l)+'">'+
    '<div class="kpi-l">'+esc(l)+'</div><div class="kpi-v">'+v+'</div><div class="kpi-d">'+(d||"")+'</div>'+
    (spark||"")+'</a>';
}
function kpiRow(arr){ return '<div class="kpiRow">'+arr.map(function(k){ return kpiCard(LMSLabel(k[0]),k[1],k[2],k[3],k[4]?CH.spark(k[4],84,26):""); }).join("")+'</div>'; }
function sparkFor(label){ var r=rng(label); var v=[]; for(var i=0;i<14;i++) v.push(20+r()*60); return CH.spark(v,84,26); }
function card(title,body,cls,more){
  return '<section class="card '+(cls||"")+'">'+(title?'<div class="card-h"><h3>'+title+'</h3>'+(more||"")+'</div>':"")+'<div class="card-pad'+(title?"":" card-pad")+'">'+body+'</div></section>';
}
function miniList(rows,more){
  return '<section class="card"><div class="card-h"><h3></h3></div><div class="miniList"></div></section>';
}
function gridWrap(count,cols,rowsHtml,toolbarRight,footHtml){
  return '<div class="grid-wrap"><div class="grid-toolbar"><span class="grid-count"><b>'+count+'</b> records</span>'+(toolbarRight||"")+'</div>'+
    '<div class="scroll-x"><table class="usl-grid"><thead><tr>'+cols+'</tr></thead><tbody>'+rowsHtml+'</tbody></table></div>'+
    (footHtml||"")+'</div>';
}
function th(label,key){ return '<th class="sortable" data-sort="'+key+'">'+label+'</th>'; }
function docRows(n,seed){
  var r=rng(seed); var names=["NID front","NID back","Photograph","Salary certificate","Bank statement 6m","Trade license","TIN certificate","Property deed","Utility bill","Nominee NID"];
  var st=["Verified","Verified","Pending Verification","Approved","Rejected — resubmit","Verified"];
  var out="";
  for(var i=0;i<n;i++){
    var s=st[Math.floor(r()*st.length)];
    out+='<div class="doc-row"><span class="d-ico">📄</span><div class="grow"><b>'+names[i%names.length]+'</b><small class="muted" style="display:block">PDF · '+(0.2+r()*4).toFixed(1)+' MB · uploaded 2'+Math.floor(r()*6)+'-0'+Math.floor(r()*9)+'-1'+Math.floor(r()*9)+'</small></div>'+
      '<span class="chip '+(s.indexOf("Reject")>=0?"chip-err":s==="Verified"||s==="Approved"?"chip-ok":"chip-warn")+'">'+s+'</span>'+
      '<button class="btn btn-sm btn-2nd" data-toast="Preview: '+names[i%names.length]+' (secure viewer · AES-256 at rest)">View</button></div>';
  }
  return out;
}
function toastAttr(msg,type){ return 'data-toast="'+esc(msg)+'" data-tt="'+(type||"ok")+'"'; }

/* generic row synth per area — consistent per screen id */
var AREAVOCAB={
  A:{id:"CIF-",t:"Customer",st:["e-KYC Verified","Pending","Refresh Due"],amt:[2,40]},
  B:{id:"APP-",t:"Application",st:["On Track","SLA Risk","Returned","Approved"],amt:[3,90]},
  C:{id:"CR-",t:"Assessment",st:["Cleared","Exception","In Progress"],amt:[4,60]},
  D:{id:"APR-",t:"Approval",st:["Approved","Pending","Rejected","Escalated"],amt:[4,95]},
  E:{id:"LN-",t:"Loan account",st:["Active","Due Today","Overdue","Closed"],amt:[4,120]},
  F:{id:"COL-",t:"Collection",st:["PTP Kept","PTP Broken","No Response","Cured"],amt:[1,25]},
  G:{id:"RPT-",t:"Report",st:["Scheduled","On Demand","Filed"],amt:[0,0]},
  H:{id:"CFG-",t:"Configuration",st:["Active","Draft","Maker-Checker"],amt:[0,0]}
};
function genRows(sid,n){
  var r=rng(sid), out=[];
  var info=AREAVOCAB[sid.charAt(0)]||AREAVOCAB.A;
  for(var i=0;i<n;i++){
    var cust=D.customers[Math.floor(r()*D.customers.length)];
    var amt=Math.round((info.amt[0]+r()*(info.amt[1]-info.amt[0]))*100000);
    out.push({
      id:info.id+(10000+Math.floor(r()*89999)),
      title:LMSPick(cust.en,cust.bn)+(cust.firm?" · "+cust.firm:""),
      sub:info.t+" · "+cust.seg,
      status:info.st[Math.floor(r()*info.st.length)],
      amt:info.amt[1]?amt:0,
      date:"2026-"+String(1+Math.floor(r()*9)).padStart(2,"0")+"-"+String(1+Math.floor(r()*28)).padStart(2,"0"),
      owner:pickW(r,["R. Islam","F. Akter","K. Chowdhury","S. Mia","T. Rahman"]),
      branch:cust.branch.name, cust:cust
    });
  }
  return out;
}
function statusChip(s){
  if(/Reject|Broken|Escalated|Overdue|SLA/i.test(s)) return '<span class="chip chip-err">'+s+'</span>';
  if(/Pending|Refresh|Returned|Risk|No Response/i.test(s)) return '<span class="chip chip-warn">'+s+'</span>';
  if(/Verified|Active|Approved|Kept|Filed|Cleared|Scheduled/i.test(s)) return '<span class="chip chip-ok">'+s+'</span>';
  return '<span class="chip chip-neutral">'+s+'</span>';
}

/* ============================================================
   ROUTER
   ============================================================ */
function route(){
  var page=document.getElementById("page"); if(!page) return;
  var sb=document.getElementById("sb-route"); if(sb) sb.textContent=location.hash;
  var frag=(location.hash||"#/home").replace(/^#\/?/,"").split("?")[0];
  var seg=frag.split("/"); var p=seg[0]||"home";
  var html="";
  try{
    if(p==="home") html=pgHome();
    else if(p==="workspace"&&seg[1]) html=pgWorkspace(seg[1]);
    else if(p==="screen"&&seg[1]) html=pgScreen(seg[1]);
    else if(p==="record"&&seg[1]&&seg[2]) html=pgRecord(seg[1],seg[2]);
    else if(p==="freg"&&seg[1]) html=pgFreg(seg[1]);
    else if(p==="form"&&seg[1]) html=pgFormHost(decodeURIComponent(seg[2]||""),seg[1]);
    else if(p==="apply") html=pgApply();
    else if(p==="pipeline") html=pgPipeline();
    else if(p==="cust"&&seg[1]) html=pgCust(seg[1]);
    else if(p==="loan"&&seg[1]) html=pgLoan(seg[1]);
    else if(p==="cib"&&seg[1]) html=pgCib(seg[1]);
    else if(p==="approvals") html=pgApprovals();
    else if(p==="disburse") html=pgDisburse();
    else if(p==="collections") html=pgCollections();
    else if(p==="classification") html=pgClassification();
    else if(p==="analytics") html=pgAnalytics();
    else if(p==="regcon") html=pgRegcon();
    else if(p==="reports") html=pgReports(seg[1]);
    else if(p==="report"&&seg[1]&&seg[2]) html=pgReport(seg[1],parseInt(seg[2],10));
    else if(p==="writer") html=pgWriter();
    else if(p==="audit") html=pgAudit();
    else if(p==="settings") html=pgSettings();
    else if(p==="designsystem") html=pgDesign();
    else if(p==="coverage") html=pgCoverage();
    else if(p==="directory") html=pgDirectory();
    else if(p==="search") html=pgSearch();
    else if(p==="shortcuts") html=pgShortcuts();
    else if(p==="notifications") html=pgNotifications();
    else html=pgMissing(frag);
    page.innerHTML=html;
    page.setAttribute("data-route",frag);
    afterPaint(frag);
    syncTab(frag);
  }catch(err){
    page.innerHTML=head([["ULMS"],["Error"]],"Something went wrong",
      esc(err.message))+'<div class="empty-state"><div class="e-ico">⚠</div><p>The screen failed to render. This is a prototype defect — please report route <code class="mono">'+esc(frag)+'</code>.</p>'+
      '<button class="btn btn-primary" onclick="location.hash=\'#/home\'">Back to Home</button></div>';
    if(window.__lmsErr) window.__lmsErr(frag,err);
  }
}
window.__lmsRoute=route;

function syncTab(frag){
  var route="#/"+frag;
  var hit=null, title=null, icon="▤";
  Object.keys(MODS).forEach(function(k){
    var m=MODS[k]; m.groups.forEach(function(g){ g.screens.forEach(function(s){
      var r=s.route?s.route.split("?")[0]:("#/screen/"+s.id);
      if(r===route.split("?")[0]){ hit=r; title=s.en; icon=window.LMSTypeIcon(s.t); }
    });});
  });
  if(!hit){
    var named={"#/home":["Home","⌂"],"#/pipeline":["Application Pipeline","▤"],"#/apply":["New Application","✚"],
      "#/approvals":["My Approvals","✅"],"#/disburse":["Disbursement","💸"],"#/collections":["Collections","🎧"],
      "#/classification":["BRPD Classification","🏷"],"#/analytics":["Portfolio Analytics","▦"],"#/regcon":["Regulatory Console","🏛"],
      "#/reports":["Report Center","📄"],"#/writer":["Report Writer","✎"],"#/audit":["Audit Trail","🧾"],
      "#/settings":["System Settings","⚙"],"#/designsystem":["Design System","🎨"],"#/coverage":["Coverage","✓"],
      "#/directory":["Module Directory","☰"],"#/search":["Search","⌕"],"#/shortcuts":["Shortcuts","⌨"],"#/notifications":["Notifications","🔔"]};
    if(named[route]){ hit=route; title=named[route][0]; icon=named[route][1]; }
    else if(route.indexOf("#/cust/")===0){ hit="#/cust/x"; title="Customer 360"; icon="◉"; }
    else if(route.indexOf("#/loan/")===0){ hit="#/loan/x"; title="Loan 360"; icon="◉"; }
    else if(route.indexOf("#/cib/")===0){ hit="#/cib/x"; title="CIB Report"; icon="🛡"; }
    else if(route.indexOf("#/workspace/")===0){ var m2=MODS[route.split("/")[2]]; if(m2){ hit=route; title=m2.en; icon=m2.icon; } }
    else if(route.indexOf("#/report/")===0){ hit="#/reports"; title="Report Viewer"; icon="📄"; }
  }
  if(hit) window.LMSOpenTab(String(h(hit)),title,hit,icon);
  window.paintNavSafe&&window.paintNavSafe();
}

/* wire delegated behaviours after each paint */
function afterPaint(frag){
  document.querySelectorAll("#page [data-toast]").forEach(function(b){
    b.addEventListener("click",function(e){ if(!b.dataset.gomodal){ e.stopPropagation(); window.LMSToast(b.getAttribute("data-toast"),b.getAttribute("data-tt")||"ok"); } });
  });
  if(typeof window.__pageWired==="function") window.__pageWired(frag);
}

/* ============================================================
   HOME — Executive role center
   ============================================================ */
function pgHome(){
  var months=["Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"];
  var disb=[288,301,342,296,318,352,331,371,384,392,401,412].map(function(v){return v*10;});
  var recov=[252,268,281,262,279,301,289,316,328,339,351,366].map(function(v){return v*10;});
  var buckets=D.loans.reduce(function(a,l){ a[l.stage].n++; a[l.stage].amt+=l.outstanding; return a; },
    BRPD.map(function(b){return {n:0,amt:0,b:b};}));
  var K=kpiRow([
    ["Gross portfolio","৳5,200 Cr","<b class='up'>+1.8%</b> m/m · 45,230 loans","ok",disb],
    ["Gross NPL","4.6%","<b class='up'>−0.2pp</b> vs Aug · target ≤5%","ok",[6.8,6.4,6.1,5.8,5.5,5.2,5.0,4.9,4.8,4.7,4.6,4.6]],
    ["Net NPL","2.1%","provision coverage 68.5%","ok"],
    ["PAR-30","6.2%","<b class='dn'>+0.3pp</b> — watch Gulshan","warn"],
    ["Applications (Sep)","342","<b class='up'>+12%</b> · drop-off 18%","info"],
    ["Avg TAT","1.9 days","from 12 days legacy · target 2d","ok"],
    ["Disbursed (Sep)","৳412 Cr","108% of monthly plan","ok",disb],
    ["Collection efficiency","91.4%","target 90% · PTP kept 72%","ok"]
  ]);
  var funnel=CH.funnel([
    {label:"Received",value:342,cap:"342 apps"},
    {label:"Screening passed",value:301},{label:"CIB cleared",value:272},
    {label:"Scored AAA–BBB",value:224},{label:"CPV passed",value:196},
    {label:"Approved",value:243,cap:"71% approve"}]);
  var branchBars=CH.vbars(D.branches.slice(0,6).map(function(b,i){ return {label:b.name,value:[52,61,38,47,58,42][i],cap:"৳"+[52,61,38,47,58,42][i]+" Cr"}; }));
  var alerts=D.alerts.filter(function(a){return a.t;}).map(function(a){
    return '<div class="alert-row"><span class="a-ico">'+a.ico+'</span><div class="grow"><b>'+esc(a.t)+'</b><div class="small">'+esc(a.d)+'</div></div>'+
      '<span class="tag">'+a.ago+'</span><button class="btn btn-sm btn-2nd" data-toast="Alert routed to owning module">Open</button></div>';
  }).join("");
  var myAppr=D.approvals.slice(0,4).map(function(a){
    return '<div class="mi" data-golink="#/approvals"><span class="idchip">'+a.app.id+'</span><span class="grow trunc">'+esc(LMSPick(a.app.cust.en,a.app.cust.bn))+'</span><b class="num">'+F.tk(a.app.amount)+'</b><span class="chip '+(a.waitingHrs>a.slaHrs-6?"chip-warn":"chip-neutral")+'">'+a.waitingHrs+'h</span></div>';
  }).join("");
  var tiles=window.LMS_HOME_TILES.map(function(t){
    return '<a class="kpi status-info" href="'+t.route+'" style="text-align:center"><div style="font-size:22px">'+t.icon+'</div><div class="kpi-l">'+esc(t.label)+'</div>'+(t.badge?'<span class="ni-badge" style="margin-top:4px">'+t.badge+'</span>':'')+'</a>';
  }).join("");
  var brRows=D.branches.map(function(b,i){
    var tgt=[45,50,32,42,55,38,30,35,28,33][i], act=[52,61,38,47,58,42,24,31,33,36][i];
    return '<tr data-golink="#/screen/G1-s3"><td>'+(i+1)+'</td><td><b>'+b.name+'</b><span class="sub">'+b.region+'</span></td><td class="num">'+F.tk(tgt*1e7)+'</td><td class="num">'+F.tk(act*1e7)+'</td>'+
      '<td><span class="chip '+(act/tgt>=1?"chip-ok":act/tgt>=.85?"chip-warn":"chip-err")+'">'+Math.round(act/tgt*100)+'%</span></td>'+
      '<td class="num">'+[3.1,4.2,5.8,3.9,4.4,6.1,7.2,4.8,8.9,5.5][i].toFixed(1)+'%</td><td class="num">'+[1.4,1.9,2.8,1.8,2.1,3.0,3.6,2.3,4.5,2.7][i].toFixed(1)+'%</td></tr>';
  }).join("");
  return head([["ULMS",null],["Home",null]],"Executive Role Center",
    "ABC Bank Bangladesh · 65 branches · 45,230 active loans · <span class='chip chip-ok' style='height:18px'>● live</span>",
    btn("＋ New Application","btn-primary",null,'data-golink="#/apply"')+btn("Board pack (PDF)","btn-2nd",null,toastAttr("Board pack queued — 7 dashboards compiling to PDF"))+btn("▤ Report Center","btn-2nd",null,'data-golink="#/reports"'))+
    K+
    '<div class="dash-grid">'+
    '<div class="w8">'+card("Disbursed vs collected — trailing 12 months (৳ Lakh)",
      CH.line(months,[{name:"Disbursed",data:disb},{name:"Collected",data:recov,color:"var(--chart-3)"}]),"","")+'</div>'+
    '<div class="w4">'+card("BRPD 15/2024 classification mix",
      CH.clsStrip(buckets.map(function(x){return {label:x.b.k,value:x.n,color:x.b.color};}))+
      '<div class="small" style="margin-top:8px">Provision held <b>৳212 Cr</b> · coverage 68.5% · EOD batch 02:30 ✓</div>'+
      '<div style="margin-top:8px"><a class="btn btn-sm btn-2nd" href="#/classification">Open BRPD board</a></div>')+'</div>'+
    '<div class="w6">'+card("Origination funnel — September",funnel)+'</div>'+
    '<div class="w6">'+card("Disbursement by branch — top 6 (৳ Cr, Sep)",branchBars)+'</div>'+
    '<div class="w4">'+card("Priority alerts",alerts,"",'<a class="more" href="#/notifications">View all</a>')+'</div>'+
    '<div class="w4">'+card("My approvals waiting",'<div class="miniList">'+myAppr+'</div>',"",'<a class="more" href="#/approvals">Open inbox</a>')+'</div>'+
    '<div class="w4">'+card("Quick actions",'<div class="kpiRow" style="margin:0;grid-template-columns:1fr 1fr">'+tiles+'</div>')+'</div>'+
    '<div class="w12">'+card("Branch performance — September",
      '<div class="scroll-x"><table class="usl-grid"><thead><tr>'+["#","Branch","Target","Actual","Achv %","PAR-30","NPL"].map(function(c){return "<th>"+c+"</th>";}).join("")+'</tr></thead><tbody>'+brRows+'</tbody></table></div>',
      "","<a class='more' href='#/screen/G1-s3'>Full ranking</a>")+'</div>'+
    '</div>';
}

/* ============================================================
   WORKSPACE (module landing)
   ============================================================ */
function pgWorkspace(mid){
  var m=MODS[mid]; if(!m) return pgMissing(mid);
  var area=AREAS.filter(function(a){return a.id===m.area;})[0];
  var groups=m.groups.map(function(g,i){
    var links=g.screens.map(function(s){
      var r=s.route||("#/screen/"+s.id);
      return '<a class="mega-link" href="'+esc(r)+'"><span>'+window.LMSTypeIcon(s.t)+'</span><span class="grow trunc">'+esc(LMSPick(s.en,s.bn))+'</span><span class="sc-type">'+s.t+'</span></a>';
    }).join("");
    return '<section class="card"><div class="card-h"><h3>'+(i+1)+". "+esc(LMSPick(g.en,g.bn))+'</h3><span class="more">'+g.screens.length+' '+LMSLabel("screens")+'</span></div><div class="card-pad" style="padding:8px 8px">'+links+'</div></section>';
  }).join("");
  var forms=m.forms.map(function(f,i){ return '<button class="mega-link" style="width:100%" data-openform="'+esc(f)+'" data-mid="'+mid+'"><span>✎</span><span class="grow trunc">'+esc(f)+'</span><span class="sc-type">form</span></button>'; }).join("");
  var reps=m.reports.map(function(r,i){ return '<a class="mega-link" href="#/report/'+mid+'/'+i+'"><span>📄</span><span class="grow trunc">'+esc(r)+'</span><span class="sc-type">r</span></a>'; }).join("");
  var cross=m.cross.map(function(c){ return '<span class="chip chip-info">'+esc(c)+'</span>'; }).join("");
  return head([[LMSPick(area.en,area.bn),"#/directory",area.id],[LMSPick(m.en,m.bn),null]],
    m.icon+" "+esc(LMSPick(m.en,m.bn))+' <span class="tag" style="vertical-align:middle">'+mid+'</span>',
    LMSPick(m.desc, m.bn+" · "+LMSPick(area.en,area.bn)),
    btn("Function register","btn-2nd",null,'data-golink="#/freg/'+mid+'"')+btn("All module reports","btn-2nd",null,'data-golink="#/reports/'+mid+'"'))+
    kpiRow(m.kpis.map(function(k){ return [k.l,k.v,k.d,k.st]; }))+
    '<div class="dash-grid">'+
    '<div class="w12" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px">'+groups+'</div>'+
    '<div class="w4">'+card("Data entry forms",'<div style="padding:4px">'+forms+'</div>')+'</div>'+
    '<div class="w4">'+card("Module reports",'<div style="padding:4px">'+reps+'</div>')+'</div>'+
    '<div class="w4">'+card("Cross-module links",'<div class="card-pad" style="display:flex;flex-wrap:wrap;gap:8px">'+cross+'</div><div class="card-pad" style="border-top:1px solid var(--stroke)"><div class="fb-kv"><span>Functions in register</span><b>'+m.frs+'</b></div><div class="fb-kv"><span>Screens</span><b>'+m.groups.reduce(function(a,g){return a+g.screens.length;},0)+'</b></div><div class="fb-kv"><span>Reports</span><b>'+m.reports.length+'</b></div></div>')+'</div>'+
    '</div>';
}

/* ============================================================
   SPEC SCREEN — archetype dispatch
   ============================================================ */
function pgScreen(sid){
  var hit=window.LMSFindScreen(sid);
  if(!hit) return pgMissing(sid);
  if(hit.scr.route){ setTimeout(function(){ window.LMSGo(hit.scr.route); },0);
    return head([["Redirecting…",null]],"Redirecting…",""); }
  var t=hit.scr.t;
  var by={g:gridPage,f:recordPage,x:xPage,c:consolePage,d:dashPage,r:repPage};
  return (by[t]||gridPage)(hit.mod,hit.grp,hit.scr);
}

/* ---------- archetype g · grid/list ---------- */
function gridPage(mod,grp,scr){
  var rows=genRows(scr.id,14);
  var stPool={}; rows.forEach(function(r){ stPool[r.status]=(stPool[r.status]||0)+1; });
  var filters=Object.keys(stPool).map(function(s){
    return '<label class="fp-item"><input type="checkbox" checked data-fst="'+esc(s)+'"> '+statusChip(s).replace(/<[^>]*>/g,"")+' <span class="fp-n">'+stPool[s]+'</span></label>';
  }).join("");
  var brs=D.branches.slice(0,6).map(function(b){ return '<label class="fp-item"><input type="checkbox" checked data-fbr="'+esc(b.name)+'"> '+esc(b.name)+' <span class="fp-n">'+Math.max(1,Math.round(rows.length/8))+'</span></label>'; }).join("");
  var body=rows.map(function(r,i){
    return '<tr data-rec="'+i+'" data-sid="'+scr.id+'"><td class="col-check"><input type="checkbox" class="rowchk"></td>'+
      '<td><span class="idchip" data-golink="#/record/'+scr.id+"/"+i+'">'+r.id+'</span></td>'+
      '<td><b>'+esc(r.title)+'</b><span class="sub">'+esc(r.sub)+'</span></td>'+
      '<td>'+statusChip(r.status)+'</td>'+
      '<td class="right num">'+(r.amt?F.tk(r.amt):"—")+'</td><td class="num">'+r.date+'</td>'+
      '<td>'+esc(r.owner)+'</td><td>'+esc(r.branch)+'</td>'+
      '<td><span class="rowActs"><button title="Open" data-golink="#/record/'+scr.id+"/"+i+'">›</button><button title="Toast" '+toastAttr(r.id+" — quick action dispatched")+">⚡</button></span></td></tr>";
  }).join("");
  var cols="<th class='col-check'><input type='checkbox' id='chk-all'></th>"+th("Record","id")+th("Title","title")+th("Status","status")+th("Amount","amt")+th("Date","date")+th("Owner","owner")+th("Branch","branch")+"<th></th>";
  return head([[LMSPick(mod.en,mod.bn),"#/workspace/"+Object.keys(MODS).filter(function(k){return MODS[k]===mod;})[0]],[LMSPick(scr.en,scr.bn),null]],
    esc(LMSPick(scr.en,scr.bn))+' <span class="tag" style="vertical-align:middle">archetype g · list</span>',
    LMSPick(scr.en,scr.bn)+" · "+LMSPick(grp.en,grp.bn)+" · "+LMSPick(mod.en,mod.bn),
    btn("Export","btn-2nd",null,toastAttr("Exported 14 rows → Excel (prototype)"))+btn("Refresh","btn-2nd",null,toastAttr("View refreshed from source"))+btn("＋ New","btn-primary",null,'data-openform="'+esc(mod.forms[0]||"New record")+'" data-mid="'+Object.keys(MODS).filter(function(k){return MODS[k]===mod;})[0]+'"'))+
    '<div class="list-layout">'+
    '<aside class="filter-pane"><div class="fp-h">Status</div><div class="fp-grid" data-fpgroup="st">'+filters+'</div>'+
    '<div class="fp-h">Branch</div><div class="fp-grid" data-fpgroup="br">'+brs+'</div>'+
    '<div class="fp-h">Saved views</div>'+
    '<label class="fp-item"><input type="radio" name="sv" checked data-view="all"> All records <span class="fp-n">'+rows.length+'</span></label>'+
    '<label class="fp-item"><input type="radio" name="sv" data-view="large"> Large (≥ ৳50 L)</label>'+
    '<label class="fp-item"><input type="radio" name="sv" data-view="today"> September activity</label>'+
    '<div style="padding:8px 10px"><button class="btn btn-sm btn-2nd" '+toastAttr("Saved view created — available to your role")+">＋ "+esc(T("save_view"))+"</button></div></aside>"+
    gridWrap(rows.length,cols,body,
      '<div class="view-pills"><button class="vp on" data-vp="all">All</button><button class="vp" data-vp="large">Large</button><button class="vp" data-vp="flag">⚠ Exceptions</button></div>'+
      '<div class="grid-tools">'+btn("Columns","btn-sm btn-2nd",null,toastAttr("Column chooser (prototype)"))+btn("⟳","btn-sm btn-2nd",null,toastAttr("Refreshed"))+"</div>",
      '<div class="grid-foot">Page 1 of 2 · 14 records<button class="pgr" style="margin-left:auto" '+toastAttr("Pagination (prototype)")+'›</button></div>')+
    '</div>';
}

/* ---------- archetype f · record/form page ---------- */
var FORMVOCAB={
  A:["Full name (English)","Full name (Bangla)","Father's name","Mother's name","Date of birth","Gender","Marital status","NID (auto-verified)","Passport no.","TIN","Mobile (OTP verified)","Email","Present address","Permanent address","Years at residence","Employment type","Employer / Business","Monthly income","Nominee name","Nominee NID"],
  B:["Application no.","Customer (CIF)","Product","Loan amount (৳)","Tenor (months)","Purpose","Repayment mode","Interest type","Collateral offered","Guarantor name","Branch","Scheme / campaign","Agent code","Priority"],
  C:["Inquiry ref","Applicant","NID / TIN","Date of birth","Purpose of inquiry","Application ref","Consent obtained","Expected turnaround"],
  D:["Reference","Level","Approver role","Amount (৳)","Conditions","Delegation target","Comment (required)","Signature"],
  E:["Loan account","Customer","Amount received (৳)","Mode","Value date","Narration","Waiver requested","Receipt language"],
  F:["Loan account","DPD bucket","Action type","Promise date","Promise amount (৳)","Visit GPS","Outcome","Next follow-up"],
  G:["Report name","Parameters","Schedule","Recipients","Format"],
  H:["Setting","Value","Effective from","Reason","Maker","Checker"]
};
function formFields(areaId,ctx){
  var base=(FORMVOCAB[areaId]||FORMVOCAB.A).slice();
  if(/promise|ptp/i.test(ctx||"")) base=base.concat(["Promise date","Confidence level"]);
  if(/disburse/i.test(ctx||"")) base=base.concat(["Payout rail","Beneficiary wallet / account"]);
  if(/write.?off|recovery/i.test(ctx||"")) base=base.concat(["Board approval ref","Recovery potential (৳)"]);
  if(/reschedul|restructur/i.test(ctx||"")) base=base.concat(["New tenor","Provision impact","BRPD justification"]);
  var req=Math.min(4,base.length);
  return base.map(function(f,i){
    var required=i<req;
    var isArea=/address|Employer|Narration|Conditions|Comment|Purpose|Reason|Parameters/i.test(f);
    return '<div class="field'+(i===0?" prefill":"")+'" data-req="'+(required?1:0)+'"><label>'+esc(LMSLabel(f))+(required?'<span class="req">*</span>':'')+'</label>'+
      (isArea?'<textarea rows="2" placeholder="…"></textarea>':'<input type="text" placeholder="'+(/date/i.test(f)?"YYYY-MM-DD":/amount|৳/i.test(f)?"0.00":/NID/i.test(f)?"auto-verified from NIDW":"")+'" '+(/amount|৳/.test(f)?'class="num"':'')+'>')+
      '<span class="err-msg">Required — '+esc(f)+' cannot be blank</span></div>';
  }).join("");
}
function recordPage(mod,grp,scr){
  var mid=Object.keys(MODS).filter(function(k){return MODS[k]===mod;})[0];
  var rows=genRows(scr.id,14);
  var r=rows[0];
  var steps=["Draft","Review","Verification","Approval","Active"];
  var cur=h(scr.id)%5;
  var bpf='<div class="bpf">'+steps.map(function(s,i){
    return '<div class="bpf-step '+(i<cur?"done":i===cur?"current":"")+'"><span class="b-dot">'+(i<cur?"✓":i+1)+'</span><span>'+s+'<small>'+(i<cur?"cleared · "+(i+1)+"d":i===cur?"with "+esc(r.owner):"pending")+'</small></span></div>';
  }).join("")+'<div class="bpf-step" style="flex:none"><span class="tag">SLA 48h</span></div></div>';
  var band='<div class="dm-head-band">'+
    [['Record',r.id],['Title',esc(r.title)],['Status',statusChip(r.status)],['Amount',r.amt?F.tk(r.amt):"—"],
     ['Owner',esc(r.owner)],['Branch',esc(r.branch)],['Created',r.date]].map(function(x){
      return '<div class="band-item"><div class="b-l">'+x[0]+'</div><div class="b-v">'+x[1]+'</div></div>'; }).join("")+'</div>';
  var tabs='<div class="dm-tabs"><div class="dm-tabbar" role="tablist">'+
    ["General","Lines & schedule","Documents","Activity","Audit trail"].map(function(t,i){
      return '<button class="dm-tab'+(i===0?" on":"")+'" data-tab="rt'+i+'" role="tab">'+t+'</button>'; }).join("")+'</div>'+
    '<div class="tabpane on" id="rt0"><div class="form-section"><h3>Primary information <span class="h-note">autosave · 30s · '+esc(T("form_saved")).split("—")[0]+'maker-checker</span></h3>'+
    '<div class="form-grid">'+formFields(mod.area,scr.en)+'</div></div></div>'+
    '<div class="tabpane" id="rt1"><div class="form-section"><h3>Lines</h3><div class="scroll-x"><table class="lines-table"><thead><tr><th>#</th><th>Item</th><th>Value (৳)</th><th>Type</th><th>Status</th></tr></thead><tbody>'+
      [1,2,3].map(function(i){ return '<tr><td>'+i+'</td><td>Line item '+i+' — seeded from '+esc(mod.en)+'</td><td class="num">'+F.tkFull(100000*i*7)+'</td><td>Standard</td><td>'+statusChip("Active")+'</td></tr>'; }).join("")+
      '</tbody></table></div></div></div>'+
    '<div class="tabpane" id="rt2"><div class="form-section"><h3>Documents</h3>'+docRows(5,scr.id)+'</div></div>'+
    '<div class="tabpane" id="rt3"><div class="card-pad timeline">'+[["✎","Record created","Draft captured from "+mod.en+" intake","2d ago · "+r.owner],
      ["🛡","Status change","Moved to "+r.status,"1d ago · system"],["⏱","Task assigned","Verification to field team","22h ago · "+r.owner],
      ["✓","Checklist cleared","4 of 4 checks green","3h ago · checker-2"]].map(function(x){
      return '<div class="tl-item"><span class="tl-ico">'+x[0]+'</span><b>'+x[1]+'</b><p>'+x[2]+'</p><div class="tl-meta">'+x[3]+'</div></div>'; }).join("")+'</div></div>'+
    '<div class="tabpane" id="rt4"><div class="form-section"><h3>Audit trail (immutable)</h3><div class="scroll-x"><table class="usl-grid"><thead><tr><th>When</th><th>User</th><th>Action</th><th>Field</th><th>Old → New</th></tr></thead><tbody>'+
      [["2026-09-24 10:12","r.islam","UPDATE","status","Pending → "+r.status],["2026-09-24 09:40","maker-1","CREATE","record","— → draft"],
       ["2026-09-23 17:02","f.akter","VERIFY","documents","2 files → verified"]].map(function(x){
        return '<tr><td class="num mono">'+x[0]+'</td><td>'+x[1]+'</td><td><span class="tag">'+x[2]+'</span></td><td>'+x[3]+'</td><td class="mono small">'+esc(x[4])+'</td></tr>'; }).join("")+
      '</tbody></table></div></div></div></div>';
  var fb='<div class="fb-card"><h4>Next best action</h4><div class="fb-body"><div class="nba"><h5>'+(mod.area==="F"?"Field visit before SMS":"Complete verification today")+'</h5><p>Based on '+r.id+' profile and SLA clock.</p><button class="btn btn-sm btn-primary" '+toastAttr("Action executed — task dispatched to "+r.owner)+">Execute</button></div></div></div>"+
    '<div class="fb-card"><h4>Key facts</h4><div class="fb-body">'+
    [["Stage",steps[cur]],["SLA left","22h"],["Risk","Medium"],["Linked CIF",r.cust.cif],["Loans",String(r.cust.relLoans)]].map(function(x){
      return '<div class="fb-kv"><span>'+x[0]+'</span><b>'+esc(x[1])+'</b></div>'; }).join("")+'</div></div>'+
    '<div class="fb-card"><h4>Trend</h4><div class="fb-body">'+sparkFor(r.id)+'<div class="small" style="margin-top:6px">Activity index, 14 days</div></div></div>'+
    '<div class="fb-card"><h4>Related</h4><div class="fb-body fb-links"><a href="#/cust/'+r.cust.cif+'">◉ Customer 360</a><a href="#/audit">🧾 Audit entries</a><a href="#/report/'+mid+'/0">📄 Module report</a></div></div>';
  return head([[mod.en,"#/workspace/"+mid],[grp.en,null],[scr.en,null]],
    esc(r.title)+' <span class="tag" style="vertical-align:middle">archetype f · record</span>',
    r.id+" · "+scr.bn+" · "+esc(r.sub),
    '<span class="locked-chip">🔒 Concurrent-edit lock · you</span>'+btn("Print","btn-2nd",null,'onclick="window.print()"')+btn("Submit (maker → checker)","btn-primary",null,toastAttr(T("form_saved"))))+
    bpf+band+'<div class="dm-layout"><div class="dm-main">'+tabs+'</div><aside>'+fb+'</aside></div>';
}

/* ---------- archetype x · 360 view ---------- */
function xPage(mod,grp,scr){
  var rows=genRows(scr.id,6);
  var c=rows[0].cust;
  return pgCust(c.cif);
}

/* ---------- archetype c · console ---------- */
function consolePage(mod,grp,scr){
  var mid=Object.keys(MODS).filter(function(k){return MODS[k]===mod;})[0];
  var steps=["Prepare","Verify","Approve","Execute","Reconcile"];
  var cur=h(scr.id)%5;
  var left='<div class="con-steps"><div class="cs-item" style="color:var(--ink-500);font-size:10px;text-transform:uppercase;letter-spacing:.06em">Process</div>'+
    steps.map(function(s,i){ return '<div class="cs-item '+(i<cur?"done":i===cur?"current":"")+'"><span class="c-dot">'+(i<cur?"✓":i+1)+'</span><span>'+s+'<small>'+(i<cur?"done":i===cur?"in progress · you":"queued")+'</small></span></div>'; }).join("")+'</div>';
  var checks=[["Sanction letter issued","BOCC resolution 2026-09-14",1],["Agreement signed & scanned","Dual-page PDF verified",1],
    ["Collateral charge registered","Land Registry ack #DCK-88231",1],["Insurance valid","Policy expires 2027-03-21",1],
    ["Limit loaded in Finacle","CBS ref FIN-774102",1],["First EMI date set","2026-11-05",1],
    ["e-KYC consent on file","Version 3 · 2026-09-12",0]].map(function(x,i){
    return '<div class="ck-row '+(x[2]?"ok":"warn")+'"><span class="ck-ico">'+(x[2]?"✓":"!")+'</span><div class="grow"><b>'+x[0]+'</b><small>'+x[1]+'</small></div>'+
      (x[2]?"":'<button class="btn btn-sm btn-2nd" '+toastAttr("Override requested — dual authorization required (maker-checker)")+">Override…</button>")+'</div>';
  }).join("");
  var center='<section class="card"><div class="card-h"><h3>'+esc(scr.en)+' — control checklist</h3><span class="live">● live</span></div>'+checks+
    '<div class="card-pad" style="border-top:1px solid var(--stroke);display:flex;gap:8px;flex-wrap:wrap">'+
    btn("Execute next step","btn-primary",null,toastAttr("Step executed — workflow advanced, audit written"))+
    btn("Hold","btn-2nd",null,toastAttr("Placed on hold — reason captured"))+
    btn("Print checklist","btn-2nd",null,'onclick="window.print()"')+'</div></section>';
  var metrics='<div class="fb-card"><h4>Health</h4><div class="fb-body" style="text-align:center">'+CH.gauge(86,"controls green")+'</div></div>'+
    '<div class="fb-card"><h4>Recent activity</h4><div class="fb-body">'+
    [["10:41","Checklist 6/7 verified"],["09:58","Limit FIN-774102 loaded"],["09:12","Docs re-verified (checker-2)"],["08:30","Batch opened"]]
      .map(function(x){ return '<div class="fb-kv"><span class="mono">'+x[0]+'</span><b class="grow" style="text-align:left;font-weight:400">'+x[1]+'</b></div>'; }).join("")+'</div></div>';
  return head([[mod.en,"#/workspace/"+mid],[scr.en,null]],esc(scr.en)+' <span class="tag">archetype c · console</span>',scr.bn+" · "+mod.desc,
    btn("Refresh","btn-2nd",null,toastAttr("Console refreshed")))+
    '<div class="console-layout">'+left+'<div class="grow">'+center+'</div><aside class="con-metrics">'+metrics+'</aside></div>';
}

/* ---------- archetype d · dashboard ---------- */
function dashPage(mod,grp,scr){
  var mid=Object.keys(MODS).filter(function(k){return MODS[k]===mod;})[0];
  var r=rng(scr.id); var a=[],b=[],c=[];
  for(var i=0;i<12;i++){ a.push(Math.round(100+r()*250)); b.push(Math.round(80+r()*200)); c.push(["W"+(i+1),"",""]); }
  return head([[mod.en,"#/workspace/"+mid],[scr.en,null]],esc(scr.en)+' <span class="tag">archetype d · dashboard</span>',scr.bn+" · live with 5s refresh",
    btn("Export","btn-2nd",null,toastAttr("Dashboard exported to PDF")))+
    kpiRow(mod.kpis.map(function(k){ return [k.l,k.v,k.d,k.st]; }))+
    '<div class="dash-grid">'+
    '<div class="w8">'+card("Trend — 12 weeks",CH.line(["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"],[{name:"Inflow",data:a},{name:"Resolved",data:b,color:"var(--chart-3)"}]))+'</div>'+
    '<div class="w4">'+card("Mix",CH.donut([{label:"Green",value:5+r()*10,color:"var(--ok-bold,#107C10)"},{label:"Watch",value:2+r()*5,color:"var(--chart-2)"},{label:"Risk",value:1+r()*3,color:"var(--chart-5)"}],140,"42%","green"))+'</div>'+
    '<div class="w6">'+card("Weekly volumes",CH.vbars(["W7","W8","W9","W10","W11","W12"].map(function(w){ return {label:w,value:Math.round(60+r()*180)}; })))+'</div>'+
    '<div class="w6">'+card("Breakdown",CH.hbars(D.branches.slice(0,6).map(function(x){ return {label:x.name,value:Math.round(20+r()*100)}; })))+'</div></div>';
}

/* ---------- archetype r · report page ---------- */
function repPage(mod,grp,scr){
  var mid=Object.keys(MODS).filter(function(k){return MODS[k]===mod;})[0];
  return pgReport(mid, h(scr.id)%Math.max(1,mod.reports.length));
}

/* ---------- record detail route ---------- */
function pgRecord(sid,rid){
  var hit=window.LMSFindScreen(sid); if(!hit) return pgMissing(sid);
  return recordPage(hit.mod,hit.grp,Object.assign({},hit.scr,{en:hit.scr.en,id:sid}));
}

/* ---------- function register ---------- */
function pgFreg(mid){
  var m=MODS[mid]; if(!m) return pgMissing(mid);
  var idx=1;
  var rows=m.groups.map(function(g){
    return g.screens.map(function(s){
      var n=2+(h(s.id)%7);
      var out='<tr><td class="num">'+(idx++)+'</td><td><b>'+esc(s.en)+'</b><span class="sub">'+esc(g.en)+'</span></td><td>'+window.LMSTypeIcon(s.t)+' '+s.t+'</td><td class="num">'+n+'</td><td><span class="chip chip-ok">configured</span></td>'+
        '<td><button class="btn btn-sm btn-2nd" data-golink="'+(s.route||("#/screen/"+s.id))+'">Open</button></td></tr>';
      return out;
    }).join("");
  }).join("");
  return head([[m.en,"#/workspace/"+mid],["Function register",null]],
    "Function register — "+m.en,"Every function is bound to a screen and a maker-checker rule · "+m.frs+" functions total",
    btn("Export register","btn-2nd",null,toastAttr("Register exported → Excel")))+
    gridWrap(idx-1,["<th>#</th>","<th>Function</th>","<th>Type</th>","<th>Rules</th>","<th>Status</th>","<th></th>"].join(""),rows);
}

/* ============================================================
   APPLY — 6-step loan application wizard (flagship form)
   ============================================================ */
var WIZ=["Personal","Contact & address","Employment & finance","Loan & product","Documents","Review & submit"];
function pgApply(){
  var steps=WIZ.map(function(s,i){
    return '<button class="wiz-step'+(i===0?" current":"")+'" data-wstep="'+i+'"><span class="w-dot">'+(i+1)+'</span>'+s+'</button>';
  }).join("");
  var prodCards=D.products.map(function(p,i){
    return '<label class="pay-opt" style="align-items:flex-start" data-prod="'+p.id+'"><input type="radio" name="prod" '+(i===0?"checked":"")+' style="margin-top:4px">'+
      '<span class="po-logo" style="background:var(--primary)">'+p.icon+'</span><span class="grow"><b>'+esc(LMSPick(p.en,p.bn))+'</b>'+
      '<small style="display:block;margin-top:2px">'+p.type+' · '+p.rate+' · '+p.tenor+' · '+p.amt+'</small></span><span class="tag">'+p.id+'</span></label>';
  }).join("");
  var html=head([["Loan Origination","#/workspace/B1"],["New Application",null]],
    "New Loan Application <span class='tag' style='vertical-align:middle'>6-step wizard</span>",
    "Autosave every 30s · NID auto-fill · live DBR · maker-checker on submit",
    btn("Save draft","btn-2nd","wiz-draft")+btn("Cancel","btn-ghost",null,'data-golink="#/pipeline"'))+
    '<div class="wiz"><div class="wiz-steps">'+steps+'</div>'+
    '<div class="wiz-pane" id="wiz-pane"></div>'+
    '<div class="wiz-foot"><button class="btn btn-2nd" id="wiz-back">‹ '+T("back")+'</button>'+
    '<button class="btn btn-primary" id="wiz-next">'+T("next")+' ›</button>'+
    '<div class="prog"><span id="wiz-pct">17%</span><span class="p-track"><span class="p-fill" id="wiz-fill" style="width:17%"></span></span><span class="small">'+T("autosave")+'</span></div></div></div>'+
    '<div class="card" style="margin-top:12px"><div class="card-h"><h3>Product eligibility pre-check</h3></div><div class="card-pad" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px">'+prodCards+'</div></div>';
  return html;
}
function wizPane(i){
  var P=[
    function(){ return '<div class="form-section" style="margin:0"><h3>1 · Personal information <span class="h-note">NID verified in 3.2s — 4 fields auto-filled</span></h3><div class="form-grid">'+
      fld(LMSPick("Full name (English)","নাম (ইংরেজি)"),"Md. Rafiqul Islam",1)+fld(LMSPick("Full name (Bangla)","নাম (বাংলা)"),"মোঃ রফিকুল ইসলাম")+fld("Father's name","Md. Habibur Rahman",1)+fld("Mother's name","Rahima Begum")+
      fld("Date of birth","1988-04-12",1,"date")+sel("Gender",["Male","Female","Other"],1)+sel("Marital status",["Married","Single","Widowed"],1)+
      fld("NID","1990123456789",1).replace("<input",'<input readonly class="mono"')+fld("Passport no.","")+fld("TIN","")+'</div></div>'; },
    function(){ return '<div class="form-section" style="margin:0"><h3>2 · Contact & address</h3><div class="form-grid">'+
      fld("Mobile (+880)","1712345678",1,"tel")+fld("Email","rafiq@example.com")+fld("Years at residence","6",1,"number")+
      '<div class="field span2"><label>Present address<span class="req">*</span></label><textarea rows="2">House 42, Road 11, Block C, Banani, Dhaka 1213</textarea></div>'+
      '<div class="field span2"><label>Permanent address</label><textarea rows="2">Vill: Charpara, P.S: Sadar, Dist: Mymensingh</textarea></div>'+
      '<div class="field"><label>Map pin (auto)</label><input value="23.7936, 90.4043" readonly class="mono"></div>'+sel("Address verified via",["NIDW match","Utility bill","Field visit"],1)+'</div></div>'; },
    function(){ return '<div class="form-section" style="margin:0"><h3>3 · Employment & financials <span class="h-note">EMIs from CIB auto-populated</span></h3><div class="form-grid">'+
      sel("Employment type",["Salaried","Self-employed","Business owner","Agri"],1)+fld("Employer / Business","Rashida Traders",1)+fld("Designation","Proprietor")+
      fld("Monthly income (৳)","185,000",1,"number")+fld("Existing EMIs — CIB (৳/mo)","42,000")+fld("Proposed EMI (৳/mo)","38,500")+
      fld("Other obligations (৳/mo)","8,000")+fld("Dependents","3","number")+'</div>'+
      '<div class="calc-out"><h5>Live DBR — debt burden ratio</h5><div class="dbr-gauge"><div class="dbr-v" id="dbr-v" style="color:var(--ok-bold,#107C10)">42.6%</div>'+
      '<div class="dbr-scale"><i></i><i></i><i></i></div><div class="small">green &lt; 40% · yellow 40–50% · red &gt; 50% · policy max 50%</div></div></div></div>'; },
    function(){ return '<div class="form-section" style="margin:0"><h3>4 · Loan & product</h3><div class="form-grid">'+
      sel("Product",D.products.map(function(p){return p.en;}),1)+'<div class="field" data-req="1"><label>Loan amount (৳)<span class="req">*</span></label><input type="number" id="wiz-amt" value="1500000" placeholder="Loan amount (৳)"><span class="err-msg">Required field</span></div>'+
      '<div class="field" data-req="1"><label>Tenor (months)<span class="req">*</span></label><input type="number" id="wiz-tenor" value="48" placeholder="Tenor (months)"><span class="err-msg">Required field</span></div>'+
      sel("Interest type",["Fixed","Floating (BLR+spread)"],1)+sel("Repayment",["Monthly EMI","Quarterly","Bullet"],1)+sel("Payout rail",["CBS account credit","BEFTN","bKash","Nagad","Cheque"],1)+
      fld("Purpose","Business expansion")+fld("Collateral offered","None (clean)")+'</div>'+
      '<div class="calc-out"><h5>EMI & cost preview — reducing balance <span class="h-note">live</span></h5>'+
      '<div class="co-row"><span>Principal</span><b id="wiz-p-prin">৳15,00,000</b></div>'+
      '<div class="co-row"><span>Interest rate</span><b>11.99% p.a.</b></div>'+
      '<div class="co-row"><span>Tenor</span><b id="wiz-p-ten">48 × EMI</b></div>'+
      '<div class="co-row"><span>EMI</span><b id="wiz-p-emi">৳39,847</b></div>'+
      '<div class="co-row"><span>Total interest</span><b id="wiz-p-int">৳41,266</b></div>'+
      '<div class="co-row"><span>Processing fee (1%)</span><b id="wiz-p-fee">৳15,000</b></div>'+
      '<div class="co-row big"><span>First EMI due</span><b>2026-11-05</b></div></div></div>'; },
    function(){ return '<div class="form-section" style="margin:0"><h3>5 · Documents <span class="h-note">drag-drop · bulk 10 · virus-scan · OCR</span></h3>'+
      '<div class="upload-zone" data-toast="File picker (prototype) — drop zone armed for PDF/JPG/PNG ≤ 10 MB">⤒ Drag & drop files here, or click to browse — NID, photo, income proof, bank statement</div>'+
      '<div style="margin-top:12px">'+docRows(6,"applydocs")+'</div></div>'; },
    function(){ return '<div class="form-section" style="margin:0"><h3>6 · Review & submit</h3>'+
      '<div class="form-grid">'+[["Applicant",LMSPick("Md. Rafiqul Islam","মোঃ রফিকুল ইসলাম")],["Product",LMSPick("SME Term Loan","এসএমই টার্ম ঋণ")],["Amount","৳15,00,000 / 48m @ 11.99%"],
        ["DBR","42.6% — green"],["CIB score","781 · AA"],["Provisional decision","Recommend — L2 Branch Manager"]]
        .map(function(x){ return '<div class="field"><label>'+x[0]+'</label><input value="'+esc(x[1])+'" readonly></div>'; }).join("")+'</div>'+
      '<div class="card-pad" style="border-top:1px solid var(--stroke)"><label class="check"><input type="checkbox" id="wiz-dec"> I confirm the information is true; Bangladesh Bank CIB consent granted; BDT 1+ reporting acknowledged.</label></div></div>'; }
  ];
  return P[i]();
}
function fld(label,val,req,type){
  return '<div class="field" data-req="'+(req||0)+'"><label>'+esc(label)+(req?'<span class="req">*</span>':'')+'</label>'+
    '<input type="'+(type||"text")+'" value="'+esc(val)+'" placeholder="'+esc(label)+'"><span class="err-msg">Required field</span></div>';
}
function sel(label,opts,req){
  return '<div class="field" data-req="'+(req||0)+'"><label>'+esc(label)+(req?'<span class="req">*</span>':'')+'</label><select>'+
    opts.map(function(o,i){ return '<option'+(i===0?" selected":"")+'>'+esc(o)+'</option>'; }).join("")+'</select></div>';
}

/* wizard wiring (called from __pageWired) */
function wireWizard(){
  var pane=document.getElementById("wiz-pane"); if(!pane||pane.dataset.wired) return;
  pane.dataset.wired="1"; var step=0;
  function paint(){
    pane.innerHTML=wizPane(step);
    document.querySelectorAll(".wiz-step").forEach(function(b){ var i=+b.getAttribute("data-wstep"); b.className="wiz-step"+(i<step?" done":i===step?" current":""); });
    document.getElementById("wiz-back").disabled=step===0;
    document.getElementById("wiz-next").textContent=(step===5?T("submit_app")+" ✓":T("next")+" ›");
    var pct=Math.round((step+1)/6*100);
    document.getElementById("wiz-pct").textContent=pct+"%";
    document.getElementById("wiz-fill").style.width=pct+"%";
    if(step===2){ // live DBR
      var income=pane.querySelector("[type=number]");
      var calc=function(){ var inc=parseFloat((income.value||"185000").replace(/,/g,""))||185000;
        var dbr=(42000+8000+39847)/inc*100; var v=document.getElementById("dbr-v");
        v.textContent=dbr.toFixed(1)+"%"; v.style.color=dbr>50?"var(--err-bold,#C50F1F)":dbr>40?"var(--warn-bold,#F7630C)":"var(--ok-bold,#107C10)"; };
      income.addEventListener("input",calc); calc();
    }
    if(step===3){ // live EMI & cost preview (reducing balance)
      var amtEl=document.getElementById("wiz-amt"), tenEl=document.getElementById("wiz-tenor");
      var RATE=0.1199;
      var fmtTk=function(n){ n=Math.round(n); return "৳"+n.toLocaleString("en-IN"); };
      var recalc=function(){
        var A=parseFloat(amtEl.value)||0, N=Math.max(1,parseInt(tenEl.value,10)||48);
        var emi=RATE>0 ? A*RATE/12*Math.pow(1+RATE/12,N)/(Math.pow(1+RATE/12,N)-1) : A/N;
        document.getElementById("wiz-p-prin").textContent=fmtTk(A);
        document.getElementById("wiz-p-ten").textContent=N+" × EMI";
        document.getElementById("wiz-p-emi").textContent=fmtTk(emi);
        document.getElementById("wiz-p-int").textContent=fmtTk(emi*N-A);
        document.getElementById("wiz-p-fee").textContent=fmtTk(A*0.01);
      };
      amtEl.addEventListener("input",recalc); tenEl.addEventListener("input",recalc); recalc();
    }
  }
  document.getElementById("wiz-next").onclick=function(){
    var bad=pane.querySelectorAll('.field[data-req="1"] input:not([readonly]), .field[data-req="1"] select, .field[data-req="1"] textarea');
    for(var i=0;i<bad.length;i++){ if(!bad[i].value.trim()){ bad[i].closest(".field").classList.add("invalid"); window.LMSToast(T("form_invalid"),"err"); return; } bad[i].closest(".field").classList.remove("invalid"); }
    if(step===5){ var dec=document.getElementById("wiz-dec"); if(dec&&!dec.checked){ window.LMSToast("Declaration & CIB consent are mandatory before submit","err"); return; }
      window.LMSToast("✓ Submitted — APP-7290 created · routed to Screening (Ladder starts at L1 · SLA 48h) · SMS sent to customer","ok"); location.hash="#/pipeline"; return; }
    step=Math.min(5,step+1); paint();
  };
  document.getElementById("wiz-back").onclick=function(){ step=Math.max(0,step-1); paint(); };
  document.getElementById("wiz-draft").onclick=function(){ window.LMSToast("Draft saved 12:0"+step+" — resume anytime from My Applications","ok"); };
  document.querySelectorAll(".wiz-step").forEach(function(b){ b.onclick=function(){ step=+b.getAttribute("data-wstep"); paint(); }; });
  paint();
}

/* ============================================================
   PIPELINE
   ============================================================ */
function pgPipeline(){
  var apps=D.applications;
  var stages=D.stages;
  var byStage=stages.map(function(s){ return apps.filter(function(a){return a.stage===s;}).length; });
  var rows=apps.map(function(a,i){
    return '<tr data-app="'+i+'"><td><span class="idchip">'+a.id+'</span></td>'+
      '<td><b>'+esc(LMSPick(a.cust.en,a.cust.bn))+'</b><span class="sub">'+esc(a.cust.firm||LMSLabel(a.cust.seg))+' · '+esc(LMSPlace(a.cust.branch.name))+'</span></td>'+
      '<td>'+a.product.icon+' '+esc(LMSPick(a.product.en,a.product.bn))+'</td><td class="right num">'+F.tk(a.amount)+'</td>'+
      '<td><span class="chip '+(a.stageIdx>=6?"chip-ok":a.stageIdx>=4?"chip-info":"chip-neutral")+'">'+a.stage+'</span></td>'+
      '<td class="num" style="color:'+(a.dbr>50?"var(--err-bold,#C50F1F)":a.dbr>40?"var(--warn-bold,#F7630C)":"var(--ok)")+'">'+a.dbr+'%</td>'+
      '<td class="num"><b>'+a.score+'</b> <span class="tag">'+(a.score>=730?"AA":a.score>=680?"A":"BBB")+'</span></td>'+
      '<td class="num">'+a.tat+'d</td><td>'+statusChip(a.status)+'</td>'+
      '<td><span class="rowActs"><button title="Open" data-app="'+i+'">›</button><button title="Expedite" '+toastAttr(a.id+" expedite requested — escalated to next level")+">⚡</button></span></td></tr>";
  }).join("");
  var cols=th("Ref","id")+th("Customer","cust")+th("Product","prod")+th("Amount","amt")+th("Stage","stage")+th("DBR","dbr")+th("CIB","score")+th("TAT","tat")+th("Status","status")+"<th></th>";
  var fp=stages.map(function(s,i){ var n=byStage[i];
    return '<label class="fp-item"><input type="checkbox" checked data-stage="'+esc(s)+'"> '+esc(s)+' <span class="fp-n">'+n+'</span></label>'; }).join("");
  return head([["Loan Origination","#/workspace/B1"],["Application Pipeline",null]],
    "Application Pipeline <span class='tag' style='vertical-align:middle'>128 open · 65 branches</span>",
    "Stage-filtered work list · SLA clocked · TAT target ≤ 2 days",
    btn("＋ New Application","btn-primary",null,'data-golink="#/apply"')+btn("Export","btn-2nd",null,toastAttr("Pipeline exported → Excel"))+btn("Bulk import","btn-2nd",null,'data-golink="#/screen/B1-s3"'))+
    kpiRow([["In pipeline","128","across 9 stages","info",byStage],["Avg TAT","1.9d","<b class='up'>−0.3d</b> vs Aug","ok"],
      ["Approval rate","71%","last 90 days","ok"],["SLA at risk","6","escalate < 24h","err"],["Drop-off","18%","improved from 45%","ok"]])+
    '<div class="dash-grid" style="margin-bottom:12px"><div class="w12">'+card("Funnel by stage",
      CH.funnel(stages.map(function(s,i){ return {label:s,value:Math.max(byStage[i],i===0?342:1)}; })))+'</div></div>'+
    '<div class="list-layout"><aside class="filter-pane"><div class="fp-h">Stage</div><div class="fp-grid">'+fp+'</div>'+
    '<div class="fp-h">Views</div>'+
    '<label class="fp-item"><input type="radio" name="psv" checked data-pview="all"> All <span class="fp-n">'+apps.length+'</span></label>'+
    '<label class="fp-item"><input type="radio" name="psv" data-pview="sla"> ⚠ SLA risk</label>'+
    '<label class="fp-item"><input type="radio" name="psv" data-pview="big"> ≥ ৳40 L</label>'+
    '<div style="padding:8px 10px"><button class="btn btn-sm btn-2nd" '+toastAttr("Personal view saved")+'>'+esc(T("save_view"))+'</button></div></aside>'+
    gridWrap(apps.length,cols,rows,
      '<div class="view-pills"><button class="vp on" data-appvp="all">All</button><button class="vp" data-appvp="sla">⚠ SLA</button><button class="vp" data-appvp="big">≥ ৳40 L</button></div>')+'</div>';
}
function appModal(i){
  var a=D.applications[i]; if(!a) return;
  var tr=D.stages.map(function(s,si){
    return '<div class="cs-item '+(si<a.stageIdx?"done":si===a.stageIdx?"current":"")+'"><span class="c-dot">'+(si<a.stageIdx?"✓":si+1)+'</span><span>'+s+'<small>'+(si<a.stageIdx?si===0?"0.4d":si===1?"0.6d":si===2?"0.3d":"1.1d":si===a.stageIdx?"now · "+(a.slaHrs)+"h left":"queued")+'</small></span></div>';
  }).join("");
  window.LMSModal('<div class="modal-h"><div><h3>'+a.id+' — '+esc(LMSPick(a.cust.en,a.cust.bn))+'</h3><div class="m-sub">'+a.product.icon+' '+esc(LMSPick(a.product.en,a.product.bn))+' · '+F.tkFull(a.amount)+' · '+esc(LMSPlace(a.cust.branch.name))+' branch</div></div>'+
    '<button class="tb-btn m-x" data-mx>✕</button></div>'+
    '<div class="modal-b"><div class="dm-layout" style="grid-template-columns:230px 1fr">'+
    '<div class="con-steps">'+tr+'</div>'+
    '<div><div class="form-grid" style="padding:0">'+
      [["Customer",esc(LMSPick(a.cust.en,a.cust.bn))+" · <span class='idchip' data-golink='#/cust/"+a.cust.cif+"'>"+a.cust.cif+"</span>"],["DBR",a.dbr+"%"],["CIB score",a.score+" ("+(a.score>=730?"AA":a.score>=680?"A":"BBB")+")"],
       ["Documents",a.docsDone+" / "+a.docs+" verified"],["Officer",esc(a.officer)],["Received","2026-09-"+String(10+a.tat).padStart(2,"0")]]
      .map(function(x){ return '<div class="field"><label>'+x[0]+'</label><input value="'+x[1]+'" readonly style="height:34px"></div>'; }).join("")+'</div>'+
    '<div class="form-section" style="margin-top:12px"><h3>Documents</h3>'+docRows(4,a.id)+'</div></div></div></div>'+
    '<div class="modal-f"><button class="btn btn-primary" '+toastAttr("Approved at current level — routed to "+(a.stageIdx>=6?"disbursement queue":"next level"))+'>✓ Approve</button>'+
    '<button class="btn btn-2nd" '+toastAttr("Returned to maker with comments")+'>↩ Return</button>'+
    '<button class="btn btn-danger" '+toastAttr("Rejected — reason mandatory, audit captured")+'>✕ Reject</button><span class="spacer"></span>'+
    '<span class="small">decision is maker-checkered · digital signature on confirm</span></div>');
}

/* ============================================================
   CUSTOMER 360
   ============================================================ */
function pgCust(cif){
  var c=D.cust(cif); if(!c) return pgMissing(cif);
  var loans=D.loans.filter(function(l){return l.cust===c;});
  var apps=D.applications.filter(function(a){return a.cust===c;});
  var band='<div class="dm-head-band">'+
    [["Customer",esc(LMSPick(c.en,c.bn))],["CIF",'<span class="idchip">'+c.cif+'</span>'],["NID",'<span class="mono">'+c.nid+'</span>'],
     ["Mobile",esc(c.mobile)],["Segment",esc(c.seg)+(c.firm?" · "+esc(c.firm):"")],["KYC",statusChip(c.kyc)],
     ["CIB","<b>"+c.cibScore+"</b> <span class='tag'>"+c.cibGrade+"</span>"],["Branch",c.branch.name],["Since",c.since]]
    .map(function(x){ return '<div class="band-item"><div class="b-l">'+x[0]+'</div><div class="b-v">'+x[1]+'</div></div>'; }).join("")+'</div>';
  var loanRows=loans.length?loans.map(function(l){
    return '<tr data-golink="#/loan/'+l.id+'"><td><span class="idchip">'+l.id+'</span></td><td>'+l.product.icon+' '+esc(LMSPick(l.product.en,l.product.bn))+'</td>'+
      '<td class="right num">'+F.tk(l.outstanding)+'</td><td class="num">'+l.dpd+'</td><td>'+stageChip(l.stage)+'</td>'+
      '<td class="num">'+F.tk(l.emi)+' · '+l.nextDue+'</td><td>'+esc(l.officer)+'</td></tr>';
  }).join(""):'<tr><td colspan="7" style="text-align:center;color:var(--ink-500);height:60px">No active loans — first facility in origination</td></tr>';
  var appRows=apps.length?apps.map(function(a){
    return '<tr><td><span class="idchip">'+a.id+'</span></td><td>'+esc(LMSPick(a.product.en,a.product.bn))+'</td><td class="right num">'+F.tk(a.amount)+'</td><td><span class="chip chip-info">'+a.stage+'</span></td><td class="num">'+a.tat+'d</td></tr>';
  }).join(""):'<tr><td colspan="5" style="text-align:center;color:var(--ink-500);height:60px">No open applications</td></tr>';
  var cibFac=[["ABC Bank","Term loan",2500000,"STD-0",0,0],["ABC Bank","Credit card",150000,"STD-1",12,8000],
    ["Eastern Bank","Auto loan",800000,"SMA",74,42000],["City Bank","OD facility",1200000,"SS",132,210000]]
    .map(function(x){ return '<tr><td>'+x[0]+'</td><td>'+x[1]+'</td><td class="right num">'+F.tk(x[2])+'</td><td>'+('<span class="'+(BRPD[{ "STD-0":0,"STD-1":1,SMA:3,SS:4}[x[3]]]||BRPD[0]).chip+'">'+x[3]+'</span>')+'</td><td class="num">'+x[4]+'</td><td class="right num">'+F.tk(x[5])+'</td></tr>'; }).join("");
  var tl=[["🪪","e-KYC verified","NIDW match · photo matched 98.2%","2026-09-12 · system"],
    ["🛡","CIB inquiry","Score 781 (AA) · 4 facilities · 1 SMA elsewhere","2026-09-13 · F. Akter"],
    ["▤","Application APP-7239","SME Term Loan ৳45 L — at L3 approval","2026-09-20 · R. Islam"],
    ["📞","Collection call","Reminder — PTP ৳12K on 05 Oct","2026-09-24 · system"],
    ["📄","Statement issued","Self-service portal · 6 months","2026-09-25 · portal"]]
    .map(function(x){ return '<div class="tl-item"><span class="tl-ico">'+x[0]+'</span><b>'+x[1]+'</b><p>'+esc(x[2])+'</p><div class="tl-meta">'+x[3]+'</div></div>'; }).join("");
  var exposure=loans.reduce(function(a,l){return a+l.outstanding;},0);
  var fb='<div class="fb-card"><h4>Next best action</h4><div class="fb-body"><div class="nba"><h5>Cross-sell: top-up eligibility</h5>'+
    '<p>6 on-time EMI cycles · eligible for +৳5 L top-up at 11.99%.</p><button class="btn btn-sm btn-primary" '+toastAttr("Top-up offer queued — SMS + officer task")+'>Create offer</button></div></div></div>'+
    '<div class="fb-card"><h4>Exposure</h4><div class="fb-body">'+
    [["ABC Bank exposure",F.tk(exposure)],["Elsewhere (CIB)",F.tk(1650000)],["Total",F.tk(exposure+1650000)],["Risk grade",c.risk],["Loans",String(loans.length)]]
    .map(function(x){ return '<div class="fb-kv"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'; }).join("")+'</div></div>'+
    '<div class="fb-card"><h4>Payment rhythm</h4><div class="fb-body">'+sparkFor(c.cif)+'<div class="small" style="margin-top:6px">12 EMIs · 11 on time</div></div></div>'+
    '<div class="fb-card"><h4>Jump to</h4><div class="fb-body fb-links"><a href="#/cib/'+c.cif+'">🛡 Full CIB report</a><a href="#/apply">✚ New application</a><a href="#/screen/A3-s1">🗂 Documents</a></div></div>';
  return head([["Customer Management","#/workspace/A1"],["Customer 360°",null]],
    esc(LMSPick(c.en,c.bn))+' <span class="tag" style="vertical-align:middle">archetype x · 360°</span>',
    esc(LMSPick(c.en,c.bn))+(c.firm?" · "+esc(c.firm):"")+" · "+esc(LMSLabel(c.seg))+" · "+esc(LMSPlace(c.city)),
    btn("✚ New Application","btn-primary",null,'data-golink="#/apply"')+btn("🛡 CIB Inquiry","btn-2nd",null,'data-golink="#/cib/'+c.cif+'"')+btn("Print profile","btn-2nd",null,'onclick="window.print()"'))+
    band+
    '<div class="dm-layout"><div class="dm-main"><div class="dm-tabs"><div class="dm-tabbar" role="tablist">'+
    ["Summary","Loans ("+loans.length+")","Applications","CIB","Documents","Timeline"].map(function(t,i){
      return '<button class="dm-tab'+(i===0?" on":"")+'" data-tab="c'+i+'">'+t+'</button>'; }).join("")+'</div>'+
    '<div class="tabpane on" id="c0"><div class="form-section"><h3>Profile</h3><div class="form-grid">'+
      [[LMSPick("Full name (English)","নাম (ইংরেজি)"),esc(c.en)],[LMSPick("Full name (Bangla)","নাম (বাংলা)"),esc(c.bn)],["Segment",esc(LMSLabel(c.seg))],["City",esc(LMSPlace(c.city))],
       ["Mobile",esc(c.mobile)],["Email",esc(c.en.split(" ")[0].toLowerCase()+"@mail.com")],["KYC status",c.kyc],["AML risk",c.risk+" · screened "+(c.risk==="High"?"EDD":"CDD")],
       ["Nominee","Selina Islam · 0.5"],["Relationship since",c.since]].map(function(x){
        return '<div class="field"><label>'+x[0]+'</label><input value="'+x[1]+'" readonly></div>'; }).join("")+'</div></div></div>'+
    '<div class="tabpane" id="c1"><div class="grid-wrap"><div class="scroll-x"><table class="usl-grid"><thead><tr><th>Account</th><th>Product</th><th>Outstanding</th><th>DPD</th><th>Stage</th><th>EMI · next due</th><th>Officer</th></tr></thead><tbody>'+loanRows+'</tbody></table></div></div></div>'+
    '<div class="tabpane" id="c2"><div class="grid-wrap"><div class="scroll-x"><table class="usl-grid"><thead><tr><th>Ref</th><th>Product</th><th>Amount</th><th>Stage</th><th>TAT</th></tr></thead><tbody>'+appRows+'</tbody></table></div></div></div>'+
    '<div class="tabpane" id="c3"><div class="card-pad" style="display:flex;gap:24px;flex-wrap:wrap;align-items:center">'+
      CH.donut([{label:"Score component — profile",value:20,color:"var(--chart-1)"},{label:"History",value:25,color:"var(--chart-3)"},{label:"Capacity",value:30,color:"var(--chart-6)"},{label:"Collateral",value:15,color:"var(--chart-2)"}],130,c.cibScore,c.cibGrade)+
      '<div class="grow" style="min-width:260px"><table class="usl-grid rpt-table"><thead><tr><th>Institution</th><th>Facility</th><th>Exposure</th><th>Class</th><th>DPD</th><th>Overdue</th></tr></thead><tbody>'+cibFac+'</tbody></table></div></div></div>'+
    '<div class="tabpane" id="c4"><div class="form-section"><h3>Documents</h3>'+docRows(6,c.cif)+'</div></div>'+
    '<div class="tabpane" id="c5"><div class="card-pad timeline">'+tl+'</div></div></div></div>'+
    '<aside>'+fb+'</aside></div>';
}

/* ============================================================
   LOAN 360
   ============================================================ */
function pgLoan(id){
  var l=D.loan(id); if(!l) return pgMissing(id);
  var sched=[]; var bal=l.outstanding;
  for(var i=0;i<8;i++){ var int_=Math.round(bal*0.1199/12); var pri=l.emi-int_; bal=Math.max(0,bal-pri);
    sched.push('<tr><td class="num">'+(i+31)+'</td><td>2026-'+String(11+i>12?(11+i-12):(11+i)).padStart(2,"0")+'-05</td><td class="num">'+F.tkFull(l.emi)+'</td><td class="num">'+F.tkFull(pri)+'</td><td class="num">'+F.tkFull(int_)+'</td><td class="num">'+F.tkFull(bal)+'</td></tr>'); }
  var hist=[12,11,12,12,10,12,12,9,0,0,0,0].map(function(v,i){ return {label:["N","D","J","F","M","A","M","J","J","A","S","O"][i],value:v,cap:v?v+"":l.dpd>0?"miss":"—",color:i<8?"var(--chart-3)":l.dpd?"var(--chart-5)":"var(--chart-3)"}; });
  var clsHist=[[l.disbursed,"STD-0","Disbursed",0],[ "2026-04-18","STD-1","DPD 5 — watch",1],["2026-06-02","STD-2","DPD 34 — caution",2]];
  if(l.dpd>60) clsHist.push(["2026-07-28","SMA","DPD 61 — special mention",3]);
  if(l.dpd>90) clsHist.push(["2026-08-30","SS","DPD 95 — substandard",4]);
  var b=BRPD[l.stage];
  var txns=[["2026-09-05","EMI receipt — CBS","DR",F.tkFull(l.emi),"Allocated P→I→fee"],
    ["2026-08-05","EMI receipt — bKash","DR",F.tkFull(l.emi),"Auto-allocated"],
    ["2026-07-05","EMI receipt — BEFTN","DR",F.tkFull(l.emi),"Auto-allocated"],
    ["2026-06-05","Late fee","DR",F.tkFull(Math.round(l.emi*0.02)),"Day+5"],
    [l.disbursed,"Disbursement — "+l.rail,"CR",F.tkFull(l.principal),"Sanction ref SL-88214"]]
    .map(function(x){ return '<tr><td class="num mono">'+x[0]+'</td><td>'+x[1]+'</td><td><span class="tag">'+x[2]+'</span></td><td class="right num">'+x[3]+'</td><td class="small">'+x[4]+'</td></tr>'; }).join("");
  var band='<div class="dm-head-band">'+
    [["Account",'<span class="idchip">'+l.id+'</span>'],["Customer",'<a href="#/cust/'+l.cust.cif+'">'+esc(LMSPick(l.cust.en,l.cust.bn))+'</a>'],
     ["Product",l.product.icon+" "+esc(LMSPick(l.product.en,l.product.bn))],["Classification",'<span class="'+b.chip+'" style="font-size:12px;height:24px">'+b.k+' · '+b.cls+'</span>'],
     ["Outstanding",'<b>'+F.tk(l.outstanding)+'</b>'],["DPD",'<b style="color:'+b.color+'">'+l.dpd+' days</b>'],
     ["Provision",F.tk(l.provAmt)+" ("+l.provPct+"%)"],["Next EMI",F.tk(l.emi)+" · "+l.nextDue],["Rail",l.rail]]
    .map(function(x){ return '<div class="band-item"><div class="b-l">'+x[0]+'</div><div class="b-v">'+x[1]+'</div></div>'; }).join("")+'</div>';
  var fb='<div class="fb-card"><h4>Next best action</h4><div class="fb-body"><div class="nba"><h5>'+(l.dpd>0?"Field visit — propensity "+ (l.dpd>90?68:82) +"%":"Auto-debit reminder")+'</h5>'+
    '<p>'+(l.dpd>0?"Residence 3.2 km from officer S. Mia · best window 6–8 PM.":"EMI due "+l.nextDue+" · SMS D-3 scheduled.")+'</p>'+
    '<button class="btn btn-sm btn-primary" '+(l.dpd>0?toastAttr("Visit task created — GPS verified on mobile app"):'data-toast="Reminder queue confirmed"')+'>Execute</button></div></div></div>'+
    '<div class="fb-card"><h4>Account facts</h4><div class="fb-body">'+
    [["Principal",F.tk(l.principal)],["Rate",l.rate],["Disbursed",l.disbursed],["Branch",l.branch.name],["Officer",esc(l.officer)],["Stage since","2026-09-01"]]
    .map(function(x){ return '<div class="fb-kv"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'; }).join("")+'</div></div>'+
    '<div class="fb-card"><h4>BRPD provision</h4><div class="fb-body"><div class="fb-kv"><span>Stage</span><b>'+b.k+' ('+b.dpd+' DPD)</b></div>'+
    '<div class="fb-kv"><span>Rate</span><b>'+b.prov+'%</b></div><div class="fb-kv"><span>Amount</span><b>'+F.tk(l.provAmt)+'</b></div>'+
    '<div class="fb-kv"><span>Interest suspense</span><b>'+(l.stage>=4?"✓ posted":"n/a")+'</b></div></div></div>'+
    '<div class="fb-card"><h4>Jump to</h4><div class="fb-body fb-links"><a href="#/cust/'+l.cust.cif+'">◉ Customer 360</a><a href="#/cib/'+l.cust.cif+'">🛡 CIB report</a><a href="#/collections">🎧 Collections</a><a href="#/report/E3/0">📄 Statement</a></div></div>';
  return head([["Loan Accounts","#/workspace/E1"],["Loan 360° — "+l.id,null]],
    l.id+" · "+esc(LMSPick(l.cust.en,l.cust.bn))+' <span class="tag" style="vertical-align:middle">archetype x · 360°</span>',
    esc(LMSPick(l.product.en,l.product.bn))+" · "+esc(LMSPlace(l.branch.name))+" branch · "+esc(l.officer),
    btn("Post payment","btn-primary",null,'data-openform="Post payment" data-mid="E2"')+btn("Modification","btn-2nd",null,'data-openform="Reschedule Request" data-mid="E4"')+btn("Print statement","btn-2nd",null,'onclick="window.print()"'))+
    band+
    kpiRow([["Outstanding",F.tk(l.outstanding),F.tkFull(l.outstanding),"info"],["Overdue",F.tk(l.overdue||0),l.dpd+" DPD",l.dpd?"err":"ok"],
      ["EMI",F.tk(l.emi),"next "+l.nextDue,"info"],["Provision",F.tk(l.provAmt),l.provPct+"% · "+b.k,l.stage>=3?"warn":"ok"]])+
    '<div class="dm-layout"><div class="dm-main"><div class="dm-tabs"><div class="dm-tabbar" role="tablist">'+
    ["Overview","Repayment schedule","Transactions","Classification","Collateral","Collection log"].map(function(t,i){
      return '<button class="dm-tab'+(i===0?" on":"")+'" data-tab="l'+i+'">'+t+'</button>'; }).join("")+'</div>'+
    '<div class="tabpane on" id="l0">'+card("Payment history — last 12 EMIs",CH.vbars(hist))+'</div>'+
    '<div class="tabpane" id="l1"><div class="grid-wrap"><div class="scroll-x"><table class="usl-grid"><thead><tr><th>#</th><th>Due date</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody>'+sched.join("")+'</tbody></table></div>'+
    '<div class="grid-foot">Instalments 31–38 of 60 · reducing balance @ '+l.rate+'</div></div></div>'+
    '<div class="tabpane" id="l2"><div class="grid-wrap"><div class="scroll-x"><table class="usl-grid"><thead><tr><th>Date</th><th>Narration</th><th>Dr/Cr</th><th>Amount</th><th>Note</th></tr></thead><tbody>'+txns+'</tbody></table></div></div></div>'+
    '<div class="tabpane" id="l3"><div class="form-section"><h3>BRPD 15/2024 classification history</h3><div class="scroll-x"><table class="usl-grid"><thead><tr><th>Date</th><th>Stage</th><th>Meaning</th><th>DPD band</th><th>Provision</th><th>Reason</th></tr></thead><tbody>'+
      clsHist.map(function(x){ var bb=BRPD[x[3]]; return '<tr><td class="num mono">'+x[0]+'</td><td><span class="'+bb.chip+'">'+x[1]+'</span></td><td>'+bb.cls+'</td><td class="num">'+bb.dpd+'</td><td class="num">'+bb.prov+'%</td><td>'+x[2]+'</td></tr>'; }).join("")+
      '</tbody></table></div></div>'+card("Stage reference — BRPD circular 15/2024",
      '<div class="scroll-x"><table class="usl-grid"><thead><tr><th>'+LMSLabel("Stage")+'</th><th>'+LMSLabel("Classification")+'</th><th>DPD</th><th>'+LMSLabel("Provision")+'</th>'+(window.LMS_SHELL.lang==="bn"?"<th>"+LMSLabel("Classification")+"</th>":"")+'</tr></thead><tbody>'+
      BRPD.map(function(x){ return '<tr><td><span class="'+x.chip+'">'+x.k+'</span></td><td>'+(window.LMS_SHELL.lang==="bn"?x.bn:x.cls)+'</td><td class="num">'+x.dpd+'</td><td class="num">'+x.prov+'%</td>'+(window.LMS_SHELL.lang==="bn"?"<td>"+x.cls+"</td>":"")+'</tr>'; }).join("")+'</tbody></table></div>')+'</div>'+
    '<div class="tabpane" id="l4"><div class="form-section"><h3>Collateral & guarantees</h3>'+docRows(3,l.id)+
      '<div class="card-pad"><div class="fb-kv"><span>Type</span><b>'+(l.principal>5000000?"Commercial property · LTV 62%":"Clean / personal guarantee")+'</b></div>'+
      '<div class="fb-kv"><span>Valuation</span><b>'+(l.principal>5000000?F.tk(l.principal*1.6):"—")+'</b></div><div class="fb-kv"><span>Insurance</span><b>'+(l.principal>5000000?"Valid → 2027-03-21":"n/a")+'</b></div></div></div></div>'+
    '<div class="tabpane" id="l5"><div class="card-pad timeline">'+
      (l.dpd>0?[["📞","Call — no response","2 attempts · 18:04, 18:42","yesterday · S. Mia"],["💬","SMS reminder","Dunning ladder step 2","2d ago · system"],["✓","PTP created","৳12,000 promised · 05 Oct","3d ago · S. Mia"],["📍","Field visit","Residence verified · photos x4","5d ago · S. Mia"]]
      :[["💬","SMS confirmation","EMI received — thank you","this month · system"],["✓","Auto-debit","CBS sweep success","this month · system"]])
      .map(function(x){ return '<div class="tl-item"><span class="tl-ico">'+x[0]+'</span><b>'+x[1]+'</b><p>'+esc(x[2])+'</p><div class="tl-meta">'+x[3]+'</div></div>'; }).join("")+'</div></div>'+
    '</div></div><aside>'+fb+'</aside></div>';
}

/* ============================================================
   CIB REPORT VIEWER
   ============================================================ */
function pgCib(cif){
  var c=D.cust(cif); if(!c) return pgMissing(cif);
  var facs=[["ABC Bank","Term loan · SEC-2201",2500000,"STD-0",0,0],["ABC Bank","Credit card",150000,"STD-1",12,8000],
    ["Eastern Bank PLC","Auto loan · 2019",420000,"Closed",0,0],["City Bank","OD · SEC-1188",1200000,"SMA",74,42000],
    ["BRAC Bank","SME loan",900000,"SS",132,210000],["IFIC","Home loan",3500000,"STD-0",0,0]];
  var facRows=facs.map(function(x){
    var mapIdx={"STD-0":0,"STD-1":1,"STD-2":2,"SMA":3,"SS":4,"DF":5,"B/L":6};
    var chip=x[3]==="Closed"?'<span class="chip chip-neutral">Closed</span>':'<span class="'+BRPD[mapIdx[x[3]]].chip+'">'+x[3]+'</span>';
    return '<tr><td>'+x[0]+'</td><td>'+x[1]+'</td><td class="right num">'+F.tk(x[2])+'</td><td>'+chip+'</td><td class="num">'+x[4]+'</td><td class="right num">'+F.tk(x[5])+'</td></tr>';
  }).join("");
  var months=[]; for(var i=0;i<24;i++){ months.push("M-"+(24-i)); }
  var hist=[]; var r=rng(c.cif);
  for(var j=0;j<24;j++){ var v=r(); hist.push(v>0.85?0:v>0.7?30:0); }
  var cleaned=hist.map(function(v,i){ return {label:i%4===0?("M-"+(24-i)):"",value:v?1:0,cap:v?"⚠":"✓",color:v?"var(--chart-5)":"var(--chart-3)"}; });
  return head([["CIB Bureau","#/workspace/C1"],["Report Viewer",null]],
    "CIB Report — "+esc(c.en)+' <span class="tag" style="vertical-align:middle">Bangladesh Bank · online</span>',
    "Retrieved 2026-09-26 10:42 · mTLS channel · cached 1h · inquiry logged for audit",
    btn("Refresh inquiry","btn-2nd",null,toastAttr("Fresh inquiry sent to BB CIB — response p95 88s"))+btn("Export PDF","btn-2nd",null,'onclick="window.print()"')+btn("Dispute","btn-2nd",null,'data-openform="Dispute logging" data-mid="C1"'))+
    '<div class="dm-head-band">'+[["Borrower",esc(LMSPick(c.en,c.bn))],["NID / TIN",'<span class="mono">'+c.nid+'</span>'],
      ["CIB score","<b>"+c.cibScore+"</b>"],["Grade",'<span class="chip chip-ok">'+c.cibGrade+'</span>'],
      ["Total exposure",F.tk(8470000)],["Classified elsewhere",F.tk(252000)+" · 2 facilities"],["Inquiry ref","IQ-2026-118842"]].map(function(x){
      return '<div class="band-item"><div class="b-l">'+x[0]+'</div><div class="b-v">'+x[1]+'</div></div>'; }).join("")+'</div>'+
    '<div class="dash-grid">'+
    '<div class="w12">'+card("Facility-wise breakdown",
      '<div class="scroll-x"><table class="usl-grid"><thead><tr><th>Institution</th><th>Facility</th><th>Exposure</th><th>Classification</th><th>DPD</th><th>Overdue</th></tr></thead><tbody>'+facRows+'</tbody></table></div>')+'</div>'+
    '<div class="w8">'+card("24-month payment rhythm (✓ paid · ⚠ missed/late)",CH.vbars(cleaned))+'</div>'+
    '<div class="w4">'+card("Score composition",CH.donut([{label:"Profile 20%",value:17,color:"var(--chart-1)"},{label:"History 25%",value:21,color:"var(--chart-3)"},{label:"Capacity 30%",value:24,color:"var(--chart-6)"},{label:"Collateral 15%",value:12,color:"var(--chart-2)"},{label:"Industry 10%",value:8,color:"var(--chart-4)"}],140,c.cibScore,c.cibGrade))+'</div>'+
    '<div class="w6">'+card("Group / related-party exposure",CH.hbars([
      {label:c.firm||"Household",value:8470000,sub:F.tk(8470000)},{label:"Directors (if corp.)",value:3200000,sub:F.tk(3200000)},
      {label:"Sister concerns",value:1800000,sub:F.tk(1800000)}],{fmt:F.tk}))+'</div>'+
    '<div class="w6">'+card("Guarantor exposure",'<div class="miniList">'+
      [["Abdul Karim","Guarantees ৳12 L","SS elsewhere"],["Shirin Akter","Guarantees ৳3 L","Clean"]].map(function(x){
        return '<div class="mi"><span class="idchip">GRN</span><b>'+x[0]+'</b><span class="grow small">'+x[1]+'</span>'+statusChip(x[2])+'</div>'; }).join("")+
      '</div>')+'</div></div>';
}

/* ============================================================
   APPROVALS
   ============================================================ */
function pgApprovals(){
  var ladder=[["L1","Branch Credit Head","≤ ৳5 L",true],["L2","Branch Manager","≤ ৳10 L",true],["L3","Regional Manager","≤ ৳25 L",true],
    ["L4","Head of Credit","≤ ৳1 Cr",false],["L5","Credit Committee","≤ ৳5 Cr",false],["L6","Deputy MD","≤ ৳10 Cr",false],["L7","Managing MD","> ৳10 Cr",false]];
  var rows=D.approvals.map(function(a,i){
    var risk=a.waitingHrs>a.slaHrs?"err":a.waitingHrs>a.slaHrs-6?"warn":"ok";
    return '<tr data-app="'+D.applications.indexOf(a.app)+'"><td class="col-check"><input type="checkbox" class="rowchk"></td>'+
      '<td><span class="idchip">'+a.app.id+'</span></td><td><b>'+esc(a.app.cust.en)+'</b><span class="sub">'+a.app.product.en+' · '+a.app.cust.branch.name+'</span></td>'+
      '<td class="right num">'+F.tk(a.app.amount)+'</td><td>'+a.level+'</td><td class="num" style="color:var(--'+risk+')">'+a.waitingHrs+'h / '+a.slaHrs+'h</td>'+
      '<td>'+statusChip(a.app.status)+'</td><td>'+esc(a.by)+'</td></tr>';
  }).join("");
  return head([["Approval Workflow","#/workspace/D1"],["My Approvals",null]],
    "My Approvals <span class='tag' style='vertical-align:middle'>6 waiting · 2 at SLA risk</span>",
    "Routed by DMN amount ladder · decisions maker-checkered · digital signature on confirm",
    btn("Approve selected","btn-primary",null,toastAttr("Batch approval queued — signature pad will open per record"))+btn("Delegate…","btn-2nd",null,'data-openform="Delegate" data-mid="D1"'))+
    kpiRow([["My queue","6","৳2.9 Cr total","info"],["SLA risk","2","escalate < 6h","err"],["Avg decision","3.4h","all levels","ok"],["Escalated (wk)","2","auto → next level","warn"]])+
    '<div class="dash-grid"><div class="w8">'+
    gridWrap(D.approvals.length,"<th class='col-check'><input type='checkbox'></th>"+th("Ref","id")+th("Case","cust")+th("Amount","amt")+"<th>Level</th>"+th("Waiting / SLA","wait")+th("Status","st")+"<th>By</th>",rows)+
    '</div><div class="w4">'+card("Approval authority ladder",
      '<div class="org-ladder">'+ladder.map(function(x){
        return '<div class="ol-row"><span class="o-lvl">'+x[0]+'</span><span>'+x[1]+'<small class="muted" style="display:block">'+x[2]+'</small></span>'+
          (x[3]?'<span class="chip chip-ok">you</span>':'<span class="tag">DMN</span>')+'</div>'; }).join("")+'</div>')+'</div></div>';
}

/* ============================================================
   DISBURSEMENT CONSOLE
   ============================================================ */
function pgDisburse(){
  var ready=D.applications.filter(function(a){return a.stageIdx>=8;});
  var steps=["Sanction issued","Agreement signed","Collateral registered","Insurance valid","Limit loaded","Ready to pay"];
  var checks=steps.map(function(s,i){
    return '<div class="ck-row '+(i===3?"warn":"ok")+'"><span class="ck-ico">'+(i===3?"!":"✓")+'</span><div class="grow"><b>'+s+'</b><small>'+(i===3?"Policy expires in 54 days — conditional pass":"system verified · "+(i+1)+"/6")+'</small></div>'+
      (i===3?'<button class="btn btn-sm btn-2nd" '+toastAttr("Dual authorization override requested (maker → checker)")+'>Override…</button>':'<span class="tag">auto</span>')+'</div>';
  }).join("");
  var queue=ready.length?ready.map(function(a){
    return '<div class="mi"><span class="idchip">'+a.id+'</span><span class="grow trunc">'+esc(a.cust.en)+'</span><b class="num">'+F.tk(a.amount)+'</b>'+
      '<button class="btn btn-sm btn-primary" data-toast="Payout executed via '+(["CBS A/C","BEFTN","bKash","Nagad","Cheque"][h(a.id)%5])+' — UTR generated, SMS sent">Pay</button></div>';
  }).join(""):'<div class="card-pad small">No applications at Disbursement-Ready stage.</div>';
  return head([["Disbursement","#/workspace/D2"],["Pre-Disbursement Console",null]],
    "Pre-Disbursement Control <span class='tag' style='vertical-align:middle'>dual authorization</span>",
    "6 system checks · Finacle limit sync · payout rails: CBS · BEFTN · bKash · Nagad · cheque",
    btn("Execute all ready","btn-primary",null,toastAttr("Batch payout queued — 18 items · dual auth pending by second officer"))+btn("Print memo","btn-2nd",null,'onclick="window.print()"'))+
    kpiRow([["Ready to disburse",ready.length+" apps",F.tk(ready.reduce(function(a,x){return a+x.amount;},0)||68000000),"info"],
      ["Paid today","৳1.42 Cr","12 branches","ok"],["Failed / retry","1","bKash timeout","warn"],["Avg checklist TAT","41 min","from approval","ok"]])+
    '<div class="console-layout">'+
    '<div class="con-steps"><div class="cs-item" style="font-size:10px;text-transform:uppercase;color:var(--ink-500)">Payout rail</div>'+
      [["🏦","CBS account credit","real-time"],["⇄","BEFTN transfer","1–2 days"],["📱","bKash","real-time"],["📱","Nagad","real-time"],["🧾","Cheque / cash","branch"]]
      .map(function(x){ return '<div class="cs-item"><span class="c-dot">'+x[0]+'</span><span>'+x[1]+'<small>'+x[2]+'</small></span></div>'; }).join("")+'</div>'+
    '<div class="grow"><section class="card"><div class="card-h"><h3>Checklist — APP-7286 · '+esc((ready[0]||D.applications[0]).cust.en)+'</h3><span class="live">● live</span></div>'+
    checks+'<div class="card-pad" style="border-top:1px solid var(--stroke);display:flex;gap:8px">'+
    btn("Execute payout","btn-primary",null,toastAttr("৳45,00,000 paid via BEFTN — UTR BEFTN2026092601 · welcome SMS queued"))+
    btn("Hold","btn-2nd",null,toastAttr("Case held — reason captured"))+'</div></section></div>'+
    '<aside class="con-metrics">'+card("Ready queue",'<div class="miniList">'+queue+'</div>')+
    card("Rail mix — Sep",CH.donut([{label:"CBS",value:9,color:"var(--chart-1)"},{label:"BEFTN",value:6,color:"var(--chart-6)"},{label:"MFS",value:3,color:"var(--chart-3)"}],120,"18","payouts"))+'</aside></div>';
}

/* ============================================================
   COLLECTIONS WORKBENCH
   ============================================================ */
function pgCollections(){
  var cols=D.collections.slice().sort(function(a,b){ return b.propensity-a.propensity; });
  var buckets=[[1,30],[31,60],[61,90],[91,180],[181,365],[366,9999]];
  var bCards=buckets.map(function(bb){
    var n=D.loans.filter(function(l){ return l.dpd>bb[0]-1&&l.dpd<=bb[1]; }).length;
    var hot=bb[0]>=61;
    return '<a class="kpi status-'+(hot?"err":bb[0]>=31?"warn":"info")+'" href="#/screen/F2-s2"><div class="kpi-l">DPD '+bb[0]+"–"+(bb[1]>999?"+":bb[1])+'</div><div class="kpi-v">'+n+'</div><div class="kpi-d">'+(hot?"recovery mode":"early stage")+'</div></a>';
  }).join("");
  var rows=cols.map(function(c,i){
    return '<tr><td><span class="idchip" data-golink="#/loan/'+c.loan.id+'">'+c.loan.id+'</span></td>'+
      '<td><b>'+esc(c.loan.cust.en)+'</b><span class="sub">'+esc(c.loan.cust.mobile)+'</span></td><td class="num">'+c.loan.dpd+'</td>'+
      '<td><span class="tag">'+c.bucket+'</span></td><td class="right num">'+F.tk(c.loan.outstanding)+'</td>'+
      '<td class="num"><b>'+c.propensity+'%</b></td><td class="small">'+esc(c.lastAction)+'</td>'+
      '<td>'+(c.ptp?'<span class="chip chip-info">'+c.ptp+'</span>':'<span class="chip chip-neutral">none</span>')+'</td>'+
      '<td><span class="rowActs"><button title="Log call" '+toastAttr("Call logged — disposition captured, next action scheduled")+'>📞</button>'+
      '<button title="Create PTP" data-openform="Create PTP" data-mid="F2">✓</button>'+
      '<button title="Field visit" '+toastAttr("Visit scheduled — GPS pin + offline pack pushed to mobile")+'>📍</button></span></td></tr>';
  }).join("");
  var cal='<div class="cal-strip">'+["Mon 29","Tue 30","Wed 1","Thu 2","Fri 3","Sat 4","Sun 5"].map(function(d,i){
    var evs=i===3?'<span class="cal-ev" style="background:var(--chart-3)">PTP ৳12K · LN-40139</span><span class="cal-ev" style="background:var(--chart-6)">Visit · LN-40153</span>':
      i===1?'<span class="cal-ev" style="background:var(--chart-2)">PTP ৳8K · LN-40125</span>':'';
    return '<div class="cal-cell'+(i===3?" today":"")+'"><div class="cc-d">'+d+'</div>'+evs+'</div>'; }).join("")+'</div>';
  return head([["Monitoring & Collections","#/workspace/F2"],["Collections Workbench",null]],
    "Collections Workbench <span class='tag' style='vertical-align:middle'>priority-ranked by propensity</span>",
    "Dunning ladder · PTP board · field visits with GPS · SMS/email templates (BN/EN)",
    btn("Start calling session","btn-primary",null,toastAttr("Session started — auto-dialer ordered by propensity, calls recorded (disclosure banner on)"))+btn("Dunning ladder","btn-2nd",null,'data-golink="#/screen/F2-s6"'))+
    kpiRow([["Collection efficiency","91.4%","target 90%","ok"],["Overdue book",F.tk(cols.reduce(function(a,c){return a+c.loan.overdue;},0)),cols.length+" accounts","warn"],
      ["PTP kept (30d)","72%","<b class='up'>+6pp</b>","ok"],["Broken promises","9","re-contact today","err"],["Visits today","11","8 with GPS lock","info"]])+
    '<div class="kpiRow" style="margin-bottom:12px">'+bCards+'</div>'+
    '<div class="dash-grid"><div class="w8">'+
    gridWrap(cols.length,th("Loan","id")+th("Borrower","cust")+th("DPD","dpd")+"<th>Bucket</th>"+th("Outstanding","amt")+th("Propensity","prop")+th("Last action","act")+"<th>PTP</th><th></th>",rows)+'</div>'+
    '<div class="w4">'+card("PTP board — this week",cal)+
    card("Promise conversion by channel",CH.hbars([{label:"Field visit",value:64},{label:"Phone call",value:38},{label:"SMS only",value:12}],{fmt:function(v){return v+"%";}}))+'</div></div>';
}

/* ============================================================
   BRPD CLASSIFICATION CONSOLE
   ============================================================ */
function pgClassification(){
  var agg=BRPD.map(function(b){ return {b:b,n:0,amt:0,prov:0}; });
  D.loans.forEach(function(l){ var a=agg[l.stage]; a.n++; a.amt+=l.outstanding; a.prov+=l.provAmt; });
  var tot=D.loans.reduce(function(a,l){return a+l.outstanding;},0)||1;
  var bn=window.LMS_SHELL.lang==="bn";
  var rows=agg.map(function(a){
    return '<tr><td><span class="'+a.b.chip+'">'+a.b.k+'</span></td><td>'+(bn?a.b.bn:a.b.cls)+'</td><td class="num">'+a.b.dpd+'</td>'+(bn?'<td class="num">'+a.b.cls+'</td>':'')+
      '<td class="num right">'+a.n+'</td><td class="right num">'+F.tk(a.amt)+'</td><td class="num">'+F.pct(a.amt/tot*100)+'</td>'+
      '<td class="num">'+a.b.prov+'%</td><td class="right num">'+F.tk(a.prov)+'</td></tr>';
  }).join("");
  var moves=[["2026-09-26 02:30","LN-40153","STD-2 → SMA","DPD 61","+4% provision"],["2026-09-26 02:30","LN-40139","STD-1 → STD-2","DPD 31","—"],
    ["2026-09-25 02:30","LN-40167","SS → DF","DPD 181","+30%"],["2026-09-24 02:30","LN-40132","SMA → STD-1","cured (DPD 12)","−4%"]];
  return head([["Monitoring & Collections","#/workspace/F1"],["BRPD Classification Board",null]],
    "BRPD 15/2024 Classification & Provisioning <span class='tag' style='vertical-align:middle'>daily EOD 02:30</span>",
    "7-stage engine · Bangladesh Bank circular BRPD-15/2024 effective 01 Apr 2025 · interest suspense from SS",
    btn("Run EOD now","btn-primary",null,toastAttr("EOD classification batch simulated — 4 migrations, GL JVs posted, interest suspense updated"))+
    btn("Export CL-1…CL-5","btn-2nd",null,'data-golink="#/regcon"')+btn("Provision JV","btn-2nd",null,'data-openform="Post provision JV" data-mid="F1"'))+
    kpiRow([["Gross NPL","4.6%","৳239 Cr SS+DF+B/L","ok"],["Provision held","৳212 Cr","coverage 68.5%","ok"],
      ["Migrations 24h","+4 ↑ / 1 ↓","net +3 into SMA","err"],["Interest suspense","৳18.4 Cr","48 accounts","info"]])+
    '<div class="dash-grid">'+
    '<div class="w8">'+card("Stage table — live portfolio",
      '<div class="scroll-x"><table class="usl-grid"><thead><tr><th>Stage</th><th>Classification</th><th>DPD</th>'+(bn?"<th>English class</th>":"")+'<th>Loans</th><th>Exposure</th><th>Share</th><th>Prov %</th><th>Provision</th></tr></thead><tbody>'+rows+
      '</tbody></table></div>')+'</div>'+
    '<div class="w4">'+card("Mix",CH.clsStrip(agg.map(function(a){return {label:a.b.k,value:a.n,color:a.b.color};})))+
    card("Movement — 24h",'<div class="miniList">'+moves.map(function(m){
      return '<div class="mi"><span class="idchip" data-golink="#/loan/'+m[1]+'">'+m[1]+'</span><span class="grow">'+m[2]+' <span class="small">'+m[3]+'</span></span><span class="tag">'+m[4]+'</span></div>'; }).join("")+'</div>')+'</div>'+
    '<div class="w6">'+card("Interactive provision calculator",
      '<div class="form-grid"><div class="field"><label>Outstanding (৳)</label><input id="pc-amt" type="number" value="8500000" class="num"></div>'+
      '<div class="field"><label>Stage</label><select id="pc-stage">'+BRPD.map(function(b){return '<option>'+b.k+' — '+b.cls+'</option>';}).join("")+'</select></div></div>'+
      '<div class="calc-out"><div class="co-row"><span>Provision required</span><b id="pc-out" style="font-size:18px">৳17,00,000 (20%)</b></div>'+
      '<div class="co-row"><span>Interest suspense</span><b id="pc-is">yes — capitalise & suspend</b></div></div>')+'</div>'+
    '<div class="w6">'+card("NPL trend — 12 months",CH.line(["O","N","D","J","F","M","A","M","J","J","A","S"],
      [{name:"Gross NPL %",data:[5.8,5.7,5.6,5.5,5.3,5.2,5.0,4.9,4.9,4.8,4.7,4.6]},{name:"Net NPL %",data:[2.9,2.8,2.7,2.6,2.5,2.4,2.3,2.3,2.2,2.2,2.1,2.1],color:"var(--chart-3)"}]))+'</div></div>';
}

/* ============================================================
   ANALYTICS
   ============================================================ */
function pgAnalytics(){
  var months=["Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"];
  var vintage=CH.line(months,[{name:"2023 vintage NPL%",data:[1.2,1.4,1.7,2.1,2.4,2.6,2.9,3.1,3.3,3.4,3.5,3.6]},
    {name:"2024 vintage NPL%",data:[0.8,0.9,1.1,1.3,1.5,1.6,1.8,1.9,2.0,2.1,2.2,2.3],color:"var(--chart-3)"},
    {name:"2025 vintage NPL%",data:[0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.1,1.2,1.3],color:"var(--chart-6)"}]);
  var roll=CH.hbars([{label:"STD → SMA",value:3.2},{label:"SMA → SS",value:1.8},{label:"SS → DF",value:1.1},{label:"DF → B/L",value:0.7},{label:"SMA → STD (cure)",value:2.4,color:"var(--chart-3)"}],{fmt:function(v){return v+"%";}});
  return head([["Insight & Compliance","#/workspace/G1"],["Portfolio Analytics",null]],
    "Portfolio Analytics <span class='tag' style='vertical-align:middle'>drill-down enabled</span>","Vintage, roll-rates, aging and district heat — export pack ready",
    btn("Export pack (PDF+XLS)","btn-primary",null,toastAttr("Analytics pack queued — 6 exhibits compiled"))+btn("Schedule weekly","btn-2nd",null,'data-golink="#/writer"'))+
    kpiRow([["Portfolio","৳5,200 Cr","+1.8% m/m","ok"],["PAR-30","6.2%","+0.3pp — watch","warn"],["Yield","12.4%","portfolio weighted","ok"],["Cost of risk","1.9%","annualised","info"]])+
    '<div class="dash-grid">'+
    '<div class="w6">'+card("Vintage curves — NPL % by origination cohort",vintage)+'</div>'+
    '<div class="w6">'+card("Monthly roll-rates",roll)+'</div>'+
    '<div class="w4">'+card("DPD aging",CH.vbars([{label:"0",value:38900,cap:"38.9K"},{label:"1–30",value:3400,cap:"3.4K"},{label:"31–60",value:1500,cap:"1.5K",color:"var(--chart-2)"},{label:"61–90",value:900,cap:"0.9K",color:"var(--chart-2)"},{label:"91–180",value:340,cap:"340",color:"var(--chart-5)"},{label:"181+",value:190,cap:"190",color:"var(--chart-5)"}]))+'</div>'+
    '<div class="w4">'+card("District exposure",CH.hbars([{label:"Dhaka",value:2100},{label:"Chattogram",value:880},{label:"Sylhet",value:520},{label:"Khulna",value:480},{label:"Rajshahi",value:430},{label:"Other",value:790}],{fmt:function(v){return "৳"+v+" Cr";}}))+'</div>'+
    '<div class="w4">'+card("Collection efficiency",'<div style="text-align:center">'+CH.gauge(91.4,"vs 90% target",80,70)+'</div>')+'</div>'+
    '<div class="w12">'+card("Branch × month disbursement heat (৳ Cr)",
      CH.heatmap(D.branches.slice(0,6).map(function(b){return b.name;}),["Apr","May","Jun","Jul","Aug","Sep"],
        function(r,c){ var rr=rng(r+c); return rr()*0.9+0.05; }))+'</div></div>';
}

/* ============================================================
   REGULATORY CONSOLE
   ============================================================ */
function pgRegcon(){
  var rets=[["CL-1","Classified loan details","Monthly","10 Oct","Filed ✓"],["CL-2","Provisioning details","Monthly","10 Oct","Filed ✓"],
    ["CL-3","Recovery position","Monthly","10 Oct","In sign-off"],["CL-4","Write-off details","Monthly","10 Oct","Filed ✓"],
    ["CL-5","Restructured loans","Monthly","10 Oct","Filed ✓"],["CIB Subject file","Fixed-width via FTP","Monthly","05 Nov","Staged"],
    ["CIB Contract file","Fixed-width via FTP","Monthly","05 Nov","Staged"],["CIB Real-time","Event-driven API","Continuous","—","Live ●"],
    ["Basel III CAR","Capital adequacy return","Quarterly","15 Jan","Draft"],["EDW submission","BB prescribed","Monthly","12 Oct","Data ready"],
    ["IFRS-9 ECL","ECL provisioning model","Periodic","31 Dec","Draft"],["Large loan forecast","BB format","Quarterly","20 Jan","Not started"]];
  var rows=rets.map(function(r){
    var chip=r[4].indexOf("✓")>=0?'<span class="chip chip-ok">'+r[4]+'</span>':r[4].indexOf("Live")>=0?'<span class="chip chip-ok">'+r[4]+'</span>':
      r[4]==="Not started"?'<span class="chip chip-err">'+r[4]+'</span>':'<span class="chip chip-warn">'+r[4]+'</span>';
    return '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td class="num">'+r[3]+'</td><td>'+chip+'</td>'+
      '<td><button class="btn btn-sm btn-2nd" '+toastAttr(r[0]+" opened in Report Viewer — parameters prefilled")+'>Prepare</button> '+
      '<button class="btn btn-sm btn-2nd" '+toastAttr("Sign-off chain: Preparer ✓ → Checker ✓ → Compliance — you are next")+'>Sign-off</button></td></tr>';
  }).join("");
  return head([["Insight & Compliance","#/workspace/G3"],["Regulatory Console",null]],
    "Bangladesh Bank Returns <span class='tag' style='vertical-align:middle'>23/23 on-time · 24 months</span>",
    "CL series · CIB files · Basel III · EDW · IFRS-9 — with compliance sign-off chain",
    btn("Generate all due","btn-primary",null,toastAttr("6 due returns queued — generation p95 11s each"))+btn("Submission calendar","btn-2nd",null,'data-golink="#/screen/G3-s2"'))+
    kpiRow([["Returns due 30d","6","3 in sign-off","info"],["On-time streak","23 / 23","24 months","ok"],["CAR (Q3)","13.2%","floor 12.5%","ok"],["IFRS-9 runway","15 mo","mandatory Dec 2027","warn"]])+
    '<div class="dash-grid"><div class="w8">'+
    gridWrap(rets.length,"<th>Return</th><th>Description</th><th>Frequency</th><th>Next due</th><th>Status</th><th></th>",rows)+'</div>'+
    '<div class="w4">'+card("Capital adequacy — Basel III",'<div style="text-align:center">'+CH.gauge(13.2,"CAR vs 12.5% floor",99,95)+'</div>'+
      '<div class="small" style="margin-top:8px">RWA ৳41,200 Cr · CET1 10.8% · buffer 2.1pp</div>')+
    card("Sign-off chain (CL-2)",'<div class="org-ladder">'+
      [["Preparer","system ✓"],["Checker","f.akter ✓"],["Compliance","pending — you"],["Submit to BB","queued"]]
      .map(function(x){ return '<div class="ol-row"><span class="o-lvl">›</span><span>'+x[0]+'</span><span class="tag">'+x[1]+'</span></div>'; }).join("")+'</div>')+'</div></div>';
}

/* ============================================================
   REPORT CENTER / VIEWER / WRITER
   ============================================================ */
function pgReports(midFilter){
  var shelves=AREAS.map(function(a){
    var cards=a.mods.filter(function(mid){ return !midFilter||mid===midFilter; }).map(function(mid){
      var m=MODS[mid];
      return m.reports.map(function(rn,i){
        return repCard(mid,i,rn,m.reports.length>4?"operational":"operational");
      }).join("");
    }).join("");
    if(!cards) return "";
    return '<div class="fp-h" style="padding-left:0">'+a.en+'</div><div class="rep-shelf" style="margin-bottom:16px">'+cards+'</div>';
  }).join("");
  var statutory=[["F1","CL-1","Classified loan details"],["F1","CL-2","Provisioning details"],["F1","CL-3","Recovery position"],
    ["F1","CL-4","Write-off details"],["F1","CL-5","Restructured loans"],["C1","CIB-S","CIB Subject file"],["C1","CIB-C","CIB Contract file"],
    ["G3","CAR","Basel III capital adequacy"],["G3","ECL","IFRS-9 ECL statement"]].map(function(x){
      var m=MODS[x[0]]; var idx=m.reports.findIndex(function(r){return r.toLowerCase().indexOf(x[2].split(" ")[0].toLowerCase())>=0;});
      return repCard(x[0],idx<0?0:idx,x[1]+" — "+x[2],"statutory");
    }).join("");
  return head([["Insight & Compliance","#/workspace/G2"],["Report Center",null]],
    "Report Center <span class='tag' style='vertical-align:middle'>"+CNT.reports+" configured + statutory</span>",
    "Bilingual output · PDF / Excel · p95 11s · scheduler with email delivery",
    btn("＋ Report Writer","btn-primary",null,'data-golink="#/writer"')+btn("My scheduled","btn-2nd",null,'data-golink="#/screen/G2-s2"'))+
    '<div class="field" style="max-width:420px;margin-bottom:16px"><label>Search reports</label><input id="rep-q" placeholder="e.g. CL-1, aging, branch…"></div>'+
    '<div class="fp-h" style="padding-left:0">Statutory — Bangladesh Bank</div><div class="rep-shelf" style="margin-bottom:16px" id="shelf-statutory">'+statutory+'</div>'+shelves;
}
function repCard(mid,idx,name,kind){
  return '<div class="rep-card" data-repcard data-golink="#/report/'+mid+"/"+idx+'"><h4>📄 '+esc(name)+'</h4>'+
    '<p>'+(kind==="statutory"?"Bangladesh Bank statutory return · fixed format":"Operational / management report · parameterised")+'</p>'+
    '<div class="rep-meta"><span class="tag">'+mid+'</span><span class="chip chip-ok">p95 11s</span><span class="tag">BN / EN</span></div></div>';
}
function pgReport(mid,idx){
  var m=MODS[mid]; if(!m) return pgMissing(mid);
  var name=m.reports[Math.min(idx,m.reports.length-1)];
  var r=rng(name);
  var branches=D.branches.slice(0,8).map(function(b){ return {label:b.name,value:Math.round(80+r()*400),hl:b.name==="Gulshan"}; });
  var rows=branches.map(function(b,i){
    var v=b.value*100000;
    return '<tr><td>'+(i+1)+'</td><td>'+b.label+'</td><td class="right num">'+F.tkFull(v)+'</td><td class="right num">'+F.tkFull(v*0.31)+'</td><td class="right num">'+F.tkFull(v*0.18)+'</td><td class="num">'+(2+r()*6).toFixed(1)+'%</td></tr>';
  }).join("");
  var tot1=branches.reduce(function(a,b){return a+b.value*100000;},0);
  return head([["Report Center","#/reports"],[m.en,"#/workspace/"+mid],[name,null]],
    "📄 "+esc(name),'Viewing generated sample · parameters below · generated 2026-09-26 11:0'+(idx%9)+' by system',
    btn("Run","btn-primary",null,toastAttr("Re-run with parameters — preview refreshing"))+btn("Schedule","btn-2nd",null,'data-openform="New schedule" data-mid="G2"')+
    btn("PDF","btn-2nd",null,'onclick="window.print()"')+btn("Excel","btn-2nd",null,toastAttr("XLSX download started (prototype)"))+btn("Share","btn-2nd",null,toastAttr("Shared with Credit Ops distribution list")))+
    '<div class="list-layout"><aside class="filter-pane">'+
    '<div class="fp-h">Parameters</div><div style="padding:0 10px 10px">'+
    '<div class="field"><label>Period</label><select><option>Sep 2026</option><option>Aug 2026</option><option>FY 2025-26</option></select></div>'+
    '<div class="field" style="margin-top:8px"><label>Branch</label><select><option>All 65 branches</option>'+D.branches.map(function(b){return "<option>"+b.name+"</option>";}).join("")+'</select></div>'+
    '<div class="field" style="margin-top:8px"><label>Currency display</label><select><option>৳ Lakh / Crore</option><option>৳ full</option></select></div>'+
    '<div class="field" style="margin-top:8px"><label>'+LMSLabel("Language")+'</label><select>'+(window.LMS_SHELL.lang==="bn"?"<option>ইংরেজি</option><option>বাংলা</option><option>দ্বিভাষিক</option>":"<option>English</option><option>Bangla</option><option>Bilingual</option>")+'</select></div>'+
    '<button class="btn btn-primary" style="margin-top:12px;width:100%" '+toastAttr("Report re-generated with selected parameters")+'>'+T("apply")+'</button></div></aside>'+
    '<div><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">'+
    card("By branch (৳ Lakh)",CH.vbars(branches),"w6")+card("Mix",CH.donut([{label:"Retail",value:46,color:"var(--chart-1)"},{label:"SME",value:31,color:"var(--chart-2)"},{label:"Corporate",value:15,color:"var(--chart-3)"},{label:"Agri",value:8,color:"var(--chart-7)"}],130,"100%","mix"),"w4")+'</div>'+
    '<div class="grid-wrap"><div class="scroll-x"><table class="usl-grid rpt-table"><thead><tr><th>#</th><th>Branch</th><th>Exposure</th><th>Provision required</th><th>Classified</th><th>NPL %</th></tr></thead><tbody>'+rows+
    '</tbody><tfoot><tr><td></td><td>TOTAL — 65 branches</td><td class="right num">'+F.tkFull(tot1)+'</td><td class="right num">'+F.tkFull(tot1*.31)+'</td><td class="right num">'+F.tkFull(tot1*.18)+'</td><td class="num">4.6%</td></tr></tfoot></table></div>'+
    '<div class="grid-foot">Print-friendly · generated in 9.4s · audit ref RPT-'+(1000+idx)+'</div></div></div></div>';
}
function pgWriter(){
  var steps=["Source","Fields","Filters","Grouping","Calculations","Layout","Schedule"];
  return head([["Report Center","#/reports"],["Report Writer",null]],
    "Report Writer <span class='tag' style='vertical-align:middle'>7 steps · governed data model</span>",
    "Build over 60 governed materialised views — no SQL needed",
    btn("Save draft","btn-2nd",null,toastAttr("Draft saved to My Reports"))+btn("Finish & publish","btn-primary",null,toastAttr("Report published to Report Center — added to your area shelf")))+
    '<div class="wiz"><div class="wiz-steps">'+steps.map(function(s,i){
      return '<div class="wiz-step'+(i===0?" current":"")+'"><span class="w-dot">'+(i+1)+'</span>'+s+'</div>'; }).join("")+'</div>'+
    '<div class="wiz-pane"><div class="form-section" style="margin:0"><h3>1 · Source — governed views</h3>'+
    '<div class="form-grid">'+sel("Data domain",["Loan portfolio (MV_LOAN_PORTFOLIO)","Applications (MV_LOS_PIPELINE)","Collections (MV_COLLECTIONS)","Classification (MV_BRPD_STAGE)","Customers (MV_CLIENT_X)"],1)+
    sel("Grain",["One row per loan","One row per EMI","One row per day × branch"],1)+
    fld("Report name","My branch risk pack",1)+'</div>'+
    '<div class="card-pad" style="border-top:1px solid var(--stroke)"><div class="small">Selected view exposes 42 columns · row-level security applies automatically (branch scope).</div></div></div></div>'+
    '<div class="wiz-foot"><button class="btn btn-2nd" disabled>'+T("back")+'</button><button class="btn btn-primary" id="wr-next">'+T("next")+' ›</button><span class="spacer"></span><span class="small">Prototype: steps 2–7 simulated on Next</span></div></div>';
}

/* ============================================================
   AUDIT / SETTINGS / DESIGN / COVERAGE / DIRECTORY / SEARCH / SHORTCUTS / NOTIFS
   ============================================================ */
function pgAudit(){
  var r=rng("audit");
  var acts=["APPROVE","UPDATE","CREATE","VERIFY","OVERRIDE","EXPORT","LOGIN"];
  var objs=["APP-7239","LN-40118","CIF-100871","LN-40160","PRD-PL-01","CFG-DENSITY","APP-7248"];
  var rows=""; for(var i=0;i<14;i++){
    var a=acts[Math.floor(r()*acts.length)], o=objs[Math.floor(r()*objs.length)];
    rows+='<tr><td class="mono">2026-09-'+String(26-Math.floor(r()*6)).padStart(2,"0")+' '+String(8+Math.floor(r()*10)).padStart(2,"0")+':'+String(Math.floor(r()*59)).padStart(2,"0")+'</td>'+
      '<td>'+["r.islam","f.akter","k.chowdhury","s.mia","t.rahman"][Math.floor(r()*5)]+'</td><td><span class="tag">'+a+'</span></td><td class="mono">'+o+'</td>'+
      '<td class="mono small">'+(a==="UPDATE"?"status: Pending → Approved":"n/a")+'</td><td>'+(a==="OVERRIDE"?'<span class="chip chip-warn">maker-checker</span>':'<span class="chip chip-ok">logged</span>')+'</td></tr>';
  }
  return head([["Platform & Admin","#/workspace/H4"],["Audit Trail",null]],
    "Audit Trail Viewer <span class='tag' style='vertical-align:middle'>immutable · WORM storage</span>",
    "Every approve / modify / override captured · 18.4K events in 24h · 100% coverage",
    btn("Export (CSV)","btn-2nd",null,toastAttr("14 events exported — digitally signed"))+btn("SOX-style extract","btn-2nd",null,toastAttr("Extract queued for compliance")))+
    '<div class="list-layout"><aside class="filter-pane"><div class="fp-h">User</div>'+
    ["r.islam","f.akter","k.chowdhury","s.mia","t.rahman"].map(function(u){ return '<label class="fp-item"><input type="checkbox" checked> '+u+'</label>'; }).join("")+
    '<div class="fp-h">Action</div>'+acts.map(function(a){ return '<label class="fp-item"><input type="checkbox" checked> '+a+'</label>'; }).join("")+'</aside>'+
    gridWrap(14,"<th>When</th><th>User</th><th>Action</th><th>Object</th><th>Change</th><th>Control</th>",rows)+'</div>';
}
function pgSettings(){
  return head([["Platform & Admin","#/workspace/H5"],["System Settings",null]],"System Settings",
    "Maker-checker applies to every change · Bangladesh localisation",
    btn("Save changes","btn-primary",null,toastAttr(T("form_saved")))+btn("Request checker approval","btn-2nd",null,toastAttr("Change request #CR-882 routed to checker")))+
    '<div class="dm-layout"><div class="dm-main">'+
    '<div class="form-section"><h3>Localisation</h3><div class="form-grid">'+
    sel(LMSPick("Primary language","প্রধান ভাষা"),LMSPick(["English","Bangla"],["ইংরেজি","বাংলা"]),1)+sel(LMSPick("Number format","সংখ্যার ফরম্যাট"),LMSPick(["৳ Lakh / Crore (5,200 Cr)","৳ full digits"],["৳ লক্ষ / কোটি (৫,২০০ কোঃ)","৳ সম্পূর্ণ সংখ্যা"]),1)+
    sel("Fiscal year",["July – June"],1)+fld("Timezone","Asia/Dhaka (GMT+6)",1)+'</div></div>'+
    '<div class="form-section"><h3>Working days & holidays</h3><div class="form-grid">'+
    '<div class="field span2"><label>Working days</label><div class="flex" style="flex-wrap:wrap;gap:10px">'+
    ["Sun","Mon","Tue","Wed","Thu"].map(function(d){ return '<label class="check"><input type="checkbox" checked> '+d+'</label>'; }).join("")+
    ["Fri","Sat"].map(function(d){ return '<label class="check"><input type="checkbox"> '+d+'</label>'; }).join("")+'</div></div>'+
    fld("Holiday calendar","BB + lunar 2026 (loaded ✓)",1)+'</div></div>'+
    '<div class="form-section"><h3>Comms</h3><div class="form-grid">'+
    sel("SMS gateway",["SSL Wireless","Bulk SMS BD","Alpha"],1)+sel("Email relay",["SendGrid","AWS SES"],1)+
    fld("Sender mask","ABCBANK",1)+'</div></div>'+
    '<div class="form-section"><h3>Security</h3><div class="form-grid">'+
    sel("Session timeout",["15 min","30 min","60 min"],1)+sel("Password policy",["BB ICT V4.0 (default)"],1)+
    '<div class="field"><label>2FA for approvers</label><select><option>Enabled — TOTP</option><option>Disabled</option></select></div></div></div>'+
    '</div><aside>'+card("Change discipline",'<div class="fb-kv"><span>Maker</span><b>you</b></div><div class="fb-kv"><span>Checker</span><b>admin-2</b></div><div class="fb-kv"><span>Audit</span><b>always on</b></div><div class="fb-kv"><span>Rollback</span><b>supported</b></div>')+
    card("Environment",'<div class="fb-kv"><span>Build</span><b>v2.0.146-staging</b></div><div class="fb-kv"><span>Fineract</span><b>1.10 CE</b></div><div class="fb-kv"><span>Region</span><b>ap-south-1</b></div>')+'</aside></div>';
}
function pgDesign(){
  var ramp=""; for(var i=10;i<=160;i+=10){ ramp+='<div style="flex:1;min-width:60px"><div style="height:38px;border-radius:6px;background:var(--brand-'+i+');border:1px solid var(--stroke)"></div><div class="small" style="text-align:center">'+i+'</div></div>'; }
  return head([["Platform & Admin","#/workspace/H5"],["Design System",null]],"ULMS Design System — INDIGO-FLUENT v3",
    "Tokens, components and archetypes — this living page is generated from the same CSS the app uses",
    btn("Toggle dark","btn-2nd",null,'data-toast="Use the ☾ button in the top bar — dark theme restyles charts too"'))+
    '<div class="dash-grid">'+
    '<div class="w12">'+card("Brand ramp",'<div class="flex" style="gap:6px;flex-wrap:wrap">'+ramp+'</div>')+'</div>'+
    '<div class="w4">'+card("Buttons",'<div class="flex" style="flex-wrap:wrap;gap:8px">'+btn("Primary","btn-primary")+btn("Secondary","btn-2nd")+btn("Danger","btn-danger")+btn("Ghost","btn-ghost")+btn("Small","btn-sm btn-primary")+'</div>')+'</div>'+
    '<div class="w4">'+card("BRPD chips",'<div class="flex" style="flex-wrap:wrap;gap:8px">'+BRPD.map(function(b){ return '<span class="'+b.chip+'">'+b.k+" · "+b.prov+"%</span>"; }).join("")+'</div>')+'</div>'+
    '<div class="w4">'+card("Status chips",'<div class="flex" style="flex-wrap:wrap;gap:8px"><span class="chip chip-ok">ok</span><span class="chip chip-warn">warn</span><span class="chip chip-err">error</span><span class="chip chip-info">info</span><span class="chip chip-neutral">neutral</span><span class="chip chip-severe">severe</span></div>')+'</div>'+
    '<div class="w6">'+card("Form field",'<div class="form-grid" style="padding:0"><div class="field"><label>Amount (৳)<span class="req">*</span></label><input value="1,500,000" class="num"><span class="help">Lakh/Crore display per system setting</span></div><div class="field invalid"><label>Required demo<span class="req">*</span></label><input value=""><span class="err-msg">Required field</span></div></div>')+'</div>'+
    '<div class="w6">'+card("Charts",CH.spark([4,9,7,12,8,14,11,16],120,32)+'<div style="margin-top:8px">'+CH.gauge(78,"gauge demo")+'</div>')+'</div>'+
    '<div class="w12">'+card("Density & theme",'<div class="small">Cycle density with ◷ (compact 32px · comfortable 40px · spacious 48px rows) and toggle dark ☾ — both are real, persisted, and propagate to charts (palette read from CSS tokens).</div>')+'</div></div>';
}
function pgCoverage(){
  var rows=Object.keys(MODS).map(function(mid){
    var m=MODS[mid];
    var sc=m.groups.reduce(function(a,g){return a+g.screens.length;},0);
    return '<tr><td><b>'+mid+'</b></td><td>'+m.icon+' '+esc(m.en)+'</td><td class="num">'+m.groups.length+'</td><td class="num">'+sc+'</td>'+
      '<td class="num">'+m.reports.length+'</td><td class="num">'+m.forms.length+'</td><td class="num">'+m.frs+'</td>'+
      '<td><span class="chip chip-ok">routes wired</span></td><td><button class="btn btn-sm btn-2nd" data-golink="#/workspace/'+mid+'">Open</button></td></tr>';
  }).join("");
  return head([["System","#/directory"],["Coverage",null]],"Screen Coverage & Route Accounting",
    "Machine-checkable proof that every module, screen, report and form is reachable",
    btn("Run self-test","btn-primary",null,toastAttr("Open _selftest.html for the full 176-route harness (this prototype ships the same rig)")))+
    kpiRow([["Areas",CNT.areas,"top-level","info"],["Modules",CNT.modules,"across 8 areas","info"],["Screens",CNT.screens,"6 archetypes","ok"],
      ["Reports",CNT.reports,"+ statutory shelf","ok"],["Forms",CNT.forms,"modal + wizard","ok"],["Functions",CNT.frs,"register","ok"]])+
    gridWrap(CNT.modules,"<th>ID</th><th>Module</th><th>Groups</th><th>Screens</th><th>Reports</th><th>Forms</th><th>Functions</th><th>Routes</th><th></th>",rows);
}
function pgDirectory(){
  // MODULE directory — one card per module (A–Z), module → sub-module group → screens
  var letters={};
  AREAS.forEach(function(a){
    a.mods.forEach(function(mid){
      var m=MODS[mid];
      var L=(m.en.replace(/[^A-Za-z]/g,"")[0]||"#").toUpperCase();
      (letters[L]=letters[L]||[]).push({mid:mid,m:m,area:a});
    });
  });
  var Ls=Object.keys(letters).sort();
  var html="";
  Ls.forEach(function(L){
    html+='<div class="nav-zone-h" style="padding:var(--s-3) 0 6px;font-size:12px">'+L+'</div>'+
      '<div class="dash-grid">';
    letters[L].forEach(function(e){
      var m=e.m, a=e.area, mid=e.mid;
      var nScr=0; m.groups.forEach(function(g){ nScr+=g.screens.length; });
      var groups=m.groups.map(function(g){
        return '<div class="dir-g"><b>'+esc(g.en)+'</b>'+
          g.screens.map(function(s){
            return '<a href="'+(s.route||("#/screen/"+s.id))+'" title="'+esc(s.en)+' · '+esc(g.en)+'">'+window.LMSTypeIcon(s.t)+" "+esc(s.en)+'</a>';
          }).join("")+'</div>';
      }).join("");
      var searchText=(m.en+" "+m.bn+" "+a.en+" "+m.groups.map(function(g){return g.en+" "+g.screens.map(function(s){return s.en;}).join(" ");}).join(" ")).toLowerCase();
      html+='<div class="card dir-mod w4" data-txt="'+esc(searchText)+'">'+
        '<div class="card-h"><h3>'+m.icon+" "+esc(LMSPick(m.en,m.bn))+'</h3><span class="tag">'+mid+'</span></div>'+
        '<div class="card-pad" style="display:flex;flex-direction:column;gap:6px">'+
        '<div class="small">'+esc(LMSPick(m.en,m.bn))+' · <span style="color:var(--primary);font-weight:var(--fw-semibold)">'+esc(LMSPick(a.en,a.bn))+'</span></div>'+
        '<p style="font-size:11.5px;color:var(--ink-500)">'+esc(LMSPick(m.desc, m.bn+" · "+LMSPick(a.en,a.bn)))+'</p>'+
        '<div class="small" style="display:flex;gap:8px;flex-wrap:wrap">'+
          '<span class="tag">'+m.groups.length+' groups</span><span class="tag">'+nScr+' screens</span>'+
          '<span class="tag">'+m.reports.length+' reports</span><span class="tag">'+m.forms.length+' forms</span></div>'+
        '<div class="dir-groups">'+groups+'</div>'+
        '<a class="btn btn-sm btn-primary" href="#/workspace/'+mid+'" style="align-self:flex-start;margin-top:2px">Open module →</a>'+
        '</div></div>';
    });
    html+='</div>';
  });
  return head([["System","#/directory"],["Module Directory",null]],"Module Directory <span class='tag' style='vertical-align:middle'>A–Z</span>",
    CNT.modules+" modules · "+CNT.groups+" sub-module groups · "+CNT.screens+" screens — every module card shows its area, counts and full module → group → screen tree",
    btn("Tell-ME search","btn-primary",null,'data-toast="Press Alt+Q anywhere — arrow keys + Enter"'))+
    '<div class="field" style="max-width:420px;margin-bottom:14px"><label>Filter modules & screens</label><input id="dir-q" placeholder="e.g. CIB, collections, e-KYC, H4…"></div>'+
    '<div id="dir-list">'+html+'</div>'+
    '<div class="empty-state" id="dir-empty" style="display:none"><div class="e-ico">🔎</div><p>No module or screen matches that filter.</p></div>';
}
function pgSearch(){
  var quick=["LN-40118","CL-1","NPL","CIF-100871","New Application","collections","Basel"].map(function(q){
    return '<button class="vp" data-sq="'+esc(q)+'" style="cursor:pointer">'+esc(q)+'</button>';
  }).join("");
  return head([["System"],["Search",null]],"Search","Records, pages, reports, forms and actions — same index as Tell-ME (Alt+Q)",
    '<div class="field grow" style="max-width:520px"><input id="pgsearch" placeholder="Search everything…" autofocus></div>'+
    '<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="small" style="color:var(--ink-500)">Try:</span>'+quick+'</div>')+
    '<div id="pgsearch-out" class="dash-grid" style="margin-top:12px"></div>'+
    '<div class="empty-state" id="pgsearch-empty" style="display:none"><div class="e-ico">🔎</div><p>Type above or pick a suggestion — results cover all 31 modules.</p></div>';
}
function pgShortcuts(){
  var map=[["Alt + Q","Focus Tell-ME search"],["Ctrl + K","Command palette (alias of search)"],["Ctrl + B","Collapse / expand sitemap"],
    ["Ctrl + W","Close active tab"],["Ctrl + PgUp / PgDn","Previous / next tab"],["Ctrl + Shift + T","Reopen last session"],
    ["Ctrl + /","This shortcut sheet"],["Esc","Close mega menu · flyouts · copilot"],
    ["Enter / ↑ ↓","Navigate Tell-ME results"],["Click area ▸","Open mega menu (column per group)"],
    ["★ on module","Pin to favorites"],["Click row","Open record — grids are live"]];
  return head([["System"],["Keyboard shortcuts",null]],"Keyboard Shortcuts","D365-aligned muscle memory for power users",
    btn("Print sheet","btn-2nd",null,'onclick="window.print()"'))+
    gridWrap(map.length,"<th>Keys</th><th>Action</th>",map.map(function(x){
      return '<tr><td>'+kbd(x[0].split("+")[0].trim())+(x[0].indexOf("+")>0?kbd(x[0].split("+").slice(1).join("+").trim()):"")+'</td><td>'+x[1]+'</td></tr>'; }).join(""));
}
function pgNotifications(){
  var rows=D.alerts.filter(function(a){return a.t;}).map(function(a){
    return '<div class="alert-row"><span class="a-ico">'+a.ico+'</span><div class="grow"><b>'+esc(a.t)+'</b><div class="small">'+esc(a.d)+'</div></div>'+
      '<span class="tag">'+a.ago+'</span><button class="btn btn-sm btn-2nd" '+toastAttr("Alert opened — routed to owning module")+'>Open</button></div>';
  }).join("");
  return head([["System"],["Notifications",null]],"Notifications","Real-time exception alerts across origination, risk and compliance",
    btn("Mark all read","btn-2nd",null,toastAttr("All notifications marked read")))+
    card("",rows);
}
function pgMissing(frag){
  return head([["ULMS"]],"Screen not found","No route matches “"+esc(frag)+"”")+
    '<div class="empty-state"><div class="e-ico">🔎</div><p>The link may be stale. Try the module directory or Tell-ME search (Alt+Q).</p>'+
    '<div class="flex" style="justify-content:center"><a class="btn btn-primary" href="#/directory">Module Directory</a><a class="btn btn-2nd" href="#/home">Home</a></div></div>';
}

/* ============================================================
   MODAL FORM SYSTEM (validated)
   ============================================================ */
window.LMSModal=function(innerHTML){
  var root=document.getElementById("lms-modal"); if(!root) return;
  root.innerHTML='<div class="modal-back" id="modal-back">'+innerHTML.replace("<div class=\"modal-h","<div class=\"modal")+'</div>';
  // actually inject as-is
  root.innerHTML='<div class="modal-back" id="modal-back"><div class="modal" role="dialog" aria-modal="true">'+innerHTML+'</div></div>';
  var back=document.getElementById("modal-back");
  back.addEventListener("mousedown",function(e){ if(e.target===back) window.LMSCloseModal(); });
  root.querySelectorAll("[data-mx]").forEach(function(b){ b.onclick=window.LMSCloseModal; });
  root.querySelectorAll("[data-toast]").forEach(function(b){
    b.addEventListener("click",function(){ window.LMSToast(b.getAttribute("data-toast"),b.getAttribute("data-tt")||"ok"); });
  });
  var f=root.querySelector("form.lms-form");
  if(f) f.addEventListener("submit",function(e){ e.preventDefault(); validateForm(f); });
};
window.LMSCloseModal=function(){ var root=document.getElementById("lms-modal"); if(root) root.innerHTML=""; };
function validateForm(f){
  var bad=f.querySelectorAll('.field[data-req="1"] input, .field[data-req="1"] select, .field[data-req="1"] textarea');
  var n=0;
  for(var i=0;i<bad.length;i++){ if(!bad[i].value.trim()){ bad[i].closest(".field").classList.add("invalid"); n++; } else bad[i].closest(".field").classList.remove("invalid"); }
  if(n){ window.LMSToast(T("form_invalid")+" ("+n+")","err"); }
  else { window.LMSToast(T("form_saved"),"ok"); window.LMSCloseModal(); }
}
function openForm(mid,name){
  var m=MODS[mid]; if(!m) return;
  var body='<form class="lms-form" onsubmit="return false"><div class="modal-h"><div><h3>'+esc(name)+'</h3>'+
    '<div class="m-sub">'+m.icon+" "+esc(m.en)+" · "+mid+' · validation · autosave · audit trail · maker-checker ready</div></div>'+
    '<button class="tb-btn m-x" data-mx type="button">✕</button></div>'+
    '<div class="modal-b"><div class="form-section" style="margin:0;box-shadow:none"><h3>Fields</h3><div class="form-grid">'+formFields(m.area,name)+'</div></div>'+
    '<div class="form-section" style="margin-top:12px"><h3>Lines</h3><div class="scroll-x"><table class="lines-table"><thead><tr><th>#</th><th>Item</th><th>Value (৳)</th><th>Note</th></tr></thead><tbody>'+
    [1,2].map(function(i){ return '<tr><td>'+i+'</td><td><input value="Line '+i+'"></td><td><input class="num" value="'+(i*250000)+'"></td><td><input value=""></td></tr>'; }).join("")+
    '<tr><td colspan="4"><button class="btn btn-sm btn-2nd" type="button" '+toastAttr("Line added")+'>＋ Add line</button></td></tr></tbody></table></div></div></div>'+
    '<div class="modal-f"><button class="btn btn-primary" type="submit">'+T("submit")+' (maker)</button>'+
    '<button class="btn btn-2nd" type="button" data-mx>'+T("cancel")+'</button><span class="spacer"></span>'+
    '<span class="small">'+kbd("Esc")+' closes · '+kbd("Ctrl")+kbd("S")+' saves draft</span></div></form>';
  window.LMSModal(body);
  var f=document.querySelector("#lms-modal form.lms-form");
  if(f){ f.addEventListener("keydown",function(e){ if(e.key==="Escape") window.LMSCloseModal(); }); }
}
window.LMSOpenForm=openForm;

/* form host route (opens modal over a neutral page) */
function pgFormHost(name,mid){
  setTimeout(function(){ openForm(mid,name||"New record"); },0);
  return head([[MODS[mid]?MODS[mid].en:"ULMS","#/workspace/"+mid],[name||"Form",null]],name||"Form","Modal opening…");
}

/* ============================================================
   PAGE WIRING (after paint)
   ============================================================ */
window.__pageWired=function(frag){
  // tabs in 360/record pages
  document.querySelectorAll("#page .dm-tab").forEach(function(t){
    t.addEventListener("click",function(){
      var host=t.closest(".dm-tabs");
      host.querySelectorAll(".dm-tab").forEach(function(x){ x.classList.remove("on"); });
      host.querySelectorAll(".tabpane").forEach(function(x){ x.classList.remove("on"); });
      t.classList.add("on");
      var pane=host.querySelector("#"+t.getAttribute("data-tab")); if(pane) pane.classList.add("on");
    });
  });
  // record links
  document.querySelectorAll("#page [data-golink]").forEach(function(b){
    b.addEventListener("click",function(e){
      if(e.target.closest("[data-toast]")) return;
      e.stopPropagation(); window.LMSGo(b.getAttribute("data-golink"));
    });
  });
  // modal form openers
  document.querySelectorAll("#page [data-openform]").forEach(function(b){
    b.addEventListener("click",function(){ openForm(b.getAttribute("data-mid")||"A1",b.getAttribute("data-openform")); });
  });
  // pipeline/approval rows → app modal
  document.querySelectorAll("#page tr[data-app]").forEach(function(tr){
    tr.addEventListener("click",function(){ appModal(parseInt(tr.getAttribute("data-app"),10)); });
  });
  // wizard
  wireWizard();
  // drillable KPI cards on role center
  document.querySelectorAll("#page [data-kpi]").forEach(function(k){
    k.addEventListener("click",function(){ window.LMSToast("Drill-through: "+k.getAttribute("data-kpi")+" → underlying records (prototype)"); });
  });
  // report center search
  var rq=document.getElementById("rep-q");
  if(rq) rq.addEventListener("input",function(){
    var q=this.value.toLowerCase();
    document.querySelectorAll("[data-repcard]").forEach(function(c){
      c.style.display=c.textContent.toLowerCase().indexOf(q)>=0?"":"none";
    });  });
  // module directory filter
  var dq=document.getElementById("dir-q");
  if(dq) dq.addEventListener("input",function(){
    var q=this.value.toLowerCase().trim();
    var visible=0;
    document.querySelectorAll(".dir-mod").forEach(function(c){
      var hit=!q||c.getAttribute("data-txt").indexOf(q)>=0;
      c.style.display=hit?"":"none"; if(hit) visible++;
    });
    // hide letter headers whose whole row-block emptied
    document.querySelectorAll("#dir-list > .nav-zone-h").forEach(function(h){
      var next=h.nextElementSibling, any=false;
      if(next&&next.classList.contains("dash-grid"))
        any=[...next.querySelectorAll(".dir-mod")].some(function(c){return c.style.display!=="none";});
      h.style.display=any?"":"none"; if(next&&next.classList.contains("dash-grid")) next.style.display=any?"":"none";
    });
    var emp=document.getElementById("dir-empty"); if(emp) emp.style.display=visible?"none":"";
  });
  // workspace area breadcrumb opens that area's mega menu (hierarchy-true navigation)
  var areaCrumb=document.querySelector(".page-crumb a[data-area]");
  if(areaCrumb) areaCrumb.addEventListener("click",function(e){
    e.preventDefault(); e.stopPropagation();
    if(window.LMSMegaOpen) window.LMSMegaOpen(this.getAttribute("data-area"));
  });
  // classification calculator
  var pa=document.getElementById("pc-amt"),ps=document.getElementById("pc-stage");
  function pc(){ if(!pa||!ps) return;
    var amt=parseFloat(pa.value)||0; var ix=ps.selectedIndex; if(!(ix>=0&&ix<BRPD.length)) ix=0;
    var st=BRPD[ix];
    document.getElementById("pc-out").textContent=F.tkFull(Math.round(amt*st.prov/100))+" ("+st.prov+"%)";
    document.getElementById("pc-is").textContent=st.prov>=20?"yes — capitalise & suspend":"no — accrue normally"; }
  if(pa){ pa.addEventListener("input",pc); ps.addEventListener("change",pc); pc(); }
  // search page
  var si=document.getElementById("pgsearch");
  if(si){
    var runSearch=function(q){
      var out=document.getElementById("pgsearch-out"); var emp=document.getElementById("pgsearch-empty");
      var res=window.LMSSearch(q);
      out.innerHTML=res.length?card("Results ("+res.length+")",'<div class="miniList">'+res.map(function(r){
        return '<div class="mi" data-golink="'+esc(r.route)+'"><span class="t-ico">'+esc(r.ico)+'</span><span class="grow trunc">'+esc(r.t)+'</span><span class="tag">'+r.g+'</span></div>';
      }).join("")+'</div>'):'<div class="empty-state" style="grid-column:1/-1"><div class="e-ico">🔎</div><p>No matches.</p></div>';
      out.querySelectorAll("[data-golink]").forEach(function(b){ b.addEventListener("click",function(){ window.LMSGo(b.getAttribute("data-golink")); }); });
      if(emp) emp.style.display = (!q || res.length) ? "none" : "none";
    };
    si.addEventListener("input",function(){ runSearch(this.value); });
    document.querySelectorAll("[data-sq]").forEach(function(chp){
      chp.addEventListener("click",function(){ si.value=this.getAttribute("data-sq"); runSearch(si.value); });
    });
  }
  // grid saved views + filters
  wireGrid();
  // writer next
  var wn=document.getElementById("wr-next");
  if(wn) wn.addEventListener("click",function(){ window.LMSToast("Steps 2–7 simulated — field picker, filters, grouping, calc, layout, schedule","ok"); });
};

/* grid interactions: pills + facets + sorting */
window.__gridState={};
function wireGrid(){
  var table=document.querySelector("#page table.usl-grid");
  if(!table||table.closest(".rpt-table")) { /* still wire sort for others */ }
  document.querySelectorAll("#page .view-pills .vp, #page [data-appvp]").forEach(function(p){
    p.addEventListener("click",function(){
      var bar=p.parentElement; bar.querySelectorAll(".vp").forEach(function(x){x.classList.remove("on");});
      p.classList.add("on"); applyPill(p.getAttribute("data-vp")||p.getAttribute("data-appvp"),table);
    });
  });
  document.querySelectorAll("#page [data-pview]").forEach(function(r){
    r.addEventListener("change",function(){ applyPill(this.getAttribute("data-pview"),table); });
  });
  document.querySelectorAll("#page .fp-item input[data-fst], #page .fp-item input[data-fbr], #page .fp-item input[data-stage]").forEach(function(chk){
    chk.addEventListener("change",function(){ applyFacets(); });
  });
  document.querySelectorAll("#page th.sortable").forEach(function(th2){
    th2.addEventListener("click",function(){ sortGrid(th2.getAttribute("data-sort"),th2); });
  });
  var all=document.getElementById("chk-all");
  if(all) all.addEventListener("change",function(){
    document.querySelectorAll("#page .rowchk").forEach(function(c){ c.checked=all.checked; });
  });
  document.querySelectorAll("#page tr[data-rec]").forEach(function(tr){
    tr.addEventListener("click",function(){
      location.hash="#/record/"+tr.getAttribute("data-sid")+"/"+tr.getAttribute("data-rec");
    });
  });
}
function applyPill(mode,table){
  document.querySelectorAll("#page tbody tr").forEach(function(tr){
    if(tr.querySelector("td[colspan]")) return;
    var show=true;
    var txt=tr.textContent;
    if(mode==="sla") show=/SLA\s*risk|Escalated/i.test(txt);
    else if(mode==="large"||mode==="big"){
      var m=txt.match(/৳\s*([\d.,]+)\s*(Cr|L)/);
      var val=m?parseFloat(m[1].replace(/,/g,""))*(m[2]==="Cr"?1e7:1e5):0;
      show=val>=5e6;
    }
    else if(mode==="flag") show=/chip-err/.test(tr.innerHTML)||/Broken|Reject|Overdue/.test(txt);
    tr.style.display=show?"":"none";
  });
}
function applyFacets(){
  var sts=[].map.call(document.querySelectorAll("#page input[data-fst]:checked"),function(c){return c.getAttribute("data-fst");});
  var brs=[].map.call(document.querySelectorAll("#page input[data-fbr]:checked"),function(c){return c.getAttribute("data-fbr");});
  var stages=[].map.call(document.querySelectorAll("#page input[data-stage]:checked"),function(c){return c.getAttribute("data-stage");});
  document.querySelectorAll("#page tbody tr").forEach(function(tr){
    if(tr.querySelector("td[colspan]")) return;
    var txt=tr.textContent, show=true;
    if(sts.length&&!sts.some(function(s){return txt.indexOf(s)>=0;})) show=false;
    if(brs.length&&!brs.some(function(s){return txt.indexOf(s)>=0;})) show=false;
    if(stages.length&&!stages.some(function(s){return txt.indexOf(s)>=0;})) show=false;
    tr.style.display=show?"":"none";
  });
}
function sortGrid(key,th2){
  var tb=th2.closest("table").querySelector("tbody");
  var rows=[].slice.call(tb.querySelectorAll("tr"));
  var i=th2.cellIndex;
  var dir=th2.getAttribute("data-dir")==="asc"?"desc":"asc";
  document.querySelectorAll("#page th.sortable").forEach(function(x){ x.innerHTML=x.innerHTML.replace(/<span class="arr">.*?<\/span>/,""); x.removeAttribute("data-dir"); });
  th2.setAttribute("data-dir",dir);
  th2.innerHTML=th2.innerHTML+'<span class="arr">'+(dir==="asc"?"▲":"▼")+'</span>';
  rows.sort(function(a,b){
    var x=a.cells[i]?a.cells[i].textContent.trim():"", y=b.cells[i]?b.cells[i].textContent.trim():"";
    var nx=parseFloat(x.replace(/[৳,L Cr]/g,""))||0, ny=parseFloat(y.replace(/[৳,L Cr]/g,""))||0;
    if(!isNaN(nx)&&!isNaN(ny)&&/[৳%]|^\d/.test(x)) { return dir==="asc"?nx-ny:ny-nx; }
    return dir==="asc"?x.localeCompare(y):y.localeCompare(x);
  });
  rows.forEach(function(r){ tb.appendChild(r); });
}

/* hash routing */
window.addEventListener("hashchange",route);

/* boot when shell present */
if(typeof document!=="undefined"&&document.getElementById("page")){
  route();
}
})();
