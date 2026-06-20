import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    setLoading(true); setError('');
    try {
      // In a real app this sends an email; here we simulate success
      await new Promise(r => setTimeout(r, 1200)); // simulate API call
      setSent(true);
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
      <motion.div style={{ width: '100%', maxWidth: 420, background: 'rgba(7,20,18,0.9)', backdropFilter: 'blur(30px)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '40px 36px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
        initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-emerald))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px', boxShadow: '0 8px 28px var(--teal-glow)' }}>🔑</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Forgot Password</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Enter your email to receive reset instructions</p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {error && (
                <div className="toast-item toast-error" style={{ marginBottom: 16 }}>{error}</div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" type="email" placeholder="your@email.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={{ paddingLeft: 36 }} required />
                  </div>
                </div>
                <motion.button type="submit" className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }}
                  disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  {loading ? 'Sending...' : '📧 Send Reset Link'}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center' }}>
              <CheckCircle size={52} style={{ color: 'var(--accent-green)', margin: '0 auto 18px' }} />
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Check your email</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                If <strong style={{ color: 'var(--accent-teal)' }}>{email}</strong> exists in our system, you'll receive password reset instructions shortly.
              </p>
              <div className="toast-item toast-info" style={{ marginTop: 18, justifyContent: 'center', fontSize: 12 }}>
                💡 For demo: contact your Admin to reset your password
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--accent-teal)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={13} /> Back to Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
