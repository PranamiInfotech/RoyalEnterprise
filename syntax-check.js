
const $=id=>document.getElementById(id);

// -------- Version 4 login and role permissions --------
const ADMIN_USERNAME = 'Upen';
const STAFF_USERNAME = 'staff';
const LOGIN_SALT = 'royal-enterprise-v4:';
const ADMIN_PASSWORD_SHA256 = 'aed577032bdf93da67735bd4c023155bbe5c2d455273666635af84f78090fdfa';
const STAFF_PASSWORD_SHA256 = 'fefc82cc1a79d0b815bbaaecfcb168eff4562ab6ca8092dd10dfc673d442d82b';
const IDLE_LIMIT_MS = 30 * 60 * 1000;
let currentRole = '';
let currentUsername = '';
let idleTimer = null;

async function sha256Hex(value){
 const bytes = new TextEncoder().encode(value);
 const digest = await crypto.subtle.digest('SHA-256', bytes);
 return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function showLogin(message=''){
 $('loginError').textContent = message;
 $('loginPassword').value = '';
 $('loginOverlay').style.display = 'flex';
 setTimeout(()=>$('loginUsername').focus(),50);
}
function hideLogin(){ $('loginOverlay').style.display = 'none'; $('loginError').textContent=''; }
function resetIdleTimer(){
 if(idleTimer)clearTimeout(idleTimer);
 if(currentRole)idleTimer=setTimeout(()=>logoutUser('You were signed out after 30 minutes of inactivity.'),IDLE_LIMIT_MS);
}
function applyRole(role, username){
 currentRole=role;currentUsername=username;
 $('loggedInLabel').textContent=username+' · '+(role==='admin'?'Administrator':'Staff');
 $('settingsNavBtn').classList.toggle('hidden',role!=='admin');
 hideLogin();resetIdleTimer();
}
function logoutUser(message='You have been logged out.'){
 if(idleTimer)clearTimeout(idleTimer);idleTimer=null;currentRole='';currentUsername='';
 $('loggedInLabel').textContent='Not signed in';$('settingsNavBtn').classList.add('hidden');
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id==='editorTab'));
 document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab==='editorTab'));
 showLogin(message);
}
$('loginForm').addEventListener('submit',async event=>{
 event.preventDefault();
 const username=$('loginUsername').value.trim();
 const password=$('loginPassword').value;
 const normalizedPassword=password.trim();
 const error=$('loginError');
 error.textContent='Checking credentials…';
 try{
  const digest=await sha256Hex(LOGIN_SALT+password);
  const trimmedDigest=normalizedPassword===password ? digest : await sha256Hex(LOGIN_SALT+normalizedPassword);
  if(username.toLowerCase()===ADMIN_USERNAME.toLowerCase() &&
     (digest===ADMIN_PASSWORD_SHA256 || trimmedDigest===ADMIN_PASSWORD_SHA256)){applyRole('admin',ADMIN_USERNAME);return;}
  if(username.toLowerCase()===STAFF_USERNAME.toLowerCase() &&
     (digest===STAFF_PASSWORD_SHA256 || trimmedDigest===STAFF_PASSWORD_SHA256)){applyRole('staff',STAFF_USERNAME);return;}
  showLogin('Invalid username or password.');
 }catch(err){
  console.error('Royal Enterprise login verification failed:',err);
  showLogin('Login verification failed in this browser. Refresh the page and try again over HTTPS.');
 }
});
$('logoutBtn').addEventListener('click',()=>logoutUser());
['click','keydown','mousemove','touchstart','scroll'].forEach(type=>document.addEventListener(type,()=>{if(currentRole)resetIdleTimer();},{passive:true}));
function requireAdmin(){
 if(currentRole==='admin')return true;
 alert('Only the administrator can access Company Settings. Please sign in with the administrator account.');
 if(!currentRole)showLogin('Administrator sign-in is required for Company Settings.');
 return false;
}

