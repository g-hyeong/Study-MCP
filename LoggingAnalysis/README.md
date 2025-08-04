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

## 특징

- **최소한의 구조**: 복잡한 추상화 없이 핵심 기능만 포함
- **Zod 스키마**: TypeScript 타입 안전성과 런타임 검증
- **쉬운 확장**: `tools/` 폴더에 새 도구 추가하기만 하면 됨

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 새 도구 추가하기

1. `src/tools/` 폴더에 새 `.ts` 파일 생성
2. Zod 스키마와 실행 함수 정의
3. `src/tools/index.ts`에서 export
4. `src/server.ts`의 `tools` 배열에 추가

### 예제: Hello World 도구

```typescript
// src/tools/hello.ts
import { z } from 'zod';

export const HelloInputSchema = z.object({
  name: z.string().describe('인사할 이름')
});

export const helloTool = {
  name: 'hello',
  description: '간단한 인사 도구',
  inputSchema: HelloInputSchema,
  execute: async (input: z.infer<typeof HelloInputSchema>) => {
    return {
      message: `안녕하세요, ${input.name}님!`
    };
  }
};
```