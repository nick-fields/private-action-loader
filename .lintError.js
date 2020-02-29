const colors = require('colors');
const rules = require('./.commitlintrc.js').rules['type-enum'];
const error = [
  '', // intentional empty item
  colors.bold(colors.red('Invalid Commit Format')),
  `Expected Format: '[${colors.cyan('Type')}]: [${colors.magenta('Subject')}]'`,
  `${colors.cyan('Type')} must be one of ${rules[2].join('|')}`,
  `${colors.magenta('Subject')} can be any commit message`,
  '', // intentional empty item
  `Example valid commit:`,
  `${colors.cyan('patch')}: ${colors.magenta('this is a commit message.')}`,
  '', // intentional empty item
];

console.log(error.join('\n'));
process.exit(1);
