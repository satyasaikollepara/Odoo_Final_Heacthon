import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Layers, ArrowUpCircle, ArrowDownCircle, RefreshCw, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

const ttStyle = { background:'#071412', border:'1px solid rgba(20,184,166,0.2)', borderRadius:8, color:'#e2fef8', fontSize:12 };

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [ledger, setLedger]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [tab, setTab]           = useState('inventory');
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [inv, led] = await Promise.all([api.get('/dashboard/inventory'), api.get('/dashboard/stock-ledger')]);
      setProducts(inv.data); setLedger(led.data);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalUnits  = products.reduce((s,p)=>s+p.on_hand_qty,0);
  const reserved    = products.reduce((s,p)=>s+p.reserved_qty,0);
  const stockValue  = products.reduce((s,p)=>s+Number(p.cost_price)*p.on_hand_qty,0);
  const lowStock    = products.filter(p=>p.on_hand_qty<=10).length;

  const filtered = products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));

  const chartData = products.filter(p=>p.on_hand_qty>0).slice(0,10).map(p=>({
    name: p.name.length>12?p.name.slice(0,12)+'…':p.name,
    available: p.on_hand_qty-p.reserved_qty,
    reserved: p.reserved_qty,
  }));

  const getStatus = p => {
    if (p.on_hand_qty===0) return { label:'Out of Stock', color:'var(--accent-red)', bg:'rgba(239,68,68,0.12)' };
    if (p.on_hand_qty<=5)  return { label:'Critical', color:'var(--accent-red)', bg:'rgba(239,68,68,0.12)' };
    if (p.on_hand_qty<=10) return { label:'Low', color:'var(--accent-orange)', bg:'rgba(245,158,11,0.12)' };
    return { label:'OK', color:'var(--accent-green)', bg:'rgba(16,185,129,0.12)' };
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <Toast toasts={toast.toasts} />

      <div className="kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        {[
          { label:'Total Units',  value:totalUnits,                                    color:'teal',   icon:<Package size={18}/> },
          { label:'Available',    value:totalUnits-reserved,                            color:'green',  icon:<TrendingUp size={18}/> },
          { label:'Reserved',     value:reserved,                                       color:'orange', icon:<Layers size={18}/> },
          { label:'Low Stock ≤10',value:lowStock,                                       color:'red',    icon:<AlertTriangle size={18}/> },
        ].map((k,i)=>(
          <motion.div key={k.label} className={`kpi-card ${k.color}`}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} whileHover={{ scale:1.03 }}>
            <div className="kpi-icon">{k.icon}</div><div className="kpi-value">{k.value}</div><div className="kpi-label">{k.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div className="chart-wrapper" style={{ marginBottom:24 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}>
        <div className="chart-title">Stock Levels by Product</div>
        <div className="chart-subtitle">Available vs Reserved units</div>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#475569" fontSize={11} />
            <YAxis stroke="#475569" fontSize={11} />
            <Tooltip contentStyle={ttStyle} />
            <Bar dataKey="available" name="Available" fill="#10b981" radius={[4,4,0,0]} stackId="a" />
            <Bar dataKey="reserved"  name="Reserved"  fill="#f59e0b" radius={[4,4,0,0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
        <button className={`btn btn-sm ${tab==='inventory'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('inventory')}><Layers size={13}/> Inventory</button>
        <button className={`btn btn-sm ${tab==='ledger'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('ledger')}>📋 Stock Ledger ({ledger.length})</button>
        <div style={{ flex:1 }} />
        {tab==='inventory'&&(
          <div style={{ position:'relative' }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft:30, width:200 }} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        )}
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
      </div>

      {tab==='inventory'
        ? (
          <motion.div className="table-container" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <div className="table-header"><span className="table-title">Current Inventory ({filtered.length} products)</span></div>
            <table>
              <thead><tr><th>Product</th><th>Type</th><th>On Hand</th><th>Reserved</th><th>Available</th><th>Cost Price</th><th>Stock Value</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map((p,i)=>{
                  const available=p.on_hand_qty-p.reserved_qty;
                  const status=getStatus(p);
                  const pct=p.on_hand_qty>0?Math.min(100,(available/p.on_hand_qty)*100):0;
                  return (
                    <motion.tr key={p.id} initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.03 }}>
                      <td>
                        <div style={{ fontWeight:600 }}>{p.name}</div>
                        <div style={{ marginTop:4, height:3, background:'rgba(255,255,255,0.08)', borderRadius:2, width:80 }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:status.color, borderRadius:2 }} />
                        </div>
                      </td>
                      <td><span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:p.procurement_type==='PURCHASE'?'rgba(6,182,212,0.15)':'rgba(139,92,246,0.15)', color:p.procurement_type==='PURCHASE'?'var(--accent-cyan)':'var(--accent-purple)', fontWeight:600 }}>{p.procurement_type}</span></td>
                      <td style={{ fontWeight:700 }}>{p.on_hand_qty}</td>
                      <td style={{ color:p.reserved_qty>0?'var(--accent-orange)':'var(--text-muted)' }}>{p.reserved_qty}</td>
                      <td style={{ fontWeight:700, color:available<=0?'var(--accent-red)':'var(--accent-green)' }}>{available}</td>
                      <td style={{ color:'var(--text-secondary)' }}>₹{Number(p.cost_price).toLocaleString()}</td>
                      <td style={{ color:'var(--accent-teal)', fontWeight:600 }}>₹{(Number(p.cost_price)*p.on_hand_qty).toLocaleString()}</td>
                      <td><span style={{ fontSize:11, padding:'3px 10px', borderRadius:12, background:status.bg, color:status.color, fontWeight:600 }}>{status.label}</span></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div className="table-container" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <div className="table-header"><span className="table-title">📋 Stock Ledger — All Movements</span></div>
            <table>
              <thead><tr><th>#</th><th>Product</th><th>Change</th><th>Reason</th><th>Reference</th><th>Date & Time</th></tr></thead>
              <tbody>
                {ledger.length===0
                  ? <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No stock movements yet</td></tr>
                  : ledger.map((e,i)=>{
                      const isIn=e.change_qty>0;
                      return (
                        <motion.tr key={e.id} initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.02 }}>
                          <td style={{ color:'var(--text-muted)', fontSize:12 }}>{e.id}</td>
                          <td style={{ fontWeight:600 }}>{e.product_name}</td>
                          <td><span style={{ display:'flex', alignItems:'center', gap:6, fontWeight:700, color:isIn?'var(--accent-green)':'var(--accent-red)' }}>{isIn?<ArrowUpCircle size={14}/>:<ArrowDownCircle size={14}/>}{isIn?'+':''}{e.change_qty}</span></td>
                          <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{e.reason}</td>
                          <td style={{ color:'var(--text-muted)', fontSize:12 }}>{e.reference_id?`#${e.reference_id}`:'—'}</td>
                          <td style={{ color:'var(--text-muted)', fontSize:12 }}>{new Date(e.created_at).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                        </motion.tr>
                      );
                  })
                }
              </tbody>
            </table>
          </motion.div>
        )
      }
    </div>
  );
}
