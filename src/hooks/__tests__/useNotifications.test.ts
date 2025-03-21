import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useNotifications } from '../useNotifications';
import notificationReducer from '../../store/slices/notificationSlice';

const createTestStore = () =>
  configureStore({
    reducer: {
      notifications: notificationReducer,
    },
  });

describe('useNotifications', () => {
  const store = createTestStore();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  it('devrait fournir des méthodes pour afficher différents types de notifications', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.showError("Message d'erreur");
      result.current.showWarning("Message d'avertissement");
      result.current.showInfo("Message d'information");
      result.current.showSuccess("Message de succès");
    });

    const state = store.getState();
    expect(state.notifications.notifications).toHaveLength(4);
    expect(state.notifications.notifications[0].type).toBe('error');
    expect(state.notifications.notifications[1].type).toBe('warning');
    expect(state.notifications.notifications[2].type).toBe('info');
    expect(state.notifications.notifications[3].type).toBe('success');
  });

  it('devrait permettre d\'ajouter des actions aux notifications', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    const action = {
      label: 'Action',
      onClick: jest.fn(),
    };

    act(() => {
      result.current.showError("Message d'erreur", action);
    });

    const state = store.getState();
    expect(state.notifications.notifications[0].action).toBeDefined();
    expect(state.notifications.notifications[0].action?.label).toBe('Action');
  });

  it('devrait respecter la limite maximale de notifications', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      // Créer plus de notifications que la limite maximale
      for (let i = 0; i < 10; i++) {
        result.current.showInfo(`Message ${i}`);
      }
    });

    const state = store.getState();
    expect(state.notifications.notifications.length).toBeLessThanOrEqual(5); // 5 est la limite par défaut
  });
}); 
