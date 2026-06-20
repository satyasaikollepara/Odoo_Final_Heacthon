import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Package, ShoppingCart, Factory, Truck } from 'lucide-react';
import api from '../api';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

const COLORS   = ['#14b8a6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
const PIE_COLS = ['#10b981','#14b8a6','#f59e0b','#ef4444'];
const ttStyle  = { background:'#071412', border:'1px solid rgba(20,184,166,0.2)', borderRadius:8, color:'#e2fef8', fontSize:12 };

export default function ReportsPage() {
  const [data, setData]       = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.get('/dashboard'), api.get('/dashboard/inventory')])
      .then(([d, p]) => { setData(d.data); setProducts(p.data); })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const topByValue = [...products].sort((a,b)=>Number(b.cost_price)*b.on_hand_qty-Number(a.cost_price)*a.on_hand_qty).slice(0,10).map(p=>({ name:p.name.length>14?p.name.slice(0,14)+'…':p.name, value:Number(p.cost_price)*p.on_hand_qty }));

  const salesPie     = [{ name:'Draft',v:Number(data?.sales?.draft||0)},{name:'Confirmed',v:Number(data?.sales?.confirmed||0)},{name:'Delivered',v:Number(data?.sales?.delivered||0)},{name:'Cancelled',v:Number(data?.sales?.cancelled||0)}].filter(d=>d.v>0).map(d=>({...d,value:d.v}));
  const purchasePie  = [{ name:'Draft',v:Number(data?.purchase?.draft||0)},{name:'Confirmed',v:Number(data?.purchase?.confirmed||0)},{name:'Received',v:Number(data?.purchase?.received||0)},{name:'Cancelled',v:Number(data?.purchase?.cancelled||0)}].filter(d=>d.v>0).map(d=>({...d,value:d.v}));
  const mfgPie       = [{ name:'Draft',v:Number(data?.manufacturing?.draft||0)},{name:'In Progress',v:Number(data?.manufacturing?.in_progress||0)},{name:'Completed',v:Number(data?.manufacturing?.completed||0)},{name:'Cancelled',v:Number(data?.manufacturing?.cancelled||0)}].filter(d=>d.v>0).map(d=>({...d,value:d.v}));

  const stockHealth = [
    { label:'Out of Stock', value:products.filter(p=>p.on_hand_qty===0).length, color:'#ef4444' },
    { label:'Critical ≤5',  value:products.filter(p=>p.on_hand_qty>0&&p.on_hand_qty<=5).length, color:'#f59e0b' },
    { label:'Low ≤10',      value:products.filter(p=>p.on_hand_qty>5&&p.on_hand_qty<=10).length, color:'#06b6d4' },
    { label:'Healthy >10',  value:products.filter(p=>p.on_hand_qty>10).length, color:'#10b981' },
  ];

  const salesFunnel = [
    { stage:'Created',   count:Number(data?.sales?.total_orders||0) },
    { stage:'Confirmed', count:Number(data?.sales?.confirmed||0)+Number(data?.sales?.delivered||0) },
    { stage:'Delivered', count:Number(data?.sales?.delivered||0) },
  ];

  return (
    <div>
      <Toast toasts={toast.toasts} />

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:32 }}>
        {[
          { label:'Total Products',  value:data?.products?.total||0,             color:'teal',   icon:<Package size={18}/> },
          { label:'Total Sales',     value:data?.sales?.total_orders||0,          color:'green',  icon:<ShoppingCart size={18}/> },
          { label:'Total Purchases', value:data?.purchase?.total_orders||0,       color:'cyan',   icon:<Truck size={18}/> },
          { label:'Total MOs',       value:data?.manufacturing?.total_orders||0,  color:'purple', icon:<Factory size={18}/> },
        ].map((k,i)=>(
          <motion.div key={k.label} className={`kpi-card ${k.color}`}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }} whileHover={{ scale:1.03 }}>
            <div className="kpi-icon">{k.icon}</div><div className="kpi-value">{k.value}</div><div className="kpi-label">{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Top Products by Value */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--accent-teal)', marginBottom:4 }}>Inventory Value</div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text-primary)' }}>Top Products by Stock Value</div>
        </div>
        <div className="chart-wrapper" style={{ marginBottom:28 }}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={topByValue} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="#475569" fontSize={10} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" stroke="#475569" fontSize={10} width={110} />
              <Tooltip formatter={v=>[`₹${Number(v).toLocaleString('en-IN')}`, 'Value']} contentStyle={ttStyle} />
              <Bar dataKey="value" radius={[0,6,6,0]}>{topByValue.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Order Status Pies */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--accent-teal)', marginBottom:4 }}>Order Analytics</div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text-primary)' }}>Order Status Breakdown</div>
        </div>
        <div className="grid-3" style={{ marginBottom:28 }}>
          {[{ title:'Sales Orders', data:salesPie },{ title:'Purchase Orders', data:purchasePie },{ title:'Manufacturing MOs', data:mfgPie }].map((chart,ci)=>(
            <motion.div key={chart.title} className="chart-wrapper"
              initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3+ci*0.1 }}>
              <div className="chart-title">{chart.title}</div>
              {chart.data.length===0
                ? <div className="empty-state" style={{ padding:30 }}><p>No data</p></div>
                : <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={chart.data} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="value">
                        {chart.data.map((_,i)=><Cell key={i} fill={PIE_COLS[i%PIE_COLS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={ttStyle} />
                      <Legend wrapperStyle={{ fontSize:10, color:'#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
              }
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stock Health + Sales Funnel */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
        <div className="grid-2" style={{ marginBottom:28 }}>
          {/* Health bars */}
          <div className="chart-wrapper">
            <div className="chart-title">Stock Health Distribution</div>
            <div className="chart-subtitle">Products by stock level</div>
            <div style={{ marginTop:18 }}>
              {stockHealth.map((s,i)=>(
                <div key={s.label} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{s.label}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:s.color }}>{s.value}</span>
                  </div>
                  <div style={{ height:5, background:'rgba(255,255,255,0.06)', borderRadius:3 }}>
                    <motion.div style={{ height:'100%', background:s.color, borderRadius:3 }}
                      initial={{ width:0 }} animate={{ width:products.length>0?`${(s.value/products.length)*100}%`:'0%' }}
                      transition={{ delay:0.5+i*0.1, duration:0.6 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Funnel */}
          <div className="chart-wrapper">
            <div className="chart-title">Sales Conversion Funnel</div>
            <div className="chart-subtitle">Orders through pipeline stages</div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={salesFunnel} barSize={55}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="stage" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="count" name="Orders" radius={[8,8,0,0]}>
                  <Cell fill="#8b5cf6" /><Cell fill="#14b8a6" /><Cell fill="#10b981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Low Stock Alert */}
      {(data?.low_stock||[]).length>0&&(
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--text-primary)' }}>⚠️ Low Stock Alert</div>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Product</th><th>On Hand</th><th>Reserved</th><th>Available</th><th>Status</th></tr></thead>
              <tbody>
                {data.low_stock.map((p,i)=>(
                  <motion.tr key={p.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.05 }}>
                    <td style={{ fontWeight:600 }}>{p.name}</td>
                    <td style={{ fontWeight:700, color:p.on_hand_qty===0?'var(--accent-red)':'var(--accent-orange)' }}>{p.on_hand_qty}</td>
                    <td style={{ color:'var(--text-muted)' }}>{p.reserved_qty}</td>
                    <td style={{ fontWeight:700, color:(p.on_hand_qty-p.reserved_qty)<=0?'var(--accent-red)':'var(--accent-orange)' }}>{p.on_hand_qty-p.reserved_qty}</td>
                    <td><span style={{ fontSize:11, padding:'3px 10px', borderRadius:12, background:p.on_hand_qty===0?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)', color:p.on_hand_qty===0?'var(--accent-red)':'var(--accent-orange)', fontWeight:600 }}>{p.on_hand_qty===0?'🚨 Restock Now':'⚠️ Reorder Soon'}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
