import { JavaScriptParser } from '../parsers/JavaScriptParser.js';
import { glob } from 'glob';
import * as t from '@babel/types';

export class LoggingAnalyzer {
  constructor() {
    this.parser = new JavaScriptParser();
    this.logLevels = {
      trace: { severity: 0, production: false },
      debug: { severity: 1, production: false },
      info: { severity: 2, production: true },
      warn: { severity: 3, production: true },
      error: { severity: 4, production: true },
      fatal: { severity: 5, production: true },
    };
  }

  async analyzeFile(parsedFile, filePath, options = {}) {
    const { ast, code, fileName } = parsedFile;
    const results = {
      filePath,
      fileName,
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
      },
      issues: [],
      suggestions: [],
      metadata: {
        totalLines: code.split('\n').length,
        loggerImports: [],
        totalLogCalls: 0,
      },
    };

    try {
      results.metadata.loggerImports = this.parser.findLoggerImports(ast);
      const loggerNames = results.metadata.loggerImports.map(imp => imp.localName);
      const logCalls = this.parser.findLoggerCalls(ast, loggerNames);
      results.metadata.totalLogCalls = logCalls.length;

      if (options.checkLogLevel !== false) {
        const logLevelIssues = this.analyzeLogLevels(logCalls, code);
        results.issues.push(...logLevelIssues);
      }

      if (options.checkMessageQuality !== false) {
        const messageQualityIssues = this.analyzeMessageQuality(logCalls, code);
        results.issues.push(...messageQualityIssues);
      }

      if (options.checkSecurity !== false) {
        const securityIssues = this.parser.findSensitiveDataPatterns(ast);
        results.issues.push(...securityIssues);
      }

      if (options.checkStringPattern !== false) {
        const stringPatternIssues = this.analyzeStringPatterns(logCalls);
        results.issues.push(...stringPatternIssues);
      }

      const performanceIssues = this.analyzePerformanceImpact(logCalls, ast);
      results.issues.push(...performanceIssues);

      this.updateSummary(results);
      results.suggestions = this.generateSuggestions(results.issues);

    } catch (error) {
      results.issues.push({
        type: 'analysis_error',
        severity: 'high',
        message: `분석 중 오류 발생: ${error.message}`,
        line: 0,
      });
    }

