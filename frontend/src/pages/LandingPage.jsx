import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* ─── Nav ─────────────────────────────────────────────── */}
      <motion.nav className="landing-nav" initial={{ y: -68 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 25 }}>
        <div className="nav-logo">
          <div className="nav-logo-icon">🪑</div>
          <div>
            <div className="nav-logo-text">Shiv Furniture ERP</div>
            <div className="nav-logo-sub">From Demand to Delivery</div>
          </div>
        </div>
        <div className="landing-nav-links">
          <motion.button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            Sign In →
          </motion.button>
        </div>
      </motion.nav>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        {/* Animated grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(20,184,166,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,0.04) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <motion.div className="hero-eyebrow" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <span className="dot" />
          Mini ERP System — Shiv Furniture Works
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          One Platform.<br />
          <span className="gradient-text">Complete Business Control.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          From spreadsheet chaos to real-time visibility. Manage products, sales, purchases, manufacturing, and inventory — all in one centralized ERP system built for Shiv Furniture Works.
        </motion.p>

        <motion.div className="hero-buttons" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <motion.button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            🚀 Get Started — Sign In
          </motion.button>
        </motion.div>

        {/* Floating module icons */}
        {[
          { icon: '📦', x: '8%', y: '25%', delay: 0.6 },
          { icon: '🛒', x: '88%', y: '20%', delay: 0.8 },
          { icon: '🏭', x: '5%', y: '72%', delay: 1.0 },
          { icon: '🚛', x: '91%', y: '68%', delay: 1.2 },
          { icon: '📊', x: '48%', y: '88%', delay: 1.4 },
        ].map((f, i) => (
          <motion.div key={i} style={{ position: 'absolute', left: f.x, top: f.y, fontSize: 28, opacity: 0.4, pointerEvents: 'none' }}
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.35, scale: 1, y: [0, -12, 0] }}
            transition={{ delay: f.delay, duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}>
            {f.icon}
          </motion.div>
        ))}
      </section>

      {/* ─── Stats ────────────────────────────────────────────── */}
      <motion.div className="stats-strip" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        {[
          { value: '6', label: 'User Roles' },
          { value: '5', label: 'Core Modules' },
          { value: '100%', label: 'Stock Visibility' },
          { value: 'Real-Time', label: 'Audit Logs' },
          { value: 'MTS + MTO', label: 'Procurement Modes' },
        ].map((s, i) => (
          <motion.div key={i} className="stat-item" custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="landing-cta">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          Ready to Transform Your Operations?
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
          Sign in with your role and take control of Shiv Furniture's entire business flow.
        </motion.p>
        <motion.button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
          🚀 Sign In to ERP →
        </motion.button>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="nav-logo-icon" style={{ width: 28, height: 28, fontSize: 14 }}>🪑</div>
          <span>Shiv Furniture Works — Mini ERP System</span>
        </div>
        <span>Built with Node.js · React · PostgreSQL</span>
      </footer>
    </div>
  );
}
