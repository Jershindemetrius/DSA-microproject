import React, { useState } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useLogs } from '../context/LogContext';

function AuthScreen() {
  const { login, register, authError, setAuthError } = useLogs();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setAuthError('');
    setSubmitting(true);
    try {
      if (isRegistering) {
        await register({ username, email, password });
      } else {
        await login(username, password);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-7 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-800 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">CyberLog</h1>
            <p className="text-xs text-gray-500">Sign in to your security workspace</p>
          </div>
        </div>
        {(error || authError) && (
          <div role="alert" className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error || authError}</span>
          </div>
        )}
        {isRegistering && (
          <label className="block text-sm text-slate-700">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </label>
        )}
        <label className="block text-sm text-slate-700">
          Username
          <input
            autoComplete="username"
            minLength={3}
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Password
          <input
            type="password"
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
          {isRegistering && <span className="text-xs text-gray-500">At least 8 characters.</span>}
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-800 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-900 disabled:opacity-60"
        >
          {submitting ? 'Connecting…' : isRegistering ? 'Create account' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRegistering((value) => !value);
            setError('');
          }}
          className="w-full text-sm text-blue-800 hover:underline"
        >
          {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
        </button>
      </form>
    </main>
  );
}

export default AuthScreen;
