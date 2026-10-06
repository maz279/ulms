/* ============================================================
   ULMS demo data — deterministic, seeded (no server required).
   Bangladeshi context: ৳, Lakh/Crore, BRPD 15/2024 stages,
   CIB grades, bKash/Nagad rails, district names.
   ============================================================ */
(function(){
"use strict";
/* xorshift PRNG — same data every boot */
function seedGen(seed){
  var h=1779033703^seed.length;
  for(var i=0;i<seed.length;i++){ h=Math.imul(h^seed.charCodeAt(i),3432918353); h=(h<<13)|(h>>>19); }
  return function(){
    h=Math.imul(h^(h>>>16),2246822507); h=Math.imul(h^(h>>>13),3266489909);
    h^=h>>>16; return (h>>>0)/4294967296;
  };
}
var R=seedGen("ulms-2026");
function pick(a){ return a[Math.floor(R()*a.length)]; }
function ri(a,b){ return a+Math.floor(R()*(b-a+1)); }

/* ---------- formatters (global, used everywhere) ---------- */
window.LMSF = {
  tk:function(n){ // ৳ with Lakh/Crore
    var neg = n<0; n=Math.abs(n);
    var s;
    if(n>=1e7) s=(n/1e7).toFixed(2).replace(/\.00$/,"")+" Cr";
    else if(n>=1e5) s=(n/1e5).toFixed(2).replace(/\.00$/,"")+" L";
    else s=n.toLocaleString("en-US");
    return (neg?"−৳":"৳")+s;
  },
  tkFull:function(n){ return (n<0?"−":"")+"৳ "+Math.abs(Math.round(n)).toLocaleString("en-US"); },
  pct:function(n){ return (Math.round(n*10)/10).toFixed(1)+"%"; },
  dt:function(d){ return d; },
  inr:function(n){ return Math.round(n).toLocaleString("en-US"); }
};

/* ---------- BRPD 15/2024 stage table (single source of truth) ---------- */
window.LMS_BRPD = [
  {k:"STD-0", cls:"Standard · Current", dpd:"0",        prov:1,   chip:"b-std0", color:"#107C10", bn:"উত্তম (চলতি)"},
  {k:"STD-1", cls:"Standard · Watch",   dpd:"1–30",     prov:1,   chip:"b-std1", color:"#256025", bn:"উত্তম (নজরদারি)"},
  {k:"STD-2", cls:"Standard · Caution", dpd:"31–60",    prov:1,   chip:"b-std2", color:"#8A6D1A", bn:"উত্তম (সতর্ক)"},
  {k:"SMA",   cls:"Special Mention",    dpd:"61–90",    prov:5,   chip:"b-sma",  color:"#B58900", bn:"বিশেষ উল্লেখ"},
  {k:"SS",    cls:"Substandard",        dpd:"91–180",   prov:20,  chip:"b-ss",   color:"#C42B3C", bn:"অনুত্তম"},
  {k:"DF",    cls:"Doubtful",           dpd:"181–365",  prov:50,  chip:"b-df",   color:"#DA3B01", bn:"সন্দেহজনক"},
  {k:"B/L",   cls:"Bad / Loss",         dpd:">365",     prov:100, chip:"b-bl",   color:"#A4262C", bn:"অবলোপন"}
];
window.LMS_stageOf=function(dpd){
  if(dpd<=0) return 0; if(dpd<=30) return 1; if(dpd<=60) return 2;
  if(dpd<=90) return 3; if(dpd<=180) return 4; if(dpd<=365) return 5; return 6;
};

/* ---------- products ---------- */
var PRODUCTS=[
  {id:"PL-01", en:"Personal Loan",            bn:"ব্যক্তিগত ঋণ",              rate:"11.99%", tenor:"12–60m", amt:"৳50K–20L", type:"Retail", icon:"👤"},
  {id:"HL-01", en:"Home Loan",                bn:"গৃহঋণ",                     rate:"9.50%",  tenor:"60–300m",amt:"৳10L–2Cr", type:"Retail", icon:"🏠"},
  {id:"AL-01", en:"Auto Loan",                bn:"যানবাহন ঋণ",                rate:"12.50%", tenor:"12–84m", amt:"৳5L–80L",  type:"Retail", icon:"🚗"},
  {id:"SME-01",en:"SME Term Loan",            bn:"ক্ষুদ্র ঋণ (এসএমই)",         rate:"13.00%", tenor:"12–60m", amt:"৳2L–5Cr",  type:"SME",    icon:"🏭"},
  {id:"SME-02",en:"SME Working Capital",      bn:"এসএমই চালু মূলধন",          rate:"13.50%", tenor:"12m rev",amt:"৳5L–3Cr", type:"SME",    icon:"📦"},
  {id:"AGR-01",en:"Krishi (Agri) Loan",       bn:"কৃষি ঋণ",                   rate:"8.00%",  tenor:"6–36m",  amt:"৳50K–10L", type:"Agri",   icon:"🌾"},
  {id:"ISL-01",en:"Halal Auto Murabaha",      bn:"হালাল অটো মুরাবাহা",        rate:"12.00%", tenor:"12–60m", amt:"৳5L–60L",  type:"Islamic",icon:"☪"},
  {id:"EDU-01",en:"Education Loan",           bn:"শিক্ষা ঋণ",                  rate:"10.00%", tenor:"12–120m",amt:"৳1L–20L",  type:"Retail", icon:"🎓"}
];

/* ---------- branches ---------- */
var BRANCHES=[
  {id:"BR-001", name:"Gulshan",      region:"Dhaka North",   regionCode:"DN"},
  {id:"BR-002", name:"Dhanmondi",    region:"Dhaka North",   regionCode:"DN"},
  {id:"BR-003", name:"Motijheel",    region:"Dhaka South",   regionCode:"DS"},
  {id:"BR-004", name:"Uttara",       region:"Dhaka North",   regionCode:"DN"},
  {id:"BR-005", name:"Chattogram",   region:"Chattogram",    regionCode:"CTG"},
  {id:"BR-006", name:"Sylhet",       region:"Sylhet",        regionCode:"SYL"},
  {id:"BR-007", name:"Khulna",       region:"Khulna",        regionCode:"KHU"},
  {id:"BR-008", name:"Rajshahi",     region:"Rajshahi",      regionCode:"RAJ"},
  {id:"BR-009", name:"Bogura",       region:"Rajshahi",      regionCode:"RAJ"},
  {id:"BR-010", name:"Narayanganj",  region:"Dhaka South",   regionCode:"DS"}
];

/* ---------- customers ---------- */
var C_NAMES=[
  ["Md. Rafiqul Islam","মোঃ রফিকুল ইসলাম","Rashida Traders (Sole Prop.)"],
  ["Nusrat Jahan","নুসরাত জাহান",null],
  ["Abdul Karim","আব্দুল করিম","Karim Auto Workshop"],
  ["Fatima Begum","ফাতেমা বেগম",null],
  ["S. M. Tanvir Ahmed","এস এম তানভীর আহমেদ","Tanvir Sea Foods Ltd."],
  ["Shirin Akter","শিরিন আক্তার",null],
  ["Jahangir Alam","জাহাঙ্গীর আলম","Alam Agro Farms"],
  ["Rownak Jahan Khan","রওনক জাহান খান",null],
  ["Md. Shahidul Islam","মোঃ শহিদুল ইসলাম","Shahidul Electro House"],
  ["Salma Khatun","সালমা খাতুন",null],
  ["A. K. M. Asaduzzaman","এ কে এম আসাদুজ্জামান","Asad Garments Ltd."],
  ["Rehana Parvin","রেহানা পারভীন",null],
  ["Kamrul Hasan","কামরুল হাসান","Hasan Fish Feed & Co."],
  ["Mizanur Rahman","মিজানুর রহমান",null],
  ["Farhana Yasmin","ফারহানা ইয়াসমিন","Yasmin Boutique"],
  ["Habibur Rahman","হাবিবুর রহমান","Habib Traders (Partnership)"]
];
var CITIES=["Dhaka","Dhaka","Dhaka","Narayanganj","Chattogram","Sylhet","Bogura","Khulna","Dhaka","Rajshahi","Gazipur","Tangail","Cox's Bazar","Mymensingh","Dhaka","Jessore"];
var SEGMENTS=["Salaried","Self-Employed","SME Owner","Salaried","Corporate SME","Housewife","Agri","Salaried","Retail Trade","Salaried","Corporate SME","Salaried","SME Owner","Salaried","Micro Retail","Partnership"];
var CUSTOMERS = C_NAMES.map(function(cn,i){
  var female = /Jahan|Begum|Akter|Khatun|Parvin|Yasmin|Khan/.test(cn[0]) && !/Khan$/.test("x") && /Jahan|Begum|Akter|Khatun|Parvin|Yasmin/.test(cn[0]);
  var kyc = R()>.15 ? "Verified" : (R()>.5 ? "Pending":"Refresh Due");
  return {
    cif:"CIF-"+(100871+i),
    en:cn[0], bn:cn[1], firm:cn[2],
    female:female,
    nid:"*********"+String(1000+ri(0,8999)).slice(-3)+"·"+(R()>.5?"masked":"AES"),
    mobile:"+880 1"+pick([7,8,9])+ri(10000000,99999999),
    city:CITIES[i], seg:SEGMENTS[i],
    branch:BRANCHES[i%BRANCHES.length],
    kyc:kyc, cibScore:ri(620,830), cibGrade:"", risk:pick(["Low","Low","Low","Medium","Medium","High"]),
    since:"20"+ri(12,24), relLoans:ri(0,3),
    photo:""
  };
});
CUSTOMERS.forEach(function(c){
  c.cibGrade = c.cibScore>=780?"AAA":c.cibScore>=730?"AA":c.cibScore>=680?"A":c.cibScore>=630?"BBB":"BB";
});

/* ---------- loan accounts ---------- */
var OFFICERS=["R. Islam (LO)","F. Akter (LO)","K. Chowdhury (LO)","S. Mia (LO)","T. Rahman (CA)"];
var LOANS=[]; var LSTATGES=[0,0,0,1,2,3,4,5,6,0,1,3,2,0];
for(var li=0; li<26; li++){
  var st=LSTATGES[li%LSTATGES.length];
  var dpd= st===0?0 : st===1?ri(2,28): st===2?ri(33,58): st===3?ri(63,88): st===4?ri(95,175): st===5?ri(190,350): ri(370,640);
  var prod=PRODUCTS[li%PRODUCTS.length];
  var cust=CUSTOMERS[li%CUSTOMERS.length];
  var principal= pick([400000,800000,1500000,2500000,3500000,6000000,12000000,25000000]);
  var outstanding=Math.round(principal*pick([.2,.35,.5,.62,.75,.88]));
  var emi=Math.round(principal/ri(24,60)*1.25);
  LOANS.push({
    id:"LN-"+(40118+li*7),
    cust:cust, product:prod, principal:principal, outstanding:outstanding,
    dpd:dpd, stage:st, stageKey:window.LMS_BRPD[st].k,
    provPct:window.LMS_BRPD[st].prov,
    provAmt:Math.round(outstanding*window.LMS_BRPD[st].prov/100),
    rate:prod.rate, emi:emi, overdue: dpd>0? Math.round(emi*Math.min(dpd/30,6)) : 0,
    branch:cust.branch, officer:OFFICERS[li%OFFICERS.length],
    disbursed:"202"+ri(2,5)+"-"+String(ri(1,12)).padStart(2,"0")+"-"+String(ri(1,28)).padStart(2,"0"),
    nextDue: pick(["2026-10-05","2026-10-10","2026-10-15","2026-10-20","2026-10-25"]),
    rail: pick(["CBS A/C","BEFTN","bKash","Nagad","Cheque"]),
    top:false
  });
}
LOANS[8].top=true; // a flagship large account for the demo

/* ---------- applications pipeline ---------- */
var APP_STAGES=["Received","Screening","CIB Check","Credit Scoring","CPV","BOCC Review","Approval","Sanction","Disbursement Ready"];
var APPLICATIONS=[];
for(var ai=0; ai<18; ai++){
  var stg=Math.min(APP_STAGES.length-1, Math.floor(R()*APP_STAGES.length));
  var prod=PRODUCTS[(ai+2)%PRODUCTS.length];
  var cust=CUSTOMERS[(ai+3)%CUSTOMERS.length];
  var amt=pick([300000,600000,1200000,2500000,4500000,9000000]);
  APPLICATIONS.push({
    id:"APP-"+(7210+ai*3),
    cust:cust, product:prod, amount:amt,
    stage:APP_STAGES[stg], stageIdx:stg,
    dbr:ri(28,62), score:ri(590,820), tat:ri(0,9),
    branch:cust.branch, officer:OFFICERS[ai%OFFICERS.length],
    docs:ri(2,8), docsDone:ri(2,8), slaHrs:ri(2,40),
    status: stg===APP_STAGES.length-1?"Ready":(R()>.75?"SLA Risk":"On Track")
  });
}
APPLICATIONS.sort(function(a,b){ return a.stageIdx-b.stageIdx || b.amount-a.amount; });

/* ---------- approvals inbox ---------- */
var APPROVALS = APPLICATIONS.slice(4,10).map(function(a,i){
  var L=["L1 · Branch Credit Head","L2 · Branch Manager","L3 · Regional Manager","L4 · Head of Credit","L5 · Credit Committee"][i%5];
  return { app:a, level:L, waitingHrs:ri(1,52), slaHrs:L.indexOf("L1")===0?24:48, by:a.officer };
});

/* ---------- collections ---------- */
var COLL_ACTIONS=["Call — no response","Call — promised","Field visit done","SMS reminder sent","Legal notice drafted","PTP kept","PTP broken","Right-party contact"];
var COLLECTIONS = LOANS.filter(function(l){ return l.dpd>0; }).map(function(l,i){
  return {
    loan:l, bucket: l.dpd<=30?"1–30":l.dpd<=60?"31–60":l.dpd<=90?"61–90":"90+",
    lastAction: COLL_ACTIONS[i%COLL_ACTIONS.length],
    ptp: /promise|PTP/.test(COLL_ACTIONS[i%COLL_ACTIONS.length]) ? "৳"+(ri(2,18))+"K · Oct "+ri(2,9) : null,
    propensity: ri(15,92), agency: l.dpd>180? pick(["RecoveryBD Ltd.","Metro Collections"]):null,
    officer: OFFICERS[i%OFFICERS.length]
  };
});

/* ---------- alerts ---------- */
var ALERTS=[
  {sev:"err", ico:"🏷", t:"SMA migration spike — Gulshan branch", d:"4 accounts migrated STD-2 → SMA in 24h (DPD 60+). Immediate collection push recommended.", ago:"12m"},
  {sev:"warn",ico:"⏱", t:"Approval SLA breach risk", d:"APP-7239 waiting 46h at L3 · Regional Manager (SLA 48h). Escalation in 2h.", ago:"38m"},
  {sev:"warn",ico:"🛡", t:"CIB gateway latency", d:"Bangladesh Bank CIB API p95 = 168s (threshold 120s). 3 inquiries queued.", ago:"1h"},
  {sev:"err", ico:"🔒", t:"Collateral insurance expired", d:"LN-40143 (Tanvir Sea Foods) — fire policy expired 22 Sep. Renewal notice issued.", ago:"3h"},
  {sev:"info",ico:"🧾", t:"CL-2 provisioning file staged", d:"September provisioning return generated · awaiting Compliance sign-off.", ago:"5h"},
  {sev:"info",ico:"🪪", t:"e-KYC batch verified", d:"38 of 40 NIDW verifications passed this morning (avg 3.2s). 2 flagged for manual review.", ago:"6h"}
];

/* ---------- record index for Tell-ME ---------- */
var RECORDS=[];
LOANS.slice(0,12).forEach(function(l){
  RECORDS.push([l.id,"Loan · "+l.cust.en, l.stageKey+" · "+LMSF.tk(l.outstanding)+" outstanding","#/loan/"+l.id]);
});
CUSTOMERS.slice(0,12).forEach(function(c){
  RECORDS.push([c.cif,"Customer · "+c.en, (c.firm? c.firm+" · ":"")+c.seg+" · "+c.city,"#/cust/"+c.cif]);
});
APPLICATIONS.slice(0,8).forEach(function(a){
  RECORDS.push([a.id,"Application · "+a.cust.en, a.stage+" · "+LMSF.tk(a.amount),"#/pipeline"]);
});

window.LMS_D = {
  products:PRODUCTS, branches:BRANCHES, customers:CUSTOMERS, loans:LOANS,
  applications:APPLICATIONS, approvals:APPROVALS, collections:COLLECTIONS,
  alerts:ALERTS, records:RECORDS, stages:APP_STAGES,
  cust:function(cif){ for(var i=0;i<this.customers.length;i++) if(this.customers[i].cif===cif) return this.customers[i]; return null; },
  loan:function(id){ for(var i=0;i<this.loans.length;i++) if(this.loans[i].id===id) return this.loans[i]; return null; },
  kpis:{
    portfolio:5200, portfolioCr:function(){return LMSF.tk(5200000000);},
    nplGross:4.6, nplNet:2.1, par30:6.2, appsMonth:342, tatAvg:1.9, approvalRate:71,
    disbMonth:412, collEff:91.4, coverage:68.5, capRatio:13.2
  }
};
})();
