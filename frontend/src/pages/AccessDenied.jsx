import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(239,68,68,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(239,68,68,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <motion.div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}>

        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
          style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <ShieldX size={48} style={{ color: 'var(--accent-red)' }} />
        </motion.div>

        {/* Error code */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, marginBottom: 8,
            background: 'linear-gradient(135deg, var(--accent-red), #dc2626)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          403
        </motion.div>

        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
          Access Denied
        </motion.h2>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 8 }}>
          You don't have permission to access this page.
        </motion.p>

        {user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 28 }}>
            <span style={{ fontSize: 13, color: 'var(--accent-red)', fontWeight: 600 }}>
              Your role: <strong>{user.role}</strong> — does not have access to this module
            </span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeft size={15} /> Go Back
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Home size={15} /> Home
          </button>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
          Contact your <strong style={{ color: 'var(--accent-teal)' }}>Administrator</strong> to request access
        </motion.p>
      </motion.div>
    </div>
  );
}
