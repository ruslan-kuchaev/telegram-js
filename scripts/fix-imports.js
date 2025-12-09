import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function addJsExtensions(dir) {
  const files = await readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);

    if (file.isDirectory()) {
      await addJsExtensions(fullPath);
    } else if (file.name.endsWith('.js')) {
      let content = await readFile(fullPath, 'utf-8');
      
      // Добавляем .js к относительным импортам
      content = content.replace(
        /from ['"](\.\/.+?)(?<!\.js)['"]/g,
        "from '$1.js'"
      );
      content = content.replace(
        /from ['"](\.\.\/.+?)(?<!\.js)['"]/g,
        "from '$1.js'"
      );

      await writeFile(fullPath, content, 'utf-8');
    }
  }
}

addJsExtensions('./dist').then(() => {
  console.log('✅ Import paths fixed');
}).catch(console.error);
