/*
 ZTG Putrajaya Membership v0.2 — separate community membership, independent of Crew Chat.
 Google sign-in is used ONLY for identity. No reads/writes to Crew Chat 'members' docs.
 Pre-release: deploy only after merging/auditing Firebase Rules and UAT.
*/
(() => {
  'use strict';
  if (window.__ztgMembershipV02) return;
  window.__ztgMembershipV02 = true;
  const cfg = window.RIDE_CONFIG || {};
  const q = (s, r=document) => r.querySelector(s);
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numberId = n => 'ZTG-PJ-' + String(n).padStart(4,'0');
  const numberKey = n => String(n).padStart(4,'0');
  // Numbers are normalized to Malaysia country code for wa.me hyperlinks.
  function normalizeMYPhone(value) {
    let x=String(value||'').replace(/[\s()+\-\.]/g,'');
    if (/^0(1\d{8,9})$/.test(x)) x='6'+x; // Local 01x -> international 601x
    else if (/^1\d{8,9}$/.test(x)) x='60'+x;
    if (!/^601\d{8,9}$/.test(x)) return null;
    return x;
  }
  const waLink = (value, text='') => {
    const digits=normalizeMYPhone(value);
    return digits ? `https://wa.me/${digits}${text?'?text='+encodeURIComponent(text):''}` : '#';
  };
  const waButton = (number, title='WhatsApp') => {
    const digits=normalizeMYPhone(number);
    return digits ? `<a class="ztg-btn outline" href="${waLink(digits)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp ${e(digits)}">💬 ${e(title)}: +${e(digits)}</a>` : '<span class="ztg-note">Nombor tidak sah</span>';
  };

  let fb=null, user=null, application=null, registry=null, adminRole=null, loading=false;
  let busy=false, authUnsub=null;
  const style=document.createElement('style');
  style.textContent=`
    .ztg-modal{position:fixed;z-index:20000;inset:0;background:#000c;overflow-y:auto;padding:18px 10px 55px;display:flex;align-items:flex-start;justify-content:center}
    .ztg-dialog{margin:auto 0;width:min(780px,100%);background:#101c17;color:#f2faef;border:1px solid #547052;border-radius:18px;box-shadow:0 15px 65px #000a;padding:19px}
    .ztg-dialog *{box-sizing:border-box}.ztg-dialog h2{color:#d4ffa7;font-size:1.35rem;margin:0}.ztg-dialog h3{font-size:1.06rem;margin:15px 0 8px}
    .ztg-dialog p{line-height:1.52}.ztg-head{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #395543;padding-bottom:14px;margin-bottom:15px}
    .ztg-dialog .hint{font-size:.86rem;color:#adc6b0}.ztg-dialog label{display:block;font-size:.9rem;font-weight:700;margin:12px 0 5px}
    .ztg-dialog input:not([type=checkbox]){display:block;width:100%;padding:11px 12px;border:1px solid #526b59;background:#1c2c23;color:#fff;border-radius:9px;font-size:16px}
    .ztg-dialog input[type=checkbox]{width:18px;height:18px;accent-color:#c4ff8c;flex:none;margin:0}
    .ztg-dialog .checklabel{display:flex;align-items:flex-start;gap:9px;font-weight:400;margin:12px 0}
    .ztg-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 13px}
    .ztg-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;border:0;border-radius:9px;padding:10px 12px;background:#b7e779;color:#142315;text-decoration:none;font-size:.88rem;font-weight:800;line-height:1.3}
    .ztg-btn.outline{background:#284534;border:1px solid #5e865f;color:#e8ffe3}.ztg-btn:disabled{opacity:.5;cursor:not-allowed}
    .ztg-actions{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin:12px 0}.ztg-card{border:1px solid #43694d;background:#1c3025;padding:13px;border-radius:12px;margin:12px 0}
    .ztg-card .rowitem{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:9px 0;border-bottom:1px solid #395143}
    .ztg-card .rowitem:last-child{border:0}.ztg-number{font-weight:950;color:#d4ff99;font-size:1.55rem}.ztg-x{background:#304937;color:white;border:0;padding:7px 12px;border-radius:9px;cursor:pointer}
    .ztg-error{color:#ffafa4;white-space:pre-wrap}.ztg-success{color:#d5ff9f}.ztg-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}
    .ztg-tab{border:1px solid #53795a;background:#283d2f;color:#dbf3dd;border-radius:9px;padding:8px 12px;font-weight:800;cursor:pointer}.ztg-tab.on{background:#b7e779;color:#182a17}
    @media(max-width:590px){.ztg-dialog{padding:13px}.ztg-form-grid{grid-template-columns:1fr}.ztg-btn{font-size:.83rem}}
  `;
  document.head.appendChild(style);
  const modal=() => q('#ztg-membership-modal');
  const staff=()=>!!adminRole;

  function entries(){
    const tiles=q('#view .tiles');
    if (tiles&&!q('#ztg-members-tile')) {
      const b=document.createElement('button'); b.id='ztg-members-tile'; b.type='button'; b.className='tile';
      b.innerHTML='<span class="symbol">🪪</span><strong>Keahlian ZTG</strong><small>Daftar ahli · Direktori</small>';
      b.addEventListener('click',open); tiles.appendChild(b);
    }
    const top=q('.topnav');
    if (top&&!q('#ztg-members-nav')) {
      const b=document.createElement('button'); b.id='ztg-members-nav';b.type='button'; b.className='navbtn hub-desktop-nav';
      b.innerHTML='🪪 <span>Keahlian</span>'; b.addEventListener('click',open); top.appendChild(b);
    }
  }
  if(q('#view'))new MutationObserver(entries).observe(q('#view'),{childList:true,subtree:true});
  entries();

  function open(){
    if(modal())return;
    const el=document.createElement('div');el.id='ztg-membership-modal';el.className='ztg-modal';
    el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Keahlian ZTG Putrajaya');
    el.addEventListener('click',ev=>{if(ev.target===el)close()});document.body.appendChild(el);
    draw(); ensureFirebase().then(loadSelf).catch(renderError);
  }
  function close(){modal()?.remove()}
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&modal())close()});
  function shell(markup){
    const el=modal();if(!el)return;
    el.innerHTML=`<div class="ztg-dialog"><div class="ztg-head"><div><h2>🪪 ZTG PUTRAJAYA COMMUNITY</h2><div class="hint">Keahlian komuniti · Berasingan daripada Crew Chat</div></div><button id="ztg-close" class="ztg-x" aria-label="Tutup">✕</button></div><div id="ztg-body">${markup}</div><p id="ztg-msg" role="status" aria-live="polite"></p></div>`;
    q('#ztg-close').addEventListener('click',close);
  }
  function message(value,err=false){const el=q('#ztg-msg');if(el){el.className=err?'ztg-error':'ztg-success';el.textContent=value}}
  function renderError(err){shell(`<p class="ztg-error">Tidak dapat memuatkan modul keahlian: ${e(err?.message||err)}</p><p class="hint">Semak konfigurasi Firebase dan Firestore Rules. Crew Chat tidak diubah.</p>`)}
  function draw(){
    if(!modal())return;
    if(!fb||loading)return shell('<p>Memuatkan keahlian ZTG…</p>');
    if(!user){
      shell('<p>Pendaftaran terbuka untuk komuniti ZTG Putrajaya. Log masuk Google untuk menghantar permohonan. <strong>Akaun Crew Chat tidak diperlukan.</strong></p><button id="ztg-login" class="ztg-btn">Log masuk dengan Google</button>');
      q('#ztg-login').onclick=login;return;
    }
    let h=`<p class="hint">Log masuk: <b>${e(user.email||user.displayName)}</b></p>`;
    if(registry?.memberId){
      h+=`<div class="ztg-card"><div class="ztg-success">✓ AHLI ZTG DISAHKAN</div><div class="ztg-number">${e(registry.memberId)}</div><p>${e(registry.callsign)} · ${e(registry.bikeModel)}</p></div>`;
    }else if(application?.status==='Approved'){
      h+='<div class="ztg-card">Permohonan diluluskan. Sila buka semula halaman untuk menyelaraskan rekod.</div>';
    }else if(application?.status==='Pending'){
      h+=`<div class="ztg-card"><strong>⏳ Sedang disemak</strong><p>${e(application.callsign)} · ${application.whatsappVerified?'WhatsApp sudah disahkan':'WhatsApp belum disahkan admin'}</p></div>`;
      if(!application.whatsappVerified)h+=registrationForm(application,'Kemas kini permohonan');
      else h+='<p class="hint">WhatsApp telah disahkan. Sebarang pembetulan nombor perlu dibuat melalui Admin.</p>';
    }else{
      if(application?.status==='NeedsCorrection')h+='<p class="ztg-error">Admin meminta pembetulan. Sila kemas kini borang.</p>';
      h+=registrationForm(application||{},'Hantar permohonan');
    }
    h+='<div class="ztg-actions">';
    if(registry||staff())h+='<button id="ztg-directory" class="ztg-btn outline">📒 Direktori Ahli</button>';
    if(staff())h+='<button id="ztg-admin" class="ztg-btn outline">🛡️ Urusan Admin</button>';
    h+='<button id="ztg-logout" class="ztg-btn outline">Log keluar</button></div>';
    h+='<p class="hint">Nombor WhatsApp ahli hanya dipaparkan dalam direktori dalaman kepada ahli yang diluluskan, dengan persetujuan pemilik nombor. Admin boleh mengurus semua rekod.</p>';
    shell(h);
    q('#ztg-form')?.addEventListener('submit',submit);
    q('#ztg-directory')?.addEventListener('click',listDirectory);
    q('#ztg-admin')?.addEventListener('click',listAdmin);
    q('#ztg-logout')?.addEventListener('click',()=>fb.signOut(fb.auth));
  }
  function registrationForm(item={},button='Hantar permohonan'){
    const v=k=>e(item?.[k]||'');
    return `<form id="ztg-form" autocomplete="on"><div class="ztg-form-grid">
      <div><label for="ztg-name">Nama penuh *</label><input id="ztg-name" name="fullName" maxlength="100" required autocomplete="name" value="${v('fullName')}"></div>
      <div><label for="ztg-callsign">Nama panggilan / Callsign *</label><input id="ztg-callsign" name="callsign" maxlength="40" required value="${v('callsign')}"></div>
      <div><label for="ztg-wa">No. WhatsApp aktif *</label><input id="ztg-wa" name="whatsapp" type="tel" maxlength="20" inputmode="tel" required placeholder="0123456789 atau +60123456789" value="${v('whatsapp')}"></div>
      <div><label for="ztg-bike">Model motosikal *</label><input id="ztg-bike" name="bikeModel" maxlength="60" required value="${v('bikeModel')}"></div>
      <div><label for="ztg-area">Kawasan *</label><input id="ztg-area" name="area" maxlength="80" required value="${v('area')}"></div></div>
      <label class="checklabel"><input type="checkbox" name="waActive" required><span>Saya mengesahkan nombor ini boleh dihubungi melalui WhatsApp dan bersetuju menerima mesej pengesahan daripada Admin ZTG.</span></label>
      <label class="checklabel"><input type="checkbox" name="consentDirectory" ${item?.consentDirectory?'checked':''}><span>Saya bersetuju nombor WhatsApp saya disenaraikan dalam direktori <strong>ahli yang telah diluluskan sahaja</strong>. Tidak dipaparkan kepada pengunjung awam.</span></label>
      <p class="hint">Admin akan menghubungi nombor untuk menyemak keaktifannya sebelum meluluskan ahli. Pautan WhatsApp sahaja bukan bukti nombor aktif.</p>
      <div class="ztg-actions"><button type="submit" class="ztg-btn">${e(button)}</button></div></form>`;
  }
  async function ensureFirebase(){
    if(fb)return;
    if(!cfg.firebase?.apiKey||!cfg.firebase?.projectId||!cfg.firebase?.appId)throw Error('Firebase belum dikonfigurasi dalam config.js');
    const [appSDK,authSDK,dbSDK]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')
    ]);
    const app=appSDK.getApps().length?appSDK.getApp():appSDK.initializeApp(cfg.firebase);
    fb={...authSDK,...dbSDK,auth:authSDK.getAuth(app),db:dbSDK.getFirestore(app)};
    authUnsub=fb.onAuthStateChanged(fb.auth,u=>{user=u;application=null;registry=null;adminRole=null;if(modal())loadSelf().catch(renderError)});
  }
  async function loadSelf(){
    if(!fb||!modal())return;
    if(!user){loading=false;draw();return;}
    loading=true;draw();
    try {
      const uid=user.uid;
      const [a,m,staffDoc]=await Promise.all([
        fb.getDoc(fb.doc(fb.db,'ztgApplications',uid)),
        fb.getDoc(fb.doc(fb.db,'ztgMembers',uid)),
        fb.getDoc(fb.doc(fb.db,'ztgMembershipAdmins',uid))
      ]);
      application=a.exists()?a.data():null;registry=m.exists()?m.data():null;
      const role=staffDoc.exists()?staffDoc.data():null;
      adminRole=role?.active&&['owner','admin','captain'].includes(role.role)?role.role:null;
    } finally {loading=false;draw();}
  }
  async function login(){
    try {await fb.signInWithPopup(fb.auth,new fb.GoogleAuthProvider())}
    catch(err){if(['auth/popup-blocked','auth/cancelled-popup-request'].includes(err.code))await fb.signInWithRedirect(fb.auth,new fb.GoogleAuthProvider());else message('Log masuk gagal: '+err.message,true)}
  }
  async function submit(ev){
    ev.preventDefault();if(!user||busy)return;
    const f=ev.currentTarget,data=new FormData(f),get=x=>String(data.get(x)||'').trim();
    const phone=normalizeMYPhone(get('whatsapp'));
    if(!phone)return message('Format nombor Malaysia tidak sah. Contoh 0123456789 / +60123456789.',true);
    if(!data.has('waActive'))return message('Sahkan nombor WhatsApp aktif.',true);
    const vals={fullName:get('fullName'),callsign:get('callsign'),whatsapp:phone,bikeModel:get('bikeModel'),area:get('area'),consentDirectory:data.has('consentDirectory')};
    if(Object.keys(vals).some(k=>k!=='consentDirectory'&&!vals[k]))return message('Lengkapkan semua medan bertanda *.',true);
    busy=true;const btn=f.querySelector('[type=submit]');btn.disabled=true;
    try {
      const ref=fb.doc(fb.db,'ztgApplications',user.uid);
      if(!application)await fb.setDoc(ref,{uid:user.uid,email:user.email,...vals,status:'Pending',whatsappVerified:false,createdAt:fb.serverTimestamp(),updatedAt:fb.serverTimestamp()});
      else if(['Pending','NeedsCorrection'].includes(application.status)&&!application.whatsappVerified){
        await fb.updateDoc(ref,{...vals,status:'Pending',updatedAt:fb.serverTimestamp()});
      }else throw Error('Permohonan sudah disahkan/diluluskan. Hubungi admin.');
      await loadSelf();message('Permohonan disimpan. Admin akan semak nombor WhatsApp.');
    }catch(err){message('Gagal simpan: '+err.message,true)}finally{busy=false;if(btn.isConnected)btn.disabled=false}
  }
  function adminShell(content){
    shell(`<button class="ztg-btn outline" id="ztg-back">← Kembali</button><h3>🛡️ Keahlian ZTG — Admin</h3>${content}`);
    q('#ztg-back').onclick=draw;
  }
  async function listAdmin(){
    if(!staff())return;
    adminShell('<p>Memuatkan permohonan dan rekod…</p>');
    try{
      const [apps,members]=await Promise.all([
        fb.getDocs(fb.collection(fb.db,'ztgApplications')),
        fb.getDocs(fb.collection(fb.db,'ztgMembers'))
      ]);
      const all=apps.docs.map(d=>({uid:d.id,...d.data()}));
      const pending=all.filter(x=>x.status!=='Approved').sort((a,b)=>(a.callsign||'').localeCompare(b.callsign||''));
      let h=`<p class="hint">${members.size} ahli diluluskan · ${pending.length} permohonan untuk tindakan. Nombor mesti menerima balasan WhatsApp sebelum status disahkan.</p>`;
      h+=pending.length?pending.map(x=>{
        const verified=!!x.whatsappVerified;
        return `<div class="ztg-card"><strong>${e(x.fullName)} (${e(x.callsign)})</strong><p class="hint">${e(x.bikeModel)} · ${e(x.area)} · ${e(x.status)} · ${verified?'✅ WhatsApp disahkan':'⏳ Belum disahkan'}</p><div class="ztg-actions">${waButton(x.whatsapp,'Hubungi')}
          ${!verified?`<button data-verify="${e(x.uid)}" class="ztg-btn outline">✓ Sahkan WhatsApp</button>`:''}
          ${verified?`<button data-approve="${e(x.uid)}" class="ztg-btn">Lulus & Beri ID</button>`:''}
          ${verified&&adminRole==='owner'&&x.uid===user.uid?`<button data-bond="${e(x.uid)}" class="ztg-btn outline">007 — Bond</button>`:''}
          <button data-reject="${e(x.uid)}" class="ztg-btn outline">Perlu Pembetulan</button>
        </div></div>`;
      }).join(''):'<div class="ztg-card">Tiada permohonan menunggu.</div>';
      h+='<h3>📒 Ahli yang telah diluluskan (Admin)</h3>';
      h+=members.docs.sort((a,b)=>(a.data().memberId||'').localeCompare(b.data().memberId||'')).map(d=>{
        const x=d.data();return `<div class="ztg-card rowitem"><div><strong>${e(x.memberId)} · ${e(x.callsign)}</strong><p class="hint">${e(x.fullName)} · ${e(x.bikeModel)} · ${e(x.area)}</p></div>${waButton(x.whatsapp,'WhatsApp')}</div>`;
      }).join('')||'<p class="hint">Belum ada ahli diluluskan.</p>';
      adminShell(h);
      q('#ztg-body').querySelectorAll('[data-verify]').forEach(b=>b.onclick=()=>verify(b.dataset.verify));
      q('#ztg-body').querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>approve(b.dataset.approve,false));
      q('#ztg-body').querySelectorAll('[data-bond]').forEach(b=>b.onclick=()=>approve(b.dataset.bond,true));
      q('#ztg-body').querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>reject(b.dataset.reject));
    }catch(err){adminShell(`<p class="ztg-error">Gagal baca data: ${e(err.message)}</p>`)}
  }
  async function verify(uid){
    if(!staff())return;
    if(!confirm('ANDA SUDAH menerima balasan daripada nombor WhatsApp pemohon? Hanya tekan OK selepas pengesahan sebenar.'))return;
    try{
      await fb.updateDoc(fb.doc(fb.db,'ztgApplications',uid),{whatsappVerified:true,verifiedAt:fb.serverTimestamp(),verifiedBy:user.uid,updatedAt:fb.serverTimestamp()});
      await listAdmin();
    }catch(err){alert('Gagal sahkan WhatsApp: '+err.message)}
  }
  async function reject(uid){
    if(!staff()||!confirm('Minta pemohon kemas kini permohonan? Pengesahan WhatsApp akan dibatalkan.'))return;
    try{await fb.updateDoc(fb.doc(fb.db,'ztgApplications',uid),{status:'NeedsCorrection',whatsappVerified:false,verifiedAt:fb.deleteField(),verifiedBy:fb.deleteField(),updatedAt:fb.serverTimestamp()});await listAdmin()}
    catch(err){alert('Gagal kemas kini: '+err.message)}
  }
  async function approve(uid,bond){
    if(!staff()||busy)return;
    if(bond&&(adminRole!=='owner'||uid!==user.uid))return alert('007 hanya boleh dikeluarkan oleh Owner untuk akaun sendiri.');
    if(!confirm(bond?'Keluarkan nombor khas ZTG-PJ-0007 untuk akaun Owner ini?':'WhatsApp telah disahkan. Luluskan dan keluarkan ID keahlian kekal?'))return;
    busy=true;
    try{
      const A=fb.doc(fb.db,'ztgApplications',uid),M=fb.doc(fb.db,'ztgMembers',uid),C=fb.doc(fb.db,'ztgMembershipMeta','sequence');
      const issued=await fb.runTransaction(fb.db,async tx=>{
        const a=await tx.get(A),m=await tx.get(M),seq=await tx.get(C);
        if(!a.exists())throw Error('Permohonan tidak wujud.');
        if(m.exists())throw Error('Ahli sudah mempunyai nombor.');
        const x=a.data();
        if(x.status!=='Pending'||!x.whatsappVerified)throw Error('WhatsApp mesti disahkan dan permohonan mesti Pending.');
        const P=fb.doc(fb.db,'ztgMemberPhones',x.whatsapp);
        if((await tx.get(P)).exists())throw Error('Nombor WhatsApp ini sudah didaftarkan oleh ahli lain.');
        let n=bond?7:Math.max(1,Number(seq.exists()?seq.data().nextNumber:1)||1),N=null;
        for(let i=0;i<3000;i++){
          if(n===7&&!bond){n++;continue}
          N=fb.doc(fb.db,'ztgMemberNumbers',numberKey(n));
          if(!(await tx.get(N)).exists())break;
          if(bond)throw Error('007 telah digunakan.');
          n++;N=null;
        }
        if(!N)throw Error('Nombor ahli habis / gagal diperuntukkan.');
        const code=numberId(n),now=fb.serverTimestamp(),base={uid,memberId:code,number:n,numberKey:numberKey(n),fullName:x.fullName,callsign:x.callsign,whatsapp:x.whatsapp,bikeModel:x.bikeModel,area:x.area,consentDirectory:x.consentDirectory,approvedAt:now,approvedBy:user.uid};
        tx.set(N,{uid,memberId:code,issuedAt:now,issuedBy:user.uid});
        tx.set(P,{uid,memberId:code,issuedAt:now});
        tx.set(M,base);
        if(x.consentDirectory)tx.set(fb.doc(fb.db,'ztgDirectory',uid),base);
        tx.update(A,{status:'Approved',memberId:code,number:n,approvedAt:now,approvedBy:user.uid,updatedAt:now});
        if(!bond)tx.set(C,{nextNumber:n+1,updatedAt:now},{merge:true});
        return code;
      });
      alert('Ahli diluluskan: '+issued);
      if(uid===user.uid)await loadSelf();
      await listAdmin();
    }catch(err){alert('Tidak berjaya: '+(err?.message||err))}finally{busy=false}
  }
  async function listDirectory(){
    if(!registry&&!staff())return;
    shell('<p>Memuatkan direktori ahli…</p>');
    try{
      const snap=await fb.getDocs(fb.collection(fb.db,'ztgDirectory'));
      const arr=snap.docs.map(d=>d.data()).sort((a,b)=>(a.memberId||'').localeCompare(b.memberId||''));
      let h='<button class="ztg-btn outline" id="ztg-back">← Kembali</button><h3>📒 Direktori Ahli ZTG</h3><p class="hint">Hanya ahli yang diluluskan dan bersetuju menyenaraikan WhatsApp dipaparkan. Gunakan nombor untuk urusan komuniti sahaja; jangan tambah ke kumpulan tanpa izin.</p>';
      h+='<label for="ztg-search">Cari nama / ID</label><input id="ztg-search" placeholder="Cari callsign, nama atau nombor ahli…" autocomplete="off"><div id="ztg-directory-list"></div>';
      shell(h);
      const paint=(term='')=>{
        const box=q('#ztg-directory-list');if(!box)return;
        const shown=arr.filter(x=>`${x.fullName} ${x.callsign} ${x.memberId}`.toLowerCase().includes(term.toLowerCase()));
        box.innerHTML=shown.map(x=>`<div class="ztg-card rowitem"><div><strong>${e(x.memberId)} · ${e(x.callsign)}</strong><p class="hint">${e(x.fullName)} · ${e(x.bikeModel)} · ${e(x.area)}</p></div>${waButton(x.whatsapp,'WhatsApp')}</div>`).join('')||'<p class="hint">Tiada rekod ditemui.</p>';
      };
      paint();q('#ztg-search').oninput=ev=>paint(ev.target.value);
      q('#ztg-back').onclick=draw;
    }catch(err){shell(`<p class="ztg-error">Direktori tidak dapat dibuka: ${e(err.message)}</p><button class="ztg-btn outline" id="ztg-back">← Kembali</button>`);q('#ztg-back').onclick=draw}
  }
  window.ZTGMembership={open,normalizeMYPhone,waLink};
})();