const STORE='royalEnterpriseInvoiceAppV1';
const defaultData={
 settings:{name:'Royal Enterprise',phone:'98250 37034 / 97129 37034',address:'00081/1/A/1/1, Ameri Compound, Nr. Ruby Photo Studio, Ram Rahim Tekra, B/H. Calico Mill, Behrampura, Ahmedabad - 380022',gst:'24ABJPR4452K1ZC',pan:'ABJPR4452K',bank:'Kotak Mahindra Bank',branch:'Narayan Nagar Road, Paldi',account:'7612625683',ifsc:'KKBK0002589',rate:18,state:'Gujarat (Code: 24)',sign:'Authorised Signatory'},
 customers:[],products:[],invoices:[],nextNumber:678,driveClientId:''
};
let db=loadDB(), items=[];
function loadDB(){try{return {...structuredClone(defaultData),...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch(e){return structuredClone(defaultData)}}
function persist(){localStorage.setItem(STORE,JSON.stringify(db))}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function money(n){return '₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function words(n){
 n=Math.round(Number(n)||0);if(n===0)return 'Zero Rupees Only';
 const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
 function under(x){return x<20?a[x]:b[Math.floor(x/10)]+(x%10?' '+a[x%10]:'')}
 function chunk(x){let s='';if(x>=100){s+=a[Math.floor(x/100)]+' Hundred';x%=100;if(x)s+=' ';}return s+under(x)}
 let parts=[];const units=[[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand'],[1,'']];
 for(const [v,name] of units){if(n>=v){let q=Math.floor(n/v);parts.push(chunk(q)+(name?' '+name:''));n%=v}}
 return parts.join(' ')+' Rupees Only';
}
function getTotals(){
 const subtotal=items.reduce((sum,x)=>sum+itemQuantity(x)*(Number(x.rate)||0),0);
 const freight=Math.max(0,Number($('freight').value)||0),taxable=subtotal+freight,rate=Math.max(0,Number($('gstRate').value)||0);
 const mode=$('taxMode').value,gst=mode==='none'?0:taxable*rate/100;
 const cgst=mode==='intra'?gst/2:0,sgst=mode==='intra'?gst/2:0,igst=mode==='inter'?gst:0;
 const beforeRound=taxable+gst;
 const rounded=Math.floor(beforeRound+0.5+1e-9);
 const round=Number((rounded-beforeRound).toFixed(2));
 return {subtotal,freight,taxable,rate,mode,gst,cgst,sgst,igst,round,total:rounded};
}
function updateTotals(){const t=getTotals();$('taxableDisplay').textContent=money(t.taxable);$('gstDisplay').textContent=money(t.gst);$('grandDisplay').textContent=money(t.total);$('wordsDisplay').textContent=words(t.total);$('roundOff').value=t.round.toFixed(2)}
const BOARD_TYPES=['Uncoated Paper Board','Kappa Board','Kraft Board','Mill Board','Stiff Board','FBB Board','Duplex Board','FBB Waste','Duplex Waste','Board Waste'];
const HSN_CODES=['480210','48070010','480593','48102900','4707','48109200'];
function itemBasis(x){return x.basis || 'kgs';}
function itemQuantity(x){return Number(itemBasis(x)==='bundles'?(x.bundles??x.qty):(x.qty??''))||0;}
function addItem(x={}){
 const desc=BOARD_TYPES.includes(x.desc)?x.desc:'';
 const basis=itemBasis(x);
 const qty=basis==='bundles'?(x.bundles??x.qty??''):(x.qty??1);
 items.push({desc,size:x.size||'',hsn:HSN_CODES.includes(String(x.hsn))?String(x.hsn):'',basis,qty,bundles:basis==='bundles'?qty:'',rate:x.rate??0,unit:x.unit||''});
 renderItems();
}
function renderItems(){
 $('itemsInput').querySelector('tbody').innerHTML=items.map((x,i)=>{
  const basis=itemBasis(x),qty=itemQuantity(x);
  return `<tr>
   <td><select class="item-desc-select" data-i="${i}" data-k="desc"><option value="">-- Select description --</option>${BOARD_TYPES.map(v=>`<option value="${esc(v)}" ${x.desc===v?'selected':''}>${esc(v)}</option>`).join('')}</select>
   <input class="item-size-input" data-i="${i}" data-k="size" value="${esc(x.size||'')}" placeholder="Size / GSM (e.g. 27 x 32, 440 Oz)"></td>
   <td><select class="item-hsn-select" data-i="${i}" data-k="hsn"><option value="">-- HSN --</option>${HSN_CODES.map(v=>`<option value="${v}" ${String(x.hsn)===v?'selected':''}>${v}</option>`).join('')}</select></td>
   <td><select class="item-basis-select" data-i="${i}" data-k="basis"><option value="bundles" ${basis==='bundles'?'selected':''}>Bundles</option><option value="kgs" ${basis==='kgs'?'selected':''}>KGS</option></select></td>
   <td><input data-i="${i}" data-k="qty" type="number" min="0" step=".001" value="${qty||''}" placeholder="Quantity"></td>
   <td><input data-i="${i}" data-k="rate" type="number" min="0" step=".01" value="${x.rate??0}"></td>
   <td class="right">${money(qty*(Number(x.rate)||0))}</td>
   <td class="item-row-actions"><button class="secondary" data-addsimilar="${i}" type="button" title="Add another size line for this board">+ Line</button><button class="danger" data-remove="${i}" type="button" title="Remove line">×</button></td>
  </tr>`;
 }).join('');
}
function nextInvoice(){ $('invoiceNo').value='RE/'+new Date().getFullYear()+'/'+String(db.nextNumber).padStart(4,'0');$('challanNo').value='';$('invoiceDate').value=todayDisplay();$('placeSupply').value=db.settings.state||'Gujarat';$('buyerName').value='';$('buyerGst').value='';$('buyerAddress').value='';$('buyerState').value='';$('freight').value=0;$('roundOff').value=0;$('taxMode').value='intra';$('gstRate').value=db.settings.rate||18;items=[];addItem();updateTotals()}
function customerList(){ $('customerNames').innerHTML=db.customers.map(c=>`<option value="${esc(c.name)}">`).join('');$('customerTable').querySelector('tbody').innerHTML=db.customers.map((c,i)=>`<tr><td>${esc(c.name)}</td><td>${esc(c.gst||'')}</td><td>${esc(c.address||'')}</td><td>${esc(c.state||'')}</td><td><button class="secondary" data-cedit="${i}">Edit</button> <button class="danger" data-cdel="${i}">Delete</button></td></tr>`).join('')}
function productList(){ $('productTable').querySelector('tbody').innerHTML=db.products.map((p,i)=>`<tr><td>${esc(p.name)}</td><td>${esc(p.hsn)}</td><td>${esc(p.unit)}</td><td>${money(p.rate)}</td><td><button class="secondary" data-padd="${i}">Add to invoice</button> <button class="danger" data-pdel="${i}">Delete</button></td></tr>`).join('')}
function readSettings(){const s={};[['name','sName'],['phone','sPhone'],['address','sAddress'],['gst','sGst'],['pan','sPan'],['bank','sBank'],['branch','sBranch'],['account','sAccount'],['ifsc','sIfsc'],['rate','sRate'],['state','sState'],['sign','sSign']].forEach(([k,id])=>s[k]=$(id).value);return s}
function fillSettings(){const s=db.settings;[['name','sName'],['phone','sPhone'],['address','sAddress'],['gst','sGst'],['pan','sPan'],['bank','sBank'],['branch','sBranch'],['account','sAccount'],['ifsc','sIfsc'],['rate','sRate'],['state','sState'],['sign','sSign']].forEach(([k,id])=>$(id).value=s[k]??'')}

function dateToISO(value){
 const v=String(value||'').trim();
 if(!v)return '';
 let m=v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
 if(m){
  const day=Number(m[1]),month=Number(m[2]),year=Number(m[3]);
  const d=new Date(year,month-1,day);
  if(d.getFullYear()!==year||d.getMonth()!==month-1||d.getDate()!==day)return '';
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 }
 m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if(m){
  const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]);
  const d=new Date(year,month-1,day);
  if(d.getFullYear()!==year||d.getMonth()!==month-1||d.getDate()!==day)return '';
  return v;
 }
 return '';
}
function formatDateDisplay(value){
 const iso=dateToISO(value);
 if(!iso)return String(value||'');
 const [year,month,day]=iso.split('-');
 return `${day}/${month}/${year}`;
}
function todayDisplay(){
 const d=new Date();
 return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function invoiceData(){const t=getTotals();return {no:$('invoiceNo').value,challan:$('challanNo').value,date:dateToISO($('invoiceDate').value),place:$('placeSupply').value,buyer:{name:$('buyerName').value,gst:$('buyerGst').value,address:$('buyerAddress').value,state:$('buyerState').value},items:structuredClone(items),totals:t,words:words(t.total),savedAt:new Date().toISOString()}}
function renderPreview(inv=invoiceData()){
 const s=db.settings,t=inv.totals;
 let previousDescription='';
 const lineRows=inv.items.map(x=>{
  const basis=itemBasis(x),qty=itemQuantity(x),amount=qty*(Number(x.rate)||0);
  const sameDescription=Boolean(x.desc)&&x.desc===previousDescription;
  previousDescription=x.desc||'';
  return `<tr><td class="desc">${sameDescription?'':`<b>${esc(x.desc||'')}</b>`}${x.size?`${sameDescription?'':'<br>'}${esc(x.size)}`:''}</td><td>${esc(x.hsn||'')}</td><td class="right">${basis==='bundles'?qty:''}</td><td class="right">${basis==='kgs'?qty:''}</td><td class="right">${money(x.rate)}</td><td class="right">${money(amount)}</td></tr>`;
 }).join('');
 $('invoicePaper').innerHTML=`
 <div class="inv-top">
  <div class="inv-headline"><span>TAX INVOICE</span><span>Subject to Ahmedabad Jurisdiction</span><span></span></div>
  <div class="inv-brandband"><div class="inv-logo"><img src="royal-enterprise-logo.webp" alt="Royal Enterprise logo"></div><div class="brand">${esc(s.name)}</div><div class="inv-phone">M : ${esc(s.phone).replace(' / ','<br>')}</div></div>
  <div class="inv-dealers">Authorised Dealers of :<br>Craft Board, Kappa Board, Duplex Board, Stiff Board, White Mill Board, Grey Board &amp; All Type of Boards</div>
  <div class="inv-address">${esc(s.address)}</div>
 </div>
 <div class="inv-meta">
  <div class="inv-box inv-buyer"><div class="inv-buyer-top"><b>M/s.</b><br><strong>${esc(inv.buyer.name)}</strong><br>${esc(inv.buyer.address).replace(/\n/g,'<br>')}<br>${esc(inv.buyer.state)}</div><div class="inv-buyer-gst">Buyer's GST No. : ${esc(inv.buyer.gst)}</div></div>
  <div class="inv-box inv-bill"><div class="inv-billrow"><span>Bill No. :</span><span>${esc(inv.no)}</span></div><div class="inv-billrow"><span>Challan No. :</span><span>${esc(inv.challan)}</span></div><div class="inv-billrow"><span>Date :</span><span>${esc(formatDateDisplay(inv.date))}</span></div></div>
 </div>
 <table class="inv-table"><thead><tr><th>DESCRIPTION</th><th>HSN<br>CODE</th><th>BUNDLES</th><th>KGS.</th><th>RATE</th><th>AMOUNT</th></tr></thead><tbody>${lineRows}<tr class="line-items-empty"><td></td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>
 <div class="inv-footer-grid">
  <div class="inv-left-footer">
   <div class="inv-bank"><b>Company's Bank Details</b><br>Bank Name : <b>${esc(s.bank)}</b><br>Branch : <b>${esc(s.branch)}</b><br>A/c. No. : <b>${esc(s.account)}</b><br>IFSC Code : <b>${esc(s.ifsc)}</b></div>
   <div class="inv-vehicle">Vehicle No. :</div>
   <div class="inv-gstpan">GST No. : ${esc(s.gst)}<br>State : ${esc(s.state)}<br>PAN No. : ${esc(s.pan)}</div>
   <div class="inv-words"><span class="inv-words-title">Rupees</span>${esc(inv.words)}</div>
  </div>
  <div class="inv-right-footer"><table class="inv-totals">
   <tr><td>TOTAL</td><td class="right">${money(t.subtotal)}</td></tr>
   ${t.mode==='intra'?`<tr><td>CGST ${t.rate/2}%</td><td class="right">${money(t.cgst)}</td></tr><tr><td>SGST ${t.rate/2}%</td><td class="right">${money(t.sgst)}</td></tr>`:t.mode==='inter'?`<tr><td>IGST ${t.rate}%</td><td class="right">${money(t.igst)}</td></tr>`:`<tr><td>GST</td><td class="right">${money(0)}</td></tr>`}
   ${t.freight?`<tr><td>Freight</td><td class="right">${money(t.freight)}</td></tr>`:''}
   <tr><td>Round Off</td><td class="right">${money(t.round)}</td></tr><tr class="grand"><td>Grand TOTAL</td><td class="right">${money(t.total)}</td></tr>
  </table></div>
 </div>
 <div class="inv-terms-sign"><div class="inv-terms"><b>TERMS :</b><br>Interest @ 24% will be charged in bills not paid within 30 days of presentation.<br>Kindly note that any complaint regarding goods you received must be made within 24 hours after delivery.<br><b>E. &amp; O. E.</b></div><div class="inv-sign"><div class="sign-title">For, ${esc(s.name)}</div><div class="signature-line"></div><div class="sign-label">${esc(s.sign||'Authorised Signatory')}</div></div></div>`;
}
function showTab(id){
 if(id==='settingsTab' && currentRole!=='admin'){requireAdmin();return;}
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id===id));
 document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));
 if(id==='previewTab')renderPreview();if(id==='historyTab')renderHistory()
}
window.showInvoiceTab=showTab;

