'use client';

import { useEffect, useState } from 'react';

interface Project {
  id: string;
  name: string;
  repoName: string;
  description: string;
  branch: string;
  pm2Name: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`)
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch projects:', err);
        setLoading(false);
      });
  }, []);

  const triggerDeploy = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${id}/deploy`, {
        method: 'POST'
      });
      const data = await res.json();
      alert(`Deployment triggered for ${id}: ${data.status}`);
    } catch (err) {
      console.error('Failed to trigger deploy:', err);
      alert('Failed to trigger deployment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted mt-1">Manage and deploy your Node.js applications.</p>
        </div>
        <button className="btn-primary">Add Project</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="card group hover:border-primary/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{project.name}</h3>
                <p className="text-sm text-muted">{project.repoName}</p>
              </div>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase">
                {project.branch}
              </span>
            </div>
            
            <p className="text-sm text-muted mb-6 line-clamp-2">
              {project.description || "No description provided."}
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => triggerDeploy(project.id)}
                className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
              >
                Deploy Now
              </button>
              <a 
                href={`/projects/${project.id}`}
                className="px-4 py-2 border border-border rounded-lg font-semibold hover:bg-white/5 transition-all text-sm"
              >
                Details
              </a>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <p className="text-muted">No projects found. Add your first project to get started.</p>
        </div>
      )}
    </div>
  );
}
