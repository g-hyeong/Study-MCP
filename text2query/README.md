# Text2Query MCP Server 🚀

한국어 자연어를 GraphQL 쿼리로 변환하는 Model Context Protocol (MCP) 서버입니다.

사용자가 "개발팀 사용자들의 이름과 이메일을 알려줘"라고 말하면, 이를 `{ users(filter: { department: "개발팀" }) { name email } }`와 같은 GraphQL 쿼리로 자동 변환하여 실행합니다.

## 🎯 프로젝트 개요

### 핵심 기능
- **자연어 처리**: 한국어 질의문을 GraphQL 쿼리로 변환
- **GraphQL 실행**: 변환된 쿼리를 실제 GraphQL 서버에서 실행
- **MCP 프로토콜**: Claude Code와 같은 MCP 클라이언트와 표준 통신

### 변환 예시
```
입력: "모든 사용자의 이름과 이메일"
출력: { users { name email } }

입력: "개발팀 사용자들"  
출력: { users(filter: { department: "개발팀" }) { name email age } }

입력: "김철수가 작성한 게시글"
출력: { users(filter: { name: "김철수" }) { posts { title content createdAt } } }

입력: "최근 게시글 5개"
출력: { posts(limit: 5) { title content createdAt author { name } } }
```

## 🏗️ 아키텍처

### 전체 구조
```
┌─────────────────┐    MCP Protocol     ┌─────────────────┐    HTTP/GraphQL    ┌─────────────────┐
│  MCP 클라이언트   │ ←── (stdio) ──→    │   text2query     │ ───── axios ──→   │  GraphQL 서버    │
│  (Claude Code)   │                    │   MCP Server     │                   │  (Apollo Server) │
└─────────────────┘                    └─────────────────┘                   └─────────────────┘
                                               │
                                               ↓
                                        ┌─────────────────┐
                                        │     MongoDB     │
                                        │   (샘플 데이터)   │
                                        └─────────────────┘
```

### 3-Tier 아키텍처
1. **MCP Client (Presentation)**: Claude Code, Gemini CLI 등
2. **text2query Server (Application)**: 자연어 변환 및 MCP 프로토콜 처리
3. **GraphQL + MongoDB (Data)**: 실제 데이터 저장 및 쿼리 실행

## 🔧 기술 스택

### MCP Server (현재 디렉토리)
- **언어**: TypeScript, Node.js
- **프로토콜**: Model Context Protocol (`@modelcontextprotocol/sdk`)
- **HTTP 클라이언트**: axios
- **자연어 처리**: 정규식 기반 규칙 시스템

### GraphQL Server (graphql-server/)
- **서버**: Apollo Server 4 (`@apollo/server`)
- **웹 프레임워크**: Express.js
- **데이터베이스**: MongoDB + Mongoose ODM
- **기능**: CORS, Body Parser, GraphQL Playground

### 데이터베이스 (mongo-init/)
- **데이터베이스**: MongoDB 7
- **관리 도구**: Mongo Express (웹 UI)
- **샘플 데이터**: 15명 사용자, 15개 게시글, 18개 댓글

## 📁 프로젝트 구조

```
text2query/
├── README.md                    # 이 파일
├── CLAUDE.md                    # Claude Code 가이드
├── docker-compose.yml           # Docker 서비스 설정
├── .env                        # 환경 변수
│
├── mcp-server/                  # MCP 서버 (메인)
│   ├── src/
│   │   ├── index.ts            # MCP 서버 진입점
│   │   ├── tools.ts            # MCP 도구 정의 및 실행
│   │   └── converter.ts        # 자연어 → GraphQL 변환 엔진
│   └── package.json
│
├── graphql-server/              # GraphQL API 서버
│   ├── src/
│   │   ├── index.ts            # Apollo Server 설정
│   │   ├── schema.ts           # GraphQL 스키마 정의
│   │   ├── resolvers.ts        # GraphQL 리졸버
│   │   └── models.ts           # Mongoose 데이터 모델
│   └── package.json
│
└── mongo-init/                  # MongoDB 초기 데이터
    └── seed-data.js            # 샘플 데이터 스크립트
```

## 🚀 실행 방법

### 1. 환경 설정
```bash
# 저장소 클론
cd text2query

# 환경 변수 확인
cat .env
```

### 2. 데이터베이스 실행
```bash
# MongoDB + Mongo Express 실행
docker-compose up -d mongodb mongo-express

# 데이터 확인 (웹 브라우저)
open http://localhost:8081
```

### 3. GraphQL 서버 실행
```bash
cd graphql-server
npm install
npm run dev

# GraphQL Playground 확인
open http://localhost:4000/graphql
```

### 4. MCP 서버 실행
```bash
cd ../mcp-server  
npm install
npm run dev
```

### 5. 통합 테스트
```bash
# GraphQL 직접 테스트
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ users { name email } }"}'

# 자연어 변환 테스트
cd ../mcp-server
node -e "
const converter = require('./dist/converter.js');
const nlc = new converter.NaturalLanguageConverter();
console.log(nlc.convertToGraphQL('개발팀 사용자들'));
"
```

## 🧠 핵심 컴포넌트 상세

### 1. 자연어 변환 엔진 (converter.ts)

#### 설계 철학
- **규칙 기반**: 머신러닝 대신 정규식을 사용한 예측 가능한 변환
- **패턴 매칭**: 미리 정의된 패턴과 입력 문장을 순차적으로 비교
- **한국어 특화**: "~팀", "~가 작성한", "~의" 등 한국어 문법 고려

#### 변환 로직
```typescript
// 패턴 정의 예시
{
  pattern: /^(\w+팀?)\s*사용자(?:의\s*(.*?))?$/,
  converter: (match) => {
    const department = match[1];        // "개발팀"
    const fields = this.parseFields(match[2]); // "name email"
    return `{ users(filter: { department: "${department}" }) { ${fields} } }`;
  }
}
```

