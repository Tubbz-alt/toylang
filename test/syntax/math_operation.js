
const toylang = require('../../index.js')
    , should = require('should')
    , mocha = require('mocha')
    , it = mocha.it
    , describe = mocha.describe

describe('#SYNTAX math_operation', function() {
  describe('number + number - number * number / number', function() {
    it('should sum, subtract, multiply and divide positive numbers', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('1 + 2 - 3 * 4')
      })
    })

    it('should sum, subtract, multiply and divide negative numbers', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('-1 + -2 - -3 * -4')
      })
    })

    it('should sum, subtract, multiply and divide positive floats', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('1.4 + 2.3 - 3.2 * 4.1')
      })
    })

    it('should sum, subtract, multiply and divide negative floats', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('-1.4 + -2.3 - -3.2 * -4.1')
      })
    })
  })

  describe('func_call + func_call - func_call * func_call / func_call', function() {
    it('should sum, subtract, multiply and divide the result of func_calls', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('one() + two() - number(3) * get(4)')
      })
    })
  })

  describe('string + string', function() {
    it('should concatenate two strings', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('"string1" + "string2"')
      })
    })
  })

  describe('variable + variable - variable * variable / variable', function() {
    it('should sum, subtract, multiply and divide variables', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('va1 + va2 - var3 * var4 / var5')
      })
    })
  })
})
