(function addReactBuildIndexFile() {
  const fs = require('fs');
  const path = require('path');
  const reactFolderPath = path.join(__dirname, 'dist', 'react');
  const indexContent = `/*
  created from /afterBuild.js file
  */
  import '../mustib-ui/mustib-ui.css'
  export * from './components'
  `;
  const filePath = path.join(reactFolderPath, 'index.ts');
  fs.writeFileSync(filePath, indexContent);
})();
