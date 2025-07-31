# 📊 LoggingQualityAnalysis MCP Server

**@bzzmnyd/lib** logger를 사용하는 JavaScript 코드의 로깅 품질을 자동으로 분석하는 Model Context Protocol (MCP) 서버입니다.

## 🎯 주요 기능

### 🔍 분석 기능
- **로그 레벨 적정성 검사**: 컨텍스트에 맞는 적절한 로그 레벨 사용 여부 검사
- **문자열 패턴 분석**: 문자열 결합(`+`) vs 템플릿 리터럴(`` `${}` ``) 사용 패턴 분석
- **메시지 품질 평가**: 의미 있는 로그 메시지 작성 여부 검사
- **보안 위험 감지**: 민감한 정보(password, token 등) 로깅 위험 감지
- **성능 영향도 분석**: 반복문 내 로깅 등 성능에 영향을 주는 패턴 감지
- **일관성 체크**: 프로젝트 전반의 로깅 패턴 일관성 검사

### 🛠️ MCP 도구
1. **`analyze-file`**: 단일 JavaScript 파일 분석
2. **`analyze-directory`**: 디렉토리 내 모든 JavaScript 파일 분석
3. **`check-logging-patterns`**: 특정 로깅 패턴 검사

## 📋 지원하는 이슈 유형

### 1. 문자열 결합 패턴 문제
```javascript
// ❌ 문제: 변수가 출력되지 않음
logger.info("사용자 생성: " + userId);

// ✅ 개선: 템플릿 리터럴 사용
logger.info(`사용자 생성: ${userId}`);
```

### 2. 부적절한 로그 레벨
```javascript
// ❌ 문제: 비즈니스 로직 완료를 DEBUG로
logger.debug("주문 처리 완료");

// ✅ 개선: 프로덕션 추적을 위해 INFO 사용
logger.info(`주문 처리 완료: orderId=${orderId}`);
```

### 3. 메시지 품질 문제
```javascript
// ❌ 문제: 의미 없는 메시지
logger.info("here");
logger.debug("test");

// ✅ 개선: 구체적이고 유용한 정보
logger.info(`사용자 인증 완료: userId=${userId}`);
```

### 4. 보안 위험
```javascript
// ❌ 문제: 민감한 정보 로깅
logger.info(`로그인 정보: ${password}`);

// ✅ 개선: 민감한 정보 제외
logger.info(`로그인 성공: userId=${userId}`);
```

### 5. 성능 문제
```javascript
// ❌ 문제: 반복문 내 INFO 로깅
for (const item of items) {
  logger.info(`처리 중: ${item.id}`);
}

// ✅ 개선: 배치 처리나 DEBUG 레벨
logger.info(`아이템 처리 시작: ${items.length}개`);
for (const item of items) {
  logger.debug(`처리 중: ${item.id}`);
}
logger.info(`아이템 처리 완료: ${items.length}개`);
```

## 🚀 설치 및 설정

### 1. 의존성 설치
```bash
cd LoggingQualityAnalysis
npm install
```

### 2. MCP 클라이언트 설정

#### Claude Desktop 설정 예시
`~/.claude_desktop_config.json`에 다음을 추가:

```json
{
  "mcpServers": {
    "logging-quality-analysis": {
      "command": "node",
      "args": [
        "/path/to/LoggingQualityAnalysis/src/index.js"
      ],
      "cwd": "/path/to/LoggingQualityAnalysis"
    }
  }
}
```

#### Cursor IDE MCP 설정 예시
Cursor 설정에서 MCP 서버 추가:

```json
{
  "mcp.servers": {
    "logging-quality-analysis": {
      "command": "node",
      "args": ["/path/to/LoggingQualityAnalysis/src/index.js"]
    }
  }
}
```

## 📖 사용법

### MCP 클라이언트에서 사용

#### 1. 단일 파일 분석
```
사용자: analyze-file 도구를 사용해서 src/services/UserService.js 파일을 분석해줘

결과:
- 총 이슈: 5개
- 문자열 결합 패턴: 3개
- 부적절한 로그 레벨: 2개
```

