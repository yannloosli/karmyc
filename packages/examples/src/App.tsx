import React from "react";
import {
    AreaRoot,
    Tools
} from '../../karmyc-core';
import { AreaInitializer } from './AreaInitializer';
import './styles/area.css';

export const App: React.FC = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden'
        }}>
            <AreaInitializer />
            <Tools areaId="root" areaType="app" areaState={{}} position="top-outside" style={{ height: 32, minHeight: 32 }} />
            <AreaRoot />
            <Tools areaId="root" areaType="app" areaState={{}} position="bottom-outside" style={{ height: 32, minHeight: 32 }} />
        </div>
    );
};
