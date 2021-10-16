const Parser = require("./parser");

const x = new Parser().parse('layout: true\nname: a\n---\n'
  + '1\n2\n'
  + '--\n3\n4\n');

console.log(x);
