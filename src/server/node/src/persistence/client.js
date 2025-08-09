import { promises as fs } from 'fs';
import path from 'path';

const keyDepth = 2;
const delimiter = '_';
const basePath = 'data/sanora';

const filePathForKey = async (key) => {
  let mutatingKey = key.replace(':', delimiter).trim();
  const filePathParts = [];
  for(let i = 0; i < keyDepth; i++) {
    filePathParts.push(mutatingKey.slice(-3));
    mutatingKey = mutatingKey.slice(0, -3);
  }
  filePathParts.push(mutatingKey);
  filePathParts.push(basePath);

  const filePath = filePathParts.reverse().join('/');

  return filePath;
};

const set = async (key, value) => {
  const filePath = await filePathForKey(key);
  
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value);
  
  return true;
}

const get = async (key) => {
  const filePath = await filePathForKey(key);

  try {
    return await fs.readFile(filePath, 'utf8');
  } catch(err) {
    return null;
  }
};

const getAll = async (pattern) => {
  const entries = await fs.readdir(basePath, {recursive: true, withFileTypes: true});
  
  const filteredEntries = entries.filter(entry => {
    const isFile = entry.isFile();
    const relativePath = entry.path ? 
      path.relative(basePath, path.join(entry.path, entry.name)) : 
      entry.name;
    const matchesPattern = relativePath.indexOf(pattern) > -1;
    
    return isFile && matchesPattern;
  });
  
  const files = filteredEntries.map(async entry => {
    const fullPath = path.join(entry.path || basePath, entry.name);
    const relativePath = entry.path ? 
      path.relative(basePath, path.join(entry.path, entry.name)) : 
      entry.name;
    
    return {
      filename: relativePath,
      content: await fs.readFile(fullPath, 'utf8')
    };
  });

  const contents = await Promise.all(files);
  return contents;
};

const del = async (key) => {
  const filePath = await filePathForKey(key);

  await fs.unlink(filePath);

  return true;
};

const createClient = () => {
  return {
    on: () => createClient,
  };
};

createClient.connect = () => {
  return {
    set,
    get,
    getAll,
    del
  };
};

export { createClient };