    return results;
  }

  async analyzeDirectory(directoryPath, pattern = '**/*.js', options = {}) {
    try {
      const files = await glob(pattern, { cwd: directoryPath });
      const results = {
        directoryPath,
        pattern,
        totalFiles: files.length,
        analyzedFiles: 0,
        summary: {
          totalIssues: 0,
          criticalIssues: 0,
          highIssues: 0,
          mediumIssues: 0,
          lowIssues: 0,
        },
        fileResults: [],
        consistency: {
          logLevelPatterns: {},
          messagePatterns: {},
          inconsistencies: [],
        },
      };

      for (const file of files) {
        try {
          const filePath = `${directoryPath}/${file}`;
          const parsedFile = await this.parser.parseFile(filePath);
          const fileResult = await this.analyzeFile(parsedFile, filePath, options);
          
          results.fileResults.push(fileResult);
          results.analyzedFiles++;
          
          this.aggregateSummary(results.summary, fileResult.summary);
          this.trackPatterns(results.consistency, fileResult);
          
        } catch (error) {
          console.error(`파일 분석 실패: ${file}`, error.message);
        }
      }

      results.consistency.inconsistencies = this.detectInconsistencies(results.consistency);
      
      return results;
    } catch (error) {
      throw new Error(`디렉토리 분석 실패: ${error.message}`);
    }
  }

  analyzeLogLevels(logCalls, code) {
    const issues = [];
    const codeLines = code.split('\n');

    for (const call of logCalls) {
      const { logLevel, line, arguments: args } = call;
      
      if (!this.logLevels[logLevel]) {
        issues.push({
          type: 'log_level_issue',
          severity: 'medium',
          message: `알 수 없는 로그 레벨: ${logLevel}`,
          line,
          current_level: logLevel,
          suggestion: '유효한 로그 레벨을 사용하세요 (trace, debug, info, warn, error, fatal)',
        });
        continue;
      }

      const context = this.getCallContext(call, codeLines, line);
      const levelSuitability = this.assessLogLevelSuitability(logLevel, context, args);
      
      if (levelSuitability.issue) {
        issues.push({
          type: 'log_level_issue',
          severity: levelSuitability.severity,
          message: levelSuitability.message,
          line,
          current_level: logLevel,
          suggested_level: levelSuitability.suggestedLevel,
          reason: levelSuitability.reason,
          context: context.type,
        });
      }
    }

    return issues;
  }

  getCallContext(call, codeLines, line) {
    const currentLine = codeLines[line - 1] || '';
    const previousLines = codeLines.slice(Math.max(0, line - 5), line - 1);
    const nextLines = codeLines.slice(line, Math.min(codeLines.length, line + 3));

    const context = {
      currentLine,
      previousLines,
      nextLines,
      type: 'unknown',
    };

    if (previousLines.some(l => l.includes('try {')) && nextLines.some(l => l.includes('catch'))) {
      context.type = 'try-catch-block';
    } else if (currentLine.includes('Error') || currentLine.includes('Exception')) {
      context.type = 'error-handling';
    } else if (previousLines.some(l => l.includes('function') || l.includes('=>'))) {
      context.type = 'function-entry';
    } else if (currentLine.includes('완료') || currentLine.includes('성공') || currentLine.includes('처리')) {
      context.type = 'business-logic-completion';
    } else if (previousLines.some(l => l.includes('for') || l.includes('while') || l.includes('forEach'))) {
      context.type = 'loop';
    }

    return context;
  }

  assessLogLevelSuitability(logLevel, context, args) {
    const firstArg = args[0];
    let message = '';
    
    if (t.isStringLiteral(firstArg)) {
      message = firstArg.value.toLowerCase();
    } else if (t.isTemplateLiteral(firstArg)) {
      message = firstArg.quasis.map(q => q.value.raw).join('').toLowerCase();
    }

    if (logLevel === 'debug') {
      if (context.type === 'business-logic-completion') {
        return {
          issue: true,
          severity: 'medium',
          message: '비즈니스 로직 완료 시점에는 INFO 레벨이 적절합니다',
          suggestedLevel: 'info',
          reason: '프로덕션에서 추적 가능하도록 INFO 레벨 사용 권장',
        };
      }
      if (context.type === 'loop' && message.includes('처리')) {
        return {
          issue: true,
          severity: 'high',
          message: '반복문 내 처리 로그는 성능에 영향을 줄 수 있습니다',
          suggestedLevel: 'trace',
          reason: '대량 처리시 로그 오버헤드 방지',
        };
      }
    }

    if (logLevel === 'info') {
      if (message.includes('debug') || message.includes('test') || message.includes('here')) {
        return {
          issue: true,
          severity: 'medium',
          message: '의미 없는 디버그 메시지를 INFO 레벨로 로깅',
          suggestedLevel: 'debug',
          reason: '실제 정보가 아닌 디버그 메시지',
        };
      }
    }

    if (logLevel === 'error') {
      if (context.type !== 'error-handling' && context.type !== 'try-catch-block') {
        if (!message.includes('실패') && !message.includes('오류') && !message.includes('에러')) {
          return {
            issue: true,
            severity: 'high',
            message: '실제 오류가 아닌 상황에서 ERROR 레벨 사용',
            suggestedLevel: 'warn',
            reason: 'ERROR는 실제 장애 상황에서만 사용해야 합니다',
          };
        }
      }
    }

    if (logLevel === 'warn') {
      if (context.type === 'error-handling' && message.includes('실패')) {
        return {
          issue: true,
          severity: 'medium',
          message: '실패 상황에서 WARN 대신 ERROR 레벨 사용 고려',
          suggestedLevel: 'error',
          reason: '서비스에 영향을 주는 실패는 ERROR 레벨',
        };
      }
    }

    return { issue: false };
  }

  analyzeMessageQuality(logCalls, code) {
    const issues = [];

    for (const call of logCalls) {
      const { arguments: args, line, logLevel } = call;
      const firstArg = args[0];

      if (!firstArg) {
        issues.push({
          type: 'message_quality_issue',
          severity: 'high',
          message: '로그 메시지가 없습니다',
          line,
          issue: 'missing_message',
          suggestion: '의미 있는 로그 메시지를 추가하세요',
        });
        continue;
      }

      let messageText = '';
      if (t.isStringLiteral(firstArg)) {
        messageText = firstArg.value;
      } else if (t.isTemplateLiteral(firstArg)) {
        messageText = firstArg.quasis.map(q => q.value.raw).join('');
      }

      const qualityIssue = this.assessMessageQuality(messageText, logLevel, args.length);
      if (qualityIssue) {
        issues.push({
          type: 'message_quality_issue',
          severity: qualityIssue.severity,
          message: qualityIssue.message,
          line,
          current_message: messageText.substring(0, 50),
          issue: qualityIssue.issue,
          suggestion: qualityIssue.suggestion,
          improved_example: qualityIssue.example,
        });
      }
    }

    return issues;
  }

  assessMessageQuality(messageText, logLevel, argCount) {
    const msg = messageText.toLowerCase().trim();

    if (msg.length === 0) {
      return {
        severity: 'high',
        message: '비어있는 로그 메시지',
        issue: 'empty_message',
        suggestion: '의미 있는 메시지를 작성하세요',
      };
    }

    if (['debug', 'test', 'here', 'log', '111', '222', 'aaa', 'bbb'].includes(msg)) {
      return {
        severity: 'high',
        message: '의미 없는 로그 메시지',
        issue: 'meaningless_message',
        suggestion: '구체적이고 유용한 정보를 포함한 메시지로 변경',
        example: '사용자 등록 처리 시작: userId={}',
      };
    }

    if (msg.length < 5) {
      return {
        severity: 'medium',
        message: '너무 짧은 로그 메시지',
        issue: 'too_short',
        suggestion: '더 자세한 컨텍스트 정보를 포함하세요',
      };
    }

    if (logLevel === 'error' && !msg.includes('실패') && !msg.includes('오류') && !msg.includes('에러') && !msg.includes('fail') && !msg.includes('error')) {
      return {
        severity: 'medium',
        message: 'ERROR 레벨 로그에 오류 상황을 명시하지 않음',
        issue: 'unclear_error_context',
        suggestion: '오류 유형과 원인을 명확히 기술하세요',
        example: '사용자 인증 실패: 잘못된 비밀번호',
      };
    }

    if (argCount === 1 && (msg.includes('{}') || msg.includes('%s') || msg.includes('%d'))) {
      return {
        severity: 'medium',
        message: '플레이스홀더가 있지만 매개변수가 없음',
        issue: 'missing_parameters',
        suggestion: '플레이스홀더에 해당하는 매개변수를 추가하세요',
      };
    }

    return null;
  }

  analyzeStringPatterns(logCalls) {
    const issues = [];

    for (const call of logCalls) {
      const stringPattern = this.parser.analyzeStringPatterns(call);
      
      if (stringPattern && stringPattern.issue) {
        issues.push({
          type: 'string_pattern_issue',
          severity: stringPattern.issue === 'string-concat-with-variables' ? 'medium' : 'low',
          message: '문자열 결합 패턴 개선 필요',
          line: stringPattern.line,
          current_pattern: stringPattern.type,
          issue: stringPattern.issue,
          suggestion: stringPattern.suggestion,
          improved_example: stringPattern.example,
          parts: stringPattern.parts,
        });
      }
    }

    return issues;
  }

  analyzePerformanceImpact(logCalls, ast) {
    const issues = [];
    const loopLogCounts = {};

    for (const call of logCalls) {
      const { line, logLevel, path } = call;
      
      let currentPath = path.parent;
      let loopDepth = 0;
      let isInLoop = false;

      while (currentPath) {
        if (t.isForStatement(currentPath) || t.isWhileStatement(currentPath) || 
            t.isDoWhileStatement(currentPath) || t.isForInStatement(currentPath) || 
            t.isForOfStatement(currentPath)) {
          loopDepth++;
          isInLoop = true;
        }
        currentPath = currentPath.parent;
      }

      if (isInLoop) {
        const loopKey = `${line}-${loopDepth}`;
        loopLogCounts[loopKey] = (loopLogCounts[loopKey] || 0) + 1;

        if (logLevel === 'info' || logLevel === 'warn' || logLevel === 'error') {
          issues.push({
            type: 'performance_issue',
            severity: loopDepth > 1 ? 'high' : 'medium',
            message: `반복문 내 ${logLevel.toUpperCase()} 레벨 로깅`,
            line,
            issue: 'loop_logging_overhead',
            description: `${loopDepth}중 반복문 내에서 로깅이 발생합니다`,
            impact: loopDepth > 1 ? '높은 성능 저하 예상' : '성능 저하 가능성',
            solution: '배치 단위 로깅이나 DEBUG 레벨로 변경 고려',
          });
        }
      }

      if (this.hasExpensiveStringOperation(call)) {
        issues.push({
          type: 'performance_issue',
          severity: 'medium',
          message: '비용이 큰 문자열 연산 감지',
          line,
          issue: 'expensive_string_operation',
          description: '복잡한 객체 직렬화나 문자열 연산이 포함됨',
          solution: '로그 레벨 체크나 지연 평가 사용 고려',
        });
      }
    }

    return issues;
  }

  hasExpensiveStringOperation(call) {
    const args = call.arguments;
    
    for (const arg of args) {
      if (t.isCallExpression(arg)) {
        if (t.isMemberExpression(arg.callee) && 
            t.isIdentifier(arg.callee.property) && 
            arg.callee.property.name === 'toString') {
          return true;
        }
        
        if (t.isIdentifier(arg.callee) && 
            (arg.callee.name === 'JSON' || arg.callee.name.includes('stringify'))) {
          return true;
        }
      }
    }
    
    return false;
  }

  async checkSpecificPatterns(parsedFile, filePath, patterns) {
    const { ast } = parsedFile;
    const results = {};

    if (patterns.includes('string-concat')) {
      const logCalls = this.parser.findLoggerCalls(ast);
      results['string-concat'] = this.analyzeStringPatterns(logCalls);
    }

    if (patterns.includes('template-literal')) {
      results['template-literal'] = this.checkTemplateLiteralUsage(ast);
    }

    if (patterns.includes('log-level')) {
      const logCalls = this.parser.findLoggerCalls(ast);
      results['log-level'] = this.analyzeLogLevels(logCalls, parsedFile.code);
    }

    if (patterns.includes('security')) {
      results['security'] = this.parser.findSensitiveDataPatterns(ast);
    }

    return results;
  }

  checkTemplateLiteralUsage(ast) {
    const results = [];
    const logCalls = this.parser.findLoggerCalls(ast);

    for (const call of logCalls) {
      const pattern = this.parser.analyzeStringPatterns(call);
      if (pattern && pattern.type === 'template-literal') {
        results.push({
          type: 'good_practice',
          line: pattern.line,
          message: '템플릿 리터럴 사용 - 좋은 패턴',
          expressionCount: pattern.expressionCount,
        });
      }
    }

    return results;
  }

  updateSummary(results) {
    results.summary.totalIssues = results.issues.length;
    
    for (const issue of results.issues) {
      switch (issue.severity) {
        case 'critical':
          results.summary.criticalIssues++;
          break;
        case 'high':
          results.summary.highIssues++;
          break;
        case 'medium':
          results.summary.mediumIssues++;
          break;
        default:
          results.summary.lowIssues++;
      }
    }
  }

  aggregateSummary(totalSummary, fileSummary) {
    totalSummary.totalIssues += fileSummary.totalIssues;
    totalSummary.criticalIssues += fileSummary.criticalIssues;
    totalSummary.highIssues += fileSummary.highIssues;
    totalSummary.mediumIssues += fileSummary.mediumIssues;
    totalSummary.lowIssues += fileSummary.lowIssues;
  }

  trackPatterns(consistency, fileResult) {
    for (const issue of fileResult.issues) {
      if (issue.type === 'log_level_issue') {
        const pattern = `${issue.context}-${issue.current_level}`;
        consistency.logLevelPatterns[pattern] = (consistency.logLevelPatterns[pattern] || 0) + 1;
      }
    }
  }

  detectInconsistencies(consistency) {
    const inconsistencies = [];
    
    const patterns = Object.keys(consistency.logLevelPatterns);
    const contextGroups = {};
    
    for (const pattern of patterns) {
      const [context, level] = pattern.split('-');
      if (!contextGroups[context]) {
        contextGroups[context] = [];
      }
      contextGroups[context].push(level);
    }

    for (const [context, levels] of Object.entries(contextGroups)) {
      const uniqueLevels = [...new Set(levels)];
      if (uniqueLevels.length > 1) {
        inconsistencies.push({
          type: 'consistency_issue',
          context,
          inconsistentLevels: uniqueLevels,
          recommendation: `${context} 컨텍스트에서 일관된 로그 레벨 사용`,
        });
      }
    }

    return inconsistencies;
  }

  generateSuggestions(issues) {
    const suggestions = [];
    const issueGroups = {};

    for (const issue of issues) {
      const key = `${issue.type}-${issue.severity}`;
      if (!issueGroups[key]) {
        issueGroups[key] = [];
      }
      issueGroups[key].push(issue);
    }

    for (const [key, groupedIssues] of Object.entries(issueGroups)) {
      const [type, severity] = key.split('-');
      const count = groupedIssues.length;

      if (type === 'string_pattern_issue' && count >= 3) {
        suggestions.push({
          type: 'improvement_suggestion',
          priority: severity,
          category: 'string_patterns',
          affected_issues: count,
          estimated_effort: '1-2 hours',
          suggestion: '문자열 결합을 템플릿 리터럴로 일괄 변경',
          benefits: ['가독성 향상', '성능 최적화', '변수 출력 보장'],
        });
      }

      if (type === 'log_level_issue' && count >= 5) {
        suggestions.push({
          type: 'improvement_suggestion',
          priority: severity,
          category: 'log_levels',
          affected_issues: count,
          estimated_effort: '2-3 hours',
          suggestion: '로그 레벨 일관성 개선',
          benefits: ['프로덕션 모니터링 향상', '디버깅 효율성 증대'],
        });
      }
    }

    return suggestions;
  }
}