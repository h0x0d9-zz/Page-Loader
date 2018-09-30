#!/usr/bin/env node

import program from 'commander';
import load from '..';

program
  .version('0.0.1')
  .description('App downloads web page to your computer, and allows you to view them at any time.')
  .arguments('<sourceLink>')
  .option('-o, --output [destFolder]', 'target path to save source page')
  .action(
    sourceLink => load(sourceLink, program.output)
      .then((res) => {
        console.info('Page was downloaded as %o', res);
        process.exit(0);
      })
      .catch(() => process.exit(1)),
  )
  .parse(process.argv);
