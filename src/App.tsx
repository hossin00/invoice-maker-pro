import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Search, Download, X, CheckCircle, DollarSign, Clock, AlertCircle } from 'lucide-react';

const ACCENT = '#10b981';
const SK = 'imp_data_v1'; const SS = 'imp_s_v1'; const SO = 'imp_o_v1';

type Status = 'draft'|'sent'|'paid'|'overdue';
type Page = 'dashboard'|'invoices'|'clients'|'items'|'reports'|'settings'|'help';

interface Client { id:string; name:string; email:string; phone:string; address:string; isSample?:boolean; }
interface LineItem { id:string; description:string; qty:number; rate:number; }
interface Invoice { id:string; number:string; clientId:string; date:string; dueDate:string; status:Status; items:LineItem[]; notes:string; taxRate:number; isSample?:boolean; }
interface ServiceItem { id:string; description:string; defaultRate:number; unit:string; }

function ld<T>(k:string,fb:T):T{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}}
function sv<T>(k:string,v:T){localStorage.setItem(k,JSON.stringify(v));}
function uid(){return Math.random().toString(36).slice(2,10);}
function subtotal(items:LineItem[]){return items.reduce((s,i)=>s+i.qty*i.rate,0);}
function total(items:LineItem[],tax:number){const sub=subtotal(items);return sub+sub*(tax/100);}
function fmt(n:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);}

const SAMPLE_CLIENTS:Client[]=[
  {id:'c1',name:'Acme Corp',email:'billing@acme.com',phone:'+1 555-0101',address:'123 Business Ave, New York, NY',isSample:true},
  {id:'c2',name:'Stellar Design Co',email:'hello@stellar.design',phone:'+1 555-0202',address:'456 Creative Blvd, Austin, TX',isSample:true},
  {id:'c3',name:'TechFlow Ltd',email:'accounts@techflow.io',phone:'+1 555-0303',address:'789 Innovation Dr, San Francisco, CA',isSample:true},
];
const SAMPLE_INVOICES:Invoice[]=[
  {id:'i1',number:'INV-001',clientId:'c1',date:'2026-05-01',dueDate:'2026-05-31',status:'paid',taxRate:10,notes:'Web development services',items:[{id:'l1',description:'Website Development',qty:1,rate:2500},{id:'l2',description:'SEO Optimization',qty:3,rate:150}],isSample:true},
  {id:'i2',number:'INV-002',clientId:'c2',date:'2026-05-15',dueDate:'2026-06-14',status:'sent',taxRate:10,notes:'Brand identity package',items:[{id:'l3',description:'Logo Design',qty:1,rate:800},{id:'l4',description:'Brand Guidelines',qty:1,rate:400}],isSample:true},
  {id:'i3',number:'INV-003',clientId:'c3',date:'2026-04-01',dueDate:'2026-05-01',status:'overdue',taxRate:0,notes:'Consulting retainer April',items:[{id:'l5',description:'Technical Consulting',qty:20,rate:120}],isSample:true},
  {id:'i4',number:'INV-004',clientId:'c1',date:'2026-06-01',dueDate:'2026-06-30',status:'draft',taxRate:10,notes:'',items:[{id:'l6',description:'Maintenance Package',qty:1,rate:500}],isSample:true},
];

