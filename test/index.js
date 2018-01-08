
const toylang = require('../index.js')
    , should = require('should')
    , mocha = require('mocha')
    , it = mocha.it
    , describe = mocha.describe

describe('#assign', function() {
  describe('variable = number', function() {
    it('should assign positive number to "variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('variable = 1')
      })
    })

    it('should assign negative number to "negative-variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('negative-variable = -123')
      })
    })

    it('should assign positive float to "positive-float"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('positive-float = 3.141592653')
      })
    })

    it('should assign negative float to "negative-float"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('negative-float = -1.4')
      })
    })
  })

  describe('variable = string', function() {
    it('should assign double-quoted string to "double-quoted-variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('double-quoted-variable = "any string"')
      })
    })

    it('should assign single-quoted string to "single_quoted_variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse("single_quoted_variable = 'single quoted string'")
      })
    })

    it('should assign multiline string to "multiline_variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse(`
multiline_variable = 'first line
second line
last line'
`)
      })
    })

    it('should assign special characters string to "special-characters_variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse(`
special-characters_variable = '~~ = tilde, equivalent to \
~~n = line break
~~t = tab
~~v = vertical tab
~~f = form feed
~~r = carriage return
~~xFF = hexadecimal code from 0 to 255
~~uFFFF = hexadecimal code from 0 to 65535
~~b = backspace'
`)
      })
    })
  })

  describe('variable = boolean', function() {
    it('should assign false to "falsy-variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('falsy-variable = F')
      })
    })

    it('should assign true to "truthy-variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('truthy-variable = T')
      })
    })
  })

  describe('#variable = array', function() {
    it('should assign empty array to "empty-array-variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('empty-array-variable = []')
      })
    })

    it('should assign populated array to "populated-array-variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('populated-array-variable = [1,2,3,4]')
      })
    })
  })

  describe('#variable = object', function() {
    it('should assign empty object to "empty-object-variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('empty-object-variable = {}')
      })
    })

    it('should assign populated object to "populated-object-variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('populated-object-variable = {first-key = 1; second-key = "two"; thrid_key = [1,2,3]; fourth-key={}}')
      })
    })
  })
})
