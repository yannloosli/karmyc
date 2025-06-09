import { useTranslation } from "../../../src/hooks/useTranslation";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import readmeContent from '../../../README.md?raw';

export const ReadmeArea = () => {
    const { t } = useTranslation();

    // Remplacer les chemins des images et supprimer la première ligne
    const processedContent = readmeContent
        .replace(/\.\/demo\/assets\//g, './assets/')
        .split('\n')
        .slice(1)
        .join('\n');

    return (
        <div className="readme-area" style={{ 
            padding: '20px 20px 20px 30px', 
            overflow: 'auto', 
            height: '100%',
            lineHeight: '1.4',
            backgroundColor: '#f0f0f0'
        }}>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{processedContent}</ReactMarkdown>
        </div>
    );
}; 
