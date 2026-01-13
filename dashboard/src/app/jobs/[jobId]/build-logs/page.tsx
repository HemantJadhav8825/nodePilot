'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function JobLogs() {
  const { jobId } = useParams();
  const [logs, setLogs] = useState<string>('Loading logs...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logs/${jobId}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data.content || 'No logs found for this job.');
        setLoading(false);
      })
      .catch(err => {
        setLogs('Failed to fetch logs. The job might still be in queue or log file was removed.');
        setLoading(false);
      });
  }, [jobId]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">Build Logs</h2>
          <p className="text-muted mt-1 font-mono">Job ID: #{jobId}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-border rounded-lg font-semibold hover:bg-white/5"
        >
          Refresh Logs
        </button>
      </div>

      <div className="bg-black/50 border border-border rounded-xl p-6 font-mono text-sm overflow-x-auto min-h-[500px] whitespace-pre-wrap">
        {loading ? (
          <div className="flex items-center gap-3 text-muted">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Searching for logs...
          </div>
        ) : (
          <div className="text-slate-300">
            {logs}
          </div>
        )}
      </div>
    </div>
  );
}
