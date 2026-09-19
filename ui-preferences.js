/* NTS global UI preferences: theme + English/Urdu, shared by every portal. */
const translations = {
  'Light mode':'روشن موڈ','Dark mode':'ڈارک موڈ','English':'English','Urdu':'اردو','Settings':'ترتیبات',
  'Sign Out':'سائن آؤٹ','Sign In to NTS Portal':'NTS پورٹل میں سائن اِن','Notifications':'اطلاعات',
  'Student Portal':'طالب علم پورٹل','Driver Transit Console':'ڈرائیور ٹرانزٹ کنسول','Transport Directorate':'ٹرانسپورٹ ڈائریکٹوریٹ',
  'Authorized Portal Access':'مجاز پورٹل رسائی','Student':'طالب علم','Driver':'ڈرائیور','Admin':'ایڈمن',
  'Track My Bus':'میری بس ٹریک کریں','My Journey History':'میری سفر کی تاریخ','Overview':'جائزہ','Fleet Telemetry':'فلیٹ ٹریکنگ',
  'Bus Fleet':'بس فلیٹ','Stops & Ordering':'اسٹاپس اور ترتیب','Route Corridors':'روٹس','Driver Directory':'ڈرائیور ڈائریکٹری',
  'Student Roster':'طلبہ کی فہرست','Polling Control':'پولنگ کنٹرول','Boarding Audit':'بورڈنگ ریکارڈ',
  'Core System Features':'بنیادی نظام کی خصوصیات','Operational Status: Normal':'نظام معمول کے مطابق فعال ہے',
  'Live Bus':'لائیو بس','My Route':'میرا روٹ','Schedule':'شیڈول','Profile':'پروفائل','Logout':'لاگ آؤٹ',
  'Today’s Trip':'آج کا سفر','Route':'روٹ','Stops':'اسٹاپس','Students':'طلبہ','Emergency':'ایمرجنسی',
  'Dashboard':'ڈیش بورڈ','Buses':'بسیں','Drivers':'ڈرائیورز','Trips':'سفر','Reports':'رپورٹس'
};

function applyLanguage(lang) {
  const rtl = lang === 'ur';
  document.documentElement.lang = rtl ? 'ur' : 'en';
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.body.classList.toggle('rtl', rtl);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = rtl ? (translations[key] || key) : key;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = rtl ? (translations[key] || key) : key;
  });
  localStorage.setItem('nts-language', lang);
  const label = document.querySelector('#language-label');
  if (label) label.textContent = rtl ? 'اردو' : 'EN';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('nts-theme', theme);
  const btn = document.querySelector('#theme-toggle');
  if (btn) {
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    btn.innerHTML = theme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
    if (window.lucide) lucide.createIcons({attrs:{'stroke-width':1.8}});
  }
}

function injectPreferenceControls() {
  if (document.querySelector('.nts-preference-controls')) return;
  const host = document.querySelector('.header-container');
  if (!host) return;
  const controls = document.createElement('div');
  controls.className = 'nts-preference-controls';
  controls.innerHTML = `
    <button id="theme-toggle" class="pref-btn" type="button" title="Dark mode" aria-label="Switch theme"><i data-lucide="moon"></i></button>
    <button id="language-toggle" class="pref-btn language-btn" type="button" title="Language"><span id="language-label">EN</span></button>`;
  const right = host.lastElementChild;
  if (right) right.appendChild(controls); else host.appendChild(controls);
  document.querySelector('#theme-toggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  document.querySelector('#language-toggle').addEventListener('click', () => {
    applyLanguage(document.documentElement.lang === 'ur' ? 'en' : 'ur');
  });
}

function setupUI() {
  const theme = localStorage.getItem('nts-theme') || 'light';
  const lang = localStorage.getItem('nts-language') || 'en';
  applyTheme(theme);
  injectPreferenceControls();
  applyLanguage(lang);
  if (window.lucide) lucide.createIcons({attrs:{'stroke-width':1.8}});
}

document.addEventListener('DOMContentLoaded', setupUI);

const emojiIcons = {
  '🚌':'bus-front','🔔':'bell','🌅':'sunrise','🌇':'sunset','📍':'map-pin','📋':'clipboard-list','🟢':'circle-check','🔴':'circle-x','🟡':'circle-alert','👥':'users','🎓':'graduation-cap','👤':'user','⚙️':'settings','🏢':'building-2','🛡️':'shield-check','🗳️':'vote','📡':'radio-tower','🛑':'octagon-alert','⚠️':'triangle-alert','📊':'chart-column','🛰️':'satellite','🛤️':'route','👨‍✈️':'user-round-check','📞':'phone','🚀':'rocket','➡️':'arrow-right','🏁':'flag','🔕':'bell-off','⏰':'clock-3','🗺️':'map','🔒':'lock-keyhole','🔑':'key-round'
};
function replaceEmojiText(root=document.body){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[]; let n;
  while(n=walker.nextNode()) if(Object.keys(emojiIcons).some(e=>n.nodeValue.includes(e))) nodes.push(n);
  nodes.forEach(node=>{
    const frag=document.createDocumentFragment();
    let text=node.nodeValue;
    const re=new RegExp(Object.keys(emojiIcons).map(e=>e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
    let last=0, m;
    while((m=re.exec(text))){
      if(m.index>last) frag.appendChild(document.createTextNode(text.slice(last,m.index)));
      const i=document.createElement('i'); i.dataset.lucide=emojiIcons[m[0]]; i.className='inline-icon';
      frag.appendChild(i); last=m.index+m[0].length;
    }
    if(last<text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag,node);
  });
  if(window.lucide) lucide.createIcons({attrs:{'stroke-width':1.8}});
}

const observer = new MutationObserver(mutations => {
  if(mutations.some(m=>m.addedNodes.length)) replaceEmojiText(document.body);
});
window.addEventListener('load',()=>{ replaceEmojiText(document.body); observer.observe(document.body,{childList:true,subtree:true}); });
