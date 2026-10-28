import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { createRule, fetchRules, updateRule } from '../services/api';

const EMPTY_RULE = {
  name: '',
  rule_type: '',
  description: '',
  severity: 'medium',
  threshold: 3,
  window_seconds: 300,
  pattern: '',
  enabled: true,
};

function Rules() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(EMPTY_RULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRules(await fetchRules());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await createRule({
        ...form,
        threshold: Number(form.threshold),
        window_seconds: Number(form.window_seconds),
        pattern: form.pattern || null,
      });
      setForm(EMPTY_RULE);
      setNotice('Detection rule saved.');
      await loadRules();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule) => {
    setError('');
    setNotice('');
    try {
      await updateRule(rule.id, { enabled: !rule.enabled });
      setNotice(`Rule "${rule.name}" ${rule.enabled ? 'disabled' : 'enabled'}.`);
      await loadRules();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-base font-bold text-slate-900">Detection Rules</h2>
        <p className="text-xs text-gray-500 mt-1">Rules are stored and managed by the backend.</p>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button onClick={loadRules} className="ml-3 font-semibold underline">Retry</button>
        </div>
      )}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <form onSubmit={submit} className="bg-white rounded-lg border border-gray-200 shadow-2xs p-4 md:p-5 space-y-3">
        <h3 className="font-semibold text-sm text-slate-900">Create a rule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label className="text-slate-700">
            Name
            <input required minLength={3} maxLength={100} value={form.name} onChange={(event) => updateForm('name', event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <label className="text-slate-700">
            Rule type
            <input required minLength={3} maxLength={50} value={form.rule_type} onChange={(event) => updateForm('rule_type', event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <label className="text-slate-700 md:col-span-2">
            Description
            <textarea required minLength={5} value={form.description} onChange={(event) => updateForm('description', event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" rows="2" />
          </label>
          <label className="text-slate-700">
            Severity
            <select value={form.severity} onChange={(event) => updateForm('severity', event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2">
              {['critical', 'high', 'medium', 'low', 'info'].map((severity) => <option key={severity} value={severity}>{severity}</option>)}
            </select>
          </label>
          <label className="text-slate-700">
            Threshold
            <input type="number" min="1" required value={form.threshold} onChange={(event) => updateForm('threshold', event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <label className="text-slate-700">
            Window (seconds)
            <input type="number" min="10" required value={form.window_seconds} onChange={(event) => updateForm('window_seconds', event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <label className="text-slate-700">
            Pattern (optional)
            <input value={form.pattern} onChange={(event) => updateForm('pattern', event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
        </div>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50">
          <Plus className="w-4 h-4" />
          {saving ? 'Saving…' : 'Create rule'}
        </button>
      </form>

      <section className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-sm text-slate-900">Configured rules</h3>
          <button onClick={loadRules} aria-label="Refresh rules" className="text-blue-800 hover:text-blue-950"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-500">Loading rules…</p>
        ) : rules.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No detection rules have been configured.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <article key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    {rule.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">{rule.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {rule.rule_type} · {rule.severity} · threshold {rule.threshold} / {rule.window_seconds}s
                  </p>
                </div>
                <button
                  onClick={() => toggleRule(rule)}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold border ${rule.enabled ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-300'}`}
                >
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Rules;
