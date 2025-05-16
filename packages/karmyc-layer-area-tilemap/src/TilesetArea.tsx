import React, { useEffect, useRef, useState } from 'react';
import { useAreaStore } from '../../karmyc-core/src/stores/areaStore';
import { TilesetAreaState } from './types';

export const TilesetArea: React.FC<any> = (props) => {
    // Log de debug pour vérifier les props reçues
    console.log('TilesetArea props:', props);
    // Supporte layer OU state selon le système d'area
    const tilesetState = (props.layer ?? props.state) as TilesetAreaState;
    const areaId = props.id || tilesetState?.id || props.state?.id;
    const updateArea = useAreaStore(s => s.updateArea);
    if (!tilesetState || !tilesetState.tileset) {
        return <div style={{ color: '#fff', background: '#222', padding: 16 }}>Tileset non initialisé</div>;
    }
    const { tileset, selectedTile } = tilesetState;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

    // Met à jour l'image et les colonnes/lignes automatiquement à l'upload
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            const img = new window.Image();
            img.src = base64;
            img.onload = () => {
                const columns = Math.floor(img.width / tileset.tileWidth);
                const rows = Math.floor(img.height / tileset.tileHeight);
                setImgSize({ w: img.width, h: img.height });
                if (updateArea && areaId) {
                    updateArea({
                        id: areaId,
                        state: {
                            ...tilesetState,
                            tileset: {
                                ...tileset,
                                image: base64,
                                columns,
                                rows,
                            }
                        }
                    });
                }
            };
        };
        reader.readAsDataURL(file);
    };

    // Met à jour la sélection de tile
    const handleTileClick = (x: number, y: number) => {
        if (updateArea && areaId) {
            updateArea({
                id: areaId,
                state: { ...tilesetState, selectedTile: y * tileset.columns + x }
            });
        }
    };

    // Met à jour dynamiquement la taille de l'image
    useEffect(() => {
        if (!tileset.image) return;
        const img = new window.Image();
        img.src = tileset.image;
        img.onload = () => setImgSize({ w: img.width, h: img.height });
    }, [tileset.image]);

    // Met à jour dynamiquement colonnes/lignes si tileWidth/tileHeight changent
    useEffect(() => {
        if (!tileset.image || !imgSize) return;
        const columns = Math.floor(imgSize.w / tileset.tileWidth);
        const rows = Math.floor(imgSize.h / tileset.tileHeight);
        if ((columns !== tileset.columns || rows !== tileset.rows) && updateArea && areaId) {
            updateArea({
                id: areaId,
                state: {
                    ...tilesetState,
                    tileset: {
                        ...tileset,
                        columns,
                        rows,
                    }
                }
            });
        }
        // eslint-disable-next-line
    }, [tileset.tileWidth, tileset.tileHeight, imgSize]);

    // Réglages dynamiques
    const handleTilesetChange = (patch: Partial<typeof tileset>) => {
        if (updateArea && areaId) {
            updateArea({
                id: areaId,
                state: {
                    ...tilesetState,
                    tileset: { ...tileset, ...patch }
                }
            });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: '#fff', background: '#181c20', borderRadius: 8, padding: 16, minWidth: 320 }}>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageChange}
            />
            <button onClick={() => fileInputRef.current?.click()} style={{ marginBottom: 8, background: '#23272e', color: '#4fd1c5', border: '1px solid #4fd1c5', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                Importer un tileset
            </button>
            {/* Tileset scrollable */}
            <div style={{
                maxHeight: 320,
                maxWidth: 320,
                overflow: 'auto',
                background: '#181c20',
                borderRadius: 8,
                boxShadow: '0 2px 8px #0002',
                margin: '0 auto',
            }}>
                {tileset.image && (
                    <TilesetImageWithOverlay
                        image={tileset.image}
                        tileWidth={tileset.tileWidth}
                        tileHeight={tileset.tileHeight}
                        columns={tileset.columns}
                        rows={tileset.rows}
                        selectedTile={selectedTile}
                        onTileClick={handleTileClick}
                    />
                )}
            </div>
            <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
                Tile sélectionné : {typeof selectedTile === 'number' ? selectedTile : 'aucun'}
            </div>
            {/* Aperçu du tile sélectionné */}
            {tileset.image && typeof selectedTile === 'number' && (
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                    <span style={{ color: '#aaa', fontSize: 12 }}>Aperçu du tile sélectionné :</span>
                    <div style={{
                        width: tileset.tileWidth,
                        height: tileset.tileHeight,
                        margin: '4px auto',
                        border: '2px solid #4fd1c5',
                        background: '#222',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <TilePreviewCanvas
                            image={tileset.image}
                            tileWidth={tileset.tileWidth}
                            tileHeight={tileset.tileHeight}
                            columns={tileset.columns}
                            index={selectedTile}
                        />
                    </div>
                </div>
            )}
            {/* Taille réelle de l'image tileset */}
            {tileset.image && (
                <div style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>
                    Dimensions image tileset :
                    {imgSize ? ` ${imgSize.w}x${imgSize.h}px` : ' chargement...'}
                </div>
            )}
            {/* Réglages du tileset */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <label style={{ color: '#b0b8c1' }}>
                    Largeur
                    <input
                        type="number"
                        min={8}
                        max={128}
                        value={tileset.tileWidth}
                        onChange={e => handleTilesetChange({ tileWidth: +e.target.value })}
                        style={{ width: 48, marginLeft: 4 }}
                    />
                </label>
                <label style={{ color: '#b0b8c1' }}>
                    Hauteur
                    <input
                        type="number"
                        min={8}
                        max={128}
                        value={tileset.tileHeight}
                        onChange={e => handleTilesetChange({ tileHeight: +e.target.value })}
                        style={{ width: 48, marginLeft: 4 }}
                    />
                </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ color: '#b0b8c1' }}>
                    Colonnes
                    <input
                        type="number"
                        min={1}
                        max={64}
                        value={tileset.columns}
                        onChange={e => handleTilesetChange({ columns: +e.target.value })}
                        style={{ width: 48, marginLeft: 4 }}
                    />
                </label>
                <label style={{ color: '#b0b8c1' }}>
                    Lignes
                    <input
                        type="number"
                        min={1}
                        max={64}
                        value={tileset.rows}
                        onChange={e => handleTilesetChange({ rows: +e.target.value })}
                        style={{ width: 48, marginLeft: 4 }}
                    />
                </label>
            </div>
        </div>
    );
};

// Aperçu pixel-perfect d'un tile du tileset
function TilePreviewCanvas({ image, tileWidth, tileHeight, columns, index }: { image: string, tileWidth: number, tileHeight: number, columns: number, index: number }) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    React.useEffect(() => {
        const img = new window.Image();
        img.src = image;
        img.onload = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, tileWidth, tileHeight);
            const sx = (index % columns) * tileWidth;
            const sy = Math.floor(index / columns) * tileHeight;
            ctx.drawImage(img, sx, sy, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
        };
    }, [image, tileWidth, tileHeight, columns, index]);
    return <canvas ref={canvasRef} width={tileWidth} height={tileHeight} style={{ width: tileWidth, height: tileHeight, imageRendering: 'pixelated', display: 'block' }} />;
}

