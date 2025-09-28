console.log('Starting dictionary processing...');
console.log('Current working directory:', process.cwd());

import { existsSync } from 'fs';
import { join } from 'path';

const dictionariesPath = join(process.cwd(), 'dictionaries');
console.log('Dictionaries path:', dictionariesPath);
console.log('Words file exists:', existsSync(join(dictionariesPath, 'words_alpha.txt')));
console.log('CMU dict exists:', existsSync(join(dictionariesPath, 'cmudict-0.7b')));
