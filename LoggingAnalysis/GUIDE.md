# MCP 서버 개발 가이드

이 가이드는 MCP (Model Context Protocol) 서버에 새로운 기능과 도구를 추가하고, LLM의 행동을 효과적으로 유도하는 방법을 설명합니다.

## 목차

1. [새 도구 추가하기](#새-도구-추가하기)
2. [스키마 설계 전략](#스키마-설계-전략)
3. [LLM 행동 유도 기법](#llm-행동-유도-기법)
4. [MCP 클라이언트 설정](#mcp-클라이언트-설정)
5. [고급 기능](#고급-기능)
6. [디버깅 및 테스트](#디버깅-및-테스트)

## 새 도구 추가하기

### 1단계: 도구 파일 생성

`src/tools/` 폴더에 새 파일을 생성합니다:

```typescript
// src/tools/weather.ts
import { z } from 'zod';

// 입력 스키마 정의
export const WeatherInputSchema = z.object({
  city: z.string().describe('날씨를 조회할 도시명 (예: 서울, 부산)'),
  unit: z.enum(['celsius', 'fahrenheit']).optional().default('celsius').describe('온도 단위')
});

// 출력 타입 정의
export type WeatherInput = z.infer<typeof WeatherInputSchema>;
export type WeatherOutput = {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
};

// 도구 정의
export const weatherTool = {
  name: 'weather',
  description: '특정 도시의 현재 날씨 정보를 조회합니다. 온도, 날씨 상태, 습도를 제공합니다.',
  inputSchema: WeatherInputSchema,
  execute: async (input: WeatherInput): Promise<WeatherOutput> => {
    // 실제 날씨 API 호출 로직
    const weather = await fetchWeatherData(input.city, input.unit);
    
    return {
      city: input.city,
      temperature: weather.temp,
      condition: weather.condition,
      humidity: weather.humidity
    };
  }
};

async function fetchWeatherData(city: string, unit: string) {
  // 실제 구현에서는 OpenWeatherMap 등의 API 사용
  return {
    temp: 22,
    condition: '맑음',
    humidity: 65
  };
}
```

### 2단계: 도구 등록

```typescript
// src/tools/index.ts에 추가
export { weatherTool } from './weather.js';

// src/server.ts의 tools 배열에 추가
import { calculatorTool, weatherTool } from './tools/index.js';

const tools = [calculatorTool, weatherTool];
```

## 스키마 설계 전략

### 기본 원칙

1. **명확한 설명**: 각 필드에 구체적인 `describe()` 추가
2. **타입 안전성**: TypeScript 타입과 Zod 스키마 일치
3. **기본값 제공**: 선택적 매개변수에 합리적 기본값
4. **검증 로직**: 비즈니스 규칙을 스키마에 포함

### 고급 스키마 예제

```typescript
// 복잡한 데이터 구조
export const TaskInputSchema = z.object({
  title: z.string()
    .min(1, '제목은 필수입니다')
    .max(100, '제목은 100자를 초과할 수 없습니다')
    .describe('작업 제목'),
  
  priority: z.enum(['low', 'medium', 'high'])
    .default('medium')
    .describe('작업 우선순위 (low: 낮음, medium: 보통, high: 높음)'),
  
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다')
    .optional()
    .describe('마감일 (YYYY-MM-DD 형식, 선택사항)'),
  
  tags: z.array(z.string())
    .max(5, '태그는 최대 5개까지 가능합니다')
    .default([])
    .describe('작업 태그 목록'),
  
  assignee: z.object({
    name: z.string().describe('담당자 이름'),
    email: z.string().email('유효한 이메일 주소를 입력하세요').describe('담당자 이메일')
  }).optional().describe('작업 담당자 정보')
});
```

## LLM 행동 유도 기법

### 1. 상세한 도구 설명

```typescript
export const fileAnalyzerTool = {
  name: 'analyze_file',
  description: `파일의 내용을 분석하여 다음 정보를 제공합니다:
  - 파일 타입 및 크기
  - 코드 품질 점수 (코드 파일인 경우)
  - 보안 위험 요소 체크
  - 개선 제안사항
  
  분석 결과는 구조화된 형태로 제공되며, 추가 질문이나 후속 작업을 위한 컨텍스트를 포함합니다.`,
  // ...
};
```

### 2. 스키마 내 가이드

```typescript
export const EmailInputSchema = z.object({
  to: z.string()
    .email()
    .describe('수신자 이메일 주소. 반드시 유효한 이메일 형식이어야 합니다.'),
  
  subject: z.string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .describe('이메일 제목. 명확하고 구체적으로 작성하세요. 예: "프로젝트 진행 상황 보고"'),
  
  tone: z.enum(['formal', 'casual', 'urgent'])
    .default('formal')
    .describe(`이메일 톤:
    - formal: 공식적, 비즈니스 문서 스타일
    - casual: 친근하고 편안한 스타일  
    - urgent: 긴급함을 강조하는 스타일`),
  
  body: z.string()
    .min(10)
    .describe('이메일 본문. 목적을 명확히 하고 구체적인 내용을 포함하세요.')
});
```

### 3. 실행 결과에 가이드 포함

```typescript
execute: async (input: EmailInput) => {
  const result = await sendEmail(input);
  
  return {
    success: true,
    messageId: result.id,
    message: '이메일이 성공적으로 발송되었습니다.',
    nextSteps: [
      '발송 확인을 위해 발신함을 확인하세요',
      '중요한 이메일인 경우 수신 확인을 요청하세요',
      '후속 조치가 필요한 경우 캘린더에 리마인더를 설정하세요'
    ]
  };
}
```

## MCP 클라이언트 설정

### Claude Desktop 설정

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "skeleton-server": {
      "command": "node",
      "args": ["/path/to/your/project/dist/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Cursor 설정

`.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    "skeleton-server": {
      "command": "npm",
      "args": ["run", "start"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### 개발 환경 설정

개발 중에는 watch 모드 사용:

```json
{
  "mcpServers": {
    "skeleton-server": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/Users/gu/Repos/Dev/mcp/LoggingAnalysis"
    }
  }
}
```

## 고급 기능

### 리소스 제공

도구뿐만 아니라 리소스도 제공할 수 있습니다:

```typescript
// server.ts에 추가
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'config://server-info',
        name: '서버 정보',
        description: '현재 MCP 서버의 상태와 설정 정보',
        mimeType: 'application/json'
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'config://server-info') {
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            serverName: 'MCP Skeleton Server',
            version: '1.0.0',
            tools: tools.length,
            uptime: process.uptime()
          }, null, 2)
        }
      ]
    };
  }
  throw new Error('리소스를 찾을 수 없습니다');
});
```

### 프롬프트 템플릿

반복적인 작업을 위한 프롬프트 템플릿:

```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'code-review',
        description: '코드 리뷰를 위한 체계적인 분석 프롬프트',
        arguments: [
          {
            name: 'language',
            description: '프로그래밍 언어',
            required: true
          },
          {
            name: 'file_path',
            description: '리뷰할 파일 경로',
            required: true
          }
        ]
      }
    ]
  };
});
```

### 에러 처리 개선

```typescript
execute: async (input: MyInput) => {
  try {
    const result = await performOperation(input);
    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new Error(`입력 검증 실패: ${error.message}. 올바른 형식으로 다시 시도해주세요.`);
    } else if (error instanceof NetworkError) {
      throw new Error(`네트워크 오류: ${error.message}. 연결 상태를 확인한 후 다시 시도해주세요.`);
    } else {
      throw new Error(`예상치 못한 오류가 발생했습니다: ${error.message}`);
    }
  }
}
```

## 디버깅 및 테스트

### 로깅 추가

```typescript
// server.ts의 도구 실행 핸들러에 로깅 추가
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const toolName = request.params.name;
  console.error(`[${new Date().toISOString()}] 도구 실행: ${toolName}`);
  console.error(`[${new Date().toISOString()}] 입력값:`, JSON.stringify(request.params.arguments, null, 2));
  
  try {
    const result = await tool.execute(validatedInput);
    console.error(`[${new Date().toISOString()}] 실행 완료: ${toolName}`);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 실행 실패: ${toolName}`, error);
    throw error;
  }
});
```

### 스키마 테스트

```typescript
// tools/weather.test.ts
import { WeatherInputSchema } from './weather.js';

describe('WeatherInputSchema', () => {
  it('유효한 입력을 허용해야 함', () => {
    const result = WeatherInputSchema.parse({
      city: '서울',
      unit: 'celsius'
    });
    expect(result.city).toBe('서울');
  });

  it('잘못된 단위를 거부해야 함', () => {
    expect(() => {
      WeatherInputSchema.parse({
        city: '서울',
        unit: 'kelvin'
      });
    }).toThrow();
  });
});
```

### MCP 프로토콜 테스트

```bash
# 개발 중 서버 상태 확인
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npm run dev

# 도구 실행 테스트
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "calculator", "arguments": {"operation": "add", "a": 5, "b": 3}}}' | npm run dev
```

## 베스트 프랙티스

1. **타입 우선**: 항상 TypeScript 타입을 먼저 정의하고 Zod 스키마로 구현
2. **명확한 네이밍**: 도구명과 매개변수명은 의미가 명확해야 함
3. **에러 메시지**: 사용자가 이해할 수 있는 친화적인 에러 메시지
4. **문서화**: 복잡한 도구는 별도 문서 작성
5. **테스트**: 각 도구에 대한 단위 테스트 작성
6. **로깅**: 디버깅을 위한 적절한 로깅 구현

이 가이드를 따라하면 효과적이고 사용자 친화적인 MCP 서버를 구축할 수 있습니다.