# MCP Skeleton Server

최소한의 TypeScript 기반 MCP (Model Context Protocol) 서버 템플릿

## 프로젝트 구조

```
src/
├── server.ts           # MCP 서버 진입점 및 핵심 로직
└── tools/
    ├── index.ts        # 도구 export
    └── calculator.ts   # 예제 계산기 도구
```

## 핵심 기능

### ✅ MCP 프로토콜 필수 요소

1. **도구 목록 제공**: `ListToolsRequestSchema` 핸들러로 사용 가능한 도구들을 LLM에 알림
2. **도구 실행**: `CallToolRequestSchema` 핸들러로 도구 실행 요청 처리
3. **Zod 스키마 검증**: 입력값 검증과 타입 안전성 보장
4. **JSON Schema 변환**: `zod-to-json-schema`로 LLM이 이해할 수 있는 형식 제공

## 개발 가이드

### 새 도구 추가하기

1. `src/tools/` 폴더에 새 파일 생성
2. Zod 스키마와 실행 함수 정의
3. `src/tools/index.ts`에서 export
4. `src/server.ts`의 `tools` 배열에 추가

### 도구 구조 예시

```typescript
import { z } from 'zod';

// 입력 스키마 정의
export const MyToolInputSchema = z.object({
  param: z.string().describe('매개변수 설명')
});

// 도구 정의
export const myTool = {
  name: 'my_tool',
  description: 'LLM이 이해할 수 있는 상세한 설명',
  inputSchema: MyToolInputSchema,
  execute: async (input: z.infer<typeof MyToolInputSchema>) => {
    // 도구 로직 구현
    return { result: `처리됨: ${input.param}` };
  }
};
```

## 실행 명령어

```bash
npm run dev      # 개발 모드
npm run build    # 빌드
npm start        # 실행
npm run typecheck # 타입 체크
```

## 설계 원칙

- **최소한의 구조**: 복잡한 추상화 없이 핵심 기능만
- **TypeScript 우선**: 타입 안전성과 개발자 경험
- **쉬운 확장**: 새 도구 추가가 간단함