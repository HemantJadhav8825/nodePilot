'use client';

import { useEffect, useState } from 'react';

interface EnvVar {
  key: string;
  value: string;
}

export default function Settings() {
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This will fetch from a new endpoint I'll add soon
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/env`)
      .then(res => res.json())
      .then(data => {
        const vars = Object.entries(data).map(([key, value]) => ({ 
          key, 
          value: value as string 
        }));
        setEnvVars(vars);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-8">System Settings</h2>

      <div className="space-y-6">
        <section className="card">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Environment Variables</h3>
          <p className="text-sm text-muted mb-6">
            Global environment variables used by the NodePilot server.
          </p>

          <div className="space-y-4">
            {envVars.map((v) => (
              <div key={v.key} className="flex flex-col gap-1">
                <label className="text-xs font-mono font-bold text-muted uppercase tracking-wider">
                  {v.key}
                </label>
                <input 
                  type="text" 
                  value={v.value} 
                  readOnly 
                  className="bg-slate-900 border border-border rounded-lg px-4 py-2 text-sm font-mono text-slate-300 focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
            <strong>Note:</strong> Editing of environment variables is restricted in this version for security. Please modify the `.env` file on the VPS manually.
          </div>
        </section>

        <section className="card">
          <h3 className="text-xl font-semibold mb-2">Health Check</h3>
          <div className="flex items-center gap-2 text-sm text-success">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            NodePilot Server is running
          </div>
        </section>
      </div>
    </div>
  );
}
