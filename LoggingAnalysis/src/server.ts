#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { calculatorTool } from './tools/index.js';

// 사용 가능한 도구들
const tools = [calculatorTool];

// MCP 서버 생성
const server = new Server(
  {
    name: 'mcp-skeleton-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// 도구 목록 요청 핸들러
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema)
    }))
  };
});

// 도구 실행 요청 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const toolName = request.params.name;
  const tool = tools.find(t => t.name === toolName);

  if (!tool) {
    throw new Error(`도구를 찾을 수 없습니다: ${toolName}`);
  }

  try {
    // 입력 검증
    const validatedInput = tool.inputSchema.parse(request.params.arguments ?? {});
    
    // 도구 실행
    const result = await tool.execute(validatedInput);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    throw new Error(`도구 실행 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
});

// 서버 시작
async function main(): Promise<void> {
  try {
    console.error('MCP Skeleton Server 시작 중...');
    console.error(`서버: mcp-skeleton-server v1.0.0`);
    console.error(`도구 개수: ${tools.length}`);
    
    await server.connect(process.stdin);
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}