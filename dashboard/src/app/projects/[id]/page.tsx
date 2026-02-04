'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  repoName: string;
  description: string;
  branch: string;
  pm2Name: string;
  targetDir: string;
}

export default function ProjectDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Project not found');
        return res.json();
      })
      .then(data => {
        setProject(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch project:', err);
        setLoading(false);
      });
  }, [id]);

  const [selectedBranch, setSelectedBranch] = useState<string>('');

  useEffect(() => {
    if (project?.branch) {
      setSelectedBranch(project.branch);
    }
  }, [project]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/');
      } else {
        alert('Failed to delete project');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete project');
    }
  };

  const triggerDeploy = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${id}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branch: selectedBranch || 'main' })
      });
      alert('Deployment triggered!');
    } catch (err) {
      alert('Failed to trigger deployment');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!project) return <div className="p-10 text-center">Project not found</div>;

  const branchOptions = ['main', 'dev', 'prod', 'uat', 'stage'];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold">{project.name}</h2>
          <p className="text-muted mt-1">{project.repoName}</p>
        </div>
        <div className="flex gap-4 items-center">
          <select 
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="select select-bordered w-full max-w-xs"
          >
            {branchOptions.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <button onClick={handleDelete} className="px-4 py-2 bg-error/10 text-error rounded-lg hover:bg-error/20 font-semibold transition-all">
            Delete Project
          </button>
          <button onClick={triggerDeploy} className="btn-primary">
            Deploy Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-xs font-bold uppercase text-muted mb-4">Repository Info</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted mb-1">GitHub Repo</p>
              <p className="font-mono text-sm">{project.repoName}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Branch</p>
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase">
                {project.branch}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs font-bold uppercase text-muted mb-4">Server Config</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted mb-1">PM2 Name</p>
              <p className="font-mono text-sm">{project.pm2Name}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Target Directory</p>
              <p className="font-mono text-sm">{project.targetDir || 'Default (/root/mern)'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xs font-bold uppercase text-muted mb-4">Description</h3>
        <p className="text-muted leading-relaxed">
          {project.description || "No description provided for this project."}
        </p>
      </div>
    </div>
  );
}
