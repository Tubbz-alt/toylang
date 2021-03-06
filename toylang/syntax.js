
const path = require('path')
const fs = require('fs')

function removeEmptyLines(inst) {
  return inst.replace(/^\s*/, '')
}

function ensureArray(arg) {
  return Array.isArray(arg) ? arg : []
}

function isReservedWord(word) {
  return /^(return|if|else|T|F|and|x?or)$/.test(word)
}

const isExtensibleExpression = (function() {
  const extensible_expressions = 'func_call primitive variable'.split(' ')

  return function isExtensibleExpression(exp) {
    return !!~extensible_expressions.indexOf(
      exp && exp.parsed && exp.parsed.type
    )
  }
})()

const syntax = {
  parseFile(filename) {
    return syntax.parse(fs.readFileSync(path.resolve(filename), 'utf-8').toString())
  },

  parse(code) {
    const ast = syntax.parseChunks(code, 'global')
    if(ast.remain)
      syntax.throwError(ast)
    return ast
  },

  throwError(ast) {
    if(process.env.NODE_ENV !== 'test')
      console.log(JSON.stringify(ast, 0, 2))
    throw new SyntaxError('Unexpected token somewhere (NYI)')
  },

  /*
    chunk = [ exp ] *
  */
  parseChunks(inst, scope_name) {
    const chunks = []
    let chunk = null
    let code_inst = inst
    let max_chunks = 40

    while(max_chunks--) {
      chunk = syntax.parseExpression(code_inst) || syntax.parseDeclaration(code_inst, scope_name)

      if(!chunk)
        break

      code_inst = chunk.remain
      chunks.push(chunk)
    }

    return {
      remain: code_inst,
      original: inst,
      parsed: {
        type: 'chunks',
        args: {
          value: chunks
        }
      }
    }
  },

  /*
    exp = [ assign | math_operation | func_call | func_def | primitive | variable ] [ ext_exp ] ?
  */
  parseExpression(inst, ignore_chunks) {
    ignore_chunks = ensureArray(ignore_chunks)
    inst = removeEmptyLines(inst)

    if(!inst)
      return false

    let exp = false

    if(!~ignore_chunks.indexOf('assign'))
      exp = syntax.parseAssign(inst)

    if(!exp && !~ignore_chunks.indexOf('math_operation'))
      exp = syntax.parseMathOperation(inst)

    if(!exp && !~ignore_chunks.indexOf('func_call'))
      exp = syntax.parseFuncCall(inst)

    if(!exp && !~ignore_chunks.indexOf('func_def'))
      exp = syntax.parseFuncDef(inst)

    if(!exp && !~ignore_chunks.indexOf('primitive'))
      exp = syntax.parsePrimitive(inst)

    if(!exp && !~ignore_chunks.indexOf('variable'))
      exp = syntax.parseVariable(inst)

    if(!~ignore_chunks.indexOf('ext'))
      exp = syntax.extendExpression(exp)

    if(exp)
      exp.remain = removeEmptyLines(exp.remain)

    return exp
  },

  /*
    ext_exp = [ ext_object | ext_array | ext_func_call ] *
  */
  extendExpression(exp) {
    if(isExtensibleExpression(exp)) {
      exp.parsed.exts = []

      let ext = null

      while(ext = syntax.extendExpressionObject(exp.remain) || syntax.extendExpressionArray(exp.remain) || syntax.extendExpressionFuncCall(exp.remain)) {
        exp.remain = removeEmptyLines(ext.remain)
        exp.parsed.exts.push(ext.parsed)
      }
    }

    return exp
  },

  /*
    ext_object = "." exp
  */
  extendExpressionObject(inst) {
    if(!/^(\s*\.\s*)/.test(inst))
      return false

    const exp = syntax.parseExpression(inst.substr(RegExp.$1.length), ['ext', 'assign'])
    if(!exp)
      return false

    return {
      original: inst,
      remain: exp.remain,
      parsed: {
        type: 'extend_object',
        args: exp.parsed
      }
    }
  },

  /*
    ext_array = "[" exp "]"
  */
  extendExpressionArray(inst) {
    if(!/^(\s*\[\s*)/.test(inst))
      return false

    const exp = syntax.parseExpression(inst.substr(RegExp.$1.length))
    if(!exp)
      return false

    if(!/^(\s*\]\s*)/.test(exp.remain))
      return false

    return {
      original: inst,
      remain: exp.remain.substr(RegExp.$1.length),
      parsed: {
        type: 'extend_computed',
        args: exp.parsed
      }
    }
  },

  /*
    ext_func_call = func_call_args_chunk
  */
  extendExpressionFuncCall(inst) {
    return syntax.parseFuncCallArgsChunk(inst)
  },

  /*
    decl = if
  */
  parseDeclaration(inst, scope_name) {
    inst = removeEmptyLines(inst)

    if(!inst)
      return false

    let decl = syntax.parseDeclarationIf(inst, scope_name)
    if(decl)
      return decl

    return false
  },

  /*
    if = "if" if_cond_block if_chunk_block [ else ] ?
  */
  parseDeclarationIf(inst, scope_name) {
    if(!/^(\s*if\s*)/.test(inst))
      return false

    const cond_block = syntax.parseDeclarationIfCondBlock(inst.substr(RegExp.$1.length))
    if(!cond_block)
      return false

    const if_chunk = syntax.parseDeclarationIfChunkBlock(cond_block.remain, scope_name)
    if(!if_chunk)
      return false

    const else_block = syntax.parseDeclarationIfElse(if_chunk.remain, scope_name)

    return {
      original: inst,
      remain: else_block.remain,
      parsed: {
        type: 'decl_if',
        args: {
          cond_block: cond_block.parsed,
          if_chunk: if_chunk.parsed,
          else_block: else_block && else_block.parsed
        }
      }
    }
  },

  /*
    else = [ else_middle ] * else_end
  */
  parseDeclarationIfElse(inst, scope_name) {
    const else_middles = []
    let else_middle = null
    let code_inst = inst

    while(else_middle = syntax.parseDeclarationIfElseMiddle(code_inst, scope_name)) {
      else_middles.push(else_middle.parsed)
      code_inst = else_middle.remain
    }

    let else_end = syntax.parseDeclarationIfElseEnd(else_middle ? else_middle.remain : code_inst, scope_name)
    if(!else_end) {
      let remain = code_inst

      if(else_middles.length) {
        const blocks = else_middles[else_middles.length - 1].args.block.args.args.value
        if(blocks.length) {
          if(!/^(\s*\}\s*)/.test(blocks[blocks.length - 1].remain))
            return false
          remain = blocks[blocks.length - 1].remain.substr(RegExp.$1.length)
        }
      }

      else_end = {
        remain: remain,
        parsed: null
      }
    }

    return {
      original: inst,
      remain: else_end.remain,
      parsed: {
        type: 'else',
        args: {
          else_middles: else_middles,
          else_end: else_end.parsed
        }
      }
    }
  },

  /*
    else_middle = "else" if_cond_block if_chunk_block
  */
  parseDeclarationIfElseMiddle(inst, scope_name) {
    if(!/^(\s*else\s*)/.test(inst))
      return false

    let else_cond = syntax.parseDeclarationIfCondBlock(inst.substr(RegExp.$1.length))
    if(!else_cond)
      return false

    let else_block = syntax.parseDeclarationIfChunkBlock(else_cond.remain, scope_name)
    if(!else_block)
      return false

    return {
      original: inst,
      remain: else_block.remain,
      parsed: {
        type: 'else_middle',
        args: {
          cond: else_cond.parsed,
          block: else_block.parsed
        }
      }
    }
  },

  /*
    else_end = "else" if_chunk_block
  */
  parseDeclarationIfElseEnd(inst, scope_name) {
    if(!/^(\s*else\s*)/.test(inst))
      return false

    let else_block = syntax.parseDeclarationIfChunkBlock(inst.substr(RegExp.$1.length), scope_name)
    if(!else_block)
      return false

    return {
      original: inst,
      remain: else_block.remain,
      parsed: {
        type: 'else_end',
        args: else_block.parsed
      }
    }
  },

  /*
    if_chunk_block = "{" if_chunk "}"
  */
  parseDeclarationIfChunkBlock(inst, scope_name) {
    if(!/^(\s*\{\s*)/.test(inst))
      return false

    let code_inst = inst.substr(RegExp.$1.length)
    let if_chunk = syntax.parseDeclarationIfChunk(code_inst, scope_name)
    if(if_chunk)
      code_inst = if_chunk.remain
    else
      if_chunk = {
        remain: code_inst,
        parsed: {
          type: 'chunks',
          args: {
            value: []
          }
        }
      }

    if(if_chunk.parsed.args.value.length < 1)
      return false

    code_inst = removeEmptyLines(code_inst)
    const ret = syntax.parseFuncDefChunkReturn(code_inst, scope_name)
    if(ret) {
      if_chunk.remain = ret.remain
      if_chunk.parsed.args.value.push(ret)
    }

    if(!/^(\s*\}\s*)/.test(if_chunk.remain))
      return false

    return {
      original: inst,
      remain: if_chunk.remain.substr(RegExp.$1.length),
      parsed: {
        type: 'cond_block',
        args: if_chunk.parsed
      }
    }
  },

  /*
    if_chunk = chunk
  */
  parseDeclarationIfChunk(inst, scope_name) {
    const chunks = syntax.parseChunks(inst, scope_name)
    if(!chunks)
      return false

    if(scope_name === 'func_def') {
      const ret = syntax.parseFuncDefChunkReturn(chunks.remain, scope_name)
      if(ret) {
        chunks.remain = ret.remain
        chunks.parsed.args.value.push(ret)
      }
    }

    return chunks
  },

  /*
    if_cond_block = "(" cond ")"
  */
  parseDeclarationIfCondBlock(inst) {
    if(!/^(\s*\(\s*)/.test(inst))
      return false

    const cond = syntax.parseDeclarationIfCond(inst.substr(RegExp.$1.length))
    if(!cond)
      return false

    if(!/^(\s*\)\s*)/.test(cond.remain))
      return false

    return {
      original: inst,
      remain: cond.remain.substr(RegExp.$1.length),
      parsed: {
        type: 'cond_block',
        args: {
          value: cond
        }
      }
    }
  },

  /*
    cond = [ log_unary ] ? exp [ log_op exp ] *
  */
  parseDeclarationIfCond(inst) {
    const conds = []
    let code_inst = inst
    let log_unary = syntax.parseLogicUnary(code_inst)
    if(log_unary) {
      conds.push(log_unary.parsed)
      code_inst = log_unary.remain
    }

    let exp = syntax.parseExpression(code_inst)
    if(!exp)
      return false

    conds.push(exp.parsed)

    let log_op = null
    while(1) {
      log_op = syntax.parseLogicOperator(exp.remain)
      if(!log_op)
        break

      log_unary = syntax.parseLogicUnary(log_op.remain)
      code_inst = log_unary ? log_unary.remain : log_op.remain

      exp = syntax.parseExpression(code_inst)
      if(!exp)
        break

      if(log_unary)
        conds.push(log_op.parsed, log_unary.parsed, exp.parsed)
      else
        conds.push(log_op.parsed, exp.parsed)
    }

    return {
      original: inst,
      remain: exp.remain,
      parsed: {
        type: 'cond',
        args: conds
      }
    }
  },

  /*
    log_unary = "not"
  */
  parseLogicUnary(inst) {
    if(!/^(\s*\b(not)\b\s*)/.test(inst))
      return false

    return {
      original: inst,
      remain: inst.substr(RegExp.$1.length),
      parsed: {
        type: 'log_unary',
        args: {
          value: RegExp.$2
        }
      }
    }
  },

  /*
    log_op = ">" | "<" | "==" | "!=" | ">=" | "<=" | "and" | "xor" | "or"
  */
  parseLogicOperator(inst) {
    if(!/^(\s*(<=|>=|!=|==|>|<|=)\s*)/.test(inst))
      if(!/^(\s*\b(x?or|and)\b\s*)/.test(inst))
        return false

    const log_op_block = RegExp.$1
    const log_op = RegExp.$2

    return {
      original: inst,
      remain: inst.substr(log_op_block.length),
      parsed: {
        type: 'log_op',
        args: {
          value: log_op
        }
      }
    }
  },

  /*
    math_operation = exp [ math_operator exp ] +
  */
  parseMathOperation(inst) {
    const exp1 = syntax.parseExpression(inst, ['math_operation'])
    if(!exp1)
      return false

    exp1.remain = removeEmptyLines(exp1.remain)

    const op1 = syntax.parseMathOperator(exp1.remain)
    if(!op1)
      return false

    const exp2 = syntax.parseExpression(op1.remain, ['math_operation'])
    if(!exp2)
      return false

    exp2.remain = removeEmptyLines(exp2.remain)
    const chain = {
      original: inst,
      remain: exp2.remain,
      parsed: {
        type: 'math_operation',
        args: [
          exp1,
          op1,
          exp2
        ]
      }
    }

    let op2 = null
    let exp3 = exp2

    while(1) {
      op2 = syntax.parseMathOperator(exp3.remain)
      if(!op2)
        break

      op2.remain = removeEmptyLines(op2.remain)
      exp3 = syntax.parseExpression(op2.remain, ['math_operation'])
      if(!exp3)
        break

      chain.remain = exp3.remain = removeEmptyLines(exp3.remain)
      chain.parsed.args.push(op2, exp3)
    }

    return chain
  },

  /*
    math_operator = [ "-" | "+" | "*" | "/" ]
  */
  parseMathOperator(inst) {
    if(!/^([-+*\/])/.test(inst))
      return false

    const op = RegExp.$1

    return {
      remain: inst.substr(op.length),
      original: inst,
      parsed: {
        type: 'operator',
        args: {
          operator: op
        }
      }
    }
  },

  /*
    primitive = [ number | string | boolean | array | object ]
  */
  parsePrimitive(inst) {
    let exp = syntax.parsePrimitiveNumber(inst) ||
      syntax.parsePrimitiveString(inst) ||
      syntax.parsePrimitiveBoolean(inst) ||
      syntax.parsePrimitiveArray(inst) ||
      syntax.parsePrimitiveObject(inst)

    return exp && {
      original: inst,
      remain: exp.remain,
      parsed: {
        type: 'primitive',
        args: exp.parsed
      }
    }
  },

  /*
    object = "{" [ variable "=" exp [ ";" variable "=" exp ] * ] ? "}"
  */
  parsePrimitiveObject(inst) {
    if(!/^(\s*\{\s*)/.test(inst))
      return false

    const object_map = syntax.parsePrimitiveObjectMap(inst.substr(RegExp.$1.length))
    if(!/^(\s*\}\s*)/.test(object_map.remain))
      return false

    return {
      original: inst,
      remain: object_map.remain.substr(RegExp.$1.length),
      parsed: {
        type: 'object',
        args: object_map.parsed
      }
    }
  },

  parsePrimitiveObjectMap(inst) {
    const map = []
    let name = null
    let exp = null
    let code_inst = inst

    while(1) {
      name = syntax.parseVariable(code_inst)
      if(!name)
        break

      if(!/^(\s*=\s*)/.test(name.remain))
        break

      exp = syntax.parseExpression(name.remain.substr(RegExp.$1.length))
      if(!exp)
        break

      map.push({
        key: name.parsed,
        value: exp.parsed
      })

      code_inst = exp.remain
      if(!/^(\s*;\s*)/.test(exp.remain))
        break

      code_inst = exp.remain.substr(RegExp.$1.length)
    }

    return {
      original: inst,
      remain: code_inst,
      parsed: {
        type: 'object_map',
        args: map
      }
    }
  },

  /*
    array = "[" [ exp [ "," exp ] * ] ? "]"
  */
  parsePrimitiveArray(inst) {
    if(!/^(\s*\[\s*)/.test(inst))
      return false

    const array_list = syntax.parsePrimitiveArrayList(inst.substr(RegExp.$1.length))
    if(!array_list)
      return false

    if(!/^(\s*\]\s*)/.test(array_list.remain))
      return false

    return {
      original: inst,
      remain: array_list.remain.substr(RegExp.$1.length),
      parsed: {
        type: 'array',
        args: array_list.parsed
      }
    }
  },

  parsePrimitiveArrayList(inst) {
    const array_list = {
      original: inst,
      remain: inst,
      parsed: {
        type: 'array_list',
        args: []
      }
    }

    let exp = syntax.parseExpression(array_list.remain)
    if(!exp)
      return array_list

    array_list.parsed.args.push(exp)

    while(/^(\s*,\s*)/.test(exp.remain)) {
      exp = syntax.parseExpression(exp.remain.substr(RegExp.$1.length))
      if(!exp)
        break

      array_list.parsed.args.push(exp)
    }

    array_list.remain = exp.remain
    return array_list
  },

  /*
    assign = variable "=" exp
  */
  parseAssign(inst) {
    const v = syntax.parseVariable(inst)
    if(!v)
      return false

    const ext = syntax.extendExpression(v)
    const code_inst = ext.remain

    if(!/^(\s*=\s*)/.test(code_inst))
      return false

    const exp = syntax.parseExpression(code_inst.substr(RegExp.$1.length))
    if(!exp)
      return false

    return {
      remain: exp.remain,
      original: inst,
      parsed: {
        type: 'assign',
        args: {
          left: v.parsed,
          right: exp.parsed
        }
      }
    }
  },

  /*
    variable = [ a-z ] + [ [ "-" ] ? [ _a-z0-9 ] + ] *
  */
  parseVariable(inst) {
    if(!/^([a-z]+(-?[_a-z0-9]+)*)/.test(inst))
      return false

    const v = RegExp.$1
    if(isReservedWord(v))
      return false

    return {
      remain: inst.substr(v.length),
      original: inst,
      parsed: {
        type: 'variable',
        args: {
          value: v
        }
      }
    }
  },

  /*
    number = [ "+" | "-" ] ? [ 0-9 ] + [ "." [ 0-9 ] + ] ?
  */
  parsePrimitiveNumber(inst) {
    if(!/^(([-+]?\d+(?:\.\d+)?)\b)/.test(inst))
      return false

    const number_block = RegExp.$1
    const number = RegExp.$2
    const remain = inst.substr(number_block.length)

    return {
      remain: remain,
      original: inst,
      parsed: {
        type: 'number',
        args: {
          value: number
        }
      }
    }
  },

  /*
    string = [ "'" [ ALPHA ] + "'" ] | [ """ [ ALPHA ] + """ ]
  */
  parsePrimitiveString(inst) {
    if(!(/^("([^"]*)")/.test(inst) || /^('([^']*)')/.test(inst)))
      return false

    const quoted_string = RegExp.$1
    const string = syntax.parsePrimitiveStringSpecialCharacters(RegExp.$2)
    const remain = inst.substr(quoted_string.length)

    return {
      remain: remain,
      original: inst,
      parsed: {
        type: 'string',
        args: {
          value: string
        }
      }
    }
  },

  parsePrimitiveStringSpecialCharacters(string) {
    return string.replace(/([^~])~n/g, '$1\n')
      .replace(/([^~])~t/g, '$1\t')
      .replace(/([^~])~r/g, '$1\r')
      .replace(/([^~])~f/g, '$1\f')
      .replace(/([^~])~b/g, '$1\b')
      .replace(/([^~])~v/g, '$1\v')
      .replace(/([^~])~x([0-9a-f]{2})/g, function(_, char_code) { return String.fromCharCode(parseInt(char_code, 16)) })
      .replace(/([^~])~u([0-9a-f]{4})/g, function(_, char_code) { return String.fromCharCode(parseInt(char_code, 16)) })
      .replace(/~~/g, '~')
  },

  /*
    boolean = [ "T" | "F" ]
  */
  parsePrimitiveBoolean(inst) {
    if(!/^(\b(T|F)\b)/.test(inst))
      return false

    const boolean_block = RegExp.$1
    const boolean_value = RegExp.$2
    const remain = inst.substr(boolean_block.length)

    return {
      remain: remain,
      original: inst,
      parsed: {
        type: 'boolean',
        args: {
          value: boolean_value
        }
      }
    }
  },

  /*
    func_call = variable func_call_args_chunk
  */
  parseFuncCall(inst) {
    const fname = syntax.parseVariable(inst)
    if(!fname)
      return false

    const fcargsc = syntax.parseFuncCallArgsChunk(fname.remain)
    if(!fcargsc)
      return false

    return {
      remain: fcargsc.remain,
      original: inst,
      parsed: {
        type: 'func_call',
        args: {
          name: fname.parsed,
          args: fcargsc.parsed
        }
      }
    }
  },

  /*
    func_call_args_chunk = "(" [ func_call_args_list ] ? ")"
  */
  parseFuncCallArgsChunk(inst) {
    if(!/^(\s*\(\s*)/.test(inst))
      return false

    const args = syntax.parseFuncCallArgsList(inst.substr(RegExp.$1.length))
    if(!args)
      return false

    if(!/^(\s*\)\s*)/.test(args.remain))
      return false

    return {
      remain: args.remain.substr(RegExp.$1.length),
      original: inst,
      parsed: {
        type: 'func_call_args_chunk',
        args: args.parsed
      }
    }
  },

  /*
    func_call_args_list = exp [ "," exp ] *
  */
  parseFuncCallArgsList(inst) {
    const exps = []
    let code_inst = inst
    let max_args = 20

    let exp = syntax.parseExpression(code_inst)
    if(exp) {
      exps.push(exp.parsed)

      while(max_args--) {
        code_inst = exp.remain
        if(!/^(\s*,\s*)/.test(code_inst))
          break

        exp = syntax.parseExpression(code_inst.substr(RegExp.$1.length))
        if(!exp)
          return false

        code_inst = exp.remain
        exps.push(exp.parsed)
      }
    }

    return {
      remain: code_inst,
      original: inst,
      parsed: {
        type: 'func_call_args',
        args: {
          exps: exps
        }
      }
    }
  },

  /*
    func_def = "f " variable func_def_args_chunk "{" func_def_chunk "}"
  */
  parseFuncDef(inst) {
    if(!/^(\bf\s+)/.test(inst))
      return false

    const fname = syntax.parseVariable(inst.substr(RegExp.$1.length))

    if(!fname)
      return false

    const fargs = syntax.parseFuncDefArgsChunk(fname.remain)

    if(!fargs)
      return false

    if(!/^(\s*\{\s*)/.test(fargs.remain))
      return false

    const body = syntax.parseFuncDefChunk(fargs.remain.substr(RegExp.$1.length))
    if(!body)
      return false

    if(!/^(\s*\}\s*)/.test(body.remain))
      return false

    return {
      remain: body.remain.substr(RegExp.$1.length),
      original: inst,
      parsed: {
        type: 'func_def',
        args: {
          name: fname.parsed,
          args: fargs.parsed,
          body: body.parsed
        }
      }
    }
  },

  /*
    func_def_args_chunk = "(" [ func_def_args_list ] ? ")"
  */
  parseFuncDefArgsChunk(inst) {
    if(!/^(\s*\(\s*)/.test(inst))
      return false

    const varcs = syntax.parseFuncDefArgsList(inst.substr(RegExp.$1.length))

    if(!/^(\s*\)\s*)/.test(varcs.remain))
      return false

    return {
      remain: varcs.remain.substr(RegExp.$1.length),
      original: inst,
      parsed: {
        type: 'func_def_args_chunk',
        args: varcs.parsed
      }
    }
  },

  /*
    func_def_chunk = chunk func_def_return
  */
  parseFuncDefChunk(inst) {
    const scope_name = 'func_def'
    const chunks = syntax.parseChunks(inst, scope_name)
    if(!chunks)
      return false

    const clean_chunks_remain = removeEmptyLines(chunks.remain)
    const ret = syntax.parseFuncDefChunkReturn(clean_chunks_remain, scope_name)
    if(ret) {
      chunks.remain = ret.remain
      chunks.parsed.args.value.push(ret)
    } else
      chunks.remain = clean_chunks_remain

    if(chunks.parsed.args.value.length < 1)
      return false

    const last_chunk = chunks.parsed.args.value[chunks.parsed.args.value.length - 1]
    if(last_chunk.parsed.type === 'func_return')
      return chunks

    if(last_chunk.parsed.type === 'decl_if') {
      if(!last_chunk.parsed.args.else_block.args.else_end)
        return false
      const last_if_chunk = last_chunk.parsed.args.if_chunk.args.args.value[last_chunk.parsed.args.if_chunk.args.args.value.length - 1]

      const else_end_last_chunk = [
        last_chunk.parsed.args.else_block.args.else_end.args.args.args.value[last_chunk.parsed.args.else_block.args.else_end.args.args.args.value.length - 1]
      ]

      const elses_middle_last_chunks = last_chunk.parsed.args.else_block.args.else_middles.map(function(else_middle) {
        return else_middle.args.block.args.args.value[else_middle.args.block.args.args.value.length - 1]
      })

      const last_if_else_chunks = [last_if_chunk].concat(else_end_last_chunk, elses_middle_last_chunks)

      if(
        last_if_else_chunks.every(function(last_chunk) {
          return last_chunk.parsed.type === 'func_return'
        })
      )
        return chunks
    }

    return false
  },

  /*
    func_def_return = "return" exp
  */
  parseFuncDefChunkReturn(inst, scope_name) {
    if(scope_name === 'global')
      return false

    if(!/^(return\s+)/.test(inst))
      return false

    const exp = syntax.parseExpression(inst.substr(RegExp.$1.length))
    if(!exp)
      return false

    return {
      remain: exp.remain,
      original: inst,
      parsed: {
        type: 'func_return',
        args: exp.parsed
      }
    }
  },

  /*
    func_def_args_list = variable [ "," variable ] *
  */
  parseFuncDefArgsList(inst) {
    const args = []
    let arg = null
    let code_inst = inst

    do {
      arg = syntax.parseVariable(code_inst)
      if(!arg)
        break

      code_inst = arg.remain
      args.push(arg.parsed)

      if(!/(^\s*,\s*)/.test(arg.remain))
        break

      code_inst = arg.remain.substr(RegExp.$1.length)
    } while(arg)

    return {
      remain: code_inst,
      original: inst,
      parsed: {
        type: 'func_def_args_list',
        args: {
          args: args
        }
      }
    }
  }
}

module.exports = syntax
