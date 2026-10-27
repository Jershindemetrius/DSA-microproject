import React, { useState } from 'react';
import { UploadCloud, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { uploadLogFile, fetchLogRecords } from '../services/api';
import { analyzeLogs } from '../utils/analyzer';
import LogTable from '../components/LogTable';

function Analyze() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [results, setResults] = useState([]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.name.endsWith('.log') || selected.name.endsWith('.txt')) ) {
      setFile(selected);
    } else {
      alert('Please select a .log or .txt file');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus('loading');
    try {
      // In demo mode we ignore upload and use local sample data
      await uploadLogFile(file);
      const { data: logs } = await fetchLogRecords();
      const analysed = analyzeLogs(logs);
      setResults(analysed);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const loadSample = async () => {
    setStatus('loading');
    const { data: logs } = await fetchLogRecords();
    const analysed = analyzeLogs(logs);
    setResults(analysed);
    setStatus('success');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-primary">Analyze Logs</h2>
      <div className="border border-dashed border-gray-300 rounded p-8 text-center bg-white">
        <label className="cursor-pointer flex flex-col items-center space-y-2">
          <UploadCloud className="w-12 h-12 text-primary" />
          <span className="text-sm text-gray-600">Drag & drop a .log or .txt file here, or click to select</span>
          <input type="file" accept=".log,.txt" className="hidden" onChange={handleFileChange} />
        </label>
        {file && <p className="mt-2 text-sm">Selected: {file.name} ({(file.size/1024).toFixed(1)} KB)</p>}
        <div className="mt-4 space-x-2">
          <button
            onClick={handleAnalyze}
            disabled={!file || status === 'loading'}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 disabled:opacity-50"
          >
            {status === 'loading' ? <Loader2 className="animate-spin inline-block mr-2" /> : <FileText className="inline-block mr-2" />}
            Analyze
          </button>
          <button
            onClick={loadSample}
            disabled={status === 'loading'}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Load Sample Logs
          </button>
        </div>
      </div>

      {status === 'error' && (
        <div className="text-red-600 flex items-center">
          <XCircle className="w-5 h-5 mr-1" /> Error processing the file.
        </div>
      )}

      {status === 'success' && results.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-2 text-primary">Analysis Results</h3>
          <LogTable logs={results} />
        </div>
      )}
    </div>
  );
}

export default Analyze;
