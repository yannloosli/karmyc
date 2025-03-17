import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    createProject,
    deleteProject,
    selectActiveProject,
    selectAllProjects,
    selectProjectById,
    setActiveProject,
    updateProject
} from '../store/slices/projectSlice';
import { IProject } from '../types/core';

/**
 * Hook pour gérer les projets
 * Fournit des fonctions pour manipuler les projets et accéder à leur état
 */
export function useProject() {
  const dispatch = useDispatch();
  
  // Sélecteurs
  const projects = useSelector(selectAllProjects);
  const activeProject = useSelector(selectActiveProject);
  
  // Actions
  const createNewProject = useCallback((project: Omit<IProject, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch(createProject(project));
  }, [dispatch]);
  
  const updateExistingProject = useCallback((id: string, changes: Partial<IProject>) => {
    dispatch(updateProject({ id, changes }));
  }, [dispatch]);
  
  const removeProject = useCallback((id: string) => {
    dispatch(deleteProject(id));
  }, [dispatch]);
  
  const activateProject = useCallback((id: string | null) => {
    dispatch(setActiveProject(id));
  }, [dispatch]);
  
  const getProjectById = useCallback((id: string) => {
    return useSelector(selectProjectById(id));
  }, []);

  return {
    // État
    projects,
    activeProject,
    
    // Actions
    createNewProject,
    updateExistingProject,
    removeProject,
    activateProject,
    getProjectById,
  };
} 
