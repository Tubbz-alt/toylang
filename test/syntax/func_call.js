
const toylang = require('../../index.js')
    , should = require('should')
    , mocha = require('mocha')
    , it = mocha.it
    , describe = mocha.describe

describe('#SYNTAX func_call', function() {
  describe('regular func_calls', function() {
    it('should invoke a simple func_call with no func_call_args_list', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('func-call-with-no-args()')
      })
    })

    it('should invoke a simple func_call with some func_call_args_list', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('func-call-with-args(1, "string", T, {}, [])')
      })
    })
  })

  describe('chained func_calls', function() {
    it('should invoke a series of func_calls with no func_call_args_list', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('many-funcs-with-no-args()()()()()')
      })
    })

    it('should invoke a series of chained func_calls with func_call_args_list', function() {
      should.doesNotThrow(function() {
        toylang.syntax.parse('many-funcs-with-args(4)(3)(2)(1)(0)')
      })
    })

    describe('promise-style func_calls', function() {
      it('should invoke a series of promise-style func_calls', function() {
        should.doesNotThrow(function() {
          toylang.syntax.parse('promise().then().catch().then().catch()')
        })
      })
    })

    describe('computed-property func_call', function() {
      it('should invoke a series func computed-property func_calls', function() {
        should.doesNotThrow(function() {
          toylang.syntax.parse('get-objs["prop1"]()["prop2"]()["prop3"]()')
        })
      })
    })
  })
})
