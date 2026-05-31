import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Lock, Users, BarChart3, Key,
  GitFork, Share2, Menu, X, ArrowRight,
  Globe, Database, Server, Box, Layers, Container,
  CheckCircle, XCircle
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Tech Stack', href: '#tech-stack' },
  { label: 'Roles', href: '#roles' },
];

const FEATURES = [
  { icon: <Globe size={28} />, title: 'Single Sign-On (SSO)', desc: 'Log in once and access all your apps automatically — no need to enter your password again and again.' },
  { icon: <Key size={28} />, title: 'Login with Google / GitHub', desc: 'Let users sign in using their existing accounts. No new passwords needed — just click and you are in.' },
  { icon: <Users size={28} />, title: 'Roles & Permissions', desc: 'Decide who can see and do what. Assign roles like Admin or User and control access easily.' },
  { icon: <Lock size={28} />, title: 'Two-Step Verification', desc: 'Add an extra layer of security. Even if someone steals a password, they still cannot get in.' },
  { icon: <Zap size={28} />, title: 'Session Control', desc: 'See all active logins in real time. Log out from any device remotely with one click.' },
  { icon: <BarChart3 size={28} />, title: 'Activity Logs', desc: 'Keep a record of who logged in, when, and what they did — useful for tracking and security checks.' },
];

const TECH_STACK = [
  { icon: <Layers size={32} />, name: 'React', color: '#61DAFB' },
  { icon: <Server size={32} />, name: 'Node.js', color: '#68A063' },
  { icon: <Database size={32} />, name: 'PostgreSQL', color: '#336791' },
  { icon: <Box size={32} />, name: 'Prisma', color: '#2D3748' },
  { icon: <Zap size={32} />, name: 'Redis', color: '#DC382D' },
  { icon: <Container size={32} />, name: 'Docker', color: '#2496ED' },
];

const STEPS = [
  { num: '01', title: 'Create Your App', desc: 'Register your project in the AuthForge dashboard and get your keys in seconds.' },
  { num: '02', title: 'Set Up Login Options', desc: 'Choose how users log in — email, Google, GitHub, or two-step verification. All in a few clicks.' },
  { num: '03', title: 'Connect to Your App', desc: 'Call our simple API from any language — Node.js, Python, PHP, anything you like.' },
  { num: '04', title: 'Go Live', desc: 'Your app is now secure. Every user is protected from the moment they sign up.' },
];

