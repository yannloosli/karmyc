import { AnyAction, Middleware } from '@reduxjs/toolkit';
import { IStateTransition } from '../../types/state';
import { RootState } from '../index';
import { transitionState } from '../slices/stateSlice';

// Registre des transitions disponibles
const transitions: Record<string, IStateTransition> = {};

// Transitions prédéfinies
const predefinedTransitions: IStateTransition[] = [
  {
    from: 'draft',
    to: 'review',
    condition: (state) => {
      // Vérifier que l'état est prêt pour la revue
      return state.data.isComplete && !state.data.hasErrors;
    },
    action: (state, data) => {
      // Actions spécifiques lors de la transition vers la revue
      state.data.reviewStartedAt = new Date().toISOString();
      state.data.reviewer = data?.reviewer;
    }
  },
  {
    from: 'review',
    to: 'approved',
    condition: (state) => {
      // Vérifier que la revue est terminée
      return state.data.reviewStatus === 'completed' && state.data.reviewResult === 'approved';
    },
    action: (state, data) => {
      // Actions spécifiques lors de l'approbation
      state.data.approvedAt = new Date().toISOString();
      state.data.approvedBy = data?.approver;
    }
  },
  {
    from: 'review',
    to: 'rejected',
    condition: (state) => {
      // Vérifier que la revue est terminée
      return state.data.reviewStatus === 'completed' && state.data.reviewResult === 'rejected';
    },
    action: (state, data) => {
      // Actions spécifiques lors du rejet
      state.data.rejectedAt = new Date().toISOString();
      state.data.rejectedBy = data?.rejector;
      state.data.rejectionReason = data?.reason;
    }
  },
  {
    from: 'approved',
    to: 'published',
    condition: (state) => {
      // Vérifier que l'état est prêt pour la publication
      return state.data.isReadyForPublish && !state.data.hasWarnings;
    },
    action: (state, data) => {
      // Actions spécifiques lors de la publication
      state.data.publishedAt = new Date().toISOString();
      state.data.publishedBy = data?.publisher;
    }
  },
  {
    from: 'published',
    to: 'archived',
    condition: (state) => {
      // Vérifier que l'état peut être archivé
      return state.data.canBeArchived;
    },
    action: (state, data) => {
      // Actions spécifiques lors de l'archivage
      state.data.archivedAt = new Date().toISOString();
      state.data.archivedBy = data?.archiver;
    }
  }
];

// Enregistrer les transitions prédéfinies
predefinedTransitions.forEach(transition => {
  registerTransition(transition);
});

export const registerTransition = (transition: IStateTransition) => {
  const key = `${transition.from}-${transition.to}`;
  transitions[key] = transition;
};

export const unregisterTransition = (from: string, to: string) => {
  const key = `${from}-${to}`;
  delete transitions[key];
};

export const getAvailableTransitions = (currentType: string): string[] => {
  return Object.entries(transitions)
    .filter(([key]) => key.startsWith(currentType))
    .map(([key]) => key.split('-')[1]);
};

export const stateMiddleware: Middleware<{}, RootState> = store => next => (action: AnyAction) => {
  // Exécuter l'action normalement
  const result = next(action);

  // Gérer les transitions d'état
  if (action.type === transitionState.type) {
    const { id, transition, data } = action.payload;
    const currentState = store.getState().state.states[id];
    
    if (currentState) {
      const transitionKey = `${currentState.type}-${transition}`;
      const transitionConfig = transitions[transitionKey];

      if (transitionConfig) {
        // Vérifier les conditions de transition
        if (!transitionConfig.condition || transitionConfig.condition(currentState)) {
          // Exécuter l'action de transition si définie
          if (transitionConfig.action) {
            transitionConfig.action(currentState, data);
          }
          
          // Mettre à jour le type d'état
          currentState.type = transitionConfig.to;
          currentState.updatedAt = new Date().toISOString();
        }
      }
    }
  }

  return result;
}; 
