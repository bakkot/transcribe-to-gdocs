import { parseArgs } from 'node:util';

import { initGdocsClient } from './write-to-gdocs.ts';
import { transcribeMicrophone } from './transcribe.ts';
import { fixup } from './fixup.ts';

const { positionals: argv, values } = parseArgs({ allowPositionals: true, options: { tab: { type: 'string' } } });
if (argv.length !== 1) {
  console.error('usage: node run.ts docid [--tab "tab name"]');
  process.exit(1);
}
const [docId] = argv;


const write = await initGdocsClient(docId, values.tab);

let writing: Promise<void> | null = null;
let queue = '';

transcribeMicrophone(async (text: string) => {
  queue += text;
  // avoid simultaneous writes because they can race
  if (!writing) {
    while (queue !== '') {
      try {
        let orig = queue;
        queue = fixup(queue);
        // fixups can make nonempty into empty
        if (queue !== '') {
          if (orig === queue) {
            console.log(`${JSON.stringify(queue)}`);
          } else {
            console.log(`${JSON.stringify(orig)} -> ${JSON.stringify(queue)}`);
          }
          writing = write(queue);
          queue = '';
          await writing;
        }
      } finally {
        writing = null;
      }
    }
  }
});
