#!/usr/bin/env node

import { LoggingAnalyzer } from './src/analyzers/LoggingAnalyzer.js';
import { JavaScriptParser } from './src/parsers/JavaScriptParser.js';
import { ResultFormatter } from './src/utils/ResultFormatter.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testAnalyzer() {
  console.log('🚀 LoggingQualityAnalysis 테스트 시작\n');

  const analyzer = new LoggingAnalyzer();
  const parser = new JavaScriptParser();
  const formatter = new ResultFormatter();

  // 테스트 파일들
  const testFiles = [
    resolve(__dirname, 'examples/sample-java-files/good-patterns.js'),
    resolve(__dirname, 'examples/sample-java-files/problematic-patterns.js'),
  ];

  for (const filePath of testFiles) {
    console.log(`\n📂 파일 분석: ${filePath.split('/').pop()}`);
    console.log('='.repeat(50));

    try {
      // 파일 파싱
      const parsedFile = await parser.parseFile(filePath);
      console.log(`✅ 파싱 성공: ${parsedFile.code.split('\n').length} 라인`);

      // Logger import 확인
      const imports = parser.findLoggerImports(parsedFile.ast);
      console.log(`📦 Logger imports: ${imports.length}개`);
      imports.forEach(imp => {
        console.log(`   - ${imp.localName} from ${imp.source} (라인 ${imp.line})`);
      });

      // Logger 호출 찾기
      const loggerNames = imports.map(imp => imp.localName);
      const logCalls = parser.findLoggerCalls(parsedFile.ast, loggerNames);
      console.log(`📞 Logger 호출: ${logCalls.length}개`);
      
      // 첫 번째 로그 호출 상세 정보 출력
      if (logCalls.length > 0) {
        console.log('📋 첫 번째 로그 호출 상세:');
        const firstCall = logCalls[0];
        console.log(`   - 레벨: ${firstCall.logLevel}, 라인: ${firstCall.line}`);
        console.log(`   - 인수 개수: ${firstCall.arguments.length}`);
        if (firstCall.arguments[0]) {
          console.log(`   - 첫 번째 인수 타입: ${firstCall.arguments[0].type}`);
        }
        
        // 문자열 패턴 분석 테스트
        const stringPattern = parser.analyzeStringPatterns(firstCall);
        console.log(`   - 문자열 패턴:`, stringPattern);
      }

      // 전체 분석 실행
      const results = await analyzer.analyzeFile(parsedFile, filePath);
      console.log(`🔍 분석 완료: ${results.summary.totalIssues}개 이슈 발견`);

      // 결과 출력
      const formattedResults = formatter.formatResults(results, 'file', filePath);
      console.log('\n' + formattedResults);

    } catch (error) {
      console.error(`❌ 에러 발생: ${error.message}`);
      console.error(error.stack);
    }
  }

  // 디렉토리 분석 테스트
  console.log('\n' + '='.repeat(60));
  console.log('📁 디렉토리 분석 테스트');
  console.log('='.repeat(60));

  try {
    const directoryPath = resolve(__dirname, 'examples/sample-java-files');
    const directoryResults = await analyzer.analyzeDirectory(directoryPath, '*.js');
    
    console.log(`✅ 디렉토리 분석 완료: ${directoryResults.analyzedFiles}개 파일`);
    console.log(`📊 총 이슈: ${directoryResults.summary.totalIssues}개`);

    const formattedDir = formatter.formatResults(directoryResults, 'directory', directoryPath);
    console.log('\n' + formattedDir);

  } catch (error) {
    console.error(`❌ 디렉토리 분석 에러: ${error.message}`);
  }
}

// 패턴별 테스트
async function testSpecificPatterns() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 특정 패턴 테스트');
  console.log('='.repeat(60));

  const analyzer = new LoggingAnalyzer();
  const parser = new JavaScriptParser();
  const formatter = new ResultFormatter();

  const testFile = resolve(__dirname, 'examples/sample-java-files/problematic-patterns.js');
  
  try {
    const parsedFile = await parser.parseFile(testFile);
    const patterns = ['string-concat', 'template-literal', 'log-level', 'security'];
    
    const patternResults = await analyzer.checkSpecificPatterns(parsedFile, testFile, patterns);
    
    console.log('패턴별 분석 결과:');
    for (const [pattern, issues] of Object.entries(patternResults)) {
      console.log(`\n${pattern}: ${Array.isArray(issues) ? issues.length : 0}개 이슈`);
    }

    const formattedPatterns = formatter.formatPatternResults(patternResults, patterns, testFile);
    console.log('\n' + formattedPatterns);

  } catch (error) {
    console.error(`❌ 패턴 테스트 에러: ${error.message}`);
  }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  testAnalyzer()
    .then(() => testSpecificPatterns())
    .then(() => {
      console.log('\n✅ 모든 테스트 완료!');
    })
    .catch(error => {
      console.error('❌ 테스트 실패:', error);
      process.exit(1);
    });
}