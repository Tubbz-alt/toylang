Toylang
=======

  [![Build status][circle-ci-badge]][circle-ci]
  [![Issue status][gh-issues-badge]][gh-issues]
  [![NPM Version][npm-module-version-badge]][npm-module]
  [![Downloads][npm-downloads-total-badge]][npm-module]
  [![Say thanks][saythanks-badge]][saythanks-to]

My first toy language. Created exclusively for learning purposes.

Example
=======

```javascript
const toylang = require('@dptole/toylang')
const ast = toylang.syntax.parse(`

user-name = 'dptole'
user-name-length = length(user-name)

if(0 < user-name-length < 10) {
  print('valid username length. its length is between 1 and 9')
  print(user-name)
} else {
  print('invalid username')
}

`)

const result = toylang.interpreter.parse(ast)
// It will output
// "valid username length. its length is between 1 and 9"
// "dptole"
```

Click [here][example-url] to see more.

ABNF-like syntax
================

```
chunk = [ exp | decl ] *

exp = [ assign | math_operation | func_call | func_def | primitive | variable ] [ ext_exp ] *

assign = variable "=" exp

variable = [ a-z ] + [ [ "-" ] ? [ _a-z0-9 ] + ] *

math_operation = exp [ math_operator exp ] +

math_operator = [ "-" | "+" | "*" | "/" ]

func_call = variable func_call_args_chunk

func_call_args_chunk = "(" [ func_call_args_list ] ? ")"

func_call_args_list = exp [ "," exp ] *

func_def = "f " variable "(" [ func_def_args_list ] ? ")" "{" func_def_chunk "}"

func_def_args_list = variable [ "," variable ] *

func_def_chunk = chunk func_def_return

func_def_return = "return " exp

primitive = [ number | string | boolean | array | object ]

number = [ "+" | "-" ] ? [ 0-9 ] + [ "." [ 0-9 ] + ] ?

string = [ "'" [ ALPHA ] + "'" ] | [ """ [ ALPHA ] + """ ]

boolean = [ "T" | "F" ]

array = "[" [ exp [ "," exp ] * ] ? "]"

object = "{" [ variable "=" exp [ ";" variable "=" exp ] * ] ? "}"

ext_exp = [ ext_object | ext_array | func_call_args_chunk ]

ext_object = "." exp

ext_array = "[" exp "]"

decl = if

if = "if" if_cond_block if_chunk_block [ else ] ?

if_cond_block = "(" cond ")"

cond = [ log_unary ] ? exp [ log_op exp ] *

log_unary = "not"

log_op = ">" | "<" | "==" | "!=" | ">=" | "<=" | "and" | "xor" | "or"

if_chunk_block = "{" chunk "}"

else = [ else_middle ] * else_end

else_middle = "else" if_cond_block if_chunk_block

else_end = "else" if_chunk_block
```

License
=======

[MIT][LICENSE]

[circle-ci]: https://circleci.com/gh/dptole/toylang
[circle-ci-badge]: https://img.shields.io/circleci/project/dptole/toylang.svg
[gh-issues-badge]: https://img.shields.io/github/issues-raw/dptole/toylang.svg
[gh-issues]: https://github.com/dptole/toylang/issues
[npm-module-version-badge]: https://img.shields.io/npm/v/@dptole/toylang.svg
[npm-module]: https://www.npmjs.org/package/@dptole/toylang
[npm-downloads-total-badge]: https://img.shields.io/npm/dt/@dptole/toylang.svg
[saythanks-badge]: https://img.shields.io/badge/say%20thanks-%E3%83%84-44cc11.svg
[saythanks-to]: https://saythanks.io/to/dptole
[example-url]: https://github.com/dptole/toylang/blob/master/example
[LICENSE]: LICENSE
