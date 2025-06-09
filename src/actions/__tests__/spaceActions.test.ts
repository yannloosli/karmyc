import { createSpace, updateSpaceState, setActiveSpace } from '../spaceActions';
import { SpaceActionTypes } from '../../types';

describe('Space Actions', () => {
  it('devrait créer une action CREATE_SPACE', () => {
    const spaceName = 'Test Space';
    const initialState = { color: '#ff0000' };
    const action = createSpace(spaceName, initialState);

    expect(action.type).toBe(SpaceActionTypes.CREATE_SPACE);
    expect(action.payload.name).toBe(spaceName);
    expect(action.payload.sharedState).toEqual(initialState);
  });

  it('devrait créer une action UPDATE_SPACE_STATE', () => {
    const spaceId = 'test-space-1';
    const newState = { color: '#00ff00' };
    const action = updateSpaceState(spaceId, newState);

    expect(action.type).toBe(SpaceActionTypes.UPDATE_SPACE_STATE);
    expect(action.payload.spaceId).toBe(spaceId);
    expect(action.payload.state).toEqual(newState);
  });

  it('devrait créer une action SET_ACTIVE_SPACE', () => {
    const spaceId = 'test-space-1';
    const action = setActiveSpace(spaceId);

    expect(action.type).toBe(SpaceActionTypes.SET_ACTIVE_SPACE);
    expect(action.payload.spaceId).toBe(spaceId);
  });
}); 
