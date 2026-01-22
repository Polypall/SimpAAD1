
import React, { useState } from 'react';
import { AuthMode, User } from '../types';
import { LogIn, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Mocking Supabase Auth interaction
    setTimeout(() => {
      if (mode === 'forgot-password') {
        setMessage('Reset link sent to your email!');
        setLoading(false);
        return;
      }
      
      // Simulate successful login
      onAuthSuccess({ id: '1', email });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-glass border border-white/20 shadow-2xl backdrop-blur-xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">
          SimpAAD
        </h1>
        <p className="text-slate-400">
          {mode === 'login' ? 'Welcome back, designer' : 
           mode === 'signup' ? 'Start your CAD journey' : 
           'Recover your account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 focus:border-blue-500 outline-none transition-colors"
            placeholder="name@example.com"
            required
          />
        </div>

        {mode !== 'forgot-password' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 focus:border-blue-500 outline-none transition-colors"
              placeholder="••••••••"
              required={mode !== 'forgot-password'}
            />
          </div>
        )}

        {message && (
          <div className="p-3 rounded-lg bg-green-500/20 text-green-400 text-sm border border-green-500/50">
            {message}
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : (
            <>
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : 
               mode === 'signup' ? <UserPlus className="w-5 h-5" /> : 
               <KeyRound className="w-5 h-5" />}
              {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3 text-center">
        {mode === 'login' ? (
          <>
            <button onClick={() => setMode('signup')} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Don't have an account? Sign up
            </button>
            <button onClick={() => setMode('forgot-password')} className="text-sm text-slate-400 hover:text-white transition-colors">
              Forgot your password?
            </button>
          </>
        ) : (
          <button onClick={() => setMode('login')} className="text-sm text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>
        )}
      </div>
    </div>
  );
};
