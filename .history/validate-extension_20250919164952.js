// VIDAVA AI Extension Validation Script
const fs = require('fs');
const path = require('path');

console.log('🔍 VIDAVA AI Extension Validation\n');

const requiredFiles = [
    'client/manifest.json',
    'client/popup.html',
    'client/popup.js',
    'client/popup.css',
    'client/background.js',
    'client/content-script.js',
    'client/ml/tensorflow-model.js',
    'client/storage/localStorage.js',
    'client/logo.png'
];

const optionalFiles = [
    'client/dashboard.html',
    'client/dashboard.js',
    'client/dashboard.css'
];

let allGood = true;

console.log('📋 Checking Required Files:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allGood = false;
    }
});

console.log('\n📋 Checking Optional Files:');
optionalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`⚠️  ${file} - Not found (optional)`);
    }
});

// Check manifest.json
console.log('\n🔧 Validating manifest.json:');
try {
    const manifest = JSON.parse(fs.readFileSync('client/manifest.json', 'utf8'));
    
    if (manifest.manifest_version === 3) {
        console.log('✅ Manifest version 3');
    } else {
        console.log('❌ Manifest version should be 3');
        allGood = false;
    }
    
    if (manifest.name && manifest.name.includes('VIDAVA AI')) {
        console.log('✅ Extension name is set');
    } else {
        console.log('❌ Extension name not properly set');
        allGood = false;
    }
    
    if (manifest.action && manifest.action.default_popup === 'popup.html') {
        console.log('✅ Popup is configured');
    } else {
        console.log('❌ Popup not properly configured');
        allGood = false;
    }
    
    if (manifest.content_scripts && manifest.content_scripts.length > 0) {
        console.log('✅ Content scripts configured');
    } else {
        console.log('❌ Content scripts not configured');
        allGood = false;
    }
    
} catch (error) {
    console.log('❌ Error reading manifest.json:', error.message);
    allGood = false;
}

// Check file sizes
console.log('\n📊 File Sizes:');
const checkFiles = ['client/popup.js', 'client/background.js', 'client/content-script.js'];
checkFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`📄 ${file}: ${sizeKB} KB`);
    }
});

console.log('\n' + '='.repeat(50));

if (allGood) {
    console.log('🎉 Extension validation PASSED!');
    console.log('\n📋 Next Steps:');
    console.log('1. Open Chrome and go to chrome://extensions/');
    console.log('2. Enable Developer Mode');
    console.log('3. Click "Load unpacked" and select the "client" folder');
    console.log('4. Open test-extension.html to test the extension');
    console.log('\n🚀 Ready to launch!');
} else {
    console.log('❌ Extension validation FAILED!');
    console.log('Please fix the issues above before launching.');
}

console.log('\n📖 For detailed instructions, see launch-instructions.md');
