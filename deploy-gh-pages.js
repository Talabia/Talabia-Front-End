const fs = require('fs');
const path = require('path');

// Copy all files from docs/browser to docs/
const browserDir = path.join(__dirname, 'docs', 'browser');
const docsDir = path.join(__dirname, 'docs');

if (fs.existsSync(browserDir)) {
  const files = fs.readdirSync(browserDir);

  files.forEach(file => {
    const srcPath = path.join(browserDir, file);
    const destPath = path.join(docsDir, file);

    if (fs.lstatSync(srcPath).isDirectory()) {
      // Copy directory recursively
      fs.cpSync(srcPath, destPath, { recursive: true, force: true });
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  });

  console.log('✓ Files copied from browser/ to docs/');

  // Create 404.html (copy of index.html for SPA routing)
  const indexPath = path.join(docsDir, 'index.html');
  const notFoundPath = path.join(docsDir, '404.html');
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('✓ Created 404.html for SPA routing');

  // Create .nojekyll file
  const nojekyllPath = path.join(docsDir, '.nojekyll');
  fs.writeFileSync(nojekyllPath, '');
  console.log('✓ Created .nojekyll file');

  // Remove browser directory (with retry for Windows file locks)
  try {
    fs.rmSync(browserDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    console.log('✓ Removed browser/ directory');
  } catch (err) {
    console.log('⚠ Could not remove browser/ directory (file lock). You can manually delete it.');
    console.log('  This does not affect deployment.');
  }

  console.log('\n✓ Deployment files ready! Push the changes to GitHub.');
} else {
  console.log('✗ docs/browser directory not found. Run the build first.');
}
