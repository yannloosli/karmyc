import React from "react";
import {
    AreaRoot,
    MenuBar,
    StatusBar
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
            <MenuBar areaId="root" areaState={{}} areaType="app" />
            <AreaRoot />
            <StatusBar areaId="root" areaState={{}} areaType="app" />
        </div>
    );
};
