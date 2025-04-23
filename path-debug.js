const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('System info:');
console.log('OS Platform:', process.platform);
console.log('OS Release:', os.release());
console.log('Current directory:', process.cwd());
console.log('HOME directory:', os.homedir());
console.log();

// Tester la conversion de chemins
const testPath = path.resolve(__dirname, 'packages/core/src/components/area/components/AreaRoot.tsx');
console.log('Test path:', testPath);

// Pour WSL, on peut convertir les chemins Linux -> Windows
if (os.release().toLowerCase().includes('microsoft')) {
    try {
        // Convertir le chemin Linux en chemin Windows
        const wslPathCmd = `wslpath -w "${testPath}"`;
        const windowsPath = execSync(wslPathCmd).toString().trim();
        console.log('WSL to Windows path:', windowsPath);
        
        // Test si le fichier existe dans ce chemin
        console.log('File exists:', require('fs').existsSync(testPath));
        
        console.log('\nVous pouvez essayer ces commandes:');
        console.log(`code --goto "${windowsPath}"`);
        console.log(`VSCODE_CWD="${process.cwd()}" code --goto "${testPath}"`);
    } catch (error) {
        console.error('Erreur lors de la conversion du chemin:', error);
    }
} else {
    console.log('Not running in WSL');
} 
