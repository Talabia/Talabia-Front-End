const fs = require('fs');
const path = require('path');

// Try to load archiver (optional dependency)
let archiver;
try {
  archiver = require('archiver');
} catch (e) {
  // archiver not installed - ZIP creation will be skipped
}

// Copy all files from dist/browser to dist/
const browserDir = path.join(__dirname, 'dist', 'browser');
const distDir = path.join(__dirname, 'dist');

if (fs.existsSync(browserDir)) {
  console.log('📦 Preparing IIS deployment files...\n');

  const files = fs.readdirSync(browserDir);

  files.forEach(file => {
    const srcPath = path.join(browserDir, file);
    const destPath = path.join(distDir, file);

    if (fs.lstatSync(srcPath).isDirectory()) {
      // Copy directory recursively
      fs.cpSync(srcPath, destPath, { recursive: true, force: true });
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  });

  console.log('✓ Files copied from browser/ to dist/');

  // Verify web.config exists
  const webConfigPath = path.join(distDir, 'web.config');
  if (fs.existsSync(webConfigPath)) {
    console.log('✓ web.config found');
  } else {
    console.log('⚠ WARNING: web.config not found! Make sure it exists in src/web.config');
  }

  // Remove browser directory
  try {
    fs.rmSync(browserDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    console.log('✓ Removed browser/ directory');
  } catch (err) {
    console.log('⚠ Could not remove browser/ directory (file lock). You can manually delete it.');
  }

  console.log('\n✅ IIS deployment files ready in dist/ folder!');
  console.log('\n📋 Next steps:');
  console.log('   1. Upload all files from dist/ folder to your IIS web root');
  console.log('   2. Ensure URL Rewrite module is installed on IIS');
  console.log('   3. Make sure the application pool is set to "No Managed Code"');
  console.log('   4. Your app should be accessible at your domain root');
  console.log('\n💡 Optional: Create a ZIP file by running: node deploy-iis.js --zip');

  // Check if --zip flag is provided
  if (process.argv.includes('--zip')) {
    createZipFile(distDir);
  }
} else {
  console.log('✗ dist/browser directory not found. Run the build first.');
}

function createZipFile(distDir) {
  if (!archiver) {
    console.log('\n⚠ Cannot create ZIP file. Install archiver: npm install --save-dev archiver');
    console.log('  Or manually ZIP the dist/ folder contents.');
    return;
  }

  console.log('\n📦 Creating deployment ZIP file...');

  const output = fs.createWriteStream(path.join(__dirname, 'talabia-admin-iis.zip'));
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', function() {
    console.log(`✓ Created talabia-admin-iis.zip (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
    console.log('  Upload this ZIP to your server and extract it to the web root.');
  });

  archive.on('error', function(err) {
    console.log('⚠ Error creating ZIP file:', err.message);
    console.log('  Manually ZIP the dist/ folder contents.');
  });

  archive.pipe(output);
  archive.directory(distDir, false);
  archive.finalize();
}
