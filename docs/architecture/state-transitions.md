# State Transition System

## Overview

The state transition system allows for controlled and predictable state changes. It is based on a system of predefined transitions with associated conditions and actions.

## Predefined States

1. **Draft**
   - Initial state of an element
   - Modifiable
   - In creation

2. **Review**
   - Under review
   - Requires validation
   - Can be approved or rejected

3. **Approved**
   - Validated by reviewers
   - Ready for publication
   - Can be published

4. **Published**
   - Publicly available
   - Final version
   - Can be archived

5. **Archived**
   - No longer active
   - Kept for reference
   - Final state

## Available Transitions

### Draft → Review
```typescript
{
  from: 'draft',
  to: 'review',
  condition: (state) => state.data.isComplete && !state.data.hasErrors,
  action: (state, data) => {
    state.data.reviewStartedAt = new Date().toISOString();
    state.data.reviewer = data?.reviewer;
  }
}
```

### Review → Approved
```typescript
{
  from: 'review',
  to: 'approved',
  condition: (state) => 
    state.data.reviewStatus === 'completed' && 
    state.data.reviewResult === 'approved',
  action: (state, data) => {
    state.data.approvedAt = new Date().toISOString();
    state.data.approvedBy = data?.approver;
  }
}
```

### Review → Rejected
```typescript
{
  from: 'review',
  to: 'rejected',
  condition: (state) => 
    state.data.reviewStatus === 'completed' && 
    state.data.reviewResult === 'rejected',
  action: (state, data) => {
    state.data.rejectedAt = new Date().toISOString();
    state.data.rejectedBy = data?.rejector;
    state.data.rejectionReason = data?.reason;
  }
}
```

### Approved → Published
```typescript
{
  from: 'approved',
  to: 'published',
  condition: (state) => 
    state.data.isReadyForPublish && 
    !state.data.hasWarnings,
  action: (state, data) => {
    state.data.publishedAt = new Date().toISOString();
    state.data.publishedBy = data?.publisher;
  }
}
```

### Published → Archived
```typescript
{
  from: 'published',
  to: 'archived',
  condition: (state) => state.data.canBeArchived,
  action: (state, data) => {
    state.data.archivedAt = new Date().toISOString();
    state.data.archivedBy = data?.archiver;
  }
}
```

## API

### Registering a Transition

```typescript
registerTransition({
  from: 'currentState',
  to: 'newState',
  condition: (state) => boolean,
  action: (state, data) => void
});
```

### Removing a Transition

```typescript
unregisterTransition('currentState', 'newState');
```

### Listing Available Transitions

```typescript
const availableTransitions = getAvailableTransitions('currentState');
```

### Using in a Component

```typescript
import { useAppDispatch } from '../hooks';
import { transitionState } from '../store/slices/stateSlice';

function MyComponent() {
  const dispatch = useAppDispatch();

  const handleTransition = () => {
    dispatch(transitionState({
      id: 'stateId',
      transition: 'review',
      data: { reviewer: 'John Doe' }
    }));
  };

  return <button onClick={handleTransition}>Review</button>;
}
```

## Best Practices

1. **Conditions**
   - Always check data validity
   - Include explicit error messages
   - Avoid complex conditions

2. **Actions**
   - Update timestamps
   - Record relevant metadata
   - Avoid side effects

3. **Error Handling**
   - Validate data before transition
   - Handle error cases
   - Provide user feedback

## Usage Examples

### Simple Transition

```typescript
// Transition from draft to review
dispatch(transitionState({
  id: 'document-1',
  transition: 'review',
  data: { reviewer: 'Alice' }
}));
```

### Transition with Validation

```typescript
// Transition to approval with verification
const state = store.getState().state.states['document-1'];
if (state.data.reviewStatus === 'completed') {
  dispatch(transitionState({
    id: 'document-1',
    transition: 'approved',
    data: { approver: 'Bob' }
  }));
}
```

### Transition with Additional Data

```typescript
// Transition to rejected with reason
dispatch(transitionState({
  id: 'document-1',
  transition: 'rejected',
  data: {
    rejector: 'Charlie',
    reason: 'Inappropriate content'
  }
}));
```

## Security and Validation

1. **Checks**
   - State existence
   - Transition validity
   - Access rights

2. **Data Validation**
   - Data format
   - Required fields
   - Data types

3. **Error Handling**
   - Error messages
   - Logs
   - Notifications 
