// MCP 서버 테스트 스크립트
const { spawn } = require('child_process');

async function testMCPServer() {
  console.log('MCP 서버 테스트 시작...');
  
  const mcpProcess = spawn('node', ['dist/index.js'], {
    cwd: './mcp-server',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, GRAPHQL_ENDPOINT: 'http://localhost:4000/graphql' }
  });

  // 자연어 변환 테스트
  const testCases = [
    {
      name: 'text_to_graphql',
      args: { text: '모든 사용자의 이름과 이메일' }
    },
    {
      name: 'text_to_graphql', 
      args: { text: '개발팀 사용자들' }
    },
    {
      name: 'get_schema_info',
      args: {}
    }
  ];

  let responseCount = 0;
  
  mcpProcess.stdout.on('data', (data) => {
    console.log('MCP Response:', data.toString());
  });

  mcpProcess.stderr.on('data', (data) => {
    console.log('MCP Server started:', data.toString());
  });

  // 서버 시작 대기
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 테스트 실행
  for (const testCase of testCases) {
    console.log(`\n테스트: ${testCase.name}`);
    const request = {
      method: 'tools/call',
      params: {
        name: testCase.name,
        arguments: testCase.args
      }
    };
    
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  setTimeout(() => {
    mcpProcess.kill();
    console.log('\n테스트 완료');
  }, 5000);
}

testMCPServer().catch(console.error);