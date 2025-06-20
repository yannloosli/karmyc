'use client';

import React, { useEffect, useState } from 'react';
import { KarmycWrapper } from '../components/KarmycWrapper';

export default function HomePage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return <KarmycWrapper isClient={isClient} />;
} 
