import type { Metadata } from 'next';
import './globals.css';
import '@gamesberry/karmyc-core/style.css';
import React from 'react';


export const metadata: Metadata = {
    title: 'Karmyc Core Demo - SSR',
    description: 'Démonstration de Karmyc Core avec Next.js 14 et SSR',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body>
                {children}
            </body>
        </html>
    );
} 
