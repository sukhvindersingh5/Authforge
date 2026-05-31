import React, { useState } from 'react';
import { Code2, Terminal, Server, Check, Copy, Code } from 'lucide-react';

const CodeBlock = ({ language, code, title }: { language: string, code: string, title: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {language === 'javascript' || language === 'typescript' ? <Terminal size={16} /> : <Code2 size={16} />}
          <span style={{ fontFamily: 'monospace' }}>{title}</span>
        </div>
        <button 
          onClick={handleCopy}
          style={{ background: 'transparent', border: 'none', color: copied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', transition: 'color 0.2s' }}
        >
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '1.5rem', overflowX: 'auto', fontSize: '0.9rem', lineHeight: 1.5, color: '#e2e8f0', fontFamily: 'monospace' }}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const Integration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'node' | 'python'>('node');

  const jsFrontendCode = `// 1. React / Vue / Vanilla JS Frontend
const authenticateUser = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  if (response.ok) {
    // Save this token securely (e.g., localStorage)
    localStorage.setItem('access_token', data.data.access_token);
  }
};`;

  const nodeBackendCode = `// 2. Node.js (Express) Backend
import express from 'express';
import { createAuthMiddleware } from './authforge-middleware';

const app = express();
const authenticate = createAuthMiddleware({ authServiceUrl: 'http://localhost:3000/api/v1' });

// Protect your API route
app.get('/api/protected-data', authenticate, (req, res) => {
  // req.user is automatically populated by AuthForge!
  res.json({ message: "Secret data", user: req.user });
});`;

  const pythonFrontendCode = `# 1. Python Desktop App / CLI (Using Requests)
import requests

def authenticate_user(email, password):
    url = "http://localhost:3000/api/v1/auth/login"
    payload = { "email": email, "password": password }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        # Save this token securely in memory or a file
        return data["data"]["access_token"]
    else:
        raise Exception("Login failed!")`;

  const pythonBackendCode = `# 2. Python Backend (FastAPI Example)
from fastapi import FastAPI, Depends, HTTPException, Header
import requests

app = FastAPI()
AUTHFORGE_URL = "http://localhost:3000/api/v1"

# AuthForge Verification Middleware Dependency
def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Token")
        
    # Ask AuthForge if the token is valid
    response = requests.get(f"{AUTHFORGE_URL}/users/me", headers={"Authorization": authorization})
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Token")
        
    return response.json()["data"]

# Protect your API route
@app.get("/api/protected-data")
def get_secret_data(user: dict = Depends(verify_token)):
    # The 'user' dictionary is populated directly from AuthForge!
    return {"message": "Secret data", "user": user}`;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', paddingBottom: '3rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Server size={32} color="var(--primary)" />
        Developer Integration
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
        AuthForge is language-agnostic. Since it uses standard HTTP APIs and JWT tokens, it works with any programming language!
      </p>

      {/* Language Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)' }}>
        <button 
          onClick={() => setActiveTab('node')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: 'transparent', 
            border: 'none', 
            borderBottom: activeTab === 'node' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'node' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'node' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Code size={18} /> JavaScript / Node.js
        </button>
        <button 
          onClick={() => setActiveTab('python')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: 'transparent', 
            border: 'none', 
            borderBottom: activeTab === 'python' ? '2px solid var(--success)' : '2px solid transparent',
            color: activeTab === 'python' ? 'var(--success)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'python' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Terminal size={18} /> Python (FastAPI)
        </button>
      </div>

      {activeTab === 'node' && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Step 1: Client-Side Login (React/JS)</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Send credentials to AuthForge to get a JWT token.</p>
          <CodeBlock language="javascript" title="frontend/login.js" code={jsFrontendCode} />

          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', marginTop: '2rem' }}>Step 2: Server-Side Protection (Node.js/Express)</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Verify the JWT using the AuthForge API before allowing access.</p>
          <CodeBlock language="typescript" title="backend/server.ts" code={nodeBackendCode} />
        </div>
      )}

      {activeTab === 'python' && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Step 1: Client-Side Login (Python Requests)</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Perfect for Python desktop apps, CLI tools, or server-to-server communication.</p>
          <CodeBlock language="python" title="client.py" code={pythonFrontendCode} />

          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', marginTop: '2rem' }}>Step 2: Server-Side Protection (Python FastAPI)</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Use a Dependency to automatically verify the JWT with AuthForge on protected routes.</p>
          <CodeBlock language="python" title="main.py" code={pythonBackendCode} />
        </div>
      )}

    </div>
  );
};
