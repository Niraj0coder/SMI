/**
 * Sri Maruthi Industries - enquiry inbox + dashboard (Google Apps Script)
 *
 *  - The website form POSTs here  -> a new row is added to the Sheet + an email alert is sent.
 *  - Open  <WEB_APP_URL>?key=YOUR_SECRET            -> the dashboard
 *  - Open  <WEB_APP_URL>?key=YOUR_SECRET&format=json -> raw JSON of all enquiries
 *
 * Sheet columns: A Received | B Name | C Phone | D Email | E Message | F Page | G Status
 */
var SECRET = 'change-this-secret';              // <- choose your own password
var ALERT_EMAIL = 'senthilbalan.smi@gmail.com';  // new-enquiry alerts go here ('' to turn off)
var STATUSES = ['New', 'Contacted', 'Quoted', 'Closed'];
var TZ = 'Asia/Kolkata';

function sheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }
function clean_(v, n) { return String(v == null ? '' : v).slice(0, n); }

/* ---------- receives the website form ---------- */
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  sheet_().appendRow([new Date(), clean_(d.name, 120), clean_(d.phone, 40), clean_(d.email, 160), clean_(d.message, 3000), clean_(d.page, 200), 'New']);
  if (ALERT_EMAIL) {
    MailApp.sendEmail({
      to: ALERT_EMAIL,
      subject: 'New website enquiry from ' + clean_(d.name, 60),
      body: 'Name: ' + clean_(d.name, 120) + '\nPhone: ' + clean_(d.phone, 40) + '\nEmail: ' + clean_(d.email, 160) + '\n\n' + clean_(d.message, 3000) +
            '\n\nOpen dashboard: ' + ScriptApp.getService().getUrl() + '?key=' + SECRET
    });
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- dashboard + JSON ---------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.key !== SECRET) return ContentService.createTextOutput('Unauthorized');
  if (p.format === 'json') return ContentService.createTextOutput(JSON.stringify(getEnquiries(p.key), null, 2)).setMimeType(ContentService.MimeType.JSON);
  var html = DASHBOARD_HTML.replace('__KEY__', JSON.stringify(p.key).replace(/</g, '\\u003c'));
  return HtmlService.createHtmlOutput(html).setTitle('SMI Enquiries').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* called from the dashboard (google.script.run) - every call re-checks the secret */
function getEnquiries(key) {
  if (key !== SECRET) throw new Error('Unauthorized');
  var sh = sheet_();
  if (!String(sh.getRange(1, 7).getValue())) sh.getRange(1, 7).setValue('Status');
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, 7).getValues(), out = [];
  for (var i = 0; i < vals.length; i++) {
    var r = vals[i];
    if (!r[1] && !r[2] && !r[3] && !r[4]) continue;
    out.push({
      row: i + 2,
      received: r[0] instanceof Date ? Utilities.formatDate(r[0], TZ, "yyyy-MM-dd'T'HH:mm:ssXXX") : String(r[0]),
      name: String(r[1]), phone: String(r[2]), email: String(r[3]), message: String(r[4]), page: String(r[5]),
      status: STATUSES.indexOf(String(r[6])) >= 0 ? String(r[6]) : 'New'
    });
  }
  return out.reverse();                          // newest first
}

function setStatus(key, row, status) {
  if (key !== SECRET) throw new Error('Unauthorized');
  row = Number(row);
  if (STATUSES.indexOf(status) < 0 || !(row >= 2) || row > sheet_().getLastRow()) throw new Error('Bad request');
  sheet_().getRange(row, 7).setValue(status);
  return true;
}

var DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><base target="_blank">
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Roboto,Arial,sans-serif;background:#f4f5f8;color:#1f2430}
header{background:linear-gradient(135deg,#0a2347,#123a6e 60%,#2f7fd0);color:#fff;padding:18px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;box-shadow:0 4px 18px rgba(8,30,62,.35)}
.logo{height:44px;padding:0 12px;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center}.mk{position:relative;display:inline-block;font:900 25px/1 "Arial Black",Poppins,Arial,sans-serif;color:#123a6e;letter-spacing:-.02em;text-shadow:1px 1px 0 rgba(0,0,0,.25);padding-top:5px}.mk b{display:inline-block;width:.235em;height:.7em;background:#123a6e;margin-left:.05em;position:relative;vertical-align:baseline;box-shadow:1px 1px 0 rgba(0,0,0,.25)}.mk b:before{content:"";position:absolute;left:0;right:0;top:-.17em;height:.1em;border-radius:50% 50% 10% 10%/100% 100% 30% 30%;background:#e4600f}
h1{margin:0;font-size:20px;font-weight:600}
header small{opacity:.85;display:block;font-size:12px;margin-top:2px}
.sp{flex:1}
button{font:inherit;cursor:pointer}
.btn{background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.45);padding:8px 14px;border-radius:8px;font-size:13px}
.btn:hover{background:#fff;color:#123a6e}
main{max-width:1250px;margin:0 auto;padding:22px 18px 60px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:20px}
.stat{background:#fff;border-radius:12px;padding:16px 18px;box-shadow:0 2px 10px rgba(20,20,40,.07);border-left:5px solid #123a6e}
.stat b{display:block;font-size:30px;line-height:1.1}
.stat span{font-size:12px;color:#6a7080;letter-spacing:.5px;text-transform:uppercase}
.bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.bar input{flex:1;min-width:220px;padding:11px 14px;border:1px solid #d9dce5;border-radius:10px;font:inherit;background:#fff}
.chip{border:1px solid #d9dce5;background:#fff;border-radius:20px;padding:7px 14px;font-size:13px;color:#4a5060}
.chip.on{background:#123a6e;border-color:#123a6e;color:#fff}
.card{background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(20,20,40,.07);overflow:hidden}
table{width:100%;border-collapse:collapse}
th{background:#fafbfc;text-align:left;font-size:12px;letter-spacing:.6px;text-transform:uppercase;color:#6a7080;padding:12px 14px;border-bottom:1px solid #e8eaf0}
td{padding:14px;border-bottom:1px solid #eef0f4;vertical-align:top;font-size:14px}
tr.row:hover{background:#f4f8fe}
.name{font-weight:600}
.sub{font-size:12px;color:#7a8090;margin-top:2px}
.msg{max-width:340px;white-space:pre-wrap;word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
.msg.open{display:block;-webkit-line-clamp:unset}
a{color:#123a6e;text-decoration:none}a:hover{text-decoration:underline}
.act a{display:inline-block;margin:0 6px 6px 0;padding:5px 10px;border-radius:6px;background:#f4f5f8;color:#333;font-size:12px}
.act a:hover{background:#123a6e;color:#fff;text-decoration:none}
select{padding:6px 8px;border-radius:8px;border:1px solid #d9dce5;font:inherit;font-size:13px;font-weight:600}
.s-New{background:#fff0e0;color:#b4500a;border-color:#f3cfa6}.s-Contacted{background:#fff6e0;color:#8a5a00;border-color:#f0d9a0}
.s-Quoted{background:#e8f0ff;color:#1d4ba8;border-color:#b9cdf3}.s-Closed{background:#e8f7ee;color:#176b3a;border-color:#b6e3c7}
.empty{padding:50px 20px;text-align:center;color:#7a8090}
#toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#1f2430;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;opacity:0;transition:opacity .25s;pointer-events:none}
#toast.on{opacity:1}
.foot{font-size:12px;color:#8a90a0;margin-top:12px;text-align:right}
@media(max-width:760px){thead{display:none}table,tbody,tr,td{display:block;width:100%}tr.row{padding:12px 6px;border-bottom:8px solid #f4f5f8}td{border:0;padding:5px 12px}.msg{max-width:none}}
</style></head><body>
<header><div class="logo"><span class="mk">SM<b></b></span></div><div><h1>Enquiry Dashboard</h1><small>Sri Maruthi Industries &middot; website contact form</small></div><div class="sp"></div>
<button class="btn" id="refresh">&#8635; Refresh</button><button class="btn" id="csv">&#11015; Export CSV</button></header>
<main>
<div class="stats" id="stats"></div>
<div class="bar"><input id="q" placeholder="Search name, phone, email or message..." autocomplete="off"><span id="chips"></span></div>
<div class="card"><table><thead><tr><th>Received</th><th>Customer</th><th>Contact</th><th>Enquiry</th><th>Status</th><th>Reach out</th></tr></thead><tbody id="rows"></tbody></table><div class="empty" id="empty" style="display:none"></div></div>
<div class="foot" id="foot"></div>
</main><div id="toast"></div>
<script>
var KEY = __KEY__, STATUSES = ['New','Contacted','Quoted','Closed'], DATA = [], filter = 'All';
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function toast(t){var e=$('toast');e.textContent=t;e.className='on';setTimeout(function(){e.className=''},1800)}
function ist(d){return new Date(d).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})}
function fmt(d){var x=new Date(d);return isNaN(x)?esc(d):x.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function waNum(p){var n=String(p).split('').filter(function(c){return c>='0'&&c<='9'}).join('');if(n.length===10)n='91'+n;return n}
function stats(){
  var today=ist(new Date()),wk=Date.now()-7*86400000;
  var cards=[['Total enquiries',DATA.length],['New (not contacted)',DATA.filter(function(r){return r.status==='New'}).length],
    ['Received today',DATA.filter(function(r){return ist(r.received)===today}).length],['Last 7 days',DATA.filter(function(r){return new Date(r.received).getTime()>=wk}).length]];
  $('stats').innerHTML=cards.map(function(c){return '<div class="stat"><b>'+c[1]+'</b><span>'+c[0]+'</span></div>'}).join('');
  $('chips').innerHTML=['All'].concat(STATUSES).map(function(s){var n=s==='All'?DATA.length:DATA.filter(function(r){return r.status===s}).length;
    return '<button class="chip'+(filter===s?' on':'')+'" data-s="'+s+'">'+s+' ('+n+')</button>'}).join(' ');
}
function render(){
  stats();
  var q=$('q').value.toLowerCase().trim();
  var list=DATA.filter(function(r){return (filter==='All'||r.status===filter)&&(!q||(r.name+' '+r.phone+' '+r.email+' '+r.message).toLowerCase().indexOf(q)>=0)});
  $('rows').innerHTML=list.map(function(r){
    return '<tr class="row"><td>'+fmt(r.received)+'</td><td><div class="name">'+esc(r.name)+'</div></td>'+
      '<td><div>'+esc(r.phone)+'</div><div class="sub">'+esc(r.email)+'</div></td>'+
      '<td><div class="msg" title="Click to expand">'+esc(r.message)+'</div></td>'+
      '<td><select class="s-'+r.status+'" data-row="'+r.row+'">'+STATUSES.map(function(s){return '<option'+(s===r.status?' selected':'')+'>'+s+'</option>'}).join('')+'</select></td>'+
      '<td class="act"><a href="tel:'+esc(r.phone)+'">Call</a><a href="https://wa.me/'+waNum(r.phone)+'">WhatsApp</a><a href="mailto:'+esc(r.email)+'?subject=Re: your enquiry - Sri Maruthi Industries">Email</a></td></tr>'}).join('');
  var em=$('empty');em.style.display=list.length?'none':'block';
  em.textContent=DATA.length?'No enquiries match your search or filter.':'No enquiries yet. They will appear here as soon as someone submits the website form.';
  $('foot').textContent='Showing '+list.length+' of '+DATA.length+' - auto-refreshes every minute';
}
function load(quiet){
  google.script.run.withSuccessHandler(function(d){DATA=d;render();if(!quiet)toast('Updated')}).withFailureHandler(function(e){toast('Could not load: '+e.message)}).getEnquiries(KEY);
}
$('q').addEventListener('input',render);
$('refresh').addEventListener('click',function(){load(false)});
$('chips').addEventListener('click',function(e){var s=e.target.getAttribute('data-s');if(s){filter=s;render()}});
$('rows').addEventListener('click',function(e){if(e.target.className==='msg'||e.target.className==='msg open')e.target.classList.toggle('open')});
$('rows').addEventListener('change',function(e){
  var el=e.target,row=Number(el.getAttribute('data-row')),st=el.value;
  DATA.forEach(function(r){if(r.row===row)r.status=st});el.className='s-'+st;stats();
  google.script.run.withSuccessHandler(function(){toast('Status saved: '+st)}).withFailureHandler(function(er){toast('Save failed: '+er.message);load(true)}).setStatus(KEY,row,st);
});
$('csv').addEventListener('click',function(){
  var nl=String.fromCharCode(10),q=String.fromCharCode(34);
  function c(v){return q+String(v).split(q).join(q+q)+q}
  var out=[['Received','Name','Phone','Email','Message','Status','Page'].map(c).join(',')].concat(DATA.map(function(r){return [fmt(r.received),r.name,r.phone,r.email,r.message,r.status,r.page].map(c).join(',')}));
  var a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('\\ufeff'+out.join(nl));a.download='smi-enquiries.csv';a.click();
});
load(true);setInterval(function(){load(true)},60000);
</script></body></html>`;