export default function App() {
  const [data,setData]=useState(()=>ld(SK,{clients:[] as Client[],invoices:[] as Invoice[],services:[] as ServiceItem[]}));
  const [onboarded,setOnboarded]=useState(()=>ld(SO,false));
  const [page,setPage]=useState<Page>('dashboard');
  const [search,setSearch]=useState('');
  const [modal,setModal]=useState<'invoice'|'client'|null>(null);
  const [editInv,setEditInv]=useState<Invoice|null>(null);
  const [editClient,setEditClient]=useState<Client|null>(null);
  const [theme,setTheme]=useState(()=>ld(SS,{theme:'system'}).theme);
  const [invForm,setInvForm]=useState({clientId:'',date:new Date().toISOString().split('T')[0],dueDate:'',notes:'',taxRate:10,status:'draft' as Status});
  const [invItems,setInvItems]=useState<LineItem[]>([{id:uid(),description:'',qty:1,rate:0}]);
  const [clientForm,setClientForm]=useState({name:'',email:'',phone:'',address:''});
  const [nextNum,setNextNum]=useState(()=>ld('imp_num_v1',5));

  useEffect(()=>{sv(SK,data);},[data]);
  useEffect(()=>{sv('imp_num_v1',nextNum);},[nextNum]);
  useEffect(()=>{const el=document.documentElement;if(theme==='dark')el.classList.add('dark');else if(theme==='light')el.classList.remove('dark');else{window.matchMedia('(prefers-color-scheme: dark)').matches?el.classList.add('dark'):el.classList.remove('dark');}sv(SS,{theme});},[theme]);

  const start=(sample:boolean)=>{
    if(sample)setData({clients:SAMPLE_CLIENTS,invoices:SAMPLE_INVOICES,services:[]});
    setOnboarded(true);sv(SO,true);
  };

  const clientName=(id:string)=>data.clients.find(c=>c.id===id)?.name||'Unknown Client';

  const openNewInv=()=>{setEditInv(null);setInvForm({clientId:data.clients[0]?.id||'',date:new Date().toISOString().split('T')[0],dueDate:'',notes:'',taxRate:10,status:'draft'});setInvItems([{id:uid(),description:'',qty:1,rate:0}]);setModal('invoice');};
  const openEditInv=(inv:Invoice)=>{setEditInv(inv);setInvForm({clientId:inv.clientId,date:inv.date,dueDate:inv.dueDate,notes:inv.notes,taxRate:inv.taxRate,status:inv.status});setInvItems([...inv.items]);setModal('invoice');};

  const saveInv=()=>{
    const inv:Invoice={id:editInv?.id||uid(),number:editInv?.number||`INV-${String(nextNum).padStart(3,'0')}`,clientId:invForm.clientId,date:invForm.date,dueDate:invForm.dueDate,status:invForm.status,items:invItems.filter(i=>i.description),notes:invForm.notes,taxRate:invForm.taxRate};
    setData(d=>({...d,invoices:editInv?d.invoices.map(i=>i.id===editInv.id?inv:i):[inv,...d.invoices]}));
    if(!editInv)setNextNum(n=>n+1);
    setModal(null);
  };

  const saveClient=()=>{
    const c:Client={id:editClient?.id||uid(),...clientForm};
    setData(d=>({...d,clients:editClient?d.clients.map(x=>x.id===editClient.id?c:x):[c,...d.clients]}));
    setModal(null);
  };

  const delInv=(id:string)=>setData(d=>({...d,invoices:d.invoices.filter(i=>i.id!==id)}));
  const delClient=(id:string)=>setData(d=>({...d,clients:d.clients.filter(c=>c.id!==id)}));

  const stats={
    revenue:data.invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+total(i.items,i.taxRate),0),
    unpaid:data.invoices.filter(i=>i.status==='sent').reduce((s,i)=>s+total(i.items,i.taxRate),0),
    overdue:data.invoices.filter(i=>i.status==='overdue').length,
    drafts:data.invoices.filter(i=>i.status==='draft').length,
    hasSample:data.invoices.some(i=>i.isSample)||data.clients.some(c=>c.isSample),
  };

  const statusStyle=(s:Status)=>({
    paid:'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    sent:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    overdue:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    draft:'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }[s]);

  const exportCSV=()=>{
    const rows=data.invoices.map(i=>[i.number,clientName(i.clientId),i.date,i.dueDate,i.status,fmt(total(i.items,i.taxRate))].join(','));
    const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('Number,Client,Date,Due,Status,Total\n'+rows.join('\n'));a.download='invoices.csv';a.click();
  };

  const filtered=data.invoices.filter(i=>{const q=search.toLowerCase();return!q||i.number.toLowerCase().includes(q)||clientName(i.clientId).toLowerCase().includes(q);});

  if(!onboarded)return(
    <div className="min-h-screen flex items-center justify-center p-6" style={{background:`linear-gradient(135deg, ${ACCENT}, #065f46)`}}>
      <div className="max-w-xl w-full text-center">
        <div className="text-6xl mb-4">💼</div>
        <h1 className="text-3xl font-bold text-white mb-2">Invoice Maker Pro</h1>
        <p className="text-emerald-100 mb-8">Professional invoices for freelancers and small businesses.</p>
        <div className="grid grid-cols-2 gap-4 text-left">
          <button onClick={()=>start(false)} className="bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-2xl p-6 text-white">
            <div className="text-2xl mb-2">📋</div><div className="font-semibold">Start Empty</div>
            <div className="text-emerald-200 text-sm mt-1">Add your own clients and invoices</div>
          </button>
          <button onClick={()=>start(true)} className="bg-white rounded-2xl p-6 text-left hover:bg-emerald-50">
            <div className="text-2xl mb-2">✨</div><div className="font-semibold text-emerald-700">Explore Sample Workspace</div>
            <div className="text-emerald-600 text-sm mt-1">3 clients, 4 invoices preloaded</div>
            <div className="text-emerald-400 text-xs mt-2">Sample data · Clearly labelled · Remove anytime</div>
          </button>
        </div>
        <p className="text-emerald-300 text-xs mt-4">One-time paid app · No subscription · Fully unlocked</p>
      </div>
    </div>
  );

  const Nav=({id,label}:{id:Page;label:string})=>(
    <button onClick={()=>setPage(id)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${page===id?'text-white':'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`} style={page===id?{backgroundColor:ACCENT}:{}}>{label}</button>
  );

  return(
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{backgroundColor:ACCENT}}>💼</div>
          <nav className="flex gap-1">
            {(['dashboard','invoices','clients','reports','settings','help'] as Page[]).map(p=><Nav key={p} id={p} label={p.charAt(0).toUpperCase()+p.slice(1)}/>)}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setTheme((t:string)=>t==='dark'?'light':'dark')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">{theme==='dark'?'☀️':'🌙'}</button>
          {page==='invoices'&&<button onClick={openNewInv} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{backgroundColor:ACCENT}}><Plus size={15}/>New Invoice</button>}
          {page==='clients'&&<button onClick={()=>{setEditClient(null);setClientForm({name:'',email:'',phone:'',address:''});setModal('client');}} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{backgroundColor:ACCENT}}><Plus size={15}/>Add Client</button>}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {page==='dashboard'&&(<>
          {stats.hasSample&&<div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3"><span className="text-amber-700 dark:text-amber-400 text-sm">✦ Sample workspace loaded</span><button onClick={()=>setData(d=>({...d,invoices:d.invoices.filter(i=>!i.isSample),clients:d.clients.filter(c=>!c.isSample)}))} className="text-xs text-amber-600 underline">Remove</button></div>}
          <div className="grid grid-cols-4 gap-4">
            {[
              {label:'Total Revenue',val:fmt(stats.revenue),icon:<DollarSign size={20}/>,color:'green'},
              {label:'Unpaid',val:fmt(stats.unpaid),icon:<Clock size={20}/>,color:'blue'},
              {label:'Overdue',val:stats.overdue,icon:<AlertCircle size={20}/>,color:'red'},
              {label:'Drafts',val:stats.drafts,icon:<Edit3 size={20}/>,color:'gray'},
            ].map(s=>(
              <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="text-gray-400 mb-2">{s.icon}</div>
                <div className="text-2xl font-bold">{s.val}</div>
                <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold">Recent Invoices</h2>
              <button onClick={()=>setPage('invoices')} className="text-sm underline" style={{color:ACCENT}}>View all</button>
            </div>
            {data.invoices.slice(0,5).map(inv=>(
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{inv.number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle(inv.status)}`}>{inv.status}</span>
                    {inv.isSample&&<span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">✦ Sample</span>}
                  </div>
                  <p className="text-xs text-gray-400">{clientName(inv.clientId)} · Due {inv.dueDate||'—'}</p>
                </div>
                <span className="font-semibold text-sm">{fmt(total(inv.items,inv.taxRate))}</span>
              </div>
            ))}
            {data.invoices.length===0&&<div className="py-10 text-center text-gray-400"><p>No invoices yet</p><button onClick={openNewInv} className="mt-3 px-4 py-2 rounded-xl text-white text-sm" style={{backgroundColor:ACCENT}}>Create First Invoice</button></div>}
          </div>
        </>)}

        {page==='invoices'&&(<>
          <div className="flex gap-3">
            <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search invoices…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none"/></div>
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm hover:bg-gray-50"><Download size={14}/>CSV</button>
          </div>
          {filtered.length===0?(
            <div className="text-center py-16"><div className="text-5xl mb-4">📄</div><p className="font-semibold text-lg mb-5">No invoices yet</p><button onClick={openNewInv} className="px-5 py-2.5 rounded-xl text-white font-medium" style={{backgroundColor:ACCENT}}>Create Invoice</button></div>
          ):(
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map(inv=>(
                <div key={inv.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{inv.number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle(inv.status)}`}>{inv.status}</span>
                      {inv.isSample&&<span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">✦ Sample</span>}
                    </div>
                    <p className="text-xs text-gray-400">{clientName(inv.clientId)} · {inv.date} · {inv.items.length} item{inv.items.length!==1?'s':''}</p>
                  </div>
                  <span className="font-bold">{fmt(total(inv.items,inv.taxRate))}</span>
                  <div className="flex gap-1">
                    <button onClick={()=>openEditInv(inv)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><Edit3 size={15}/></button>
                    <button onClick={()=>delInv(inv.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={15}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {page==='clients'&&(<>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
            {data.clients.length===0&&<div className="py-12 text-center text-gray-400"><p className="mb-4">No clients yet</p><button onClick={()=>{setEditClient(null);setClientForm({name:'',email:'',phone:'',address:''});setModal('client');}} className="px-4 py-2 rounded-xl text-white text-sm" style={{backgroundColor:ACCENT}}>Add Client</button></div>}
            {data.clients.map(c=>(
              <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{backgroundColor:ACCENT}}>{c.name.charAt(0)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="font-medium text-sm">{c.name}</span>{c.isSample&&<span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">✦ Sample</span>}</div>
                  <p className="text-xs text-gray-400">{c.email} · {c.phone}</p>
                </div>
                <span className="text-xs text-gray-400">{data.invoices.filter(i=>i.clientId===c.id).length} invoices</span>
                <div className="flex gap-1">
                  <button onClick={()=>{setEditClient(c);setClientForm({name:c.name,email:c.email,phone:c.phone,address:c.address});setModal('client');}} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><Edit3 size={15}/></button>
                  <button onClick={()=>delClient(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={15}/></button>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {page==='reports'&&(
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {(['paid','sent','overdue'] as Status[]).map(s=>{
                const invs=data.invoices.filter(i=>i.status===s);
                const tot=invs.reduce((acc,i)=>acc+total(i.items,i.taxRate),0);
                return(
                  <div key={s} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                    <div className={`text-xs px-2 py-0.5 rounded-full inline-block mb-3 ${statusStyle(s)}`}>{s}</div>
                    <div className="text-2xl font-bold">{fmt(tot)}</div>
                    <div className="text-sm text-gray-500">{invs.length} invoice{invs.length!==1?'s':''}</div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold mb-3">Top Clients by Revenue</h3>
              {data.clients.map(c=>{
                const rev=data.invoices.filter(i=>i.clientId===c.id&&i.status==='paid').reduce((s,i)=>s+total(i.items,i.taxRate),0);
                return rev>0&&(<div key={c.id} className="flex items-center gap-3 py-2"><span className="flex-1 text-sm">{c.name}</span><span className="font-semibold">{fmt(rev)}</span></div>);
              })}
            </div>
          </div>
        )}

        {page==='settings'&&(
          <div className="max-w-lg space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold mb-3">Theme</h3>
              <div className="flex gap-2">
                {['light','dark','system'].map(t=><button key={t} onClick={()=>setTheme(t)} className={`px-4 py-2 rounded-xl border text-sm capitalize ${theme===t?'text-white border-transparent':'border-gray-200 dark:border-gray-700'}`} style={theme===t?{backgroundColor:ACCENT}:{}}>{t}</button>)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-gray-500">Invoice Maker Pro · v1.0</p>
              <p className="text-sm text-green-600 mt-1">✓ One-time paid app · No subscription · Fully unlocked</p>
            </div>
          </div>
        )}

        {page==='help'&&(
          <div className="max-w-2xl space-y-3">
            {[['How do I create an invoice?','Go to Invoices, click "New Invoice", select a client, add line items with quantity and rate. The total is calculated automatically.'],['How do I add tax?','Set the tax rate (%) when creating an invoice. The app calculates subtotal + tax.'],['Can I track overdue invoices?','Set the due date on each invoice. Manually mark as Overdue when payment is not received.'],['How do I export?','Use the CSV export button on the Invoices page.']].map(([q,a],i)=>(
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                <p className="font-medium text-sm mb-1">{q}</p><p className="text-sm text-gray-500">{a}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Invoice Modal */}
      {modal==='invoice'&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setModal(null)}/>
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{editInv?'Edit Invoice':'New Invoice'}</h3>
              <button onClick={()=>setModal(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><X size={18}/></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Client</label>
                  <select value={invForm.clientId} onChange={e=>setInvForm(f=>({...f,clientId:e.target.value}))} className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    <option value="">Select client</option>
                    {data.clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
                  <select value={invForm.status} onChange={e=>setInvForm(f=>({...f,status:e.target.value as Status}))} className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                    {(['draft','sent','paid','overdue'] as Status[]).map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Date</label><input type="date" value={invForm.date} onChange={e=>setInvForm(f=>({...f,date:e.target.value}))} className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"/></div>
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Due Date</label><input type="date" value={invForm.dueDate} onChange={e=>setInvForm(f=>({...f,dueDate:e.target.value}))} className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"/></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Line Items</label>
                <div className="space-y-2">
                  {invItems.map((item,i)=>(
                    <div key={item.id} className="flex gap-2 items-center">
                      <input value={item.description} onChange={e=>{const ni=[...invItems];ni[i]={...ni[i],description:e.target.value};setInvItems(ni);}} placeholder="Description" className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"/>
                      <input type="number" value={item.qty} onChange={e=>{const ni=[...invItems];ni[i]={...ni[i],qty:+e.target.value};setInvItems(ni);}} className="w-16 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center" placeholder="Qty"/>
                      <input type="number" value={item.rate} onChange={e=>{const ni=[...invItems];ni[i]={...ni[i],rate:+e.target.value};setInvItems(ni);}} className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" placeholder="Rate"/>
                      <span className="text-sm font-medium w-20 text-right">{fmt(item.qty*item.rate)}</span>
                      {invItems.length>1&&<button onClick={()=>setInvItems(invItems.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-500"><X size={14}/></button>}
                    </div>
                  ))}
                  <button onClick={()=>setInvItems([...invItems,{id:uid(),description:'',qty:1,rate:0}])} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-1"><Plus size={13}/>Add item</button>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tax %</label>
                  <input type="number" value={invForm.taxRate} onChange={e=>setInvForm(f=>({...f,taxRate:+e.target.value}))} className="w-24 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"/>
                </div>
                <div className="flex-1 text-right">
                  <div className="text-sm text-gray-400">Subtotal: {fmt(subtotal(invItems))}</div>
                  <div className="text-lg font-bold" style={{color:ACCENT}}>Total: {fmt(total(invItems,invForm.taxRate))}</div>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Notes</label>
                <textarea value={invForm.notes} onChange={e=>setInvForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none"/>
              </div>
              <div className="flex gap-3"><button onClick={()=>setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm">Cancel</button><button onClick={saveInv} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{backgroundColor:ACCENT}}>Save Invoice</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Client Modal */}
      {modal==='client'&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setModal(null)}/>
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{editClient?'Edit Client':'Add Client'}</h3>
              <button onClick={()=>setModal(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><X size={18}/></button>
            </div>
            <div className="space-y-4">
              {[{label:'Name',key:'name'},{label:'Email',key:'email'},{label:'Phone',key:'phone'},{label:'Address',key:'address'}].map(({label,key})=>(
                <div key={key}><label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
                  <input value={clientForm[key as keyof typeof clientForm]} onChange={e=>setClientForm(f=>({...f,[key]:e.target.value}))} className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2"/>
                </div>
              ))}
              <div className="flex gap-3"><button onClick={()=>setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm">Cancel</button><button onClick={saveClient} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium" style={{backgroundColor:ACCENT}}>Save Client</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
