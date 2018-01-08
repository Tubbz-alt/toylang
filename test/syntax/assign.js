
const toylang = require('../../index.js')
    , should = require('should')
    , mocha = require('mocha')
    , it = mocha.it
    , describe = mocha.describe

describe('#SYNTAX assign', function() {
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

  describe('variable = array', function() {
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

    describe('variable = array[index]', function() {
      it('should assign the first item of an array to "array-item-variable"', function() {
        should.doesNotThrow(function() {
          toylang.syntax.parse('array-item-variable = array[0]')
        })
      })
    })
  })

  describe('variable = object', function() {
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

    describe('variable = obj.property["computed"]', function() {
      it('should assign an objects property to "objects-property-variable"', function() {
        should.doesNotThrow(function() {
          toylang.syntax.parse('objects-property-variable = obj.property')
        })
      })

      it('should assign an objects computed property to "objects-computed-property-variable"', function() {
        should.doesNotThrow(function() {
          toylang.syntax.parse('objects-computed-property-variable = obj["computed"]')
        })
      })
    })
  })

  describe('variable = func_def', function() {
    it('should assign func_def to "variable-func-def"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('variable-func-def = f f() { return 1 }')
      })
    })
  })

  describe('variable = func_call', function() {
    it('should assign func_call to "variable-func-call"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('variable-func-call = some-func()')
      })
    })

    describe('variable = func_call.property.computed["x"](1,2,3)', function() {
      it('should assign the result of a func_call of the result of another func_call to "result-variable"', function() {
        should.doesNotThrow(function() {
          toylang.syntax.parse('result-variable = some-func().property.computed["x"](1,2,3)')
        })
      })
    })
  })

  describe('variable = another-variable', function() {
    it('should assign "another-variable" to "variable"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('variable = another-variable')
      })
    })

    describe('variable = another-variable.property.computed["x"](1,2,3)', function() {
      it('should assign the result of a func_call of an object to "result-variable"', function() {
        toylang.syntax.parse('result-variable = another-variable.property.computed["x"](1,2,3)')
      })
    })
  })

  describe('variable = math_operation', function() {
    it('should assign the result of a math operation to "result"', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('result = 1 / 2 * 3 + 4')
      })
    })
  })
})
