'use client';

import { useEffect, useState } from 'react';

interface Job {
  id: string;
  name: string;
  data: {
    repoName: string;
    branch: string;
  };
  status: string;
  timestamp: number;
}

export default function BuildHistory() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:7001/api/jobs')
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight mb-8">Build History</h2>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold uppercase text-muted">Job ID</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-muted">Project</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-muted">Branch</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-muted">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-muted">Timestamp</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-muted">#{job.id}</td>
                <td className="px-6 py-4 text-sm font-medium">{job.data.repoName}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-xs">{job.data.branch}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                    job.status === 'completed' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted">
                  {new Date(job.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <a 
                    href={`/projects/${job.data.repoName.split('/').pop()}`}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    View Logs
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <div className="text-center py-20 text-muted">
            No build records found in the system.
          </div>
        )}
      </div>
    </div>
  );
}