const ROLE_ROWS = [
  { feature: 'View own profile & settings',   user: true,  admin: true  },
  { feature: 'Change own password',            user: true,  admin: true  },
  { feature: 'View own active sessions',       user: true,  admin: true  },
  { feature: 'Log out own sessions',           user: true,  admin: true  },
  { feature: 'View all registered users',      user: false, admin: true  },
  { feature: 'Edit or delete any user',        user: false, admin: true  },
  { feature: 'Assign or remove roles',         user: false, admin: true  },
  { feature: 'Promote User → Admin',           user: false, admin: true  },
  { feature: 'View activity & audit logs',     user: false, admin: true  },
  { feature: 'Access system configuration',    user: false, admin: true  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' } }),
};

export const Landing: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#020617', fontFamily: 'Inter, sans-serif' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3 backdrop-blur-xl border-b border-white/10' : 'py-5'}`}
        style={{ backgroundColor: scrolled ? 'rgba(2,6,23,0.9)' : 'transparent' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <Shield size={28} className="text-blue-400" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.6))' }} />
            <span className="text-xl font-bold text-white tracking-tight">AuthForge</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer bg-transparent border-none">
                {l.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-slate-300 hover:text-white text-sm font-semibold px-4 py-2 transition-colors no-underline">Sign In</Link>
            <Link to="/signup" className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white no-underline flex items-center gap-2 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}>
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
          <button className="md:hidden text-white bg-transparent border-none cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="md:hidden border-t border-white/10 px-6 py-4 space-y-4"
              style={{ backgroundColor: 'rgba(2,6,23,0.98)', backdropFilter: 'blur(20px)' }}>
              {NAV_LINKS.map(l => (
                <button key={l.href} onClick={() => scrollTo(l.href)}
                  className="block w-full text-left text-slate-300 hover:text-white py-2 text-sm font-medium bg-transparent border-none cursor-pointer">
                  {l.label}
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1 text-center py-2.5 rounded-xl border border-white/20 text-sm font-semibold text-white no-underline">Sign In</Link>
                <Link to="/signup" className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold text-white no-underline"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO */}
      <section className="relative z-10 pt-36 pb-24 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 border"
            style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)', color: '#93c5fd' }}>
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            Open Source · Free to Use · Built for Developers
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6"
            style={{ background: 'linear-gradient(135deg, #fff 0%, #93c5fd 50%, #6ee7b7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            User Login &<br />Security, Done Right
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AuthForge handles login, signup, roles, and security for your app — so you can focus on building features, not managing passwords.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg no-underline transition-all hover:scale-105 hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}>
              Create Free Account <ArrowRight size={20} />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-lg no-underline border transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              Sign In
            </Link>
          </motion.div>
          {/* Floating badges */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-3">
            {['Login / Signup', 'Google Login', 'Two-Step Verify', 'Roles & Access', 'Session Control', 'Activity Logs'].map(badge => (
              <span key={badge} className="px-4 py-2 rounded-full text-sm font-semibold border"
                style={{ background: 'rgba(30,41,59,0.6)', borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', backdropFilter: 'blur(8px)' }}>
                {badge}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <span className="text-blue-400 font-semibold uppercase text-sm tracking-widest">Features</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4 text-white">Everything your app needs</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">One platform for login, access control, and security — works with any project.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="p-8 rounded-2xl border cursor-default transition-all group"
                style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all group-hover:scale-110"
                  style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section id="tech-stack" className="relative z-10 py-24 px-6" style={{ background: 'rgba(15,23,42,0.3)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="text-emerald-400 font-semibold uppercase text-sm tracking-widest">Tech Stack</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4 text-white">What it's built with</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Modern, reliable tools that are trusted by developers around the world.</p>
          </motion.div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {TECH_STACK.map((t, i) => (
              <motion.div key={t.name} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.1 }}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all cursor-default"
                style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(255,255,255,0.08)', color: t.color }}>
                {t.icon}
                <span className="text-sm font-semibold text-slate-300">{t.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <span className="text-purple-400 font-semibold uppercase text-sm tracking-widest">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4 text-white">Set up in 4 simple steps</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">No complicated setup. Just follow these steps and you're done.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.num} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="flex gap-5 p-7 rounded-2xl border transition-all"
                style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="text-4xl font-black flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.num}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="relative z-10 py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="text-blue-400 font-semibold uppercase text-sm tracking-widest">Access Control</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4 text-white">Who can do what</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">AuthForge has two built-in roles — User and Admin. Each has clear permissions, just like Auth0 or Clerk.</p>
          </motion.div>

          <motion.div custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-6 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Feature</div>
              <div className="px-6 py-4 text-center">
                <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: '#3b82f6' }}>
                  <Users size={14} /> User
                </span>
              </div>
              <div className="px-6 py-4 text-center">
                <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: '#10b981' }}>
                  <Shield size={14} /> Admin
                </span>
              </div>
            </div>
            {/* Table Rows */}
            {ROLE_ROWS.map((row, i) => (
              <motion.div key={row.feature}
                custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', borderBottom: i < ROLE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                className="hover:bg-white/[0.02] transition-colors">
                <div className="px-6 py-4 text-sm text-slate-300 font-medium">{row.feature}</div>
                <div className="px-6 py-4 flex justify-center items-center">
                  {row.user
                    ? <CheckCircle size={18} style={{ color: '#10b981' }} />
                    : <XCircle size={18} style={{ color: 'rgba(148,163,184,0.3)' }} />}
                </div>
                <div className="px-6 py-4 flex justify-center items-center">
                  {row.admin
                    ? <CheckCircle size={18} style={{ color: '#10b981' }} />
                    : <XCircle size={18} style={{ color: 'rgba(148,163,184,0.3)' }} />}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <motion.div custom={2} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="p-6 rounded-2xl border"
              style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.25)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">User</h3>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#3b82f6' }}>Default Role</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">Every new signup gets this role automatically. Users can manage their own account, change their password, and control their own sessions — nothing more.</p>
            </motion.div>
            <motion.div custom={3} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="p-6 rounded-2xl border"
              style={{ background: 'rgba(16,185,129,0.07)', borderColor: 'rgba(16,185,129,0.25)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Admin</h3>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>Full Access</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">Admins can see and manage all users, assign or remove roles, read activity logs, and configure the platform — similar to an Org Admin in Clerk or Auth0.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-28 px-6" style={{ background: 'rgba(15,23,42,0.3)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="p-12 rounded-3xl border overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(16,185,129,0.1) 100%)', borderColor: 'rgba(59,130,246,0.3)' }}>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.1), transparent 60%)' }} />
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <Shield size={52} className="text-blue-400" style={{ filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.6))' }} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Ready to get started?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">Create your free account and add login to your app today. Takes less than 5 minutes.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg no-underline transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}>
                  Create Free Account <ArrowRight size={18} />
                </Link>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-lg no-underline border transition-all hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <GitFork size={20} /> View on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t py-12 px-6" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(2,6,23,0.8)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={24} className="text-blue-400" />
                <span className="text-lg font-bold text-white">AuthForge</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Open source login and security platform. Free to use, easy to set up, and built for developers.
              </p>
              <div className="flex gap-3 mt-5">
                {[GitFork, Share2].map((Icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-xl border flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Pages</p>
              {['Features', 'How It Works', 'Tech Stack', 'Roles'].map(l => (
                <button key={l} onClick={() => scrollTo(`#${l.toLowerCase().replace(/ /g, '-')}`)}
                  className="block text-slate-400 hover:text-white text-sm mb-2.5 cursor-pointer bg-transparent border-none text-left">
                  {l}
                </button>
              ))}
            </div>
            <div>
              <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Account</p>
              {[['Sign In', '/login'], ['Sign Up', '/signup'], ['Dashboard', '/dashboard']].map(([label, href]) => (
                <Link key={label} to={href} className="block text-slate-400 hover:text-white text-sm mb-2.5 no-underline">{label}</Link>
              ))}
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-slate-500 text-sm">© 2026 AuthForge. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Security'].map(l => (
                <a key={l} href="#" className="text-slate-500 hover:text-slate-300 text-sm no-underline transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
