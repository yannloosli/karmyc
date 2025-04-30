import { IGlobalMetrics, IPerformanceMetrics, performanceMonitor } from '@gamesberry/karmyc-core/actions/plugins/performance';
import { Action } from '@gamesberry/karmyc-core/types/actions'; // Import local type
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Étendre l'interface Window pour inclure les propriétés de monitoring
declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION__?: any; // Pour DevTools Zustand
        __actionLog?: Action[];
        monkeyPatchInstalled?: boolean;
        // Exposer patchedDispatch manuellement si besoin
        patchedDispatch?: (action: Action) => void;
    }
}

/**
 * Example component démontrant le système de suivi de performance avec Zustand
 */
export const PerformanceExample: React.FC<{ areaState: any }> = ({ areaState }) => {
    const [debugMode, setDebugMode] = useState(false);
    const [interceptedActions, setInterceptedActions] = useState<string[]>([]);
    const actionCountRef = useRef(0);

    // États pour les métriques de performance
    const [globalMetrics, setGlobalMetrics] = useState<IGlobalMetrics>(performanceMonitor.getGlobalMetrics());
    const [slowActions, setSlowActions] = useState<Array<{ type: string; executionTime: number }>>(performanceMonitor.getSlowActions());
    const [metrics, setMetrics] = useState<IPerformanceMetrics[]>(performanceMonitor.getMetrics().slice(-5));
    const [threshold, setThreshold] = useState('50');
    const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(true);
    const [forceUpdateCounter, setForceUpdateCounter] = useState(0);

    const thresholdRef = useRef(parseInt(threshold, 10) || 50);

    const forceUpdate = useCallback(() => {
        setForceUpdateCounter(prev => prev + 1);
    }, []);

    const updateAllMetrics = useCallback(() => {
        try {
            const currentGlobalMetrics = performanceMonitor.getGlobalMetrics();
            const currentSlowActions = performanceMonitor.getSlowActions(thresholdRef.current);
            const currentMetrics = performanceMonitor.getMetrics().slice(-5);

            setGlobalMetrics(prev => {
                if (prev.totalActions !== currentGlobalMetrics.totalActions) {
                    console.log("METRICS UPDATED:", {
                        from: prev.totalActions,
                        to: currentGlobalMetrics.totalActions,
                        diff: currentGlobalMetrics.totalActions - prev.totalActions
                    });
                    return { ...currentGlobalMetrics };
                }
                return prev;
            });

            setSlowActions([...currentSlowActions]);
            setMetrics([...currentMetrics]);

            if (debugMode) {
                console.log("METRICS CURRENT STATE:", {
                    globalActions: currentGlobalMetrics.totalActions,
                    slowActionsCount: currentSlowActions.length,
                    metricsCount: currentMetrics.length
                });
            }
        } catch (e) {
            console.error("Error updating metrics:", e);
        }
    }, [debugMode]); // thresholdRef est stable

    // Placeholder si la fonction est toujours appelée par l'UI
    const installGlobalMonkeyPatch = useCallback(() => {
        alert("Fonctionnalité d'interception désactivée dans la migration Zustand.");
        console.warn("Tentative d'installation d'interception, mais celle-ci est désactivée.");
    }, [])

    useEffect(() => {
        thresholdRef.current = parseInt(threshold, 10) || 50;
    }, [threshold]);

    useEffect(() => {
        performanceMonitor.setConfig({
            enabled: isMonitoringEnabled,
            maxMetrics: 1000,
            slowActionThreshold: thresholdRef.current
        });
    }, [isMonitoringEnabled]); // thresholdRef est stable

    useEffect(() => {
        updateAllMetrics();
        const updateInterval = setInterval(updateAllMetrics, 1000);
        return () => clearInterval(updateInterval);
    }, [updateAllMetrics]);

    const toggleDebugMode = useCallback(() => {
        setDebugMode(prev => !prev);
    }, []);

    const handleToggleMonitoring = useCallback(() => {
        if (isMonitoringEnabled) {
            performanceMonitor.disable();
        } else {
            performanceMonitor.enable();
        }
        setIsMonitoringEnabled(!isMonitoringEnabled);
        updateAllMetrics();
    }, [isMonitoringEnabled, updateAllMetrics]);

    const handleClearMetrics = useCallback(() => {
        performanceMonitor.clear();
        updateAllMetrics();
    }, [updateAllMetrics]);

    // Adapter testManualDispatch pour ne plus utiliser dispatch
    const testManualDispatch = useCallback(() => {
        console.log("Testing manual action tracking...");
        const testAction = {
            type: 'MANUAL_TEST_ACTION',
            payload: { timestamp: Date.now() }
        };
        performanceMonitor.startTracking(testAction);
        // Simuler une action qui prend du temps
        setTimeout(() => {
            performanceMonitor.endTracking(testAction, true);
            updateAllMetrics();
            forceUpdate();
            console.log("Manual action tracking finished.");
        }, 100);
    }, [updateAllMetrics, forceUpdate]);

    // Adapter les actions de test pour ne plus dispatcher
    const runFastAction = () => {
        console.log("Running fast action tracking");
        const actionType = 'DEMO_FAST_ACTION';
        const actionMeta = { id: `${actionType}_${Date.now()}` }; // Utiliser meta pour l'ID
        const simulatedAction = { type: actionType, meta: actionMeta };

        performanceMonitor.startTracking(simulatedAction);
        // Ne pas dispatcher : dispatch({ type: actionType, payload: { value: Math.random() }, meta: actionMeta });
        setTimeout(() => {
            performanceMonitor.endTracking(simulatedAction, true);
            updateAllMetrics();
            forceUpdate();
        }, 20);
    };

    const runMediumAction = () => {
        console.log("Running medium action tracking");
        const actionType = 'DEMO_MEDIUM_ACTION';
        const actionMeta = { id: `${actionType}_${Date.now()}` };
        const simulatedAction = { type: actionType, meta: actionMeta };

        performanceMonitor.startTracking(simulatedAction);
        const startTime = Date.now();
        for (let i = 0; i < 5000; i++) { Math.sqrt(i * Math.random() * 100); }
        const computeTime = Date.now() - startTime;

        // Ne pas dispatcher
        // dispatch({ type: actionType, payload: { computeTime, iterations: 5000 }, meta: actionMeta });

        // Supprimer l'appel à addMetadata car il n'existe pas
        // performanceMonitor.addMetadata(simulatedAction, { payload: { computeTime, iterations: 5000 } });

        setTimeout(() => {
            performanceMonitor.endTracking(simulatedAction, true);
            updateAllMetrics();
            forceUpdate();
        }, 20);
    };

    const runSlowAction = () => {
        console.log("Running slow action tracking");
        const actionType = 'DEMO_SLOW_ACTION';
        const actionMeta = { id: `${actionType}_${Date.now()}` };
        const simulatedAction = { type: actionType, meta: actionMeta };

        performanceMonitor.startTracking(simulatedAction);
        const startTime = Date.now();
        for (let i = 0; i < 100000; i++) { Math.sqrt(i * Math.random() * 100); }
        const computeTime = Date.now() - startTime;

        // Ne pas dispatcher
        // dispatch({ type: actionType, payload: { computeTime, iterations: 100000 }, meta: actionMeta });

        // Supprimer l'appel à addMetadata car il n'existe pas
        // performanceMonitor.addMetadata(simulatedAction, { payload: { computeTime, iterations: 100000 } });

        setTimeout(() => {
            performanceMonitor.endTracking(simulatedAction, true);
            updateAllMetrics();
            forceUpdate();
        }, 20);
    };

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            <h2>Performance Monitoring Example (Zustand)</h2>

            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={handleToggleMonitoring}
                    style={{ /* Styles du bouton */
                        padding: '8px 16px',
                        background: isMonitoringEnabled ? '#e53e3e' : '#38a169',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                    }}>
                    {isMonitoringEnabled ? 'Désactiver la surveillance' : 'Activer la surveillance'}
                </button>
                <button onClick={handleClearMetrics} style={{ /* Styles du bouton */
                    padding: '8px 16px',
                    marginLeft: '8px',
                    background: '#718096',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                }}>
                    Effacer les métriques
                </button>
                <button onClick={forceUpdate} style={{ /* Styles du bouton */
                    padding: '8px 16px',
                    marginLeft: '8px',
                    background: '#3182ce',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                }}>
                    Actualiser
                </button>
                <button onClick={toggleDebugMode} style={{ /* Styles du bouton */
                    padding: '8px 16px',
                    marginLeft: '8px',
                    background: debugMode ? '#38a169' : '#718096',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                }}>
                    {debugMode ? 'Désactiver Debug' : 'Activer Debug'}
                </button>
                <button
                    onClick={testManualDispatch}
                    style={{
                        padding: '8px 16px',
                        background: '#ffc107',
                        color: 'black',
                        border: 'none',
                        borderRadius: '4px',
                        marginLeft: '8px'
                    }}>
                    Tester suivi manuel
                </button>
            </div>

            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                Compteur d'actions suivies: {globalMetrics.totalActions || 0}, Métriques: {metrics.length}, Mise à jour: {forceUpdateCounter}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ /* Styles pour les cartes de métriques */ padding: '16px', background: '#f9f9f9', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4a5568' }}>Actions totales</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>{globalMetrics.totalActions || 0}</div>
                </div>
                <div style={{ /* Styles pour les cartes de métriques */ padding: '16px', background: '#f9f9f9', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4a5568' }}>Temps d'exécution moyen</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>{(globalMetrics.averageExecutionTime || 0).toFixed(2)} ms</div>
                </div>
                <div style={{ /* Styles pour les cartes de métriques */ padding: '16px', background: '#f9f9f9', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4a5568' }}>Taux d'erreur</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>{globalMetrics.totalActions > 0 ? ((globalMetrics.errors || 0) / globalMetrics.totalActions * 100).toFixed(1) : '0'}%</div>
                </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '12px' }}>Actions de test (pour Performance Monitor)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button onClick={runFastAction} style={{ /* Styles pour boutons de test */ padding: '8px 16px', background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px' }}>Action rapide</button>
                    <button onClick={runMediumAction} style={{ /* Styles pour boutons de test */ padding: '8px 16px', background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px' }}>Action moyenne</button>
                    <button onClick={runSlowAction} style={{ /* Styles pour boutons de test */ padding: '8px 16px', background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px' }}>Action lente</button>
                </div>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 12px 0' }}>Diagnostic</h3>
                <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>
                    Ce composant démontre maintenant le `performanceMonitor` en simulant des actions.
                    Le suivi des actions réelles de l'application nécessiterait d'adapter le `performanceMonitor`
                    ou d'intégrer son appel dans les actions Zustand.
                </p>
            </div>
        </div >
    );
};
