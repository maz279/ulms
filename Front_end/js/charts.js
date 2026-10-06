/* ============================================================
   ULMS charts — zero-dependency SVG builders (Fluent-flat style:
   no gradients, direct labels, dashed gridlines, token palette
   read live from CSS so dark mode restyles charts too).
   ============================================================ */
(function(){
"use strict";
function palette(){
  var cs = (typeof getComputedStyle==="function") ? getComputedStyle(document.documentElement) : null;
  var out=[]; for(var i=1;i<=8;i++){ out.push(cs ? (cs.getPropertyValue("--chart-"+i).trim()||"#3F51B5") : "#3F51B5"); }
  return out;
}
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function fmt(n){ return (Math.round(n*100)/100).toLocaleString("en-US"); }

var C = {
  /* sparkline — deterministic small trend, optional color */
  spark:function(vals,w,h,color){
    w=w||96; h=h||30; color=color||null;
    if(!vals||vals.length<2) return "";
    var P=palette(); color = color||P[0];
    var mx=Math.max.apply(null,vals), mn=Math.min.apply(null,vals), rg=(mx-mn)||1;
    var pts=vals.map(function(v,i){
      var x=2+(i*(w-4)/(vals.length-1)), y=h-3-((v-mn)/rg)*(h-7);
      return x.toFixed(1)+","+y.toFixed(1);
    }).join(" ");
    var last=pts.split(" ").pop().split(",");
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true">'+
      '<polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="1.6" stroke-linejoin="round"/>'+
      '<circle cx="'+last[0]+'" cy="'+last[1]+'" r="2.4" fill="'+color+'"/></svg>';
  },

  /* multi-line chart: labels[] + series [{name,data,color?}] */
  line:function(labels,series,w,h){
    w=w||640; h=h||220; var P=palette();
    var padL=44,padB=24,padT=10,padR=8, iw=w-padL-padR, ih=h-padT-padB;
    var all=[]; series.forEach(function(s){ all=all.concat(s.data); });
    var mx=Math.max.apply(null,all)*1.08||1, mn=0;
    var x=function(i){ return padL+(i*iw/Math.max(labels.length-1,1)); };
    var y=function(v){ return padT+ih-(v-mn)/(mx-mn)*ih; };
    var g="";
    [0,.25,.5,.75,1].forEach(function(t){
      var yy=y(mx*t).toFixed(1);
      g+='<line x1="'+padL+'" y1="'+yy+'" x2="'+(w-padR)+'" y2="'+yy+'" stroke="var(--stroke)" stroke-dasharray="3 4"/>';
      g+='<text x="'+(padL-6)+'" y="'+(Number(yy)+3)+'" text-anchor="end" font-size="9.5" fill="var(--ink-500)">'+fmt(mx*t)+'</text>';
    });
    labels.forEach(function(l,i){
      if(labels.length>14 && i%2) return;
      g+='<text x="'+x(i)+'" y="'+(h-6)+'" text-anchor="middle" font-size="9.5" fill="var(--ink-500)">'+esc(l)+'</text>';
    });
    series.forEach(function(s,si){
      var col=s.color||P[si%8];
      var pts=s.data.map(function(v,i){ return x(i).toFixed(1)+","+y(v).toFixed(1); }).join(" ");
      g+='<polyline points="'+pts+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
      s.data.forEach(function(v,i){
        g+='<circle cx="'+x(i).toFixed(1)+'" cy="'+y(v).toFixed(1)+'" r="2.2" fill="'+col+'"><title>'+esc(s.name)+" · "+esc(labels[i]||"")+" · "+fmt(v)+'</title></circle>';
      });
    });
    var leg='<div class="legend" style="justify-content:flex-end;margin-bottom:6px">'+series.map(function(s,si){
      var col=s.color||P[si%8];
      return '<span><i class="sw" style="background:'+col+'"></i>'+esc(s.name)+'</span>';
    }).join("")+'</div>';
    return leg+'<svg width="100%" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="line chart">'+g+'</svg>';
  },

  /* vertical bars: [{label,value,color?,hl?,cap?}] with direct value captions */
  vbars:function(rows,w,h){
    w=w||640; h=h||200; var P=palette();
    var mx=Math.max.apply(null,rows.map(function(r){return r.value;}))||1;
    var padT=16,padB=26,padL=8, iw=(w-padL*2)/rows.length, ih=h-padT-padB;
    var g="";
    rows.forEach(function(r,i){
      var bh=Math.max(2,(r.value/mx)*ih), bw=Math.min(46,iw*.6);
      var bx=padL+i*iw+(iw-bw)/2, by=padT+ih-bh, col=r.color||P[0];
      g+='<rect x="'+bx.toFixed(1)+'" y="'+by.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+bh.toFixed(1)+'" rx="3" fill="'+col+'"'+
        (r.hl?' stroke="var(--ink-700)" stroke-width="1.5"':'')+'><title>'+esc(r.label)+" · "+fmt(r.value)+'</title></rect>';
      g+='<text x="'+(bx+bw/2).toFixed(1)+'" y="'+(by-4).toFixed(1)+'" text-anchor="middle" font-size="9.5" font-weight="600" fill="var(--ink-700)">'+esc(r.cap||fmt(r.value))+'</text>';
      g+='<text x="'+(bx+bw/2).toFixed(1)+'" y="'+(h-8)+'" text-anchor="middle" font-size="9.5" fill="var(--ink-500)">'+esc(r.label)+'</text>';
    });
    g+='<line x1="'+padL+'" y1="'+(padT+ih)+'" x2="'+(w-padL)+'" y2="'+(padT+ih)+'" stroke="var(--stroke-strong)"/>';
    return '<svg width="100%" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="bar chart">'+g+'</svg>';
  },

  /* horizontal HTML bars (list style): [{label,value,color?,total?}] */
  hbars:function(rows,opts){
    opts=opts||{}; var P=palette(); var mx=opts.max||Math.max.apply(null,rows.map(function(r){return r.value;}))||1;
    var fmtV=opts.fmt||function(v){return fmt(v);};
    return rows.map(function(r,i){
      var pct=Math.round(r.value/mx*100);
      return '<div class="hbar-row"><span class="trunc" title="'+esc(r.label)+'">'+esc(r.label)+'</span>'+
        '<span class="track"><span class="fill" style="width:'+pct+'%;background:'+(r.color||P[i%8])+'"></span></span>'+
        '<span class="val">'+fmtV(r.value)+(r.sub? ' <span class="muted">'+esc(r.sub)+'</span>':'')+'</span></div>';
    }).join("");
  },

  /* donut with center captions: [{label,value,color?}], size px */
  donut:function(items,size,centerTop,centerBot){
    size=size||150; var P=palette();
    var tot=items.reduce(function(a,b){return a+b.value;},0)||1;
    var r=size/2-11, cx=size/2, cy=size/2, circ=2*Math.PI*r, off=0, segs="";
    items.forEach(function(it,i){
      var frac=it.value/tot, len=frac*circ;
      segs+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+(it.color||P[i%8])+'" stroke-width="16"'+
        ' stroke-dasharray="'+len.toFixed(2)+' '+(circ-len).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'"'+
        ' transform="rotate(-90 '+cx+' '+cy+')"><title>'+esc(it.label)+" · "+fmt(it.value)+" ("+Math.round(frac*100)+"%)"+'</title></circle>';
      off+=len;
    });
    var txt="";
    if(centerTop!=null) txt+='<text x="'+cx+'" y="'+(cy-3)+'" text-anchor="middle" font-size="17" font-weight="700" fill="var(--ink-900)">'+esc(centerTop)+'</text>';
    if(centerBot!=null) txt+='<text x="'+cx+'" y="'+(cy+14)+'" text-anchor="middle" font-size="9.5" fill="var(--ink-500)">'+esc(centerBot)+'</text>';
    var leg='<div style="display:flex;flex-direction:column;gap:4px;min-width:130px">'+items.map(function(it,i){
      return '<span class="small" style="display:flex;align-items:center;gap:6px"><i class="sw" style="background:'+(it.color||P[i%8])+'"></i>'+
        esc(it.label)+' <b class="num" style="margin-left:auto;color:var(--ink-700)">'+fmt(it.value)+'</b></span>';
    }).join("")+'</div>';
    return '<div class="flex" style="justify-content:center;gap:var(--s-5);flex-wrap:wrap">'+
      '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" role="img" aria-label="donut chart">'+segs+txt+'</svg>'+leg+'</div>';
  },

  /* semicircle gauge, threshold colored */
  gauge:function(pct,label,warnAt,errAt){
    warnAt=(warnAt==null)?55:warnAt; errAt=(errAt==null)?40:errAt;
    var w=170,h=95,cx=w/2,cy=h-8,r=64;
    var col = pct>=warnAt ? "var(--ok-bold,#107C10)" : (pct>=errAt ? "var(--warn-bold,#F7630C)" : "var(--err-bold,#C50F1F)");
    var a=Math.PI*(1-Math.max(0,Math.min(100,pct))/100);
    var ex=cx+r*Math.cos(a), ey=cy-r*Math.sin(a);
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="gauge '+pct+' percent">'+
      '<path d="M '+(cx-r)+' '+cy+' A '+r+' '+r+' 0 0 1 '+(cx+r)+' '+cy+'" fill="none" stroke="var(--surface-3)" stroke-width="13" stroke-linecap="round"/>'+
      '<path d="M '+(cx-r)+' '+cy+' A '+r+' '+r+' 0 0 1 '+ex.toFixed(1)+' '+ey.toFixed(1)+'" fill="none" stroke="'+col+'" stroke-width="13" stroke-linecap="round"/>'+
      '<text x="'+cx+'" y="'+(cy-14)+'" text-anchor="middle" font-size="21" font-weight="700" fill="var(--ink-900)">'+Math.round(pct)+'%</text>'+
      '<text x="'+cx+'" y="'+(cy+2)+'" text-anchor="middle" font-size="9.5" fill="var(--ink-500)">'+esc(label||"")+'</text></svg>';
  },

  /* funnel: [{label,value,cap?}] */
  funnel:function(rows){
    var P=palette(); var mx=rows[0]?rows[0].value:1;
    return '<svg width="100%" viewBox="0 0 560 '+(rows.length*44+10)+'" role="img" aria-label="funnel">'+
      rows.map(function(r,i){
        var wv=Math.max(90,(r.value/mx)*430), y=6+i*44, col=P[i%8];
        return '<rect x="8" y="'+y+'" width="'+wv.toFixed(0)+'" height="30" rx="4" fill="'+col+'" opacity="'+(1-i*.11)+'"><title>'+esc(r.label)+' · '+fmt(r.value)+'</title></rect>'+
          '<text x="18" y="'+(y+20)+'" font-size="12" font-weight="600" fill="#fff">'+esc(r.label)+'</text>'+
          '<text x="'+(wv+16).toFixed(0)+'" y="'+(y+20)+'" font-size="12" font-weight="600" fill="var(--ink-700)">'+esc(r.cap||fmt(r.value))+'</text>';
      }).join("")+'</svg>';
  },

  /* classification strip — BRPD 7-stage share bar with counts */
  clsStrip:function(buckets){
    var tot=buckets.reduce(function(a,b){return a+b.value;},0)||1;
    return '<div role="img" aria-label="BRPD classification mix"><div class="flex" style="gap:2px;height:22px;border-radius:5px;overflow:hidden">'+
      buckets.map(function(b){
        if(!b.value) return "";
        return '<i title="'+esc(b.label)+" · "+fmt(b.value)+'" style="flex:'+b.value+';background:'+b.color+'"></i>';
      }).join("")+'</div><div class="legend" style="margin-top:6px">'+
      buckets.map(function(b){ return '<span><i class="sw" style="background:'+b.color+'"></i>'+esc(b.label)+' <b class="num" style="color:var(--ink-700)">'+fmt(b.value)+'</b></span>'; }).join("")+
      '</div></div>';
  },

  /* simple 12-col heatmap grid */
  heatmap:function(rows,cols,valFn){
    var out='<div style="display:grid;grid-template-columns:90px repeat('+cols.length+',1fr);gap:3px;font-size:10px">';
    out+='<div></div>'+cols.map(function(c){ return '<div style="text-align:center;color:var(--ink-500)">'+esc(c)+'</div>'; }).join("");
    rows.forEach(function(r){
      out+='<div class="trunc" style="color:var(--ink-500);line-height:22px">'+esc(r)+'</div>';
      cols.forEach(function(c){
        var v=valFn(r,c); // 0..1
        var a=(0.08+v*0.85).toFixed(2);
        out+='<div title="'+esc(r)+" · "+esc(c)+" · "+Math.round(v*100)+'%" style="height:22px;border-radius:3px;background:rgba(63,81,181,'+a+')"></div>';
      });
    });
    return out+"</div>";
  }
};
window.LMSCharts = C;
})();
