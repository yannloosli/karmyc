import { AreaComponentProps } from '../../../src/types/areaTypes';
import { useSpace } from '../../../src/hooks/useSpace';
import { useSpaceHistory } from '../../../src/hooks/useSpaceHistory';
import { useCallback } from 'react';
import { Clock, RotateCcw, RotateCw } from 'lucide-react';
import { t } from '../../../src/data/utils/translation';
import { useActionDescription } from '../../../src/hooks/useActionDescription';

interface HistoryState {}

export const History: React.FC<AreaComponentProps<HistoryState>> = ({
    viewport
}) => {
    const { getActionDescription } = useActionDescription();
    const { activeSpaceId } = useSpace();
    const { 
        pastDiffs, 
        futureDiffs, 
        canUndo, 
        canRedo, 
        undo, 
        redo, 
    } = useSpaceHistory(activeSpaceId);

    const formatTimestamp = useCallback((timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    }, []);

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
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={undo} 
                        disabled={!canUndo}
                        title={t('history.undo', 'Annuler la dernière action')}
                        style={{
                            padding: '4px 8px',
                            background: canUndo ? '#333' : '#222',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: canUndo ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button 
                        onClick={redo} 
                        disabled={!canRedo}
                        title={t('history.redo', 'Rétablir la dernière action annulée')}
                        style={{
                            padding: '4px 8px',
                            background: canRedo ? '#333' : '#222',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: canRedo ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <RotateCw size={16} />
                    </button>
                </div>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {/* Future history (top) */}
                {futureDiffs.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#666', margin: '0 0 8px 0' }}>{t('history.futureActions', 'Actions futures')}</h4>
                        {futureDiffs.map((diff) => (
                            <div
                                key={`future-${diff.timestamp}`}
                                style={{
                                    padding: '8px',
                                    background: '#222',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            >
                                <div style={{ color: '#888' }}>{formatTimestamp(diff.timestamp)}</div>
                                <div style={{ marginTop: '4px' }}>
                                    {getActionDescription(diff.actionType, {})}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Past history (bottom) */}
                {pastDiffs.length > 0 ? (
                    pastDiffs.map((diff) => (
                        <div
                            key={`past-${diff.timestamp}`}
                            style={{
                                padding: '8px',
                                background: '#222',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2a2a2a';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#222';
                            }}
                            onClick={() => {
                                // On pourrait implémenter un "jump to" ici
                            }}
                            title={t('history.jumpTo', 'Aller à cette action')}
                        >
                            <div style={{ color: '#888' }}>{formatTimestamp(diff.timestamp)}</div>
                            <div style={{ marginTop: '4px' }}>
                                {getActionDescription(diff.actionType, {})}
                            </div>
                        </div>
                    ))
                ) : (
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
        </div>
    );
};
