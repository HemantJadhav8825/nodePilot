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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({
    id: '',
    name: '',
    repoName: '',
    description: '',
    branch: 'main',
    pm2Name: '',
    targetDir: ''
  });

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

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProject)
      });
      
      if (!res.ok) throw new Error('Failed to create project');
      
      const created = await res.json();
      setProjects([...projects, created]);
      setShowAddModal(false);
      setNewProject({
        id: '',
        name: '',
        repoName: '',
        description: '',
        branch: 'main',
        pm2Name: '',
        targetDir: ''
      });
    } catch (err) {
      console.error('Failed to add project:', err);
      alert('Failed to add project');
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
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          Add Project
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-bold">Add New Project</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddProject} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted">Project ID</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. my-app"
                    className="w-full bg-slate-900 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                    value={newProject.id}
                    onChange={e => setNewProject({...newProject, id: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted">Display Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. My Website"
                    className="w-full bg-slate-900 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted">GitHub Repository</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. HemantJadhav8825/admin-panel"
                  className="w-full bg-slate-900 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                  value={newProject.repoName}
                  onChange={e => setNewProject({...newProject, repoName: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted">Description</label>
                <textarea 
                  placeholder="Tell us about this project..."
                  className="w-full bg-slate-900 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none h-20 resize-none"
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted">Branch</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                    value={newProject.branch}
                    onChange={e => setNewProject({...newProject, branch: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted">PM2 Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. my-app-server"
                    className="w-full bg-slate-900 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                    value={newProject.pm2Name}
                    onChange={e => setNewProject({...newProject, pm2Name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted">Server Target Path</label>
                <input 
                  type="text" 
                  placeholder="e.g. /root/mern/my-app"
                  className="w-full bg-slate-900 border border-border rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                  value={newProject.targetDir}
                  onChange={e => setNewProject({...newProject, targetDir: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full btn-primary py-3 mt-4">Save Project</button>
            </form>
          </div>
        </div>
      )}

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
