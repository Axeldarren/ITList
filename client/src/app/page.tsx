"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from './redux';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { token } = useAppSelector((state) => state.auth);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!token) {
      setAuthStatus("unauthenticated");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        setAuthStatus("unauthenticated");
      } else {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8008';
        fetch(`${apiBaseUrl}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(response => {
            setAuthStatus(response.status === 401 ? "unauthenticated" : "authenticated");
          })
          .catch(() => setAuthStatus("authenticated"));
      }
    } catch {
      setAuthStatus("unauthenticated");
    }
  }, [token]);

  return (
    <>
      <style>{`
        @keyframes hpFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hpBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes hpGlow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
        .hp-a1 { animation: hpFadeUp 0.5s 0.00s ease both; }
        .hp-a2 { animation: hpFadeUp 0.5s 0.10s ease both; }
        .hp-a3 { animation: hpFadeUp 0.5s 0.20s ease both; }
        .hp-a4 { animation: hpFadeUp 0.5s 0.32s ease both; }
        .hp-a5 { animation: hpFadeUp 0.5s 0.44s ease both; }
        .hp-a6 { animation: hpFadeUp 0.5s 0.56s ease both; }
        .hp-caret { animation: hpBlink 1s step-end infinite; color: #7c5cfc; }
        .hp-glow  { animation: hpGlow 4s ease-in-out infinite; }

        .hp-cta {
          display: inline-flex; align-items: center; gap: 10px;
          background: #7c5cfc; color: #fff; border: none;
          padding: 11px 22px; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .hp-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(124,92,252,0.38);
          background: #6d4efc;
        }
        .hp-card {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .hp-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.07);
        }
        .dark .hp-card:hover {
          box-shadow: 0 12px 32px rgba(0,0,0,0.28);
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100 relative overflow-x-hidden">

        {/* Subtle dot-grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(124,92,252,0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Ambient glow top-left */}
        <div
          className="hp-glow absolute pointer-events-none"
          style={{
            top: '-10%', left: '-6%',
            width: '38vw', height: '38vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,92,252,0.07) 0%, transparent 70%)',
          }}
        />

        {/* ── Top bar ── */}
        <header className="hp-a1 relative z-10 bg-white dark:bg-dark-secondary border-b border-gray-200 dark:border-stroke-dark px-6 md:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="text-blue-primary"
              style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', letterSpacing: '0.05em' }}
            >
              ITLIST
            </span>
            <span className="hidden sm:block text-gray-300 dark:text-stroke-dark">·</span>
            <span
              className="hidden sm:block text-gray-400 dark:text-gray-500"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.07em' }}
            >
              v2.0.0 · PROJECT MANAGEMENT
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-emerald-500"
              style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }}
            />
            <span
              className="text-emerald-600 dark:text-emerald-500 hidden sm:block"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.07em' }}
            >
              ALL SYSTEMS GO
            </span>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 pt-14 pb-10">

          {/* Eyebrow badge */}
          <div className="hp-a2 mb-8">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-100 dark:bg-accent-500/10 text-blue-primary border border-accent-200 dark:border-accent-500/20"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-primary" />
              PROJECT MANAGEMENT SYSTEM
            </span>
          </div>

          {/* Wordmark */}
          <div className="hp-a3 mb-5" style={{ lineHeight: 0.88 }}>
            <div
              className="text-gray-900 dark:text-white"
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(72px, 12vw, 148px)',
                letterSpacing: '0.02em',
              }}
            >IT</div>
            <div
              style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(72px, 12vw, 148px)',
                letterSpacing: '0.02em',
                background: 'linear-gradient(130deg, #7c5cfc 0%, #a78bfa 60%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >LIST</div>
          </div>

          {/* Tagline */}
          <div className="hp-a4 mb-10">
            <p
              className="text-gray-500 dark:text-gray-400"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 2, letterSpacing: '0.03em' }}
            >
              <span className="block"><span className="text-blue-primary mr-2">›</span>Project command center.</span>
              <span className="block"><span className="text-blue-primary mr-2">›</span>Built for the builders<span className="hp-caret">_</span></span>
            </p>
          </div>

          {/* CTA */}
          <div className="hp-a5 mb-14">
            {authStatus === 'checking' ? (
              <div className="flex items-center gap-3">
                <LoadingSpinner size="sm" color="primary" />
                <span
                  className="text-gray-400 dark:text-gray-500"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.07em' }}
                >
                  CHECKING SESSION...
                </span>
              </div>
            ) : authStatus === 'authenticated' ? (
              <button onClick={() => router.push('/home')} className="hp-cta">
                Enter Dashboard <span style={{ fontSize: '18px' }}>→</span>
              </button>
            ) : (
              <button onClick={() => router.push('/login')} className="hp-cta">
                Access System <span style={{ fontSize: '18px' }}>→</span>
              </button>
            )}
          </div>

          {/* ── Feature Cards ── */}
          <div className="hp-a6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: '⚡',
                title: 'Real-Time Sync',
                desc: 'WebSocket-powered updates propagate to your whole team instantly.',
              },
              {
                icon: '🔒',
                title: 'End-to-End Encrypted',
                desc: 'Application-layer encryption keeps all sensitive project data secure.',
              },
              {
                icon: '🎯',
                title: 'Role-Based Access',
                desc: 'Fine-grained admin and developer permissions per project and team.',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="hp-card bg-white dark:bg-dark-secondary rounded-xl p-5 ring-1 ring-gray-200 dark:ring-white/10 shadow-sm"
              >
                <div className="text-2xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5">{card.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Dashboard Preview ── */}
          <div className="hp-a6 bg-white dark:bg-dark-secondary rounded-xl ring-1 ring-gray-200 dark:ring-white/10 overflow-hidden shadow-sm">
            {/* Window chrome */}
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-dark-tertiary border-b border-gray-100 dark:border-stroke-dark flex items-center gap-1.5">
              {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
              <span
                className="text-gray-400 dark:text-gray-500 ml-2"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.05em' }}
              >
                itlist // project dashboard
              </span>
            </div>

            {/* Body */}
            <div className="flex" style={{ height: 270 }}>

              {/* Sidebar preview */}
              <div className="w-40 flex-shrink-0 border-r border-gray-100 dark:border-stroke-dark p-3">
                <div
                  className="text-blue-primary mb-4"
                  style={{ fontFamily: 'var(--font-bebas)', fontSize: '16px', letterSpacing: '0.05em' }}
                >ITLIST</div>
                {[
                  { label: 'Dashboard', active: true },
                  { label: 'Projects', active: false },
                  { label: 'Tasks', active: false },
                  { label: 'Team', active: false },
                  { label: 'Reports', active: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 ${
                      item.active
                        ? 'bg-accent-100 dark:bg-accent-500/10 text-blue-primary font-semibold'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                    style={{ fontSize: '11px' }}
                  >
                    <div className={`w-1 h-1 rounded-full flex-shrink-0 ${item.active ? 'bg-blue-primary' : 'bg-gray-300 dark:bg-stroke-dark'}`} />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-3 overflow-hidden">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Active',    value: '12', color: '#7c5cfc' },
                    { label: 'In Review', value: '4',  color: '#f59e0b' },
                    { label: 'Done',      value: '28', color: '#10b981' },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 dark:bg-dark-tertiary rounded-lg p-2.5 ring-1 ring-gray-100 dark:ring-stroke-dark"
                      style={{ borderTop: `2px solid ${s.color}` }}
                    >
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: s.color, lineHeight: 1 }}>
                        {s.value}
                      </div>
                      <div className="text-gray-400 dark:text-gray-500 mt-0.5" style={{ fontSize: '9px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Task list */}
                <div className="bg-gray-50 dark:bg-dark-tertiary rounded-lg ring-1 ring-gray-100 dark:ring-stroke-dark overflow-hidden">
                  <div
                    className="px-3 py-2 border-b border-gray-100 dark:border-stroke-dark text-gray-400 dark:text-gray-500"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em' }}
                  >
                    RECENT TASKS
                  </div>
                  {[
                    { name: 'Deploy staging environment',     badge: 'IN PROGRESS', color: '#7c5cfc', pct: 65 },
                    { name: 'Fix auth middleware regression',  badge: 'REVIEW',      color: '#f59e0b', pct: 90 },
                    { name: 'Update API documentation',       badge: 'TODO',         color: '#60a5fa', pct: 10 },
                  ].map((t, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-3 py-2 ${i < 2 ? 'border-b border-gray-100 dark:border-stroke-dark' : ''}`}
                    >
                      <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">{t.name}</span>
                      <span
                        className="flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{
                          background: `${t.color}18`, color: t.color,
                          fontSize: '9px', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                        }}
                      >
                        {t.badge}
                      </span>
                      <div className="w-10 flex-shrink-0">
                        <div className="h-1 bg-gray-200 dark:bg-stroke-dark rounded-full">
                          <div style={{ width: `${t.pct}%`, background: t.color }} className="h-full rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="relative z-10 border-t border-gray-200 dark:border-stroke-dark py-4 px-6 flex items-center justify-center gap-6 md:gap-10 flex-wrap">
          {['TASK TRACKING', 'TEAM MANAGEMENT', 'REAL-TIME SYNC', 'ENCRYPTED'].map((label, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-gray-400 dark:text-gray-500"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-primary" />
              {label}
            </div>
          ))}
        </footer>

      </div>
    </>
  );
}
