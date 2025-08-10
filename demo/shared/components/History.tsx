import { AreaComponentProps } from '../../../src/types/areaTypes';
import { useSpace } from '../../../src/hooks/useSpace';
import { useHistory } from '../../../src/hooks/useHistory';
import { useSpaceStore } from '../../../src/core/spaceStore';
import { useCallback, useState, useEffect } from 'react';
import { 
    Clock, 
    RotateCcw, 
    RotateCw, 
    Trash2, 
    Info, 
    AlertCircle,
    CheckCircle,
    Loader2,
    BarChart3,
    Settings
} from 'lucide-react';
import { t } from '../../../src/core/utils/translation';
import { actionRegistry } from '../../../src/core/registries/actionRegistry';
import * as React from 'react';

interface HistoryState {}

interface Notification {
    id: string;
    type: 'info' | 'success' | 'error';
    message: string;
    timestamp: number;
}

interface HistoryConfig {
    enableNotifications: boolean;
    enableAutoSave: boolean;
    maxHistorySize: number;
}

export const History: React.FC<AreaComponentProps<HistoryState>> = ({
    viewport
}: {
    viewport: { width: number; height: number };
}) => {
    const getActionDescription = actionRegistry.getActionDescription;
    const { activeSpaceId } = useSpace();
    const [showStats, setShowStats] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [config, setConfig] = useState<HistoryConfig>({
        enableNotifications: true,
        enableAutoSave: true,
        maxHistorySize: 100
    });
    
    const { 
        // État de base
        isActionInProgress,
        currentActionId,
        lastAction,
        stats,
        
        // Actions principales
        startAction,
        submitAction,
        cancelAction,
        undo, 
        redo,
        clearHistory,
        
        // Vérifications
        canUndo,
        canRedo,
        
        // Getters
        getCurrentAction,
        getHistoryLength,
        getHistoryStats,
        
        // Actions utilitaires
        createSimpleAction,
        createSelectionAction,
        createTransformAction,
        
        // Constantes
        ACTION_TYPES,
        EVENTS
    } = useHistory(activeSpaceId || '');

    // Utiliser les vraies données d'historique du store
    const { pastDiffs, futureDiffs } = useSpaceStore(state => {
        const space = activeSpaceId ? state.spaces[activeSpaceId] : null;
        return {
            pastDiffs: space?.sharedState?.pastActions || [],
            futureDiffs: space?.sharedState?.futureActions || []
        };
    });

    const jumpToHistoryAction = useSpaceStore(state => state.jumpToHistoryAction);

    // Effet pour migrer l'espace si nécessaire
    useEffect(() => {
        if (activeSpaceId) {
            try {
                // Appeler la migration via le store
                const { migrateSpaceHistory } = useSpaceStore.getState();
                migrateSpaceHistory(activeSpaceId);
            } catch (error) {
                console.warn('Migration failed:', error);
            }
        }
    }, [activeSpaceId]);

    // Effet pour gérer les notifications
    useEffect(() => {
        if (lastAction && config.enableNotifications) {
            const notification: Notification = {
                id: Date.now().toString(),
                type: 'success',
                message: `Action "${lastAction.name}" effectuée avec succès`,
                timestamp: Date.now()
            };
            
            setNotifications(prev => [...prev, notification]);
            
            // Auto-supprimer après 5 secondes
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, 5000);
        }
    }, [lastAction, config.enableNotifications]);

    const formatTimestamp = useCallback((timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    }, []);

    const formatDuration = useCallback((duration: number) => {
        if (duration < 1000) return `${duration}ms`;
        return `${(duration / 1000).toFixed(1)}s`;
    }, []);

    const handleUndo = useCallback(async () => {
        try {
            const result = await undo();
            if (!result.success) {
                const notification: Notification = {
                    id: Date.now().toString(),
                    type: 'error',
                    message: `Erreur lors de l'annulation: ${result.error}`,
                    timestamp: Date.now()
                };
                setNotifications(prev => [...prev, notification]);
            }
        } catch (error) {
            console.error('Erreur lors de l\'annulation:', error);
        }
    }, [undo]);

    const handleRedo = useCallback(async () => {
        try {
            const result = await redo();
            if (!result.success) {
                const notification: Notification = {
                    id: Date.now().toString(),
                    type: 'error',
                    message: `Erreur lors du rétablissement: ${result.error}`,
                    timestamp: Date.now()
                };
                setNotifications(prev => [...prev, notification]);
            }
        } catch (error) {
            console.error('Erreur lors du rétablissement:', error);
        }
    }, [redo]);

    const handleClearHistory = useCallback(async () => {
        try {
            clearHistory();
            const notification: Notification = {
                id: Date.now().toString(),
                type: 'success',
                message: 'Historique vidé avec succès',
                timestamp: Date.now()
            };
            setNotifications(prev => [...prev, notification]);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'historique:', error);
        }
    }, [clearHistory]);

    const clearNotifications = useCallback((indices?: number[]) => {
        if (indices) {
            setNotifications(prev => prev.filter((_, index) => !indices.includes(index)));
        } else {
            setNotifications([]);
        }
    }, []);

    const updateConfig = useCallback((newConfig: Partial<HistoryConfig>) => {
        setConfig(prev => ({ ...prev, ...newConfig }));
    }, []);

    const getHistorySize = useCallback(() => {
        return `${(getHistoryLength() * 0.1).toFixed(1)} KB`;
    }, [getHistoryLength]);

    return (
        <div style={{
            width: viewport.width,
            height: viewport.height,
            display: 'flex',
            flexDirection: 'column',
            background: '#1a1a1a',
            color: 'white',
            padding: '16px',
            gap: '16px'
        }}>
            {/* Header avec actions */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #333',
                paddingBottom: '8px'
            }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} />
                    {t('history.title', 'Historique')}
                    {isActionInProgress && (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    )}
                </h3>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Boutons d'action */}
                    <button 
                        onClick={handleUndo} 
                        disabled={!canUndo() || isActionInProgress}
                        title={t('history.undo', 'Annuler la dernière action')}
                        style={{
                            padding: '4px 8px',
                            background: canUndo() && !isActionInProgress ? '#333' : '#222',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: canUndo() && !isActionInProgress ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: isActionInProgress ? 0.5 : 1
                        }}
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button 
                        onClick={handleRedo} 
                        disabled={!canRedo() || isActionInProgress}
                        title={t('history.redo', 'Rétablir la dernière action annulée')}
                        style={{
                            padding: '4px 8px',
                            background: canRedo() && !isActionInProgress ? '#333' : '#222',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: canRedo() && !isActionInProgress ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: isActionInProgress ? 0.5 : 1
                        }}
                    >
                        <RotateCw size={16} />
                    </button>
                    
                    {/* Boutons utilitaires */}
                    <button 
                        onClick={() => setShowStats(!showStats)}
                        title={t('history.stats', 'Afficher les statistiques')}
                        style={{
                            padding: '4px 8px',
                            background: showStats ? '#444' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <BarChart3 size={16} />
                    </button>
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        title={t('history.settings', 'Paramètres')}
                        style={{
                            padding: '4px 8px',
                            background: showSettings ? '#444' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <Settings size={16} />
                    </button>
                    <button 
                        onClick={handleClearHistory}
                        disabled={pastDiffs.length === 0 && futureDiffs.length === 0}
                        title={t('history.clear', 'Vider l\'historique')}
                        style={{
                            padding: '4px 8px',
                            background: '#d32f2f',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '120px',
                    overflowY: 'auto'
                }}>
                    {notifications.map((notification, index) => (
                        <div
                            key={notification.id}
                            style={{
                                padding: '8px 12px',
                                background: notification.type === 'error' ? '#d32f2f' : 
                                           notification.type === 'success' ? '#2e7d32' : '#1976d2',
                                borderRadius: '4px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {notification.type === 'error' && <AlertCircle size={16} />}
                                {notification.type === 'success' && <CheckCircle size={16} />}
                                {notification.type === 'info' && <Info size={16} />}
                                <span>{notification.message}</span>
                            </div>
                            <button
                                onClick={() => clearNotifications([index])}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Statistiques */}
            {showStats && (
                <div style={{
                    padding: '12px',
                    background: '#222',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#ccc' }}>Statistiques</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>Actions passées: {stats.pastActions}</div>
                        <div>Actions futures: {stats.futureActions}</div>
                        <div>Taille mémoire: {getHistorySize()}</div>
                        <div>Actions totales: {stats.totalActions}</div>
                        <div>Dernière action: {formatTimestamp(stats.lastActionTime)}</div>
                        <div>Temps moyen: {formatDuration(stats.averageActionDuration)}</div>
                    </div>
                </div>
            )}

            {/* Paramètres */}
            {showSettings && (
                <div style={{
                    padding: '12px',
                    background: '#222',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#ccc' }}>Paramètres</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={config.enableNotifications}
                                onChange={(e) => updateConfig({ enableNotifications: e.target.checked })}
                            />
                            Notifications
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                checked={config.enableAutoSave}
                                onChange={(e) => updateConfig({ enableAutoSave: e.target.checked })}
                            />
                            Sauvegarde automatique
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Taille max:</span>
                            <input
                                type="number"
                                value={config.maxHistorySize}
                                onChange={(e) => updateConfig({ maxHistorySize: parseInt(e.target.value) || 100 })}
                                style={{
                                    width: '60px',
                                    background: '#333',
                                    border: '1px solid #555',
                                    borderRadius: '2px',
                                    color: 'white',
                                    padding: '2px 4px'
                                }}
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Action en cours */}
            {isActionInProgress && currentActionId && (
                <div style={{
                    padding: '8px 12px',
                    background: '#1976d2',
                    borderRadius: '4px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Action en cours: {currentActionId}</span>
                    <button
                        onClick={() => cancelAction()}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Annuler
                    </button>
                </div>
            )}

            {/* Contenu principal */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {/* Past history (top) - Actions passées */}
                {pastDiffs.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#4caf50', margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
                            📚 Actions passées ({pastDiffs.length})
                        </h4>
                        {pastDiffs.map((diff, index) => (
                            <div
                                key={`past-${diff.timestamp}`}
                                style={{
                                    padding: '8px',
                                    background: index === pastDiffs.length - 1 ? '#2a2a2a' : '#222',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    borderLeft: index === pastDiffs.length - 1 ? '3px solid #4caf50' : '3px solid #666',
                                    transition: 'all 0.2s ease',
                                    marginBottom: '4px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#2a2a2a';
                                    e.currentTarget.style.transform = 'translateX(2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = index === pastDiffs.length - 1 ? '#2a2a2a' : '#222';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                                onClick={() => {
                                    if (activeSpaceId) {
                                        jumpToHistoryAction(activeSpaceId, diff.id);
                                    }
                                }}
                                title={t('history.jumpTo', 'Aller à cette action')}
                            >
                                <div style={{ color: '#888', fontSize: '12px' }}>
                                    {formatTimestamp(diff.timestamp)}
                                    {diff.metadata?.duration && ` (${formatDuration(diff.metadata.duration)})`}
                                    {index === pastDiffs.length - 1 && ' ← État actuel'}
                                </div>
                                <div style={{ marginTop: '4px' }}>
                                    {getActionDescription(diff.metadata?.actionType || diff.name)}
                                </div>
                                {diff.metadata?.payload && (
                                    <div style={{ 
                                        marginTop: '4px', 
                                        fontSize: '12px', 
                                        color: '#666',
                                        fontStyle: 'italic'
                                    }}>
                                        {diff.metadata.payload.description || diff.name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Future history (bottom) - Actions futures */}
                {futureDiffs.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                        <h4 style={{ color: '#1976d2', margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
                            🔮 Actions futures ({futureDiffs.length})
                        </h4>
                        {futureDiffs.map((diff, index) => (
                            <div
                                key={`future-${diff.timestamp}`}
                                style={{
                                    padding: '8px',
                                    background: '#222',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    borderLeft: '3px solid #1976d2',
                                    transition: 'all 0.2s ease',
                                    marginBottom: '4px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#2a2a2a';
                                    e.currentTarget.style.transform = 'translateX(2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#222';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                                onClick={() => {
                                    if (activeSpaceId) {
                                        jumpToHistoryAction(activeSpaceId, diff.id);
                                    }
                                }}
                                title={t('history.jumpTo', 'Aller à cette action')}
                            >
                                <div style={{ color: '#888', fontSize: '12px' }}>
                                    {formatTimestamp(diff.timestamp)}
                                    {diff.metadata?.duration && ` (${formatDuration(diff.metadata.duration)})`}
                                </div>
                                <div style={{ marginTop: '4px' }}>
                                    {getActionDescription(diff.metadata?.actionType || diff.name)}
                                </div>
                                {diff.metadata?.payload && (
                                    <div style={{ 
                                        marginTop: '4px', 
                                        fontSize: '12px', 
                                        color: '#666',
                                        fontStyle: 'italic'
                                    }}>
                                        {diff.metadata.payload.description || diff.name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* État vide */}
                {pastDiffs.length === 0 && futureDiffs.length === 0 && (
                    <div style={{ 
                        color: '#666', 
                        textAlign: 'center', 
                        padding: '32px',
                        background: '#222',
                        borderRadius: '4px'
                    }}>
                        {t('history.empty', 'Aucune action dans l\'historique')}
                    </div>
                )}
            </div>

            {/* Styles CSS pour l'animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
