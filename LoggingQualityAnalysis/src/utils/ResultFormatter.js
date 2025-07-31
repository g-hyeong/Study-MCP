export class ResultFormatter {
  constructor() {
    this.severityOrder = ['critical', 'high', 'medium', 'low'];
    this.severityEmojis = {
      critical: '🚨',
      high: '⚠️',
      medium: '💡',
      low: '📝',
    };
  }

  formatResults(results, analysisType, targetPath) {
    if (analysisType === 'directory') {
      return this.formatDirectoryResults(results);
    } else {
      return this.formatFileResults(results);
    }
  }

  formatFileResults(results) {
    const { filePath, fileName, summary, issues, suggestions, metadata } = results;
    
    let output = '';
    
    // 헤더
    output += `# 📊 로깅 품질 분석 결과\n\n`;
    output += `**파일:** \`${fileName}\`\n`;
    output += `**경로:** \`${filePath}\`\n\n`;

    // 메타데이터
    output += `## 📈 파일 정보\n`;
    output += `- 총 라인 수: ${metadata.totalLines}\n`;
    output += `- 로거 import: ${metadata.loggerImports.length}개\n`;
    output += `- 총 로그 호출: ${metadata.totalLogCalls}개\n\n`;

    if (metadata.loggerImports.length > 0) {
      output += `### Logger Import 정보\n`;
      for (const imp of metadata.loggerImports) {
        output += `- \`${imp.localName}\` from \`${imp.source}\` (라인 ${imp.line})\n`;
      }
      output += '\n';
    }

    // 요약
    output += `## 📋 분석 요약\n`;
    output += `- 총 이슈: **${summary.totalIssues}개**\n`;
    if (summary.criticalIssues > 0) output += `- ${this.severityEmojis.critical} Critical: **${summary.criticalIssues}개**\n`;
    if (summary.highIssues > 0) output += `- ${this.severityEmojis.high} High: **${summary.highIssues}개**\n`;
    if (summary.mediumIssues > 0) output += `- ${this.severityEmojis.medium} Medium: **${summary.mediumIssues}개**\n`;
    if (summary.lowIssues > 0) output += `- ${this.severityEmojis.low} Low: **${summary.lowIssues}개**\n`;
    output += '\n';

    if (summary.totalIssues === 0) {
      output += `✅ **축하합니다!** 발견된 로깅 품질 이슈가 없습니다.\n\n`;
      return output;
    }

    // 이슈 상세
    output += `## 🔍 발견된 이슈들\n\n`;
    
    const groupedIssues = this.groupIssuesBySeverity(issues);
    
    for (const severity of this.severityOrder) {
      if (groupedIssues[severity] && groupedIssues[severity].length > 0) {
        output += `### ${this.severityEmojis[severity]} ${severity.toUpperCase()} 우선순위 이슈들\n\n`;
        
        for (const issue of groupedIssues[severity]) {
          output += this.formatIssue(issue);
          output += '\n';
        }
      }
    }

    // 개선 제안
    if (suggestions && suggestions.length > 0) {
      output += `## 💡 개선 제안\n\n`;
      for (const suggestion of suggestions) {
        output += this.formatSuggestion(suggestion);
        output += '\n';
      }
    }

    return output;
  }

  formatDirectoryResults(results) {
    const { directoryPath, totalFiles, analyzedFiles, summary, fileResults, consistency } = results;
    
    let output = '';

    // 헤더
    output += `# 📁 디렉토리 로깅 품질 분석 결과\n\n`;
    output += `**디렉토리:** \`${directoryPath}\`\n`;
    output += `**분석 파일:** ${analyzedFiles}/${totalFiles}개\n\n`;

    // 전체 요약
    output += `## 📊 전체 요약\n`;
    output += `- 총 이슈: **${summary.totalIssues}개**\n`;
    if (summary.criticalIssues > 0) output += `- ${this.severityEmojis.critical} Critical: **${summary.criticalIssues}개**\n`;
    if (summary.highIssues > 0) output += `- ${this.severityEmojis.high} High: **${summary.highIssues}개**\n`;
    if (summary.mediumIssues > 0) output += `- ${this.severityEmojis.medium} Medium: **${summary.mediumIssues}개**\n`;
    if (summary.lowIssues > 0) output += `- ${this.severityEmojis.low} Low: **${summary.lowIssues}개**\n`;
    output += '\n';

    // 일관성 분석
    if (consistency.inconsistencies.length > 0) {
      output += `## 🔄 일관성 분석\n\n`;
      for (const inconsistency of consistency.inconsistencies) {
        output += `### ${inconsistency.context} 컨텍스트 불일치\n`;
        output += `- 사용된 로그 레벨: ${inconsistency.inconsistentLevels.join(', ')}\n`;
        output += `- 권장사항: ${inconsistency.recommendation}\n\n`;
      }
    }

    // 파일별 결과 요약
    output += `## 📄 파일별 분석 결과\n\n`;
    
    const sortedFiles = fileResults.sort((a, b) => {
      const scoreA = a.summary.criticalIssues * 4 + a.summary.highIssues * 3 + a.summary.mediumIssues * 2 + a.summary.lowIssues;
      const scoreB = b.summary.criticalIssues * 4 + b.summary.highIssues * 3 + b.summary.mediumIssues * 2 + b.summary.lowIssues;
      return scoreB - scoreA;
    });

    for (const fileResult of sortedFiles) {
      const issueScore = fileResult.summary.criticalIssues * 4 + fileResult.summary.highIssues * 3 + 
                        fileResult.summary.mediumIssues * 2 + fileResult.summary.lowIssues;
      
      let status = '✅';
      if (issueScore > 10) status = '🚨';
      else if (issueScore > 5) status = '⚠️';
      else if (issueScore > 0) status = '💡';

      output += `### ${status} \`${fileResult.fileName}\`\n`;
      output += `- 총 이슈: ${fileResult.summary.totalIssues}개`;
      if (fileResult.summary.criticalIssues > 0) output += ` (Critical: ${fileResult.summary.criticalIssues})`;
      if (fileResult.summary.highIssues > 0) output += ` (High: ${fileResult.summary.highIssues})`;
      output += `\n`;
      output += `- 로그 호출: ${fileResult.metadata.totalLogCalls}개\n\n`;
    }

    return output;
  }

  formatPatternResults(results, patterns, filePath) {
    let output = '';
    
    output += `# 🔍 로깅 패턴 분석 결과\n\n`;
    output += `**파일:** \`${filePath}\`\n`;
    output += `**검사 패턴:** ${patterns.join(', ')}\n\n`;

    for (const [pattern, issues] of Object.entries(results)) {
      if (issues.length === 0) continue;

      output += `## ${this.getPatternTitle(pattern)}\n\n`;
      
      for (const issue of issues) {
        output += this.formatPatternIssue(issue, pattern);
        output += '\n';
      }
    }

    return output;
  }

  getPatternTitle(pattern) {
    const titles = {
      'string-concat': '🔗 문자열 결합 패턴',
      'template-literal': '📝 템플릿 리터럴 사용',
      'log-level': '📊 로그 레벨 분석',
      'security': '🔒 보안 위험 분석',
    };
    return titles[pattern] || pattern;
  }

  formatPatternIssue(issue, pattern) {
    let output = '';
    
    if (pattern === 'string-concat') {
      output += `**라인 ${issue.line}:** ${issue.suggestion}\n`;
      if (issue.improved_example) {
        output += `\`\`\`javascript\n// 개선 예시\n${issue.improved_example}\n\`\`\`\n`;
      }
    } else if (pattern === 'security') {
      output += `**라인 ${issue.line}:** ${this.severityEmojis[issue.severity]} ${issue.suggestion}\n`;
      if (issue.sensitiveFields) {
        output += `민감한 필드: ${issue.sensitiveFields.map(f => f.pattern).join(', ')}\n`;
      }
    } else {
      output += `**라인 ${issue.line}:** ${issue.message || issue.suggestion}\n`;
    }
    
    return output;
  }

  groupIssuesBySeverity(issues) {
    const grouped = {};
    
    for (const issue of issues) {
      const severity = issue.severity || 'low';
      if (!grouped[severity]) {
        grouped[severity] = [];
      }
      grouped[severity].push(issue);
    }

    // 각 그룹 내에서 라인 번호로 정렬
    for (const severity of Object.keys(grouped)) {
      grouped[severity].sort((a, b) => (a.line || 0) - (b.line || 0));
    }

    return grouped;
  }

  formatIssue(issue) {
    let output = `#### 라인 ${issue.line}: ${issue.message}\n\n`;
    
    // 이슈 타입별 상세 정보
    if (issue.type === 'log_level_issue') {
      output += `- **현재 레벨:** \`${issue.current_level}\`\n`;
      if (issue.suggested_level) {
        output += `- **권장 레벨:** \`${issue.suggested_level}\`\n`;
      }
      if (issue.reason) {
        output += `- **이유:** ${issue.reason}\n`;
      }
      if (issue.context) {
        output += `- **컨텍스트:** ${issue.context}\n`;
      }
    } else if (issue.type === 'message_quality_issue') {
      if (issue.current_message) {
        output += `- **현재 메시지:** "${issue.current_message}"\n`;
      }
      if (issue.improved_example) {
        output += `- **개선 예시:** \`${issue.improved_example}\`\n`;
      }
    } else if (issue.type === 'string_pattern_issue') {
      output += `- **현재 패턴:** ${issue.current_pattern}\n`;
      if (issue.improved_example) {
        output += `- **개선 예시:**\n\`\`\`javascript\n${issue.improved_example}\n\`\`\`\n`;
      }
    } else if (issue.type === 'performance_issue') {
      if (issue.description) {
        output += `- **설명:** ${issue.description}\n`;
      }
      if (issue.impact) {
        output += `- **성능 영향:** ${issue.impact}\n`;
      }
      if (issue.solution) {
        output += `- **해결 방안:** ${issue.solution}\n`;
      }
    } else if (issue.type === 'sensitive-data-logging') {
      output += `- **보안 위험:** ${issue.risk}\n`;
      if (issue.sensitiveFields) {
        output += `- **감지된 민감 정보:** ${issue.sensitiveFields.map(f => f.pattern).join(', ')}\n`;
      }
    }

    if (issue.suggestion && !issue.improved_example) {
      output += `- **권장사항:** ${issue.suggestion}\n`;
    }

    return output;
  }

  formatSuggestion(suggestion) {
    let output = `### ${suggestion.category} 개선\n\n`;
    
    output += `- **우선순위:** ${suggestion.priority}\n`;
    output += `- **영향받는 이슈:** ${suggestion.affected_issues}개\n`;
    if (suggestion.estimated_effort) {
      output += `- **예상 작업 시간:** ${suggestion.estimated_effort}\n`;
    }
    output += `- **제안사항:** ${suggestion.suggestion}\n`;
    
    if (suggestion.benefits && suggestion.benefits.length > 0) {
      output += `- **기대 효과:**\n`;
      for (const benefit of suggestion.benefits) {
        output += `  - ${benefit}\n`;
      }
    }

    return output;
  }

  // 간단한 통계 정보를 JSON 형태로 반환
  getAnalyticsSummary(results) {
    if (Array.isArray(results)) {
      // Directory results
      const totalIssues = results.reduce((sum, file) => sum + file.summary.totalIssues, 0);
      const totalFiles = results.length;
      const avgIssuesPerFile = totalFiles > 0 ? (totalIssues / totalFiles).toFixed(2) : 0;

      return {
        type: 'directory',
        totalFiles,
        totalIssues,
        avgIssuesPerFile: parseFloat(avgIssuesPerFile),
        severityBreakdown: {
          critical: results.reduce((sum, file) => sum + file.summary.criticalIssues, 0),
          high: results.reduce((sum, file) => sum + file.summary.highIssues, 0),
          medium: results.reduce((sum, file) => sum + file.summary.mediumIssues, 0),
          low: results.reduce((sum, file) => sum + file.summary.lowIssues, 0),
        },
      };
    } else {
      // Single file results
      return {
        type: 'file',
        fileName: results.fileName,
        totalIssues: results.summary.totalIssues,
        totalLogCalls: results.metadata.totalLogCalls,
        loggerImports: results.metadata.loggerImports.length,
        severityBreakdown: {
          critical: results.summary.criticalIssues,
          high: results.summary.highIssues,
          medium: results.summary.mediumIssues,
          low: results.summary.lowIssues,
        },
      };
    }
  }
}