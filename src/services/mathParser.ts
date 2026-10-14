/**
 * Safe Mathematical Expression Evaluator
 * Uses tokenization + Shunting-Yard algorithm + RPN evaluation.
 * DOES NOT use eval() or Function().
 */

type TokenType = 'NUMBER' | 'OPERATOR' | 'FUNCTION' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: string;
}

export class MathEvaluator {
  private static precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '%': 2,
    '^': 3,
    'neg': 4,
  };

  private static isRightAssociative(op: string): boolean {
    return op === '^' || op === 'neg';
  }

  public static tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    const cleanExpr = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .trim();

    let i = 0;
    while (i < cleanExpr.length) {
      const char = cleanExpr[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers (integers & decimals)
      if (/[0-9.]/.test(char)) {
        let numStr = '';
        while (i < cleanExpr.length && /[0-9.]/.test(cleanExpr[i])) {
          numStr += cleanExpr[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: numStr });
        continue;
      }

      // Identifiers / Constants / Functions
      if (/[a-zA-Z]/.test(char)) {
        let name = '';
        while (i < cleanExpr.length && /[a-zA-Z]/.test(cleanExpr[i])) {
          name += cleanExpr[i].toLowerCase();
          i++;
        }
        if (name === 'pi') {
          tokens.push({ type: 'NUMBER', value: Math.PI.toString() });
        } else if (name === 'e') {
          tokens.push({ type: 'NUMBER', value: Math.E.toString() });
        } else if (['sin', 'cos', 'tan', 'sqrt', 'abs', 'log', 'ln'].includes(name)) {
          tokens.push({ type: 'FUNCTION', value: name });
        } else {
          throw new Error(`Unknown identifier: ${name}`);
        }
        continue;
      }

      // Operators
      if (['+', '-', '*', '/', '%', '^'].includes(char)) {
        // Detect unary minus
        const prevToken = tokens[tokens.length - 1];
        if (char === '-' && (!prevToken || prevToken.type === 'OPERATOR' || prevToken.type === 'LPAREN')) {
          tokens.push({ type: 'OPERATOR', value: 'neg' });
        } else {
          tokens.push({ type: 'OPERATOR', value: char });
        }
        i++;
        continue;
      }

      if (char === '(') {
        // If previous token was a number, insert implicit multiplication e.g. 2(3) -> 2*(3)
        const prev = tokens[tokens.length - 1];
        if (prev && (prev.type === 'NUMBER' || prev.type === 'RPAREN')) {
          tokens.push({ type: 'OPERATOR', value: '*' });
        }
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      throw new Error(`Unexpected character: "${char}"`);
    }

    return tokens;
  }

  // Shunting-Yard Algorithm to convert Infix tokens to Postfix (RPN)
  public static toRPN(tokens: Token[]): Token[] {
    const output: Token[] = [];
    const operatorStack: Token[] = [];

    for (const token of tokens) {
      if (token.type === 'NUMBER') {
        output.push(token);
      } else if (token.type === 'FUNCTION') {
        operatorStack.push(token);
      } else if (token.type === 'OPERATOR') {
        const o1 = token.value;
        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1];
          if (top.type === 'FUNCTION') {
            output.push(operatorStack.pop()!);
            continue;
          }
          if (top.type === 'OPERATOR') {
            const o2 = top.value;
            const p1 = this.precedence[o1] || 0;
            const p2 = this.precedence[o2] || 0;
            if ((!this.isRightAssociative(o1) && p1 <= p2) || (this.isRightAssociative(o1) && p1 < p2)) {
              output.push(operatorStack.pop()!);
            } else {
              break;
            }
          } else {
            break;
          }
        }
        operatorStack.push(token);
      } else if (token.type === 'LPAREN') {
        operatorStack.push(token);
      } else if (token.type === 'RPAREN') {
        let foundLParen = false;
        while (operatorStack.length > 0) {
          const top = operatorStack.pop()!;
          if (top.type === 'LPAREN') {
            foundLParen = true;
            break;
          }
          output.push(top);
        }
        if (!foundLParen) {
          throw new Error('Mismatched parentheses');
        }
        if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'FUNCTION') {
          output.push(operatorStack.pop()!);
        }
      }
    }

    while (operatorStack.length > 0) {
      const top = operatorStack.pop()!;
      if (top.type === 'LPAREN' || top.type === 'RPAREN') {
        throw new Error('Mismatched parentheses');
      }
      output.push(top);
    }

    return output;
  }

  // Evaluate RPN
  public static evaluateRPN(rpn: Token[]): number {
    const stack: number[] = [];

    for (const token of rpn) {
      if (token.type === 'NUMBER') {
        const val = parseFloat(token.value);
        if (isNaN(val)) throw new Error(`Invalid number: ${token.value}`);
        stack.push(val);
      } else if (token.type === 'OPERATOR') {
        if (token.value === 'neg') {
          if (stack.length < 1) throw new Error('Invalid syntax for unary minus');
          const a = stack.pop()!;
          stack.push(-a);
        } else {
          if (stack.length < 2) throw new Error('Invalid expression');
          const b = stack.pop()!;
          const a = stack.pop()!;

          switch (token.value) {
            case '+':
              stack.push(a + b);
              break;
            case '-':
              stack.push(a - b);
              break;
            case '*':
              stack.push(a * b);
              break;
            case '/':
              if (b === 0) throw new Error('Division by zero');
              stack.push(a / b);
              break;
            case '%':
              stack.push(a % b);
              break;
            case '^':
              stack.push(Math.pow(a, b));
              break;
            default:
              throw new Error(`Unknown operator: ${token.value}`);
          }
        }
      } else if (token.type === 'FUNCTION') {
        if (stack.length < 1) throw new Error(`Function ${token.value} requires an argument`);
        const arg = stack.pop()!;
        switch (token.value) {
          case 'sin':
            stack.push(Math.sin(arg));
            break;
          case 'cos':
            stack.push(Math.cos(arg));
            break;
          case 'tan':
            stack.push(Math.tan(arg));
            break;
          case 'sqrt':
            if (arg < 0) throw new Error('Square root of negative number');
            stack.push(Math.sqrt(arg));
            break;
          case 'abs':
            stack.push(Math.abs(arg));
            break;
          case 'log':
            if (arg <= 0) throw new Error('Invalid argument for log');
            stack.push(Math.log10(arg));
            break;
          case 'ln':
            if (arg <= 0) throw new Error('Invalid argument for ln');
            stack.push(Math.log(arg));
            break;
          default:
            throw new Error(`Unknown function: ${token.value}`);
        }
      }
    }

    if (stack.length !== 1) {
      throw new Error('Malformed expression');
    }

    const result = stack[0];
    if (!isFinite(result)) {
      throw new Error('Result is not finite');
    }
    return result;
  }

  public static calculate(expr: string): number {
    if (!expr || expr.trim() === '') return 0;
    const tokens = this.tokenize(expr);
    const rpn = this.toRPN(tokens);
    return this.evaluateRPN(rpn);
  }

  public static formatResult(num: number): string {
    if (Number.isInteger(num)) return num.toString();
    // Trim float inaccuracy up to 10 decimals
    const rounded = Math.round(num * 1e10) / 1e10;
    return rounded.toString();
  }
}