#### 필드 매핑
```typescript
const fieldMap = {
  '이름': 'name',
  '이메일': 'email', 
  '나이': 'age',
  '부서': 'department'
};
```

### 2. MCP 도구 (tools.ts)

#### text_to_graphql
```typescript
// 입력: { text: "개발팀 사용자들" }
// 출력: { query: "{ users(filter: ...) { ... } }", success: true }
```

#### execute_graphql  
```typescript
// 입력: { query: "{ users { name } }" }
// 출력: { data: [...], success: true }
```

#### get_schema_info
```typescript
// 출력: GraphQL 스키마 정보 + 지원 패턴 목록
```

### 3. GraphQL 스키마 설계

#### 데이터 모델
```graphql
type User {
  id: ID!
  name: String!          # 사용자 이름
  email: String!         # 이메일 주소  
  age: Int!             # 나이
  department: String!    # 부서명
  posts: [Post!]!       # 작성한 게시글 (관계)
}

type Post {
  id: ID!
  title: String!        # 게시글 제목
  content: String!      # 게시글 내용
  author: User!         # 작성자 (관계)
  comments: [Comment!]! # 댓글들 (관계)  
  createdAt: String!    # 작성일
}

type Comment {
  id: ID!
  content: String!      # 댓글 내용
  author: User!         # 작성자 (관계)
  post: Post!          # 게시글 (관계)
  createdAt: String!    # 작성일  
}
```

#### 쿼리 타입
```graphql
type Query {
  users(filter: UserFilter): [User!]!
  posts(filter: PostFilter, limit: Int, offset: Int): [Post!]!
  comments(postId: ID, authorId: ID): [Comment!]!
}

input UserFilter {
  name: String
  department: String
  age: Int
}
```

### 4. 샘플 데이터 구조

#### 사용자 데이터 (15명)
```javascript
// 부서별 분포
- 개발팀: 6명 (김철수, 박민수, 정현우, 임도훈, 조성훈, 문태준)
- 디자인팀: 4명 (이영희, 강수진, 윤서연, 신예린) 
- 마케팅팀: 3명 (최지연, 송미라, 한지민)
- 인사팀: 2명 (홍길동, 오준석)
```

#### 관계 데이터
- **Posts (15개)**: 각 사용자가 1개씩 작성
- **Comments (18개)**: 게시글당 0-2개의 댓글
- **ObjectId 참조**: MongoDB의 표준 관계 설정

## 🔍 지원하는 자연어 패턴

### 사용자 조회
- "모든 사용자의 이름과 이메일"
- "개발팀 사용자들"  
- "나이가 30세 이상인 사용자"

### 게시글 조회
- "모든 게시글"
- "김철수가 작성한 게시글"
- "최근 게시글 5개"

### 댓글 조회  
- "모든 댓글"
- '"프로젝트 킥오프 미팅" 게시글의 댓글'
- "이영희가 작성한 댓글"

### 관계 조회
- "사용자별 게시글 조회"
- "게시글별 댓글 조회"
- "작성자 정보 포함한 게시글"

## 🛠️ 개발자 가이드

### 새로운 패턴 추가
```typescript
// converter.ts의 patterns 배열에 추가
{
  pattern: /^새로운\s*패턴\s*(.+)$/,
  converter: (match) => {
    // 변환 로직 구현
    return `{ 생성된_쿼리 }`;
  }
}
```

### 필드 매핑 확장
```typescript
// parseFields 함수의 fieldMap에 추가
const fieldMap = {
  '새필드': 'newField',
  // ...
};
```

### 환경 변수
```bash
GRAPHQL_ENDPOINT=http://localhost:4000/graphql  # GraphQL 서버 주소
MONGODB_URI=mongodb://admin:password123@localhost:27018/text2query?authSource=admin
```

## 🔧 문제 해결

### 포트 충돌
```bash
# MongoDB 포트 변경 (docker-compose.yml)
ports:
  - "27018:27017"  # 기본 27017 대신 27018 사용
```

### GraphQL 서버 연결 실패
```bash
# 서버 상태 확인
curl http://localhost:4000/graphql

# 로그 확인
cd graphql-server && tail -f graphql-server.log
```

### MCP 클라이언트 연결
```bash
# MCP 서버 직접 테스트
echo '{"method": "tools/list"}' | npm run dev
```

## 📊 성능 특징

### 변환 속도
- **정규식 매칭**: 마이크로초 단위의 빠른 패턴 매칭
- **메모리 효율**: 별도 AI 모델 없이 경량 실행
- **확장성**: 새 패턴 추가 시 성능 영향 최소

### 제약사항
- **패턴 한계**: 미리 정의된 패턴에만 대응 가능
- **유연성 부족**: 자유로운 자연어 입력에 제한적
- **한국어 특화**: 다른 언어 지원을 위해서는 별도 패턴 필요

## 🤝 기여하기

### 개발 환경 설정
```bash
git clone <repository>
cd text2query
npm install
```

### 테스트 실행
```bash
# 단위 테스트
npm test

# 통합 테스트  
npm run test:integration
```

### 코드 스타일
```bash
npm run lint
npm run format
```

## 📝 라이선스

ISC License

## 🙏 감사의 말

이 프로젝트는 Model Context Protocol과 GraphQL의 강력함을 결합하여, 자연어와 구조화된 쿼리 언어 사이의 다리 역할을 합니다. 복잡한 AI 모델 없이도 실용적인 자연어 처리가 가능함을 보여주는 사례입니다.

---

⭐ 이 프로젝트가 도움이 되었다면 별표를 눌러주세요!