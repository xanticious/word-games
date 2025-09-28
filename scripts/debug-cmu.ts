import { readFileSync } from 'fs';
import { join } from 'path';

const filePath = join(process.cwd(), 'dictionaries', 'cmudict-0.7b');
const content = readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Check first few non-comment lines
let count = 0;
for (const line of lines) {
	if (line.startsWith(';;;') || line.trim().length === 0) {
		continue;
	}

	console.log('Line:', line);

	// Try different patterns
	const match1 = line.match(/^([A-Z']+(?:\([0-9]+\))?)\s+(.+)$/);
	const match2 = line.match(/^([A-Z'][A-Z'-]*)\s+(.+)$/);
	const match3 = line.match(/^(\S+)\s+(.+)$/);

	console.log('Match1:', match1 ? match1.slice(1, 3) : null);
	console.log('Match2:', match2 ? match2.slice(1, 3) : null);
	console.log('Match3:', match3 ? match3.slice(1, 3) : null);
	console.log('---');

	count++;
	if (count >= 5) break;
}