// ---------------- Google Drive integration ----------------
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
let googleTokenClient=null, googleAccessToken='', googleTokenExpiresAt=0;
let driveBusy=false;

function setDriveStatus(message,kind='info'){
 const el=$('driveStatus');
 if(!el)return;
 el.textContent=message;
 el.style.borderColor=kind==='ok'?'#78b88a':kind==='error'?'#d18b8b':'#d7e5ee';
}
function driveConfigured(){return Boolean((db.driveClientId||'').trim())}
function initDriveClient(){
 googleTokenClient=null;
 if(!driveConfigured()){setDriveStatus('Enter and save your OAuth Client ID.');return}
 if(!window.google?.accounts?.oauth2){
  setDriveStatus('Google authorization library is still loading. Refresh or try again shortly.');
  return;
 }
 googleTokenClient=google.accounts.oauth2.initTokenClient({
  client_id:db.driveClientId.trim(),
  scope:DRIVE_SCOPE,
  callback:async(response)=>{
   if(response.error){
    googleAccessToken='';googleTokenExpiresAt=0;
    setDriveStatus('Authorization failed: '+response.error,'error');
    return;
   }
   googleAccessToken=response.access_token||'';
   googleTokenExpiresAt=Date.now()+(Number(response.expires_in||3600)-60)*1000;
   setDriveStatus('Connected to Google Drive.','ok');
  },
  error_callback:(error)=>{
   setDriveStatus('Google sign-in popup error: '+(error.message||error.type||'unknown error'),'error');
  }
 });
 setDriveStatus('Ready to connect Google Drive.');
}
function connectDrive(){
 if(!driveConfigured()){
  alert('Enter your Google OAuth Client ID and click Save Drive configuration first.');
  return;
 }
 if(!window.google?.accounts?.oauth2){
  alert('Google authorization library has not loaded. Refresh this page and try again.');
  return;
 }
 if(!googleTokenClient)initDriveClient();
 googleTokenClient.requestAccessToken({prompt:'consent'});
}
function disconnectDrive(){
 googleAccessToken='';googleTokenExpiresAt=0;
 setDriveStatus(driveConfigured()?'Disconnected. Click Connect Google Drive to reconnect.':'Not configured.');
}
function hasDriveToken(){return Boolean(googleAccessToken&&Date.now()<googleTokenExpiresAt)}
async function driveRequest(url,options={}){
 if(!hasDriveToken())throw new Error('Google Drive is not connected or the access token expired. Reconnect Google Drive in Company Settings.');
 const response=await fetch(url,{
  ...options,
  headers:{Authorization:'Bearer '+googleAccessToken,...(options.headers||{})}
 });
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(body.error?.message||('Google Drive API error '+response.status));
 return body;
}
function driveQueryEscape(value){return String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
async function findDriveFile(name,parentId){
 const clauses=["name = '"+driveQueryEscape(name)+"'","trashed = false"];
 if(parentId)clauses.push("'"+parentId+"' in parents");
 const q=encodeURIComponent(clauses.join(' and '));
 const result=await driveRequest('https://www.googleapis.com/drive/v3/files?q='+q+'&pageSize=100&fields=files(id,name,mimeType,webViewLink)');
 return result.files?.[0]||null;
}
async function getOrCreateDriveFolder(name,parentId=null){
 const found=await findDriveFile(name,parentId);
 if(found)return found.id;
 const metadata={name,mimeType:'application/vnd.google-apps.folder'};
 if(parentId)metadata.parents=[parentId];
 const created=await driveRequest('https://www.googleapis.com/drive/v3/files?fields=id,name',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(metadata)
 });
 return created.id;
}
async function putDriveFile(name,mimeType,blob,parentId){
 let file=await findDriveFile(name,parentId);
 if(!file){
  const metadata={name,mimeType,parents:[parentId]};
  file=await driveRequest('https://www.googleapis.com/drive/v3/files?fields=id,name',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(metadata)
  });
 }
 await driveRequest('https://www.googleapis.com/upload/drive/v3/files/'+file.id+'?uploadType=media',{
  method:'PATCH',headers:{'Content-Type':mimeType},body:blob
 });
 return {id:file.id,name,link:'https://drive.google.com/file/d/'+file.id+'/view'};
}
function safeFilePart(value){
 return String(value||'').trim().replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,'_').replace(/_+/g,'_').slice(0,80)||'Customer';
}
function invoiceFileBase(inv){
 const customer=safeFilePart(inv.buyer?.name);
 const number=safeFilePart(inv.no).replace(/_+/g,'_');
 return 'Invoice_'+number+'_'+customer;
}
function invoiceDateParts(inv){
 const d=inv.date?new Date(inv.date+'T12:00:00'):new Date();
 if(Number.isNaN(d.getTime()))return {year:String(new Date().getFullYear()),month:new Date().toLocaleString('en-IN',{month:'long'})};
 return {year:String(d.getFullYear()),month:d.toLocaleString('en-IN',{month:'long'})};
}
async function createInvoicePdfBlob(inv){
 if(!window.html2pdf)throw new Error('PDF generator library did not load. Check your internet connection and refresh.');
 renderPreview(inv);
 const element=$('invoicePaper');
 const filename=invoiceFileBase(inv)+'.pdf';
 const options={
  margin:[4,4,4,4],
  filename,
  image:{type:'jpeg',quality:0.98},
  html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',scrollY:0},
  jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
  pagebreak:{mode:['css','legacy']}
 };
 return await window.html2pdf().set(options).from(element).outputPdf('blob');
}
async function uploadInvoiceToDrive(inv,source='manual'){
 if(driveBusy)return;
 if(!driveConfigured()){alert('Set up Google Drive first in Company Settings.');return}
 if(!hasDriveToken()){alert('Connect or reconnect Google Drive in Company Settings, then retry the upload.');return}
 driveBusy=true;
 setDriveStatus('Preparing invoice PDF and JSON backup…');
 try{
  const {year,month}=invoiceDateParts(inv);
  const root=await getOrCreateDriveFolder('Royal Enterprise Invoices');
  const yearFolder=await getOrCreateDriveFolder(year,root);
  const monthFolder=await getOrCreateDriveFolder(month,yearFolder);
  const base=invoiceFileBase(inv);
  const pdfBlob=await createInvoicePdfBlob(inv);
  const jsonPayload={
   app:'Royal Enterprise GST Invoice Generator',
   schemaVersion:1,
   exportedAt:new Date().toISOString(),
   company:structuredClone(db.settings),
   invoice:structuredClone(inv)
  };
  const jsonBlob=new Blob([JSON.stringify(jsonPayload,null,2)],{type:'application/json'});
  const pdfFile=await putDriveFile(base+'.pdf','application/pdf',pdfBlob,monthFolder);
  const jsonFile=await putDriveFile(base+'.json','application/json',jsonBlob,monthFolder);
  setDriveStatus('Uploaded both files: '+pdfFile.name+' and '+jsonFile.name,'ok');
  if(source==='manual'){
   alert('Invoice PDF and JSON backup saved to Google Drive:\\n'+year+'/'+month+'\\n\\nPDF: '+pdfFile.link+'\\nJSON: '+jsonFile.link);
  }else{
   console.info('Invoice uploaded to Google Drive',pdfFile.link,jsonFile.link);
  }
 }catch(error){
  setDriveStatus('Upload failed: '+error.message,'error');
  alert('Invoice was saved in browser history, but Google Drive upload failed:\\n'+error.message);
 }finally{driveBusy=false}
}


