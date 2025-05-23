# Performance Monitoring System

This guide explains how to use Karmyc's built-in performance monitoring system to track and optimize your application.

## Overview

The performance monitoring system allows you to:

- Track action execution times
- Identify slow actions that exceed a configurable threshold
- Monitor error rates and performance trends
- Access performance metrics for specific areas
- Make data-driven optimization decisions

## Quick Start

```tsx
import React from 'react';
import { useKarmyc, KarmycProvider, performancePlugin } from '@gamesberry/karmyc-core';

function App() {
  // Enable performance monitoring through the plugin system
  const config = useKarmyc({
    plugins: [performancePlugin],
    enableLogging: process.env.NODE_ENV === 'development'
  });
  
  return (
    <KarmycProvider options={config}>
      <YourApplication />
      <PerformanceMonitorPanel /> {/* Optional performance widget */}
    </KarmycProvider>
  );
}
```

## Using Performance Hooks

Karmyc provides a `usePerformance` hook to access performance metrics in your components:

```tsx
import React from 'react';
import { usePerformance } from '@gamesberry/karmyc-core';

function PerformanceStats() {
  const { performanceMetrics, getAreaPerformance } = usePerformance();
  
  // Get performance for a specific area
  const editorAreaPerformance = getAreaPerformance('editor-area-1');
  
  return (
    <div className="performance-stats">
      <h3>Performance Metrics</h3>
      <p>Average action time: {performanceMetrics.averageActionTime.toFixed(2)}ms</p>
      <p>Total actions: {performanceMetrics.totalActions}</p>
      
      {editorAreaPerformance && (
        <div>
          <h4>Editor Area Performance</h4>
          <p>Actions: {editorAreaPerformance.actionCount}</p>
          <p>Average: {editorAreaPerformance.averageActionTime.toFixed(2)}ms</p>
        </div>
      )}
    </div>
  );
}
```

## Advanced Performance Monitoring

For more detailed metrics and configuration, you can use the `performanceMonitor` directly:

```tsx
import { performanceMonitor } from '@gamesberry/karmyc-core';

// Configure the monitor
performanceMonitor.setConfig({
  enabled: true,
  maxMetrics: 2000,       // Store up to 2000 metrics
  slowActionThreshold: 50 // Flag actions taking more than 50ms as "slow"
});

// Get detailed metrics
const metrics = performanceMonitor.getMetrics();
const globalMetrics = performanceMonitor.getGlobalMetrics();
const slowActions = performanceMonitor.getSlowActions(100); // Actions taking > 100ms
const errorRate = performanceMonitor.getErrorRate();

console.table(slowActions);
```

## Performance Metrics

The performance monitoring system tracks several types of metrics:

### Global Metrics

| Metric | Description |
|--------|-------------|
| `totalActions` | Total number of actions processed |
| `averageExecutionTime` | Average time to process actions (ms) |
| `actionsByType` | Count of actions by type |
| `errors` | Number of failed actions |
| `errorRate` | Percentage of actions that failed |

### Action Metrics

For individual actions, the following data is tracked:

| Metric | Description |
|--------|-------------|
| `actionType` | Type of the action (e.g., "area/createArea") |
| `executionTime` | Time taken to process the action (ms) |
| `timestamp` | When the action was executed |
| `success` | Whether the action completed successfully |
| `payload` | Data sent with the action (for debugging) |

### Area Metrics

For specific areas, the following metrics are available:

| Metric | Description |
|--------|-------------|
| `averageActionTime` | Average time for actions in this area |
| `actionCount` | Number of actions related to this area |

## Creating a Performance Dashboard

You can create a dedicated performance dashboard to monitor your application:

```tsx
import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '@gamesberry/karmyc-core';

function PerformanceDashboard() {
  const [metrics, setMetrics] = useState(performanceMonitor.getGlobalMetrics());
  const [slowActions, setSlowActions] = useState(performanceMonitor.getSlowActions());
  
  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getGlobalMetrics());
      setSlowActions(performanceMonitor.getSlowActions());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="performance-dashboard">
      <h2>Performance Dashboard</h2>
      
      <div className="metrics-cards">
        <div className="metric-card">
          <h3>Actions</h3>
          <div className="metric-value">{metrics.totalActions}</div>
        </div>
        
        <div className="metric-card">
          <h3>Average Time</h3>
          <div className="metric-value">{metrics.averageExecutionTime.toFixed(2)}ms</div>
        </div>
        
        <div className="metric-card">
          <h3>Error Rate</h3>
          <div className="metric-value">{performanceMonitor.getErrorRate().toFixed(1)}%</div>
        </div>
      </div>
      
      <h3>Slow Actions</h3>
      <table className="slow-actions-table">
        <thead>
          <tr>
            <th>Action Type</th>
            <th>Execution Time (ms)</th>
          </tr>
        </thead>
        <tbody>
          {slowActions.map((action, i) => (
            <tr key={i}>
              <td>{action.type}</td>
              <td>{action.executionTime.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Performance Optimization Tips

Based on the data collected by the performance monitoring system, consider these optimization strategies:

1. **Identify slow actions**: Focus optimization efforts on actions that consistently appear in the slow actions list.

2. **Batch related actions**: If you see many small actions of the same type, consider batching them.

3. **Optimize area rendering**: Areas with high average action times may benefit from memoization or virtualization.

4. **Monitor after changes**: After making optimizations, monitor the performance metrics to confirm improvements.

5. **Performance budgets**: Set thresholds for acceptable performance and receive alerts when they're exceeded.

## Best Practices

1. **Enable in development**: Always have performance monitoring enabled during development to catch issues early.

2. **Selective production monitoring**: In production, you might want to enable it selectively or with reduced tracking to minimize overhead.

3. **Focus on trends**: Pay attention to trends rather than absolute values, as performance can vary across devices.

4. **Correlate with user experience**: Connect performance metrics with actual user experience metrics (e.g., time to interactive).

5. **Regular audits**: Schedule regular performance audits to prevent regression. 
