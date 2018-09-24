#!/usr/bin/env node

import program from 'commander';
import loader from '..';

program
  .version('0.0.1')
  .description('App downloads web page to your computer, and allows you to view them at any time.')
  .arguments('<sourceLink>')
  .option('-o, --output [destPath]', 'target path to save source page')
  .action((sourceLink) => {
    loader(sourceLink, program.output)
      .then(res => console.log(res))
      .catch(err => console.error(err));
  })
  .parse(process.argv);
