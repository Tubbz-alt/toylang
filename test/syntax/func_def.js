
process.env.NODE_ENV = 'test'

const toylang = require('../../index.js')
    , should = require('should')
    , mocha = require('mocha')
    , it = mocha.it
    , describe = mocha.describe

describe('#SYNTAX func_def', function() {
  describe('bad implemented func_def', function() {
    it('should not be parsed as func_def because the last chunk is not a func_def_return', function() {
      toylang.syntax.parse('f func-def() { variable = 1 + 2 }').parsed.args.value[0].parsed.type.should.not.be.eql('func_def')
    })

    it('should throw because the last chunk is a decl_if with no else_end', function() {
      should.throws(function() {
        toylang.syntax.parse(`
f func-def(a) {
  if(a > 0) {
    return a
  }
}
`)
      }, SyntaxError)
    })

    it('should throw because the last chunk is a decl_if whose else_end with no func_def_return', function() {
      should.throws(function() {
        toylang.syntax.parse(`
f func-def(a) {
  if(a.n > 0) {
    return a.n
  } else {
    a.n = a.n + 1
  }
}
`)
      }, SyntaxError)
    })

    it('should throw because the last chunk is a decl_if whose else_middles last chunk are not func_def_return', function() {
      should.throws(function() {
        toylang.syntax.parse(`
f func-def(a) {
  if(a.n > 0) {
    return a.n
  } else(a.n < 0) {
    a.n = a.n - 1
  } else {
    a.n = a.n + 1
    return a.n
  }
}
`)
      }, SyntaxError)
    })
  })

  describe('well implemented func_def', function() {
    it('should be parsed as func_def because the last chunk is a func_def_return', function() {
      toylang.syntax.parse('f func-def() { variable = 1 + 2 return variable }').parsed.args.value[0].parsed.type.should.be.eql('func_def')
    })

    it('should be parsed as func_def because the last chunk is a decl_if in which all last chunks are func_def_return', function() {
      toylang.syntax.parse(`
f func-def(a) {
  if(a > 0) {
    a = a + 1
    return a
  } else(a < 0) {
    a = a - 1
    return a
  } else {
    return 0
  }
}
`).parsed.args.value[0].parsed.type.should.be.eql('func_def')
    })
  })
})