// Affiche l'image du tileset à sa taille réelle avec overlays pixel-perfect
function TilesetImageWithOverlay(props: {
    image: string,
    tileWidth: number,
    tileHeight: number,
    columns: number,
    rows: number,
    selectedTile: number | null,
    onTileClick: (x: number, y: number) => void
}) {
    const { image, tileWidth, tileHeight, columns, rows, selectedTile, onTileClick } = props;
    const [size, setSize] = React.useState<{ w: number, h: number } | null>(null);
    const imgRef = React.useRef<HTMLImageElement>(null);
    React.useEffect(() => {
        const img = new window.Image();
        img.src = image;
        img.onload = () => setSize({ w: img.width, h: img.height });
    }, [image]);
    return (
        <div style={{ position: 'relative', width: size?.w, height: size?.h, margin: '0 auto' }}>
            <img
                ref={imgRef}
                src={image}
                alt="Tileset"
                style={{
                    width: size?.w,
                    height: size?.h,
                    display: 'block',
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            />
            {size && Array.from({ length: rows }).map((_, y) =>
                Array.from({ length: columns }).map((_, x) => {
                    const idx = y * columns + x;
                    return (
                        <div
                            key={x + '-' + y}
                            onClick={() => onTileClick(x, y)}
                            style={{
                                position: 'absolute',
                                left: x * tileWidth,
                                top: y * tileHeight,
                                width: tileWidth,
                                height: tileHeight,
                                border: selectedTile === idx ? '2px solid #4fd1c5' : '1px solid #444',
                                boxSizing: 'border-box',
                                cursor: 'pointer',
                                background: selectedTile === idx ? 'rgba(79,209,197,0.15)' : 'none',
                                transition: 'border 0.1s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                color: selectedTile === idx ? '#222' : '#fff',
                                fontWeight: selectedTile === idx ? 700 : 400,
                                pointerEvents: 'auto',
                            }}
                            title={`Index: ${idx}`}
                        >
                            <span style={{
                                background: selectedTile === idx ? '#4fd1c5' : 'rgba(0,0,0,0.4)',
                                borderRadius: 4,
                                padding: '0 4px',
                                pointerEvents: 'none',
                            }}>{idx}</span>
                        </div>
                    );
                })
            )}
        </div>
    );
} 
