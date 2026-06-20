import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Play, CheckCircle2, XCircle, Clock, Factory, Save } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function ManufacturingPage() {
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
      const [o, p] = await Promise.all([api.get('/manufacturing'), api.get('/products')]);
      setOrders(o.data); setProducts(p.data.filter(p=>p.procurement_type==='MANUFACTURING'));
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try { await api.post('/manufacturing', form); toast.success('MO created!'); setShowCreate(false); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleAction = async (id, action, msg) => {
    try { await api.patch(`/manufacturing/${id}/${action}`); toast.success(msg); load(); }
    catch (err) { toast.error(err.response?.data?.error || `Failed to ${action}`); }
  };

  const filtered = orders.filter(o => {
    const ms = (o.product_name||'').toLowerCase().includes(search.toLowerCase());
    return ms && (statusFilter==='ALL' || o.status===statusFilter);
  });

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <Toast toasts={toast.toasts} />

      <div className="kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        {[
          { label:'Total MOs',     value:orders.length,                                           color:'teal',   icon:<Factory size={18}/> },
          { label:'Draft',         value:orders.filter(o=>o.status==='DRAFT').length,              color:'purple', icon:<Clock size={18}/> },
          { label:'In Progress',   value:orders.filter(o=>o.status==='IN_PROGRESS').length,        color:'orange', icon:<Play size={18}/> },
          { label:'Completed',     value:orders.filter(o=>o.status==='COMPLETED').length,          color:'green',  icon:<CheckCircle2 size={18}/> },
        ].map((k,i)=>(
          <motion.div key={k.label} className={`kpi-card ${k.color}`}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} whileHover={{ scale:1.03 }}>
            <div className="kpi-icon">{k.icon}</div><div className="kpi-value">{k.value}</div><div className="kpi-label">{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Steps guide */}
      <motion.div className="glass-card" style={{ padding:20, marginBottom:24, display:'flex', gap:0 }} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
        {[
          { step:'1', label:'Create MO', desc:'Select product + qty', color:'var(--accent-purple)' },
          { step:'2', label:'Start',     desc:'Reserve components', color:'var(--accent-orange)' },
          { step:'3', label:'Complete',  desc:'Add finished goods to stock', color:'var(--accent-green)' },
        ].map((s,i)=>(
          <div key={i} style={{ flex:1, textAlign:'center', position:'relative', padding:'0 16px' }}>
            {i<2&&<div style={{ position:'absolute', right:0, top:16, fontSize:18, color:'var(--accent-teal)', fontWeight:700 }}>→</div>}
            <div style={{ width:36, height:36, borderRadius:'50%', background:s.color, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', fontWeight:900, color:'white' }}>{s.step}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{s.label}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{s.desc}</div>
          </div>
        ))}
      </motion.div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft:34 }} placeholder="Search product..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {['ALL','DRAFT','IN_PROGRESS','COMPLETED','CANCELLED'].map(s=>(
          <button key={s} className={`btn btn-sm ${statusFilter===s?'btn-primary':'btn-ghost'}`} onClick={()=>setStatusFilter(s)}>{s==='ALL'?'All':s.replace('_',' ')}</button>
        ))}
        <motion.button className="btn btn-primary btn-sm" onClick={()=>setShowCreate(true)} whileHover={{ scale:1.03 }}><Plus size={14}/> New MO</motion.button>
      </div>

      <motion.div className="table-container" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div className="table-header"><span className="table-title"><Factory size={15} style={{ display:'inline', marginRight:8 }}/>Manufacturing Orders ({filtered.length})</span></div>
        <table>
          <thead><tr><th>MO #</th><th>Product</th><th>Status</th><th>Qty</th><th>Planned Start</th><th>Actions</th><th/></tr></thead>
          <tbody>
            {filtered.length===0
              ? <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No MOs found</td></tr>
              : filtered.map((o,i)=>{
                  const isExp=expanded===o.id;
                  const comps=(o.components||[]);
                  return (
                    <AnimatePresence key={o.id}>
                      <motion.tr initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.04 }}>
                        <td style={{ fontWeight:700, color:'var(--accent-purple)' }}>MO-{String(o.id).padStart(4,'0')}</td>
                        <td style={{ fontWeight:700 }}>{o.product_name}</td>
                        <td><Badge status={o.status}/></td>
                        <td style={{ fontWeight:700 }}>{o.quantity}</td>
                        <td style={{ color:'var(--text-muted)', fontSize:12 }}>{o.planned_start_date?new Date(o.planned_start_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                        <td>
                          <div style={{ display:'flex', gap:5 }}>
                            {o.status==='DRAFT'&&<><motion.button className="btn btn-warning btn-xs" whileHover={{ scale:1.05 }} onClick={()=>handleAction(o.id,'start','▶️ MO Started!')}><Play size={12}/> Start</motion.button><motion.button className="btn btn-ghost btn-xs" whileHover={{ scale:1.05 }} onClick={()=>handleAction(o.id,'cancel','Cancelled')} style={{ color:'var(--accent-red)' }}><XCircle size={12}/></motion.button></>}
                            {o.status==='IN_PROGRESS'&&<motion.button className="btn btn-success btn-xs" whileHover={{ scale:1.05 }} onClick={()=>handleAction(o.id,'complete','✅ Completed!')}><CheckCircle2 size={12}/> Complete</motion.button>}
                            {['COMPLETED','CANCELLED'].includes(o.status)&&<span style={{ fontSize:12, color:'var(--text-muted)' }}>—</span>}
                          </div>
                        </td>
                        <td><button onClick={()=>setExpanded(isExp?null:o.id)} style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:4 }}>{isExp?'▲':'▼'}</button></td>
                      </motion.tr>
                      {isExp&&comps.length>0&&(
                        <motion.tr initial={{ opacity:0 }} animate={{ opacity:1 }}>
                          <td colSpan={7} style={{ background:'rgba(20,184,166,0.03)', padding:'12px 22px' }}>
                            <div style={{ fontSize:12, fontWeight:700, color:'var(--accent-teal)', marginBottom:8 }}>🔩 BoM Components</div>
                            {comps.map((c,ci)=>{
                              const need=c.quantity_needed||c.quantity;
                              const stock=c.on_hand_qty||0;
                              const ok=stock>=need;
                              return (
                                <div key={ci} style={{ display:'flex', gap:12, fontSize:13, marginBottom:6, alignItems:'center' }}>
                                  <span style={{ fontWeight:600 }}>{c.component_name}</span>
                                  <span style={{ color:'var(--text-muted)' }}>Need: {need}</span>
                                  <span style={{ fontWeight:600, color:ok?'var(--accent-green)':'var(--accent-red)' }}>Stock: {stock} {ok?'✅':'⚠️'}</span>
                                </div>
                              );
                            })}
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  );
              })
            }
          </tbody>
        </table>
      </motion.div>

      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="🏭 New Manufacturing Order">
        <CreateMOForm products={products} onSave={handleCreate} onCancel={()=>setShowCreate(false)} saving={saving} />
      </Modal>
    </div>
  );
}

function CreateMOForm({ products, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ product_id:'', quantity:1, planned_start_date:'', planned_end_date:'' });
  const set = (k,v)=>setForm(f=>({...f,[k]:v}));
  const handleSave = () => {
    if (!form.product_id) return alert('Select a product');
    if (Number(form.quantity)<1) return alert('Quantity must be ≥ 1');
    onSave({ ...form, product_id:Number(form.product_id), quantity:Number(form.quantity) });
  };
  return (
    <div>
      <div className="form-group"><label className="form-label">Product (Manufacturing type only) *</label>
        <select className="form-select" value={form.product_id} onChange={e=>set('product_id',e.target.value)}>
          <option value="">Select product...</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Quantity *</label><input className="form-input" type="number" min="1" value={form.quantity} onChange={e=>set('quantity',e.target.value)} /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Planned Start</label><input className="form-input" type="date" value={form.planned_start_date} onChange={e=>set('planned_start_date',e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Planned End</label><input className="form-input" type="date" value={form.planned_end_date} onChange={e=>set('planned_end_date',e.target.value)} /></div>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <motion.button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} whileHover={{ scale:1.02 }}><Save size={13}/> {saving?'Creating...':'Create MO'}</motion.button>
      </div>
    </div>
  );
}