async function saveInvoice(){
 const inv=invoiceData();
 if(!inv.buyer.name.trim()){alert('Please enter the customer name.');return}
 const existing=db.invoices.findIndex(x=>x.no===inv.no);
 if(existing>=0)db.invoices[existing]=inv;
 else{db.invoices.push(inv);db.nextNumber++}
 persist();renderHistory();
 if(hasDriveToken()){
  await uploadInvoiceToDrive(inv,'automatic');
  alert('Invoice saved in browser history and Google Drive upload was attempted. Check Drive status in Company Settings.');
 }else{
  alert('Invoice saved in this browser. To upload it, connect Google Drive in Company Settings, then use Save PDF + JSON to Drive from Invoice Preview.');
 }
}

function renderHistory(){$('historyTable').querySelector('tbody').innerHTML=db.invoices.slice().reverse().map((x,ri)=>{const i=db.invoices.length-1-ri;return `<tr><td>${esc(x.no)}</td><td>${esc(formatDateDisplay(x.date))}</td><td>${esc(x.buyer.name)}</td><td>${money(x.totals.total)}</td><td><button class="secondary" data-hview="${i}">View</button> <button class="secondary" data-hupload="${i}">Upload</button> <button class="secondary" data-hedit="${i}">Edit</button> <button class="danger" data-hdel="${i}">Delete</button></td></tr>`}).join('')}
function loadInvoice(i){const x=db.invoices[i];$('invoiceNo').value=x.no;$('challanNo').value=x.challan;$('invoiceDate').value=formatDateDisplay(x.date);$('placeSupply').value=x.place;$('buyerName').value=x.buyer.name;$('buyerGst').value=x.buyer.gst;$('buyerAddress').value=x.buyer.address;$('buyerState').value=x.buyer.state;$('freight').value=x.totals.freight;$('taxMode').value=x.totals.mode;$('gstRate').value=x.totals.rate;$('roundOff').value=x.totals.round;items=structuredClone(x.items);renderItems();updateTotals()}
function saveCustomer(name,gst,address,state){if(!name.trim())return alert('Enter customer name');let i=db.customers.findIndex(c=>c.name.toLowerCase()===name.trim().toLowerCase());let c={name:name.trim(),gst,address,state};if(i>=0)db.customers[i]=c;else db.customers.push(c);persist();customerList();alert('Customer saved.')}
function clearCustomerForm(){['cName','cGst','cAddress','cState'].forEach(id=>$(id).value='')}
function clearProductForm(){['pName','pHsn','pUnit','pRate'].forEach(id=>$(id).value='')}
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
$('newInvoiceBtn').onclick=nextInvoice;$('previewBtn').onclick=$('previewBtn2').onclick=()=>{const v=$('invoiceDate').value;if(!dateToISO(v)){alert('Enter a valid date in dd/MM/yyyy format.');$('invoiceDate').focus();return;}showTab('previewTab')};$('backEditBtn').onclick=()=>showTab('editorTab');$('printBtn').onclick=()=>window.print();
$('uploadDrivePreviewBtn').onclick=()=>uploadInvoiceToDrive(invoiceData(),'manual');
$('addItemBtn').onclick=()=>addItem();function onItemFieldChange(e){
 const el=e.target;if(el.dataset.i===undefined)return;
 const idx=Number(el.dataset.i),key=el.dataset.k;if(!items[idx])return;
 if(key==='basis'){
  const oldQty=itemQuantity(items[idx]);items[idx].basis=el.value;items[idx].qty=oldQty;items[idx].bundles=el.value==='bundles'?oldQty:'';renderItems();
 }else{
  items[idx][key]=el.value;
  if(key==='qty')items[idx].bundles=items[idx].basis==='bundles'?el.value:'';
  const row=el.closest('tr'),x=items[idx];
  row.children[5].textContent=money(itemQuantity(x)*(Number(x.rate)||0));
 }
 updateTotals();
}
$('itemsInput').addEventListener('input',onItemFieldChange);
$('itemsInput').addEventListener('change',onItemFieldChange);
$('itemsInput').addEventListener('click',e=>{
 const addIndex=e.target.dataset.addsimilar;
 if(addIndex!==undefined){
  const source=items[+addIndex];if(!source)return;
  const sibling={desc:source.desc,size:'',hsn:source.hsn,basis:source.basis,qty:'',bundles:'',rate:source.rate,unit:source.unit||''};
  items.splice(+addIndex+1,0,sibling);renderItems();updateTotals();return;
 }
 if(e.target.dataset.remove!==undefined){items.splice(+e.target.dataset.remove,1);renderItems();updateTotals()}
});
['freight','gstRate','taxMode'].forEach(id=>$(id).addEventListener('input',updateTotals));
$('saveInvoiceBtn').onclick=()=>{if(!dateToISO($('invoiceDate').value)){alert('Enter a valid date in dd/MM/yyyy format.');$('invoiceDate').focus();return;}saveInvoice()};
$('saveCustomerFromInvoice').onclick=()=>saveCustomer($('buyerName').value,$('buyerGst').value,$('buyerAddress').value,$('buyerState').value);
$('saveCustomerBtn').onclick=()=>{saveCustomer($('cName').value,$('cGst').value,$('cAddress').value,$('cState').value);clearCustomerForm()};
$('clearCustomerBtn').onclick=clearCustomerForm;
$('customerTable').addEventListener('click',e=>{let i=e.target.dataset.cdel;if(i!==undefined){if(confirm('Delete this customer?')){db.customers.splice(+i,1);persist();customerList()}}i=e.target.dataset.cedit;if(i!==undefined){let c=db.customers[+i];$('cName').value=c.name;$('cGst').value=c.gst;$('cAddress').value=c.address;$('cState').value=c.state;showTab('customersTab')}});
$('saveProductBtn').onclick=()=>{let p={name:$('pName').value.trim(),hsn:$('pHsn').value,unit:$('pUnit').value,rate:Number($('pRate').value)||0};if(!p.name)return alert('Enter product description');db.products.push(p);persist();productList();clearProductForm()};
$('clearProductBtn').onclick=clearProductForm;
$('productTable').addEventListener('click',e=>{let i=e.target.dataset.pdel;if(i!==undefined){db.products.splice(+i,1);persist();productList()}i=e.target.dataset.padd;if(i!==undefined){let p=db.products[+i];addItem({desc:p.name,hsn:p.hsn,unit:p.unit,rate:p.rate,qty:1,basis:String(p.unit||'').toLowerCase().includes('bundle')?'bundles':'kgs'});showTab('editorTab')}});
$('saveSettingsBtn').onclick=()=>{if(!requireAdmin())return;db.settings=readSettings();persist();alert('Company settings saved.')};
$('saveDriveConfigBtn').onclick=()=>{if(!requireAdmin())return;db.driveClientId=$('driveClientId').value.trim();persist();initDriveClient();alert('Google Drive configuration saved.');};
$('connectDriveBtn').onclick=connectDrive;
$('disconnectDriveBtn').onclick=disconnectDrive;
$('historyTable').addEventListener('click',e=>{let i=e.target.dataset.hview;if(i!==undefined){loadInvoice(+i);showTab('previewTab')}i=e.target.dataset.hupload;if(i!==undefined){uploadInvoiceToDrive(db.invoices[+i],'manual')}i=e.target.dataset.hedit;if(i!==undefined){loadInvoice(+i);showTab('editorTab')}i=e.target.dataset.hdel;if(i!==undefined&&confirm('Delete this invoice from history?')){db.invoices.splice(+i,1);persist();renderHistory()}});
$('exportDataBtn').onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='royal-enterprise-invoice-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('importData').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!data.settings||!Array.isArray(data.invoices)||!Array.isArray(data.customers)||!Array.isArray(data.products))throw Error();db=data;persist();fillSettings();customerList();productList();renderHistory();alert('Backup imported.')}catch(err){alert('Invalid backup file.')}e.target.value=''};
$('buyerName').addEventListener('change',()=>{const c=db.customers.find(x=>x.name.toLowerCase()===$('buyerName').value.toLowerCase());if(c){$('buyerGst').value=c.gst;$('buyerAddress').value=c.address;$('buyerState').value=c.state}});
function initProductDropdowns(){
 $('pName').innerHTML='<option value="">-- Select description --</option>'+BOARD_TYPES.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
 $('pHsn').innerHTML='<option value="">-- Select HSN --</option>'+HSN_CODES.map(v=>`<option value="${v}">${v}</option>`).join('');
}
initProductDropdowns();fillSettings();customerList();productList();nextInvoice();
$('driveClientId').value=db.driveClientId||'';
setTimeout(initDriveClient,800);
