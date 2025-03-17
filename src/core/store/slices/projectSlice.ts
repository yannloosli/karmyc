import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IProject } from '../../types/core';
import { validateProject } from '../../utils/validation';

interface ProjectState {
  projects: IProject[];
  activeProjectId: string | null;
  errors: string[];
}

const initialState: ProjectState = {
  projects: [],
  activeProjectId: null,
  errors: [],
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    createProject: (state, action: PayloadAction<Omit<IProject, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newProject: IProject = {
        ...action.payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const validation = validateProject(newProject);
      if (!validation.isValid) {
        state.errors = validation.errors;
        return;
      }

      state.projects.push(newProject);
      state.errors = [];
    },
    updateProject: (state, action: PayloadAction<{ id: string; changes: Partial<IProject> }>) => {
      const { id, changes } = action.payload;
      const projectIndex = state.projects.findIndex(project => project.id === id);
      
      if (projectIndex === -1) {
        state.errors = ['Projet non trouvé'];
        return;
      }

      const updatedProject = {
        ...state.projects[projectIndex],
        ...changes,
        updatedAt: new Date().toISOString(),
      };

      const validation = validateProject(updatedProject);
      if (!validation.isValid) {
        state.errors = validation.errors;
        return;
      }

      state.projects[projectIndex] = updatedProject;
      state.errors = [];
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      const projectExists = state.projects.some(project => project.id === action.payload);
      if (!projectExists) {
        state.errors = ['Projet non trouvé'];
        return;
      }

      state.projects = state.projects.filter(project => project.id !== action.payload);
      if (state.activeProjectId === action.payload) {
        state.activeProjectId = null;
      }
      state.errors = [];
    },
    setActiveProject: (state, action: PayloadAction<string | null>) => {
      if (action.payload) {
        const projectExists = state.projects.some(project => project.id === action.payload);
        if (!projectExists) {
          state.errors = ['Projet non trouvé'];
          return;
        }
      }
      state.activeProjectId = action.payload;
      state.errors = [];
    },
    clearErrors: (state) => {
      state.errors = [];
    },
  },
});

// Actions
export const { createProject, updateProject, deleteProject, setActiveProject, clearErrors } = projectSlice.actions;

// Sélecteurs
export const selectProjectState = (state: { project: ProjectState }) => state.project;
export const selectAllProjects = (state: { project: ProjectState }) => state.project.projects;
export const selectActiveProjectId = (state: { project: ProjectState }) => state.project.activeProjectId;
export const selectActiveProject = (state: { project: ProjectState }) =>
  state.project.activeProjectId
    ? state.project.projects.find(project => project.id === state.project.activeProjectId)
    : null;
export const selectProjectById = (id: string) => (state: { project: ProjectState }) =>
  state.project.projects.find(project => project.id === id);
export const selectProjectErrors = (state: { project: ProjectState }) => state.project.errors;

export default projectSlice.reducer; 
