import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

const EMPTY = { name:'', sales_price:'', cost_price:'', on_hand_qty:0, procurement_type:'PURCHASE', procurement_strategy:'MTS', bom_components:[], bom_operations:[] };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving]     = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/products'); setProducts(data); }
    catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form, isEdit) => {
    setSaving(true);
    try {
      if (isEdit) await api.put(`/products/${editProduct.id}`, form);
      else await api.post('/products', form);
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      setShowCreate(false); setEditProduct(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try { await api.delete(`/products/${p.id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  const filtered = products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const mt = typeFilter === 'ALL' || p.procurement_type === typeFilter;
    return ms && mt;
  });

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <Toast toasts={toast.toasts} />

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: products.length, color: 'teal' },
          { label: 'Purchase Type',  value: products.filter(p=>p.procurement_type==='PURCHASE').length, color: 'cyan' },
          { label: 'Mfg. Type',      value: products.filter(p=>p.procurement_type==='MANUFACTURING').length, color: 'purple' },
          { label: 'Low Stock ≤10',  value: products.filter(p=>p.on_hand_qty<=10).length, color: 'red' },
        ].map((k,i) => (
          <motion.div key={k.label} className={`kpi-card ${k.color}`}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} whileHover={{ scale:1.03 }}>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft:34 }} placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {['ALL','PURCHASE','MANUFACTURING'].map(t => (
          <button key={t} className={`btn btn-sm ${typeFilter===t?'btn-primary':'btn-ghost'}`} onClick={()=>setTypeFilter(t)}>{t==='ALL'?'All Types':t}</button>
        ))}
        <motion.button className="btn btn-primary btn-sm" onClick={()=>setShowCreate(true)} whileHover={{ scale:1.03 }}>
          <Plus size={14} /> New Product
        </motion.button>
      </div>

      {/* Table */}
      <motion.div className="table-container" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div className="table-header"><span className="table-title">Products ({filtered.length})</span></div>
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Strategy</th><th>Cost Price</th><th>Sales Price</th><th>On Hand</th><th>Reserved</th><th>Available</th><th>Actions</th><th /></tr></thead>
          <tbody>
            {filtered.map((p,i) => (
              <AnimatePresence key={p.id}>
                <motion.tr initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.04 }}>
                  <td style={{ fontWeight:700 }}>{p.name}</td>
                  <td><Badge status={p.procurement_type} /></td>
                  <td><span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(20,184,166,0.1)', color:'var(--accent-teal)', fontWeight:600 }}>{p.procurement_strategy}</span></td>
                  <td>₹{Number(p.cost_price).toLocaleString()}</td>
                  <td style={{ color:'var(--accent-green)', fontWeight:600 }}>₹{Number(p.sales_price).toLocaleString()}</td>
                  <td style={{ fontWeight:700, color: p.on_hand_qty<=10?'var(--accent-red)':'var(--text-primary)' }}>{p.on_hand_qty}</td>
                  <td style={{ color:'var(--accent-orange)' }}>{p.reserved_qty}</td>
                  <td style={{ fontWeight:700, color:(p.on_hand_qty-p.reserved_qty)<=0?'var(--accent-red)':'var(--accent-green)' }}>{p.on_hand_qty-p.reserved_qty}</td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <motion.button className="btn btn-ghost btn-xs" title="Edit" whileHover={{ scale:1.1 }} onClick={()=>setEditProduct(p)}><Edit2 size={12}/></motion.button>
                      <motion.button className="btn btn-ghost btn-xs" title="Delete" whileHover={{ scale:1.1 }} onClick={()=>handleDelete(p)} style={{ color:'var(--accent-red)' }}><Trash2 size={12}/></motion.button>
                    </div>
                  </td>
                  <td>
                    <button onClick={()=>setExpanded(expanded===p.id?null:p.id)} style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:4 }}>
                      {expanded===p.id?<ChevronUp size={15}/>:<ChevronDown size={15}/>}
                    </button>
                  </td>
                </motion.tr>
                {expanded===p.id && (
                  <motion.tr initial={{ opacity:0 }} animate={{ opacity:1 }}>
                    <td colSpan={10} style={{ background:'rgba(20,184,166,0.03)', padding:'14px 22px' }}>
                      {(p.bom_components||[]).length === 0
                        ? <div style={{ color:'var(--text-muted)', fontSize:13 }}>No BoM defined. Edit product to add components.</div>
                        : <div>
                            <div style={{ fontSize:12, fontWeight:700, color:'var(--accent-teal)', marginBottom:10 }}>📋 Bill of Materials</div>
                            {p.bom_components.map((c,ci) => (
                              <div key={ci} style={{ display:'flex', gap:12, fontSize:13, marginBottom:6 }}>
                                <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{c.component_name}</span>
                                <span style={{ color:'var(--text-muted)' }}>× {c.quantity}</span>
                              </div>
                            ))}
                          </div>}
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            ))}
          </tbody>
        </table>
      </motion.div>

      <Modal isOpen={showCreate||!!editProduct} onClose={()=>{ setShowCreate(false); setEditProduct(null); }} title={editProduct?`✏️ Edit: ${editProduct.name}`:'📦 New Product'}>
        <ProductForm initial={editProduct} products={products} onSave={f=>handleSave(f,!!editProduct)} onCancel={()=>{ setShowCreate(false); setEditProduct(null); }} saving={saving} />
      </Modal>
    </div>
  );
}

function ProductForm({ initial, products, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [comps, setComps] = useState(initial?.bom_components?.map(c=>({ product_id:c.component_id||'', quantity:c.quantity })) || []);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const addComp = () => setComps(c=>[...c,{ product_id:'', quantity:1 }]);
  const removeComp = i => setComps(c=>c.filter((_,idx)=>idx!==i));
  const updateComp = (i,k,v) => { const a=[...comps]; a[i]={...a[i],[k]:v}; setComps(a); };

  const handleSave = () => {
    if (!form.name.trim()) return alert('Name required');
    onSave({ ...form, bom_components: comps.filter(c=>c.product_id).map(c=>({product_id:Number(c.product_id),quantity:Number(c.quantity)})) });
  };

  return (
    <div>
      <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Cost Price (₹) *</label><input className="form-input" type="number" value={form.cost_price} onChange={e=>set('cost_price',e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Sales Price (₹) *</label><input className="form-input" type="number" value={form.sales_price} onChange={e=>set('sales_price',e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Procurement Type</label>
          <select className="form-select" value={form.procurement_type} onChange={e=>set('procurement_type',e.target.value)}>
            <option value="PURCHASE">PURCHASE</option><option value="MANUFACTURING">MANUFACTURING</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Strategy</label>
          <select className="form-select" value={form.procurement_strategy} onChange={e=>set('procurement_strategy',e.target.value)}>
            <option value="MTS">MTS — Make To Stock</option><option value="MTO">MTO — Make To Order</option>
          </select>
        </div>
      </div>
      <div className="form-group"><label className="form-label">Initial Qty (On Hand)</label><input className="form-input" type="number" value={form.on_hand_qty} onChange={e=>set('on_hand_qty',e.target.value)} /></div>

      {form.procurement_type === 'MANUFACTURING' && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <label className="form-label" style={{ margin:0 }}>BoM Components</label>
            <button className="btn btn-ghost btn-xs" onClick={addComp}><Plus size={12}/> Add</button>
          </div>
          {comps.map((c,i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 90px 30px', gap:8, marginBottom:6 }}>
              <select className="form-select" value={c.product_id} onChange={e=>updateComp(i,'product_id',e.target.value)}>
                <option value="">Select component</option>
                {products.filter(p=>p.procurement_type==='PURCHASE').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="form-input" type="number" min="1" value={c.quantity} onChange={e=>updateComp(i,'quantity',e.target.value)} />
              <button onClick={()=>removeComp(i)} style={{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:6,color:'var(--accent-red)',cursor:'pointer' }}><X size={12}/></button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <motion.button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} whileHover={{ scale:1.02 }}>
          <Save size={13}/> {saving?'Saving...':initial?'Update':'Create'}
        </motion.button>
      </div>
    </div>
  );
}
