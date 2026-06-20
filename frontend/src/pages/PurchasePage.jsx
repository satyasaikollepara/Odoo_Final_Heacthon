import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, CheckCircle2, XCircle, Package, Clock, Truck, Save, X } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function PurchasePage() {
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving]     = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [o, p] = await Promise.all([api.get('/purchase'), api.get('/products')]);
      setOrders(o.data); setProducts(p.data.filter(p=>p.procurement_type==='PURCHASE'));
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try { await api.post('/purchase', form); toast.success('PO created!'); setShowCreate(false); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleAction = async (id, action, msg) => {
    try { await api.patch(`/purchase/${id}/${action}`); toast.success(msg); load(); }
    catch (err) { toast.error(err.response?.data?.error || `Failed to ${action}`); }
  };

  const filtered = orders.filter(o => {
    const ms = o.vendor_name?.toLowerCase().includes(search.toLowerCase());
    return ms && (statusFilter==='ALL' || o.status===statusFilter);
  });

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <Toast toasts={toast.toasts} />

      <div className="kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        {[
          { label:'Total POs',  value:orders.length,                                          color:'teal',   icon:<Truck size={18}/> },
          { label:'Draft',      value:orders.filter(o=>o.status==='DRAFT').length,             color:'purple', icon:<Clock size={18}/> },
          { label:'Confirmed',  value:orders.filter(o=>o.status==='CONFIRMED').length,         color:'cyan',   icon:<CheckCircle2 size={18}/> },
          { label:'Received',   value:orders.filter(o=>o.status==='RECEIVED').length,          color:'green',  icon:<Package size={18}/> },
        ].map((k,i)=>(
          <motion.div key={k.label} className={`kpi-card ${k.color}`}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} whileHover={{ scale:1.03 }}>
            <div className="kpi-icon">{k.icon}</div><div className="kpi-value">{k.value}</div><div className="kpi-label">{k.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft:34 }} placeholder="Search vendor..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {['ALL','DRAFT','CONFIRMED','RECEIVED','CANCELLED'].map(s=>(
          <button key={s} className={`btn btn-sm ${statusFilter===s?'btn-primary':'btn-ghost'}`} onClick={()=>setStatusFilter(s)}>{s==='ALL'?'All':s}</button>
        ))}
        <motion.button className="btn btn-primary btn-sm" onClick={()=>setShowCreate(true)} whileHover={{ scale:1.03 }}><Plus size={14}/> New PO</motion.button>
      </div>

      <motion.div className="table-container" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div className="table-header"><span className="table-title"><Truck size={15} style={{ display:'inline', marginRight:8 }}/>Purchase Orders ({filtered.length})</span></div>
        <table>
          <thead><tr><th>PO #</th><th>Vendor</th><th>Status</th><th>Items</th><th>Total Cost</th><th>Date</th><th>Actions</th><th/></tr></thead>
          <tbody>
            {filtered.length===0
              ? <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No POs found</td></tr>
              : filtered.map((o,i)=>{
                  const items=(o.items||[]).filter(it=>it.product_id);
                  const total=items.reduce((s,it)=>s+Number(it.cost_price||0)*Number(it.quantity),0);
                  const isExp=expanded===o.id;
                  return (
                    <AnimatePresence key={o.id}>
                      <motion.tr initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.04 }}>
                        <td style={{ fontWeight:700, color:'var(--accent-cyan)' }}>PO-{String(o.id).padStart(4,'0')}</td>
                        <td>{o.vendor_name}</td>
                        <td><Badge status={o.status}/></td>
                        <td style={{ color:'var(--text-secondary)' }}>{items.length}</td>
                        <td style={{ color:'var(--accent-teal)', fontWeight:600 }}>₹{total.toLocaleString('en-IN')}</td>
                        <td style={{ color:'var(--text-muted)', fontSize:12 }}>{new Date(o.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                        <td>
                          <div style={{ display:'flex', gap:5 }}>
                            {o.status==='DRAFT'&&<><motion.button className="btn btn-primary btn-xs" whileHover={{ scale:1.05 }} onClick={()=>handleAction(o.id,'confirm','✅ PO Confirmed!')}><CheckCircle2 size={12}/> Confirm</motion.button><motion.button className="btn btn-ghost btn-xs" whileHover={{ scale:1.05 }} onClick={()=>handleAction(o.id,'cancel','Cancelled')} style={{ color:'var(--accent-red)' }}><XCircle size={12}/></motion.button></>}
                            {o.status==='CONFIRMED'&&<motion.button className="btn btn-success btn-xs" whileHover={{ scale:1.05 }} onClick={()=>handleAction(o.id,'receive','📦 Stock received!')}><Package size={12}/> Receive</motion.button>}
                            {['RECEIVED','CANCELLED'].includes(o.status)&&<span style={{ fontSize:12, color:'var(--text-muted)' }}>—</span>}
                          </div>
                        </td>
                        <td><button onClick={()=>setExpanded(isExp?null:o.id)} style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:4 }}>{isExp?'▲':'▼'}</button></td>
                      </motion.tr>
                      {isExp&&<motion.tr initial={{ opacity:0 }} animate={{ opacity:1 }}><td colSpan={8} style={{ background:'rgba(20,184,166,0.03)', padding:'12px 22px' }}>
                        {items.map((it,j)=><div key={j} style={{ fontSize:13, color:'var(--text-secondary)', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{it.product_name} × {it.quantity} @ ₹{Number(it.cost_price||0).toLocaleString()} = ₹{(Number(it.cost_price||0)*Number(it.quantity)).toLocaleString()}</div>)}
                      </td></motion.tr>}
                    </AnimatePresence>
                  );
              })
            }
          </tbody>
        </table>
      </motion.div>

      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="🚛 New Purchase Order">
        <CreatePOForm products={products} onSave={handleCreate} onCancel={()=>setShowCreate(false)} saving={saving} />
      </Modal>
    </div>
  );
}

