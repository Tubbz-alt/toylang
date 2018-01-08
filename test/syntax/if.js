
process.env.NODE_ENV = 'test'

const toylang = require('../../index.js')
    , should = require('should')
    , mocha = require('mocha')
    , it = mocha.it
    , describe = mocha.describe

describe('#SYNTAX decl_if', function() {
  describe('bad implemented decl_if', function() {
    it('should throw because decl_if cannot have func_def_return outside the func_def scope', function() {
      should.throws(function() {
        toylang.syntax.parse(`
if(a > 0) {
  return a
}
`)
      }, SyntaxError)
    })

    it('should throw because log_unary cannot appear before log_op', function() {
      should.throws(function() {
        toylang.syntax.parse(`
if(a not > 0) {
  a = 0
}
`)
      }, SyntaxError)
    })

    it('should throw because log_unary cannot be the last cond of an if_cond_block', function() {
      should.throws(function() {
        toylang.syntax.parse(`
if(n > 10 not) {
  n = 10
}
`)
      }, SyntaxError)
    })

    it('should throw because log_op cannot be the last cond of an if_cond_block', function() {
      should.throws(function() {
        toylang.syntax.parse(`
if(a.n > 30 !=) {
  a.n = 30
}
`)
      }, SyntaxError)
    })

    it('should throw because log_op cannot be the first cond of an if_cond_block', function() {
      should.throws(function() {
        toylang.syntax.parse(`
if(> b.n 30) {
  b.n = 10
}
`)
      }, SyntaxError)
    })
  })

  describe('well implemented decl_if', function() {
    it('should be parsed as decl_if with only one exp', function() {
      toylang.syntax.parse('if(exp) { exp = T }').parsed.args.value[0].parsed.type.should.be.eql('decl_if')
    })

    it('should be parsed as decl_if with only exps and log_ops', function() {
      toylang.syntax.parse(`
if(exp1 and exp2 or exp3 xor exp4) {
  arr_push(exps, [exp1, exp2, exp3, exp4])
}

if(exp1 >= exp2 > exp3 < exp4 <= exp5 == exp6 != exp7) {
  arr_push(exps, [exp1, exp2, exp3, exp4, exp5, exp6, exp7])
}
`).parsed.args.value[0].parsed.type.should.be.eql('decl_if')
    })

    it('should be parsed as decl_if with only exps, log_unaries and log_ops', function() {
      toylang.syntax.parse(`
if(exp1 >= not exp2 > exp3 < not exp4 <= exp5 == not exp6 != exp7) {
  arr_push(exps, [exp1, exp2, exp3, exp4, exp5, exp6, exp7])
}
`).parsed.args.value[0].parsed.type.should.be.eql('decl_if')
    })

    it('should be parsed as decl_if with only one log_unary and exp', function() {
      toylang.syntax.parse(`
if(not exp1) {
  arr_push(exps, [exp1])
}
`).parsed.args.value[0].parsed.type.should.be.eql('decl_if')
    })
  })
})