#### 2. 디렉토리 분석
```
사용자: analyze-directory 도구로 src/ 디렉토리의 모든 JS 파일을 분석해줘

결과:
- 분석 파일: 25개
- 총 이슈: 47개
- 일관성 문제: 3개 패턴
```

#### 3. 특정 패턴 검사
```
사용자: check-logging-patterns 도구로 src/api/OrderController.js의 문자열 결합 패턴만 확인해줘

결과:
- 문자열 결합 이슈: 8개
- 모두 템플릿 리터럴로 변경 권장
```

### 직접 실행 (개발/테스트용)

```bash
# 테스트 실행
node test-runner.js

# MCP 서버 직접 실행
node src/index.js
```

## 🔧 옵션 설정

### analyze-file 옵션
```javascript
{
  "filePath": "path/to/file.js",
  "options": {
    "checkLogLevel": true,      // 로그 레벨 검사
    "checkMessageQuality": true, // 메시지 품질 검사
    "checkSecurity": true,       // 보안 위험 검사
    "checkStringPattern": true   // 문자열 패턴 검사
  }
}
```

### analyze-directory 옵션
```javascript
{
  "directoryPath": "src/",
  "pattern": "**/*.js",        // 파일 패턴
  "options": {
    // analyze-file과 동일한 옵션들
  }
}
```

## 📊 분석 결과 예시

```markdown
# 📊 로깅 품질 분석 결과

**파일:** UserService.js
**경로:** /src/services/UserService.js

## 📈 파일 정보
- 총 라인 수: 156
- 로거 import: 1개
- 총 로그 호출: 12개

## 📋 분석 요약
- 총 이슈: **8개**
- 🚨 Critical: **1개**
- ⚠️ High: **3개**
- 💡 Medium: **4개**

## 🔍 발견된 이슈들

### 🚨 CRITICAL 우선순위 이슈들

#### 라인 45: 민감한 정보 로깅 위험
- **보안 위험:** 인증 정보 노출 위험
- **감지된 민감 정보:** password
- **권장사항:** 패스워드는 마스킹하거나 로깅에서 제외

### ⚠️ HIGH 우선순위 이슈들

#### 라인 23: 의미 없는 로그 메시지
- **현재 메시지:** "here"
- **개선 예시:** 사용자 등록 처리 시작: userId={}

## 💡 개선 제안

### string_patterns 개선
- **우선순위:** medium
- **영향받는 이슈:** 4개
- **예상 작업 시간:** 1-2 hours
- **제안사항:** 문자열 결합을 템플릿 리터럴로 일괄 변경
- **기대 효과:**
  - 가독성 향상
  - 성능 최적화
  - 변수 출력 보장
```

## 🏗️ 프로젝트 구조

```
LoggingQualityAnalysis/
├── src/
│   ├── index.js                 # MCP 서버 엔트리포인트
│   ├── analyzers/
│   │   └── LoggingAnalyzer.js   # 메인 분석 로직
│   ├── parsers/
│   │   └── JavaScriptParser.js  # JavaScript AST 파싱
│   └── utils/
│       └── ResultFormatter.js   # 결과 포맷팅
├── examples/
│   └── sample-java-files/       # 테스트용 샘플 파일들
├── tests/
├── package.json
├── test-runner.js               # 테스트 스크립트
└── README.md
```

## 🔍 로그 레벨 가이드라인

이 도구는 다음 로그 레벨 가이드라인을 기준으로 분석합니다:

- **ERROR**: 서비스 장애, 기능상 손실 발생
- **WARN**: 예외 상황이지만 서비스 장애는 아닌 경우
- **INFO**: 프로덕션 환경에서 진행 상황 파악
- **DEBUG**: 개발 및 테스트 시 상세한 흐름 파악

## 🤝 기여하기

1. 이슈나 개선사항 제안
2. 새로운 패턴 감지 로직 추가
3. 다른 언어 지원 확대
4. 테스트 케이스 추가

## 📝 라이선스

MIT License

## 🔗 관련 링크

- [Model Context Protocol 사양](https://modelcontextprotocol.io/)
- [@bzzmnyd/lib 문서](https://internal-docs.company.com/logger)
- [Babel Parser 문서](https://babeljs.io/docs/en/babel-parser)

---

**Happy Logging! 🎉**