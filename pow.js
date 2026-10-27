(function(){
var KEY='emb7_pow_log_v1', STOP='emb7_pow_stop', mem=[];
var STATUS=['For screening','On-going','Approved'];
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function load(){try{var r=localStorage.getItem(KEY);return r?JSON.parse(r):mem;}catch(e){return mem;}}
var warned=false;
function save(a){mem=a;try{localStorage.setItem(KEY,JSON.stringify(a));return true;}catch(e){warned=true;return false;}}
function ymd(d){var z=function(n){return (n<10?'0':'')+n;};return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());}
function today(){return ymd(new Date());}
function docFor(cat){return cat==='C'?'CNC (Category C)':cat==='D'?'CNC (optional)':(cat==='A-EIS'||cat==='B-EIS'||cat==='B-IEE')?'ECC':'';}
function getStop(){try{return localStorage.getItem(STOP)||'';}catch(e){return '';}}
function setStop(v){try{localStorage.setItem(STOP,v);}catch(e){}}
function count(){var b=document.getElementById('powBtn');if(b)b.textContent='POW Log ('+load().filter(function(e){return e.date===today();}).length+')';}

window.powRenderForm=function(){
  var slot=document.getElementById('powLogSlot');if(!slot||typeof currentAnswer==='undefined'||!currentAnswer||!activeItem)return;
  slot.innerHTML='<div class="pow-form"><div class="pow-h">Log this applicant (POW)</div>'+
  '<div class="pow-grid">'+
  '<label>Project name *<input id="pwProj" placeholder="Name of the project itself, e.g. Sunrise Auto Care"></label>'+
  '<label>Proponent name *<input id="pwProp"></label>'+
  '<label>Contact number<input id="pwContact" inputmode="tel"></label>'+
  '<label>Type of business<input id="pwBiz" placeholder="e.g. auto repair shop, hog raising"></label>'+
  '<label>Latitude<input id="pwLat" inputmode="decimal" placeholder="e.g. 10.3157"></label>'+
  '<label>Longitude<input id="pwLng" inputmode="decimal" placeholder="e.g. 123.8854"></label>'+
  '<label>Notes (optional)<input id="pwNotes"></label>'+
  '</div><div class="pow-row"><button class="copy-btn" onclick="powSave()">Save to log</button><button class="pow-link" onclick="powOpen()">Open today\'s log</button><span class="copy-status" id="pwMsg"></span></div></div>';
};
window.powSave=function(){
  var g=function(i){return (document.getElementById(i)||{value:''}).value.trim();};
  var msg=document.getElementById('pwMsg');
  if(!g('pwProp')||!g('pwProj')){msg.textContent='Project name and proponent name are required.';msg.style.color='#b45309';return;}
  var lat=g('pwLat'),lng=g('pwLng');
  if((lat&&isNaN(parseFloat(lat)))||(lng&&isNaN(parseFloat(lng)))){msg.textContent='Latitude and longitude must be numbers (decimal degrees).';msg.style.color='#b45309';return;}
  var a=load(),d=today(),n=a.filter(function(e){return e.date===d;}).length+1;
  var ref='POW-'+d.replace(/-/g,'')+'-'+('00'+n).slice(-3);
  a.push({ref:ref,date:d,proj:g('pwProj'),prop:g('pwProp'),contact:g('pwContact'),biz:g('pwBiz'),lat:lat,lng:lng,iis:'',notes:g('pwNotes'),
    thr:(activeItem.code||'')+' '+(activeItem.name||'')+' ('+(currentAnswer.cat||'')+')',cat:currentAnswer.cat,doc:docFor(currentAnswer.cat),status:'For screening'});
  var ok=save(a);count();
  msg.style.color='';msg.textContent=ok?('Saved as '+ref):('Saved for this session only ('+ref+'). Export before closing.');
  ['pwProp','pwContact','pwBiz','pwLat','pwLng','pwNotes'].forEach(function(i){document.getElementById(i).value='';});
};
function css(){if(document.getElementById('powCss'))return;var s=document.createElement('style');s.id='powCss';s.textContent=
'.pow-form{margin-top:18px;padding:16px 18px;border:1.5px dashed var(--panel-border,#cfe0d6);border-radius:14px;background:rgba(11,107,58,.04)}.pow-h{font-weight:700;margin-bottom:10px}.pow-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}@media(max-width:900px){.pow-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.pow-grid{grid-template-columns:1fr}}.pow-grid label{display:flex;flex-direction:column;font-size:12px;gap:4px;font-weight:600}.pow-grid input,.pow-tbl input,.pow-tbl select,.pow-bar input{font:inherit;font-size:13px;padding:7px 8px;border:1px solid #c9d6ce;border-radius:8px;background:#fff;color:#1c2b25;width:100%}.pow-row{display:flex;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap}.pow-link{background:none;border:0;color:#0b6b3a;font-weight:700;text-decoration:underline;cursor:pointer;font-size:13.5px}#powBtn{margin-left:14px;background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.4);border-radius:999px;padding:3px 12px;cursor:pointer;font:inherit;font-size:12px}'+
'#powModal{position:fixed;inset:0;background:rgba(10,30,20,.55);z-index:999;display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px}#powModal.show{display:flex}.pow-box{background:#fff;color:#1c2b25;border-radius:16px;max-width:1280px;width:100%;padding:20px 22px}.pow-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.pow-top h2{font-size:20px}.pow-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0}.pow-bar input{width:auto}.pow-sum{display:flex;gap:10px;flex-wrap:wrap;margin:6px 0 12px}.pow-sum div{background:#e6f4ec;border-radius:10px;padding:8px 14px;font-size:13px}.pow-sum b{font-size:20px;display:block;color:#0b6b3a}.pow-tbl-w{overflow:auto;max-height:55vh;border:1px solid #dbe6df;border-radius:10px}.pow-tbl{border-collapse:collapse;width:100%;font-size:12.5px;min-width:1200px}.pow-tbl th{position:sticky;top:0;background:#0b6b3a;color:#fff;text-align:left;padding:8px;white-space:nowrap}.pow-tbl td{padding:6px 8px;border-top:1px solid #e3ece6;vertical-align:top}.pow-tbl td input,.pow-tbl td select{min-width:110px}.pow-note{font-size:12px;color:#566860;margin-top:10px;line-height:1.5}.pow-btn{background:#0b6b3a;color:#fff;border:0;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:13px}.pow-btn.alt{background:#16335e}.pow-btn.x{background:#eee;color:#333}.pow-del{background:none;border:0;color:#9b1c1c;cursor:pointer;font-size:16px}@media print{body>*:not(#powModal){display:none!important}#powModal{position:static;background:none;display:block}.pow-bar,.pow-top button,.pow-del{display:none!important}.pow-tbl-w{max-height:none;overflow:visible}}';
document.head.appendChild(s);}
function modal(){var m=document.getElementById('powModal');if(!m){m=document.createElement('div');m.id='powModal';document.body.appendChild(m);}return m;}
var curDate=null;
function csv(rows){var h=['Ref','Date','Project name','Proponent name','Contact number','Project type (Annex A)','Type of business','Latitude','Longitude','Status','IIS Number','Notes'];
  var out=[h].concat(rows.map(function(e){return [e.ref,e.date,e.proj,e.prop,e.contact,e.thr,e.biz,e.lat,e.lng,e.status,e.iis,e.notes];}));
  return '\ufeff'+out.map(function(r){return r.map(function(c){c=String(c==null?'':c);return /[",\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c;}).join(',');}).join('\r\n');}
function dl(name,text){var b=new Blob([text],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}
function crc32(b){var t=crc32.t;if(!t){t=crc32.t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}}var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=t[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zip(files){var enc=new TextEncoder(),parts=[],cen=[],off=0;
  function u16(v){return [v&255,(v>>8)&255];}function u32(v){return [v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255];}
  files.forEach(function(f){var nm=enc.encode(f.n),d=enc.encode(f.d),cr=crc32(d);
    var lh=[].concat(u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(cr),u32(d.length),u32(d.length),u16(nm.length),u16(0));
    parts.push(new Uint8Array(lh),nm,d);
    cen.push([].concat(u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(cr),u32(d.length),u32(d.length),u16(nm.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off)),nm);
    off+=lh.length+nm.length+d.length;});
  var cs=0,cp=[];cen.forEach(function(c){var u=c instanceof Uint8Array?c:new Uint8Array(c);cp.push(u);cs+=u.length;});
  var end=new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(cs),u32(off),u16(0)));
  return new Blob(parts.concat(cp,[end]),{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});}
function xe(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');}
function colL(i){return String.fromCharCode(65+i);}
function xlsx(rows){var h=['Ref','Date','Project name','Proponent name','Contact number','Project type (Annex A)','Type of business','Latitude','Longitude','Status','IIS Number','Notes','Recorded by'];
  var W=[20,12,28,24,16,44,22,11,11,14,16,30,22];
  function sc(r,c,v,st){return '<c r="'+colL(c)+r+'" t="inlineStr"'+(st?' s="'+st+'"':'')+'><is><t xml:space="preserve">'+xe(v)+'</t></is></c>';}
  function nc(r,c,v,st){return '<c r="'+colL(c)+r+'"'+(st?' s="'+st+'"':'')+'><v>'+v+'</v></c>';}
  var x='<row r="1">'+h.map(function(t,i){return sc(1,i,t,1);}).join('')+'</row>';
  rows.forEach(function(e,k){var r=k+2,m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e.date||''),c='';
    c+=sc(r,0,e.ref);
    c+=m?nc(r,1,Math.round((Date.UTC(+m[1],+m[2]-1,+m[3])-Date.UTC(1899,11,30))/86400000),2):sc(r,1,e.date);
    c+=sc(r,2,e.proj)+sc(r,3,e.prop)+sc(r,4,e.contact,3)+sc(r,5,e.thr)+sc(r,6,e.biz);
    c+=(e.lat!==''&&e.lat!=null&&!isNaN(+e.lat))?nc(r,7,+e.lat):sc(r,7,e.lat);
    c+=(e.lng!==''&&e.lng!=null&&!isNaN(+e.lng))?nc(r,8,+e.lng):sc(r,8,e.lng);
    c+=sc(r,9,e.status)+sc(r,10,e.iis,3)+sc(r,11,e.notes)+sc(r,12,e.by||'');
    x+='<row r="'+r+'">'+c+'</row>';});
  var sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+W.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>';}).join('')+'</cols><sheetData>'+x+'</sheetData></worksheet>';
  var styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="mm/dd/yyyy"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B6B3A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>';
  var ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
  var rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  var wb='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="POW Log" sheetId="1" r:id="rId1"/></sheets></workbook>';
  var wrels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  return zip([{n:'[Content_Types].xml',d:ct},{n:'_rels/.rels',d:rels},{n:'xl/workbook.xml',d:wb},{n:'xl/_rels/workbook.xml.rels',d:wrels},{n:'xl/styles.xml',d:styles},{n:'xl/worksheets/sheet1.xml',d:sheet}]);}
function dlb(name,b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}
window.powExport=function(all){var a=load();var rows=all?a:a.filter(function(e){return e.date===curDate;});dlb('POW-Log-'+(all?'ALL':curDate)+'.xlsx',xlsx(rows));};
window.powExportCsv=function(all){var a=load();var rows=all?a:a.filter(function(e){return e.date===curDate;});dl('POW-Log-'+(all?'ALL':curDate)+'.csv',csv(rows));};
window.powClose=function(){modal().classList.remove('show');};
window.powSet=function(ref,f,v){var a=load();a.forEach(function(e){if(e.ref===ref)e[f]=v;});save(a);if(f==='status')powOpen(curDate,true);};
window.powDel=function(ref){if(!confirm('Delete '+ref+'?'))return;save(load().filter(function(e){return e.ref!==ref;}));count();powOpen(curDate,true);};
window.powOpen=function(d,keep){
  css();curDate=(typeof d==='string'&&d)?d:(curDate||today());var m=modal(),a=load(),rows=a.filter(function(e){return e.date===curDate;});
  var by={};rows.forEach(function(e){by[e.status]=(by[e.status]||0)+1;});
  var sum='<div><b>'+rows.length+'</b>applicants</div>'+STATUS.map(function(s){return '<div><b>'+(by[s]||0)+'</b>'+s+'</div>';}).join('');
  var body=rows.map(function(e){return '<tr><td>'+esc(e.ref)+'</td><td>'+esc(e.date)+'</td><td>'+esc(e.proj)+'</td><td>'+esc(e.prop)+'</td><td>'+esc(e.contact)+'</td><td>'+esc(e.thr)+'</td><td>'+esc(e.biz)+'</td><td>'+esc(e.lat)+(e.lat||e.lng?', ':'')+esc(e.lng)+'</td>'+
   '<td><select onchange="powSet(\''+e.ref+'\',\'status\',this.value)">'+STATUS.map(function(s){return '<option'+(s===e.status?' selected':'')+'>'+s+'</option>';}).join('')+'</select></td>'+
   '<td><input value="'+esc(e.iis)+'" placeholder="IIS No." onchange="powSet(\''+e.ref+'\',\'iis\',this.value)"></td><td>'+esc(e.notes)+'</td><td><button class="pow-del" onclick="powDel(\''+e.ref+'\')" title="Delete">&times;</button></td></tr>';}).join('')||'<tr><td colspan="12" style="padding:20px;color:#566860">No applicants logged for this date.</td></tr>';
  m.innerHTML='<div class="pow-box"><div class="pow-top"><h2>Permitting on Wheels: applicant log</h2><button class="pow-btn x" onclick="powClose()">Close</button></div>'+
  '<div class="pow-bar"><label>Date <input type="date" value="'+curDate+'" onchange="powOpen(this.value)"></label><button class="pow-btn" onclick="powExport(false)">Export this day (Excel)</button><button class="pow-btn alt" onclick="powExport(true)">Export all days</button><button class="pow-btn x" onclick="window.print()">Print</button></div>'+
  '<div class="pow-sum">'+sum+'</div><div class="pow-tbl-w"><table class="pow-tbl"><thead><tr><th>Ref</th><th>Date</th><th>Project name</th><th>Proponent name</th><th>Contact</th><th>Project type (Annex A)</th><th>Type of business</th><th>Lat, Long</th><th>Status</th><th>IIS No.</th><th>Notes</th><th></th></tr></thead><tbody>'+body+'</tbody></table></div>'+
  '<div class="pow-note">Saved on this device and browser only. At the end of the day, click Export and send the file to the EIA Section. Fill in the IIS Number once the application is forwarded. Do not clear browser data before exporting.'+(warned?' <strong style="color:#9b1c1c">Browser storage is blocked here, so entries are kept only until this page is closed.</strong>':'')+'</div></div>';
  m.classList.add('show');};
window.__pow={xlsx:xlsx,dlb:dlb,css:css,docFor:docFor};
document.addEventListener('DOMContentLoaded',function(){css();count();});
if(document.readyState!=='loading'){css();count();}
})();
