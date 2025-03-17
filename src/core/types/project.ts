export interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  areas: Array<{ id: string; name: string }>;
  createdAt: number;
}

export interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;
} 
