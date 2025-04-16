import { AnyAction, Middleware } from '@reduxjs/toolkit';
import { IStateTransition } from '../../types/state';
import { RootState } from '../index';
import { clearLoading, setLoading } from '../slices/stateSlice';

// Registry of available transitions
const transitions: Record<string, IStateTransition> = {};

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

// Predefined transitions
const predefinedTransitions: IStateTransition[] = [
    {
        from: 'draft',
        to: 'review',
        condition: (state) => {
            // Check if state is ready for review
            return state.data.isComplete && !state.data.hasErrors;
        },
        action: (state, data) => {
            // Specific actions when transitioning to review
            state.data.reviewStartedAt = new Date().toISOString();
            state.data.reviewer = data?.reviewer;
        }
    },
    {
        from: 'review',
        to: 'approved',
        condition: (state) => {
            // Check if review is completed
            return state.data.reviewStatus === 'completed' && state.data.reviewResult === 'approved';
        },
        action: (state, data) => {
            // Specific actions when approving
            state.data.approvedAt = new Date().toISOString();
            state.data.approvedBy = data?.approver;
        }
    },
    {
        from: 'review',
        to: 'rejected',
        condition: (state) => {
            // Check if review is completed
            return state.data.reviewStatus === 'completed' && state.data.reviewResult === 'rejected';
        },
        action: (state, data) => {
            // Specific actions when rejecting
            state.data.rejectedAt = new Date().toISOString();
            state.data.rejectedBy = data?.rejector;
            state.data.rejectionReason = data?.reason;
        }
    },
    {
        from: 'approved',
        to: 'published',
        condition: (state) => {
            // Check if state is ready for publication
            return state.data.isReadyForPublish && !state.data.hasWarnings;
        },
        action: (state, data) => {
            // Specific actions when publishing
            state.data.publishedAt = new Date().toISOString();
            state.data.publishedBy = data?.publisher;
        }
    },
    {
        from: 'published',
        to: 'archived',
        condition: (state) => {
            // Check if state can be archived
            return state.data.canBeArchived;
        },
        action: (state, data) => {
            // Specific actions when archiving
            state.data.archivedAt = new Date().toISOString();
            state.data.archivedBy = data?.archiver;
        }
    }
];

// Register predefined transitions
predefinedTransitions.forEach(transition => {
    registerTransition(transition);
});

const stateMiddleware: Middleware<{}, RootState> = store => next => async (action: AnyAction) => {
    const result = next(action);

    if (action.type === 'state/transitionState') {
        const { id, transition, data } = action.payload;
        const state = store.getState().state.states[id];

        if (!state) {
            return result;
        }

        const transitionConfig = predefinedTransitions.find(
            (t) => t.from === state.type && t.to === transition
        );

        if (transitionConfig) {
            try {
                // Set loading state
                store.dispatch(setLoading({ id: 'area-root', loading: true }));

                // Check condition if it exists
                if (transitionConfig.condition && !transitionConfig.condition(state)) {
                    throw new Error('Transition condition not satisfied');
                }

                // Execute transition action if it exists
                if (transitionConfig.action) {
                    await transitionConfig.action(state, data);
                }

                // Update state with new type
                store.dispatch({
                    type: 'state/updateState',
                    payload: {
                        id,
                        changes: {
                            type: transition,
                            updatedAt: new Date().toISOString(),
                        },
                    },
                });
            } catch (error) {
                console.error('Error during transition:', error);
                store.dispatch({
                    type: 'state/clearErrors',
                });
            } finally {
                // Clean up loading state
                store.dispatch(clearLoading('area-root'));
            }
        }
    }

    return result;
};

export { stateMiddleware };
