import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileCheck,
  FileText,
  Loader2,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';
import { useLogs } from '../context/LogContext';
import LogTable from '../components/LogTable';
import { fetchLogRecords, runAnalysis, uploadLogFile } from '../services/api';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.json', '.jsonl', '.ndjson', '.log', '.txt'];

function normalizeLog(log) {
  return {
    ...log,
    sourceIp: log.source_ip || '—',
    eventType: log.event_type,
    authResult: log.auth_result,
  };
}

function Analyze() {
  const { refreshData, setActiveFileName } = useLogs();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');
  const fileInputRef = useRef(null);

  const loadLogs = async (signal) => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const page = await fetchLogRecords({ page: 1, size: 20 }, { signal });
      setLogs(page.items.map(normalizeLog));
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        setLogsError(error.message);
      }
    } finally {
      if (!signal?.aborted) setLogsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadLogs(controller.signal);
    return () => controller.abort();
  }, []);

  const validateFile = (file) => {
    setErrorMessage('');
    setUploadResult(null);
    setAnalysisResult(null);
    if (!file) return;

    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setErrorMessage(`Unsupported file format. Use ${ACCEPTED_EXTENSIONS.join(', ')}.`);
      setSelectedFile(null);
      return;
    }
    if (!file.size) {
      setErrorMessage('The selected file is empty.');
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setErrorMessage('The selected file exceeds the 5 MB upload limit.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadAndAnalysis = async () => {
    if (!selectedFile) return;
    setStatus('analyzing');
    setErrorMessage('');
    setUploadResult(null);
    setAnalysisResult(null);
    try {
      const ingestion = await uploadLogFile(selectedFile);
      setUploadResult(ingestion);
      setActiveFileName(selectedFile.name);
      const analysis = await runAnalysis();
      setAnalysisResult(analysis);
      setStatus('success');
      refreshData();
      await loadLogs();
    } catch (error) {
      setErrorMessage(error.message);
      setStatus('error');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setAnalysisResult(null);
    setErrorMessage('');
    setStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border border-gray-200 shadow-2xs p-5 md:p-6">
        <div className="pb-4 mb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-slate-900">Upload Log File</h2>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: JSON, JSON Lines, Syslog, or plain-text log files (maximum 5 MB)
          </p>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            validateFile(event.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-600 bg-blue-50/50'
              : selectedFile
                ? 'border-emerald-500/80 bg-emerald-50/20'
                : 'border-gray-300 hover:border-gray-400 bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(event) => validateFile(event.target.files?.[0])}
            accept={ACCEPTED_EXTENSIONS.join(',')}
            className="hidden"
          />
          <div className="flex flex-col items-center space-y-2">
            {selectedFile ? (
              <FileCheck className="w-10 h-10 text-emerald-700" />
            ) : (
              <UploadCloud className="w-10 h-10 text-blue-800" />
            )}
            {selectedFile ? (
              <>
                <p className="text-sm font-semibold text-slate-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-800">
                  Drag and drop a log file here, or <span className="text-blue-700 underline">browse</span>
                </p>
                <p className="text-xs text-gray-500">The backend will validate, ingest, and analyze the records.</p>
              </>
            )}
          </div>
        </div>

        {errorMessage && (
          <div role="alert" className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleUploadAndAnalysis}
            disabled={!selectedFile || status === 'analyzing'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-semibold bg-blue-800 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
          >
            {status === 'analyzing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>{status === 'analyzing' ? 'Uploading and analyzing…' : 'Upload and analyze'}</span>
          </button>
          {selectedFile && (
            <button
              onClick={clearSelection}
              disabled={status === 'analyzing'}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-300 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          )}
        </div>
      </section>

      {uploadResult && (
        <section className={`rounded-lg p-4 ${analysisResult ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-blue-50 border border-blue-200 text-blue-900'}`}>
          <div className="flex items-center gap-2 font-bold text-sm mb-3">
            {analysisResult && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <span>{analysisResult ? 'Backend analysis completed' : 'Upload accepted by backend'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/80 p-2.5 rounded border border-gray-200">
              <span className="text-gray-500 block">Inserted</span>
              <span className="font-semibold">{uploadResult.inserted}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-gray-200">
              <span className="text-gray-500 block">Duplicates</span>
              <span className="font-semibold">{uploadResult.duplicates}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-gray-200">
              <span className="text-gray-500 block">Rejected</span>
              <span className="font-semibold">{uploadResult.rejected}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-gray-200">
              <span className="text-gray-500 block">Alerts generated</span>
              <span className="font-semibold">{analysisResult?.alerts_generated ?? '—'}</span>
            </div>
          </div>
          {uploadResult.errors?.length > 0 && (
            <ul className="mt-3 list-disc list-inside text-xs space-y-1">
              {uploadResult.errors.map((message, index) => <li key={`${index}-${message}`}>{message}</li>)}
            </ul>
          )}
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Stored Log Records</h3>
            <p className="text-xs text-gray-500">Latest records returned by the backend.</p>
          </div>
          {!logsLoading && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{logs.length} shown</span>}
        </div>
        {logsError && (
          <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {logsError}
            <button onClick={() => loadLogs()} className="ml-3 font-semibold underline">Retry</button>
          </div>
        )}
        {logsLoading ? <p className="py-6 text-center text-sm text-gray-500">Loading log records…</p> : <LogTable logs={logs} showPagination={false} />}
      </section>
    </div>
  );
}

export default Analyze;
