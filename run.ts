import { parseArgs } from 'node:util';

import { initGdocsClient } from './write-to-gdocs.ts';

const { positionals: argv } = parseArgs({ allowPositionals: true });
if (argv.length !== 1) {
  console.error('provide the doc ID as an argument');
  process.exit(1);
}
const [docId] = argv;


const write = await initGdocsClient(docId);

await write('testing...');
