import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Info,
  FileText
} from 'lucide-react';
import { useLogs } from '../context/LogContext';
import LogTable from '../components/LogTable';

function Analyze() {
  const { logs, stats, processNewLogs, resetToSample } = useLogs();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, analyzing, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResultSummary, setAnalysisResultSummary] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndReadFile = (file) => {
    setErrorMessage('');
    if (!file) return;

    const validExtensions = ['.log', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Invalid file format. Please upload a standard server log (.log) or plain text (.txt) file.');
      setSelectedFile(null);
      setFileContent('');
      return;
    }

    if (file.size === 0) {
      setErrorMessage('The selected file is empty. Please provide a file with valid log lines.');
      setSelectedFile(null);
      setFileContent('');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the file. Please check permissions and try again.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndReadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndReadFile(e.target.files[0]);
    }
  };

  const handleStartAnalysis = () => {
    if (!fileContent) {
      setErrorMessage('No log data available to analyze. Please select or drop a valid file first.');
      return;
    }

    setStatus('analyzing');
    setErrorMessage('');

    // Simulate analysis processing for realistic faculty demo presentation
    setTimeout(() => {
      try {
        const { analyzedLogs, detectedAlerts } = processNewLogs(fileContent, selectedFile.name);
        setAnalysisResultSummary({
          totalProcessed: analyzedLogs.length,
          threatsFound: detectedAlerts.length,
          criticalFound: detectedAlerts.filter(a => a.severity === 'critical').length,
          fileName: selectedFile.name,
          timestamp: new Date().toLocaleTimeString()
        });
        setStatus('success');
      } catch (err) {
        setErrorMessage('Failed to parse log entries. Check if the file format contains recognized timestamps or IP addresses.');
        setStatus('error');
      }
    }, 700);
  };

  const handleLoadSample = () => {
    setStatus('analyzing');
    setErrorMessage('');
    setSelectedFile(null);
    setFileContent('');

    setTimeout(() => {
      resetToSample();
      setAnalysisResultSummary({
        totalProcessed: 17,
        threatsFound: 5,
        criticalFound: 2,
        fileName: 'sample-cyber-traffic.log',
        timestamp: new Date().toLocaleTimeString()
      });
      setStatus('success');
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Upload Box Area */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upload Log File</h2>
            <p className="text-xs text-gray-500">Supported formats: standard Web, Syslog, Auth, or Apache/Nginx .log and .txt files</p>
          </div>
          <button
            onClick={handleLoadSample}
            disabled={status === 'analyzing'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            <span>Load Sample Logs (Demo)</span>
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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
            onChange={handleFileChange}
            accept=".log,.txt"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            {selectedFile ? (
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
                <FileCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mb-1">
                <UploadCloud className="w-6 h-6" />
              </div>
            )}

            {selectedFile ? (
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB • Ready for automated heuristic scanning
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Drag & drop server log file here, or <span className="text-blue-700 underline">browse files</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Upload Linux auth.log, Apache access.log, or custom application trace logs (.log, .txt)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleStartAnalysis}
            disabled={!selectedFile || status === 'analyzing'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-semibold bg-blue-800 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
          >
            {status === 'analyzing' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Heuristic Engine...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Analyze Uploaded File</span>
              </>
            )}
          </button>

          {selectedFile && (
            <button
              onClick={() => {
                setSelectedFile(null);
                setFileContent('');
                setErrorMessage('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          )}
        </div>
      </div>

      {/* Analysis Result Summary Banner */}
      {analysisResultSummary && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-900">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Analysis Completed Successfully at {analysisResultSummary.timestamp}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-2">
            <div className="bg-white/80 p-2.5 rounded border border-emerald-200/80">
              <span className="text-gray-500 block">Source File</span>
              <span className="font-semibold text-slate-800 truncate block">{analysisResultSummary.fileName}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-emerald-200/80">
              <span className="text-gray-500 block">Total Records Parsed</span>
              <span className="font-semibold text-slate-800">{analysisResultSummary.totalProcessed}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-emerald-200/80">
              <span className="text-gray-500 block">Flagged Threats</span>
              <span className="font-semibold text-orange-700">{analysisResultSummary.threatsFound}</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-emerald-200/80">
              <span className="text-gray-500 block">Critical Incidents</span>
              <span className="font-semibold text-red-700">{analysisResultSummary.criticalFound}</span>
            </div>
          </div>
        </div>
      )}

      {/* Processed Logs Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Processed Log Records</h3>
            <p className="text-xs text-gray-500">Inspected log lines with threat status and rule detection tags</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {logs.length} Total Records
          </span>
        </div>
        <LogTable logs={logs} pageSize={10} />
      </div>
    </div>
  );
}

export default Analyze;
