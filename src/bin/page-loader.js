#!/usr/bin/env node
// @flow

import program from 'commander';
import loader from '..';

program
  .version('0.0.1')
  .description('App downloads web page to your computer, and allows you to view them at any time.')
  .arguments('<sourceLink>')
  .option('-o, --output [destFolder]', 'target path to save source page')
  .action(
    sourceLink => loader(sourceLink, program.output)
      .then(res => console.info('File %o was saved', res))
      .catch((err) => {
        const e = new Error(err);
        console.error(e.message);
        process.exit(1);
      }),
  )
  .parse(process.argv);
