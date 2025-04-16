import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';
import { IGlobalMetrics, IPerformanceMetrics, performanceMonitor } from '~/actions/plugins/performance';

// Étendre l'interface Window pour inclure les propriétés Redux
declare global {
    interface Window {
        store?: any;
        __REDUX_DEVTOOLS_EXTENSION__?: any;
        __actionLog?: AnyAction[];
        monkeyPatchInstalled?: boolean;
    }
}

/**
 * Example component démontrant le système de suivi de performance
 */
export const PerformanceExample: React.FC<{ areaState: any }> = ({ areaState }) => {
    const dispatch = useDispatch();
    // Utiliser un sélecteur spécifique au lieu de retourner tout l'état
    // Ici nous sélectionnons juste une valeur vide pour établir la connexion
    // sans causer de re-rendus inutiles
    const reduxConnected = useSelector((state: any) => Boolean(state));

    const [debugMode, setDebugMode] = useState(false);
    const [reduxInfo, setReduxInfo] = useState<{
        storeDetected: boolean;
        dispatchMethod: string;
        actionTypes: string[];
        stateKeys: string[];
    }>({
        storeDetected: false,
        dispatchMethod: "unknown",
        actionTypes: [],
        stateKeys: []
    });
    const [interceptedActions, setInterceptedActions] = useState<string[]>([]);
    const actionCountRef = useRef(0);

    // États pour les métriques de performance
    const [globalMetrics, setGlobalMetrics] = useState<IGlobalMetrics>(performanceMonitor.getGlobalMetrics());
    const [slowActions, setSlowActions] = useState<Array<{ type: string; executionTime: number }>>(performanceMonitor.getSlowActions());
    const [metrics, setMetrics] = useState<IPerformanceMetrics[]>(performanceMonitor.getMetrics().slice(-5));
    const [threshold, setThreshold] = useState('50');
    const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(true);
    const [forceUpdateCounter, setForceUpdateCounter] = useState(0);

    // Référence pour le seuil des actions lentes
    const thresholdRef = useRef(parseInt(threshold, 10) || 50);

    // Fonction pour forcer une mise à jour du composant
    const forceUpdate = useCallback(() => {
        setForceUpdateCounter(prev => prev + 1);
    }, []);

    // Update all metrics in one function - DÉPLACER CETTE FONCTION AVANT QU'ELLE NE SOIT UTILISÉE
    const updateAllMetrics = useCallback(() => {
        try {
            const currentGlobalMetrics = performanceMonitor.getGlobalMetrics();
            const currentSlowActions = performanceMonitor.getSlowActions(thresholdRef.current);
            const currentMetrics = performanceMonitor.getMetrics().slice(-5);

            setGlobalMetrics(prev => {
                // Ne mettre à jour que si les valeurs ont changé
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
    }, [debugMode, thresholdRef]);

    // Analyser le store Redux et la configuration
    useEffect(() => {
        const analyzeReduxSetup = () => {
            console.log("ANALYZING REDUX SETUP...");

            // Essayer de détecter le store
            const storeDetected = Boolean(window.store || reduxConnected);

            // Inspecter la méthode dispatch
            let dispatchMethod = "unknown";
            if (dispatch) {
                dispatchMethod = "useDispatch hook available";
                // Test dispatch
                try {
                    dispatch({ type: '__REDUX_ANALYSIS_TEST__' });
                    dispatchMethod += " (test dispatch sent)";
                } catch (e) {
                    dispatchMethod += ` (dispatch error: ${e})`;
                }
            }

            // Collecter les types d'actions si possible
            const actionTypes: string[] = [];
            if (window.__REDUX_DEVTOOLS_EXTENSION__) {
                try {
                    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__;
                    if (devTools.actionTypes) {
                        actionTypes.push(...devTools.actionTypes);
                    }
                } catch (e) {
                    console.log("Error accessing Redux DevTools:", e);
                }
            }

            // Analyser l'état Redux
            let stateKeys: string[] = [];
            try {
                // Obtenir les clés d'état via getState si disponible
                if (window.store?.getState) {
                    const state = window.store.getState();
                    stateKeys = Object.keys(state || {});
                }
            } catch (e) {
                console.log("Error accessing Redux state:", e);
            }

            setReduxInfo({
                storeDetected,
                dispatchMethod,
                actionTypes,
                stateKeys
            });

            console.log("Redux Analysis Complete:", {
                storeDetected,
                dispatchMethod,
                stateSlices: stateKeys
            });
        };

        analyzeReduxSetup();
    }, [dispatch, reduxConnected]);

    // MÉTHODE 1: Installer un monkey patch Redux direct
    const installGlobalMonkeyPatch = useCallback(() => {
        if (window.monkeyPatchInstalled) {
            console.log("Monkey patch already installed, refreshing...");
            return;
        }

        console.log("INSTALLING GLOBAL REDUX MONKEY PATCH");

        try {
            // Initialiser le journal des actions
            window.__actionLog = [];

            // APPROCHE 1: Monkey patch via window.store si disponible
            if (window.store && window.store.dispatch) {
                const originalDispatch = window.store.dispatch;
                window.store.dispatch = function (action: AnyAction) {
                    console.log(`GLOBAL INTERCEPTED[${++actionCountRef.current}]:`, action.type, action);
                    window.__actionLog?.push(action);
                    setInterceptedActions(prev => [action.type, ...prev].slice(0, 10));

                    // Suivre manuellement avec performanceMonitor
                    try {
                        performanceMonitor.startTracking(action);
                        const result = originalDispatch(action);
                        setTimeout(() => {
                            performanceMonitor.endTracking(action, true);
                            updateAllMetrics();
                        }, 20);
                        return result;
                    } catch (error) {
                        console.error("Error in monkey patched dispatch:", error);
                        return originalDispatch(action);
                    }
                };
                console.log("SUCCESS: Monkey patched window.store.dispatch");
            } else {
                console.log("WARNING: window.store not found, trying alternative approach");
            }

            // APPROCHE 2: Injecter un script global pour intercepter Redux à sa racine
            const script = document.createElement('script');
            script.textContent = `
                (function() {
                    console.log("GLOBAL REDUX INTERCEPTOR STARTING");
                    
                    // Tenter d'intercepter toutes les actions Redux
                    const originalCreateStore = window.Redux?.createStore || window.createStore;
                    if (originalCreateStore) {
                        window.Redux.createStore = function() {
                            const store = originalCreateStore.apply(this, arguments);
                            const originalDispatch = store.dispatch;
                            
                            store.dispatch = function(action) {
                                console.log("STORE INTERCEPTED ACTION:", action);
                                if (window.__actionLog) window.__actionLog.push(action);
                                return originalDispatch.call(store, action);
                            };
                            
                            console.log("REDUX STORE GLOBALLY INTERCEPTED");
                            return store;
                        };
                    }
                    
                    // Si on a déjà un store, essayer de le patcher directement
                    if (window.store && window.store.dispatch) {
                        try {
                            const originalDispatch = window.store.dispatch;
                            window.store.dispatch = function(action) {
                                console.log("EXISTING STORE INTERCEPTED:", action);
                                if (window.__actionLog) window.__actionLog.push(action);
                                return originalDispatch.call(window.store, action);
                            };
                            console.log("EXISTING REDUX STORE PATCHED");
                        } catch (e) {
                            console.error("Failed to patch existing store:", e);
                        }
                    }
                    
                    // Tenter de patcher useDispatch de react-redux
                    if (window.ReactRedux && window.ReactRedux.useDispatch) {
                        const originalUseDispatch = window.ReactRedux.useDispatch;
                        window.ReactRedux.useDispatch = function() {
                            const dispatch = originalUseDispatch.apply(this, arguments);
                            return function(action) {
                                console.log("USE_DISPATCH INTERCEPTED:", action);
                                if (window.__actionLog) window.__actionLog.push(action);
                                return dispatch(action);
                            };
                        };
                        console.log("REACT-REDUX useDispatch PATCHED");
                    }
                    
                    console.log("GLOBAL REDUX INTERCEPTOR INSTALLED");
                })();
            `;
            document.head.appendChild(script);
            document.head.removeChild(script);

            // APPROCHE 3: Patcher notre dispatch local via closure
            const patchedDispatch = (action: AnyAction) => {
                console.log(`LOCAL PATCHED DISPATCH[${++actionCountRef.current}]:`, action);
                setInterceptedActions(prev => [action.type, ...prev].slice(0, 10));

                // Suivre manuellement avec performanceMonitor 
                performanceMonitor.startTracking(action);
                const result = dispatch(action);
                setTimeout(() => {
                    performanceMonitor.endTracking(action, true);
                    updateAllMetrics();
                }, 20);
                return result;
            };

            // Exposer la fonction patchée pour utilisation manuelle
            (window as any).patchedDispatch = patchedDispatch;

            window.monkeyPatchInstalled = true;

            // Envoyer une action test via les différentes méthodes
            try {
                if (window.store && window.store.dispatch) {
                    window.store.dispatch({ type: '__TEST_GLOBAL_STORE_PATCH__' });
                }
                patchedDispatch({ type: '__TEST_LOCAL_PATCH__' });
                dispatch({ type: '__TEST_ORIGINAL_DISPATCH__' });
            } catch (e) {
                console.error("Error during test dispatches:", e);
            }

            // Afficher un message de confirmation
            alert("Redux global interceptor installed. Check console for details.");

        } catch (error) {
            console.error("CRITICAL ERROR installing global Redux monkey patch:", error);
            alert("Failed to install Redux interceptor: " + error);
        }
    }, [dispatch, updateAllMetrics]);

    // Mettre à jour thresholdRef quand threshold change
    useEffect(() => {
        thresholdRef.current = parseInt(threshold, 10) || 50;
    }, [threshold]);

    // Configure performance monitor with the current threshold
    useEffect(() => {
        performanceMonitor.setConfig({
            enabled: isMonitoringEnabled,
            maxMetrics: 1000,
            slowActionThreshold: thresholdRef.current
        });
    }, [threshold, isMonitoringEnabled]);

    // Mettre à jour les métriques périodiquement
    useEffect(() => {
        // Appliquer les métriques immédiatement une première fois
        updateAllMetrics();

        // Configurer l'intervalle de mise à jour automatique
        const updateInterval = setInterval(() => {
            updateAllMetrics();
        }, 1000);

        // Nettoyage à la suppression du composant
        return () => clearInterval(updateInterval);
    }, [updateAllMetrics]);

    // Activer/désactiver le mode debug
    const toggleDebugMode = useCallback(() => {
        setDebugMode(prev => !prev);
    }, []);

    // Handle enable/disable performance monitoring
    const handleToggleMonitoring = useCallback(() => {
        if (isMonitoringEnabled) {
            performanceMonitor.disable();
        } else {
            performanceMonitor.enable();
        }
        setIsMonitoringEnabled(!isMonitoringEnabled);
        updateAllMetrics();
    }, [isMonitoringEnabled, updateAllMetrics]);

    // Handle clearing performance metrics
    const handleClearMetrics = useCallback(() => {
        performanceMonitor.clear();
        updateAllMetrics();
    }, [updateAllMetrics]);

    // Fonction pour générer une action test de dispatch manuel
    const testManualDispatch = useCallback(() => {
        console.log("Testing manual dispatch...");

        // Envoi d'une action manuelle
        const testAction = {
            type: 'MANUAL_TEST_ACTION',
            payload: { timestamp: Date.now() }
        };

        // Suivre manuellement
        performanceMonitor.startTracking(testAction);

        // Tester différentes méthodes de dispatch
        try {
            // 1. Dispatch via useDispatch hook
            dispatch(testAction);
            console.log("Dispatched via React hook");

            // 2. Dispatch via window.store si disponible
            if (window.store && window.store.dispatch) {
                window.store.dispatch(testAction);
                console.log("Dispatched via window.store");
            }

            // 3. Dispatch via patchedDispatch si disponible
            if ((window as any).patchedDispatch) {
                (window as any).patchedDispatch(testAction);
                console.log("Dispatched via patchedDispatch");
            }
        } catch (e) {
            console.error("Error during test dispatches:", e);
        }

        // Terminer le suivi après un délai
        setTimeout(() => {
            performanceMonitor.endTracking(testAction, true);
            updateAllMetrics();
            forceUpdate();
        }, 100);

    }, [dispatch, updateAllMetrics, forceUpdate]);

    // Test functions to generate performance data
    const runFastAction = () => {
        console.log("Running fast action");
        const actionType = 'DEMO_FAST_ACTION';
        const actionId = `${actionType}_${Date.now()}`;

        // Start tracking manually
        performanceMonitor.startTracking({ type: actionType, meta: { id: actionId } });

        // Dispatch action
        dispatch({ type: actionType, payload: { value: Math.random(), timestamp: Date.now() }, meta: { id: actionId } });

        // End tracking manually
        setTimeout(() => {
            performanceMonitor.endTracking({ type: actionType, meta: { id: actionId } }, true);
            updateAllMetrics();
            forceUpdate();
        }, 20);
    };

    const runMediumAction = () => {
        console.log("Running medium action");
        const actionType = 'DEMO_MEDIUM_ACTION';
        const actionId = `${actionType}_${Date.now()}`;
        const startTime = Date.now();

        // Start tracking manually
        performanceMonitor.startTracking({ type: actionType, meta: { id: actionId } });

        // Simulate some medium processing
        for (let i = 0; i < 5000; i++) {
            Math.sqrt(i * Math.random() * 100);
        }

        // Dispatch action
        dispatch({
            type: actionType,
            payload: {
                computeTime: Date.now() - startTime,
                iterations: 5000,
                timestamp: Date.now()
            },
            meta: { id: actionId }
        });

        // End tracking manually
        performanceMonitor.endTracking({ type: actionType, meta: { id: actionId } }, true);

        // Force update
        setTimeout(() => {
            updateAllMetrics();
            forceUpdate();
        }, 20);
    };

    const runSlowAction = () => {
        console.log("Running slow action");
        const actionType = 'DEMO_SLOW_ACTION';
        const actionId = `${actionType}_${Date.now()}`;
        const startTime = Date.now();

        // Start tracking manually
        performanceMonitor.startTracking({ type: actionType, meta: { id: actionId } });

        // Simulate heavy processing
        for (let i = 0; i < 100000; i++) {
            Math.sqrt(i * Math.random() * 100);
        }

        // Dispatch action
        dispatch({
            type: actionType,
            payload: {
                computeTime: Date.now() - startTime,
                iterations: 100000,
                timestamp: Date.now()
            },
            meta: { id: actionId }
        });

        // End tracking manually
        performanceMonitor.endTracking({ type: actionType, meta: { id: actionId } }, true);

        setTimeout(() => {
            updateAllMetrics();
            forceUpdate();
        }, 20);
    };

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            <h2>Performance Monitoring Example</h2>

            {/* Informations Redux */}
            <div style={{ padding: '12px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Informations Redux</h3>
                <div style={{ fontSize: '14px' }}>
                    <p style={{ margin: '4px 0' }}>
                        <strong>Store détecté:</strong> {reduxInfo.storeDetected ? '✅ Oui' : '❌ Non'}
                    </p>
                    <p style={{ margin: '4px 0' }}>
                        <strong>Méthode dispatch:</strong> {reduxInfo.dispatchMethod}
                    </p>
                    <p style={{ margin: '4px 0' }}>
                        <strong>Slices d'état:</strong> {reduxInfo.stateKeys.join(', ') || 'Aucune'}
                    </p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <button
                            onClick={installGlobalMonkeyPatch}
                            style={{
                                padding: '6px 12px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Installer l'intercepteur global
                        </button>
                        <button
                            onClick={testManualDispatch}
                            style={{
                                padding: '6px 12px',
                                background: '#ffc107',
                                color: 'black',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Tester dispatch manuel
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={handleToggleMonitoring}
                    style={{
                        padding: '8px 16px',
                        background: isMonitoringEnabled ? '#e53e3e' : '#38a169',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    {isMonitoringEnabled ? 'Désactiver la surveillance' : 'Activer la surveillance'}
                </button>
                <button
                    onClick={handleClearMetrics}
                    style={{
                        padding: '8px 16px',
                        marginLeft: '8px',
                        background: '#718096',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    Effacer les métriques
                </button>
                <button
                    onClick={forceUpdate}
                    style={{
                        padding: '8px 16px',
                        marginLeft: '8px',
                        background: '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    Actualiser
                </button>
                <button
                    onClick={toggleDebugMode}
                    style={{
                        padding: '8px 16px',
                        marginLeft: '8px',
                        background: debugMode ? '#38a169' : '#718096',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    {debugMode ? 'Désactiver Debug' : 'Activer Debug'}
                </button>
            </div>

            {/* Section des actions interceptées */}
            <div style={{ marginBottom: '16px', padding: '12px', background: interceptedActions.length > 0 ? '#f0f9ff' : '#fff5f5', border: `1px solid ${interceptedActions.length > 0 ? '#bee3f8' : '#fed7d7'}`, borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Actions Redux interceptées:</h3>
                {interceptedActions.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {interceptedActions.map((action, index) => (
                            <li key={index}>{action}</li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ margin: '4px 0', color: '#e53e3e' }}>
                        Aucune action interceptée. L'application n'utilise peut-être pas Redux standard ou
                        l'intercepteur n'est pas correctement installé.
                    </p>
                )}
            </div>

            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                Compteur d'actions: {globalMetrics.totalActions || 0}, Métriques: {metrics.length}, Mise à jour: {forceUpdateCounter}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4a5568' }}>Actions totales</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>
                        {globalMetrics.totalActions || 0}
                    </div>
                </div>

                <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4a5568' }}>Temps d'exécution moyen</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>
                        {(globalMetrics.averageExecutionTime || 0).toFixed(2)} ms
                    </div>
                </div>

                <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4a5568' }}>Taux d'erreur</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>
                        {globalMetrics.totalActions > 0
                            ? ((globalMetrics.errors || 0) / globalMetrics.totalActions * 100).toFixed(1)
                            : '0'}%
                    </div>
                </div>

                <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4a5568' }}>Actions/Minute</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>
                        {globalMetrics.totalActions > 0 && metrics.length > 1
                            ? Math.round((globalMetrics.totalActions / (
                                (new Date(metrics[metrics.length - 1]?.timestamp || Date.now()).getTime() -
                                    new Date(metrics[0]?.timestamp || Date.now()).getTime()) / 60000
                            )) || 0)
                            : 0}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '12px' }}>Actions de test</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button onClick={runFastAction} style={{ padding: '8px 16px', background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px' }}>
                        Action rapide
                    </button>
                    <button onClick={runMediumAction} style={{ padding: '8px 16px', background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px' }}>
                        Action moyenne
                    </button>
                    <button onClick={runSlowAction} style={{ padding: '8px 16px', background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px' }}>
                        Action lente
                    </button>
                </div>
            </div>

            {/* Informations de diagnostic supplémentaires */}
            <div style={{ marginTop: '24px', padding: '16px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 12px 0' }}>Diagnostic</h3>
                <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>
                    Si le système de performance ne fonctionne pas avec les actions normales de l'interface, cela peut être dû à plusieurs raisons:
                </p>
                <ol style={{ fontSize: '14px', margin: '0 0 0 20px', paddingLeft: 0 }}>
                    <li>L'application pourrait ne pas utiliser Redux standard pour la gestion d'état</li>
                    <li>Les actions ne sont pas dispatchées de manière compatible avec le plugin de performance</li>
                    <li>Le middleware Redux n'est pas correctement configuré dans l'application</li>
                </ol>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                    Essayez le bouton "Installer l'intercepteur global" pour tenter une solution plus radicale, ou
                    consultez la documentation de l'application pour comprendre sa structure d'état.
                </p>
            </div>
        </div>
    );
}; 
