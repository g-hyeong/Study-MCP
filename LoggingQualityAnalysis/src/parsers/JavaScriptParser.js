import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export class JavaScriptParser {
  constructor() {
    this.parserOptions = {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'functionBind',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining',
        'optionalCatchBinding',
        'throwExpressions',
        'topLevelAwait',
      ],
    };
  }

  async parseFile(filePath) {
    try {
      const absolutePath = resolve(filePath);
      const code = readFileSync(absolutePath, 'utf-8');
      
      const ast = parse(code, this.parserOptions);
      
      return {
        ast,
        code,
        filePath: absolutePath,
        fileName: absolutePath.split('/').pop(),
      };
    } catch (error) {
      throw new Error(`파일 파싱 실패 (${filePath}): ${error.message}`);
    }
  }

  async parseCode(code, fileName = 'inline') {
    try {
      const ast = parse(code, this.parserOptions);
      
      return {
        ast,
        code,
        filePath: fileName,
        fileName,
      };
    } catch (error) {
      throw new Error(`코드 파싱 실패: ${error.message}`);
    }
  }

  findLoggerImports(ast) {
    const imports = [];
    
    traverse.default(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        if (source === '@bzzmnyd/lib') {
          path.node.specifiers.forEach(spec => {
            if (t.isImportSpecifier(spec) && spec.imported.name === 'logger') {
              imports.push({
                type: 'named',
                localName: spec.local.name,
                importedName: spec.imported.name,
                source,
                line: path.node.loc?.start.line,
              });
            }
          });
        }
      },
    });
    
    return imports;
  }

  findLoggerCalls(ast, loggerNames = ['logger']) {
    const calls = [];
    
    traverse.default(ast, {
      CallExpression(path) {
        const { callee } = path.node;
        
        if (t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            loggerNames.includes(callee.object.name) &&
            t.isIdentifier(callee.property)) {
          
          const logLevel = callee.property.name;
          const args = path.node.arguments;
          
          calls.push({
            logLevel,
            arguments: args,
            line: path.node.loc?.start.line,
            column: path.node.loc?.start.column,
            path: path,
            node: path.node,
          });
        }
      },
    });
    
    return calls;
  }

  analyzeStringPatterns(loggerCall) {
    const arg = loggerCall.arguments[0];
    if (!arg) return null;

    if (t.isBinaryExpression(arg) && arg.operator === '+') {
      return this.analyzeBinaryExpression(arg, loggerCall.line);
    } else if (t.isTemplateLiteral(arg)) {
      return this.analyzeTemplateLiteral(arg, loggerCall.line);
    } else if (t.isStringLiteral(arg)) {
      return {
        type: 'string-literal',
        value: arg.value,
        line: loggerCall.line,
        hasVariables: false,
        suggestion: null,
      };
    }
    
    return null;
  }

  analyzeBinaryExpression(node, line, depth = 0) {
    if (depth > 10) {
      return {
        type: 'complex-concatenation',
        line,
        issue: 'too-complex',
        suggestion: '복잡한 문자열 결합을 템플릿 리터럴로 변경하세요',
      };
    }

    const parts = [];
    this.extractConcatenationParts(node, parts);
    
    const hasVariables = parts.some(part => part.type !== 'string');
    
    if (hasVariables) {
      return {
        type: 'string-concatenation',
        line,
        parts,
        issue: 'string-concat-with-variables',
        suggestion: '문자열 결합(+) 대신 템플릿 리터럴(`${}`)을 사용하세요',
        example: this.generateTemplateLiteralExample(parts),
      };
    }
    
    return {
      type: 'string-concatenation',
      line,
      parts,
      hasVariables: false,
      suggestion: null,
    };
  }

  extractConcatenationParts(node, parts) {
    if (t.isBinaryExpression(node) && node.operator === '+') {
      this.extractConcatenationParts(node.left, parts);
      this.extractConcatenationParts(node.right, parts);
    } else if (t.isStringLiteral(node)) {
      parts.push({ type: 'string', value: node.value });
    } else if (t.isIdentifier(node)) {
      parts.push({ type: 'variable', name: node.name });
    } else if (t.isMemberExpression(node)) {
      parts.push({ type: 'variable', name: this.memberExpressionToString(node) });
    } else {
      parts.push({ type: 'expression', value: 'complex_expression' });
    }
  }

  memberExpressionToString(node) {
    if (t.isIdentifier(node.object) && t.isIdentifier(node.property)) {
      return `${node.object.name}.${node.property.name}`;
    }
    return 'object.property';
  }

  generateTemplateLiteralExample(parts) {
    let template = '`';
    
    for (const part of parts) {
      if (part.type === 'string') {
        template += part.value;
      } else if (part.type === 'variable') {
        template += `\${${part.name}}`;
      } else {
        template += '${expression}';
      }
    }
    
    template += '`';
    return template;
  }

  analyzeTemplateLiteral(node, line) {
    const expressions = node.expressions.length;
    
    return {
      type: 'template-literal',
      line,
      expressionCount: expressions,
      hasVariables: expressions > 0,
      isGoodPractice: true,
    };
  }

  findSensitiveDataPatterns(ast) {
    const sensitivePatterns = [
      /password/i,
      /passwd/i,
      /secret/i,
      /token/i,
      /key/i,
      /credential/i,
      /auth/i,
      /ssn/i,
      /social.*security/i,
      /credit.*card/i,
      /card.*number/i,
      /phone/i,
      /email/i,
      /address/i,
    ];

    const issues = [];
    const self = this;
    
    traverse.default(ast, {
      CallExpression(path) {
        if (self.isLoggerCall(path.node)) {
          const args = path.node.arguments;
          
          args.forEach((arg, index) => {
            const sensitiveData = self.checkForSensitiveData(arg, sensitivePatterns);
            if (sensitiveData.length > 0) {
              issues.push({
                type: 'sensitive-data-logging',
                line: path.node.loc?.start.line,
                argument: index,
                sensitiveFields: sensitiveData,
                severity: 'critical',
                suggestion: '민감한 정보를 로깅에서 제외하거나 마스킹하세요',
              });
            }
          });
        }
      },
    });
    
    return issues;
  }

  isLoggerCall(node) {
    return t.isCallExpression(node) &&
           t.isMemberExpression(node.callee) &&
           t.isIdentifier(node.callee.object) &&
           node.callee.object.name === 'logger';
  }

  checkForSensitiveData(node, patterns) {
    const sensitiveFields = [];
    
    if (t.isStringLiteral(node)) {
      patterns.forEach(pattern => {
        if (pattern.test(node.value)) {
          sensitiveFields.push({
            type: 'string-literal',
            pattern: pattern.source,
            value: node.value,
          });
        }
      });
    } else if (t.isIdentifier(node)) {
      patterns.forEach(pattern => {
        if (pattern.test(node.name)) {
          sensitiveFields.push({
            type: 'variable',
            pattern: pattern.source,
            name: node.name,
          });
        }
      });
    }
    
    return sensitiveFields;
  }
}