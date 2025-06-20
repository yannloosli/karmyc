/** @type {import('next').NextConfig} */


import withImages from 'next-images';
import path from 'path';

const __dirname = path.resolve();

const nextConfig = {
    webpack: (config) => {
        // Configuration des alias
        config.resolve.alias = {
            ...config.resolve.alias,
            '@gamesberry/karmyc-core': path.resolve(__dirname, '../../src'),
            '@gamesberry/karmyc-core/style.css': path.resolve(__dirname, '../../style.css'),
            '@gamesberry/karmyc-core/assets': path.resolve(__dirname, '../../assets'),
            '@core': path.resolve(__dirname, '../../src/core'),
            '@components': path.resolve(__dirname, '../../src/components'),
            '@hooks': path.resolve(__dirname, '../../src/hooks'),
            '@utils': path.resolve(__dirname, '../../src/utils'),
            '@shared': path.resolve(__dirname, '../shared'),
            '@assets': path.resolve(__dirname, '../assets'),
        };

        // Configuration pour TypeScript
        config.module.rules.push({
            test: /\.(ts|tsx)$/,
            exclude: /node_modules/,
            use: [
                {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-react',
                            '@babel/preset-typescript'
                        ],
                        /* plugins: [
                            ['@babel/plugin-transform-runtime', { regenerator: true }]
                        ] */
                    }
                }
            ]
        });

        // Configuration pour les fichiers Markdown avec ?raw
        config.module.rules.push({
            test: /\.md$/,
            resourceQuery: /raw/,
            type: 'asset/source',
        });

        return config;
    },
};

export default withImages(nextConfig); 