function CreatePOForm({ products, onSave, onCancel, saving }) {
  const [vendor, setVendor] = useState('');
  const [items, setItems] = useState([{ product_id:'', quantity:1 }]);
  const addItem = ()=>setItems(it=>[...it,{ product_id:'', quantity:1 }]);
  const removeItem = i=>setItems(it=>it.filter((_,idx)=>idx!==i));
  const updateItem = (i,k,v)=>{ const a=[...items]; a[i]={...a[i],[k]:v}; setItems(a); };
  const getProduct = id=>products.find(p=>p.id===Number(id));
  const total = items.reduce((s,it)=>{ const p=getProduct(it.product_id); return s+(p?Number(p.cost_price)*Number(it.quantity):0); },0);

  const handleSave = () => {
    if (!vendor.trim()) return alert('Vendor name required');
    if (items.some(i=>!i.product_id)) return alert('Select product for all items');
    onSave({ vendor_name:vendor, items:items.map(i=>({ product_id:Number(i.product_id), quantity:Number(i.quantity) })) });
  };

  return (
    <div>
      <div className="form-group"><label className="form-label">Vendor Name *</label><input className="form-input" value={vendor} onChange={e=>setVendor(e.target.value)} placeholder="Vendor name" /></div>
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}><label className="form-label" style={{ margin:0 }}>Items *</label><button className="btn btn-ghost btn-xs" onClick={addItem}><Plus size={12}/> Add</button></div>
        {items.map((item,i)=>{
          const p=getProduct(item.product_id);
          return (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 80px 100px 30px', gap:8, marginBottom:8, alignItems:'center' }}>
              <select className="form-select" value={item.product_id} onChange={e=>updateItem(i,'product_id',e.target.value)}>
                <option value="">Select...</option>
                {products.map(prod=><option key={prod.id} value={prod.id}>{prod.name} (₹{Number(prod.cost_price).toLocaleString()})</option>)}
              </select>
              <input className="form-input" type="number" min="1" value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)} />
              <div style={{ fontSize:13, color:'var(--accent-teal)', fontWeight:600 }}>₹{(p?Number(p.cost_price)*Number(item.quantity):0).toLocaleString()}</div>
              <button onClick={()=>removeItem(i)} disabled={items.length===1} style={{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:6,color:items.length===1?'var(--text-muted)':'var(--accent-red)',cursor:items.length===1?'not-allowed':'pointer',width:30,height:36,display:'flex',alignItems:'center',justifyContent:'center' }}><X size={12}/></button>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'rgba(20,184,166,0.08)', border:'1px solid rgba(20,184,166,0.2)', borderRadius:10, marginBottom:18 }}>
        <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Total Cost</span>
        <span style={{ color:'var(--accent-teal)', fontWeight:700 }}>₹{total.toLocaleString('en-IN')}</span>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <motion.button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} whileHover={{ scale:1.02 }}><Save size={13}/> {saving?'Creating...':'Create PO'}</motion.button>
      </div>
    </div>
  );
}
