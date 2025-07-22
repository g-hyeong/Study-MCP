// MongoDB 초기 데이터 스크립트
db = db.getSiblingDB('text2query');

// Users 컬렉션 데이터
const users = [
  { _id: ObjectId("507f1f77bcf86cd799439011"), name: "김철수", email: "chulsoo@example.com", age: 28, department: "개발팀" },
  { _id: ObjectId("507f1f77bcf86cd799439012"), name: "이영희", email: "younghee@example.com", age: 32, department: "디자인팀" },
  { _id: ObjectId("507f1f77bcf86cd799439013"), name: "박민수", email: "minsu@example.com", age: 25, department: "개발팀" },
  { _id: ObjectId("507f1f77bcf86cd799439014"), name: "최지연", email: "jiyeon@example.com", age: 29, department: "마케팅팀" },
  { _id: ObjectId("507f1f77bcf86cd799439015"), name: "정현우", email: "hyunwoo@example.com", age: 31, department: "개발팀" },
  { _id: ObjectId("507f1f77bcf86cd799439016"), name: "강수진", email: "sujin@example.com", age: 27, department: "디자인팀" },
  { _id: ObjectId("507f1f77bcf86cd799439017"), name: "임도훈", email: "dohoon@example.com", age: 26, department: "개발팀" },
  { _id: ObjectId("507f1f77bcf86cd799439018"), name: "송미라", email: "mira@example.com", age: 30, department: "마케팅팀" },
  { _id: ObjectId("507f1f77bcf86cd799439019"), name: "홍길동", email: "gildong@example.com", age: 24, department: "인사팀" },
  { _id: ObjectId("507f1f77bcf86cd79943901a"), name: "윤서연", email: "seoyeon@example.com", age: 28, department: "디자인팀" },
  { _id: ObjectId("507f1f77bcf86cd79943901b"), name: "조성훈", email: "seonghoon@example.com", age: 33, department: "개발팀" },
  { _id: ObjectId("507f1f77bcf86cd79943901c"), name: "한지민", email: "jimin@example.com", age: 26, department: "마케팅팀" },
  { _id: ObjectId("507f1f77bcf86cd79943901d"), name: "문태준", email: "taejun@example.com", age: 29, department: "개발팀" },
  { _id: ObjectId("507f1f77bcf86cd79943901e"), name: "신예린", email: "yerin@example.com", age: 25, department: "디자인팀" },
  { _id: ObjectId("507f1f77bcf86cd79943901f"), name: "오준석", email: "junseok@example.com", age: 31, department: "인사팀" }
];

// Posts 컬렉션 데이터
const posts = [
  { _id: ObjectId("607f1f77bcf86cd799439021"), title: "프로젝트 킥오프 미팅", content: "새로운 프로젝트를 시작합니다.", authorId: ObjectId("507f1f77bcf86cd799439011"), createdAt: new Date("2024-01-15") },
  { _id: ObjectId("607f1f77bcf86cd799439022"), title: "React 18 업데이트 가이드", content: "React 18의 새로운 기능들을 소개합니다.", authorId: ObjectId("507f1f77bcf86cd799439013"), createdAt: new Date("2024-01-20") },
  { _id: ObjectId("607f1f77bcf86cd799439023"), title: "UI/UX 디자인 트렌드", content: "2024년 디자인 트렌드를 분석해보겠습니다.", authorId: ObjectId("507f1f77bcf86cd799439012"), createdAt: new Date("2024-01-25") },
  { _id: ObjectId("607f1f77bcf86cd799439024"), title: "마케팅 전략 회의", content: "Q1 마케팅 전략을 논의합니다.", authorId: ObjectId("507f1f77bcf86cd799439014"), createdAt: new Date("2024-02-01") },
  { _id: ObjectId("607f1f77bcf86cd799439025"), title: "개발팀 코드 리뷰", content: "코드 품질 향상을 위한 리뷰 프로세스입니다.", authorId: ObjectId("507f1f77bcf86cd799439015"), createdAt: new Date("2024-02-05") },
  { _id: ObjectId("607f1f77bcf86cd799439026"), title: "디자인 시스템 구축", content: "일관된 디자인을 위한 시스템을 만듭니다.", authorId: ObjectId("507f1f77bcf86cd799439016"), createdAt: new Date("2024-02-10") },
  { _id: ObjectId("607f1f77bcf86cd799439027"), title: "GraphQL 도입기", content: "REST API에서 GraphQL로의 전환 경험을 공유합니다.", authorId: ObjectId("507f1f77bcf86cd799439017"), createdAt: new Date("2024-02-15") },
  { _id: ObjectId("607f1f77bcf86cd799439028"), title: "브랜딩 전략", content: "브랜드 아이덴티티 강화 방안을 제시합니다.", authorId: ObjectId("507f1f77bcf86cd799439018"), createdAt: new Date("2024-02-20") },
  { _id: ObjectId("607f1f77bcf86cd799439029"), title: "신입 개발자 온보딩", content: "효과적인 온보딩 프로세스를 소개합니다.", authorId: ObjectId("507f1f77bcf86cd79943901b"), createdAt: new Date("2024-02-25") },
  { _id: ObjectId("607f1f77bcf86cd79943902a"), title: "타입스크립트 베스트 프랙티스", content: "TS 개발 시 유용한 패턴들을 정리했습니다.", authorId: ObjectId("507f1f77bcf86cd79943901d"), createdAt: new Date("2024-03-01") },
  { _id: ObjectId("607f1f77bcf86cd79943902b"), title: "모바일 퍼스트 디자인", content: "모바일 우선 접근법의 중요성을 다룹니다.", authorId: ObjectId("507f1f77bcf86cd79943901a"), createdAt: new Date("2024-03-05") },
  { _id: ObjectId("607f1f77bcf86cd79943902c"), title: "SEO 최적화 가이드", content: "검색 엔진 최적화 실무 노하우를 공유합니다.", authorId: ObjectId("507f1f77bcf86cd79943901c"), createdAt: new Date("2024-03-10") },
  { _id: ObjectId("607f1f77bcf86cd79943902d"), title: "Docker 컨테이너 관리", content: "효율적인 컨테이너 운영 방법을 설명합니다.", authorId: ObjectId("507f1f77bcf86cd799439011"), createdAt: new Date("2024-03-15") },
  { _id: ObjectId("607f1f77bcf86cd79943902e"), title: "사용자 경험 개선", content: "UX 개선을 통한 전환율 향상 사례입니다.", authorId: ObjectId("507f1f77bcf86cd79943901e"), createdAt: new Date("2024-03-20") },
  { _id: ObjectId("607f1f77bcf86cd79943902f"), title: "팀 협업 도구 비교", content: "다양한 협업 도구들의 장단점을 분석합니다.", authorId: ObjectId("507f1f77bcf86cd79943901f"), createdAt: new Date("2024-03-25") }
];

// Comments 컬렉션 데이터
const comments = [
  { _id: ObjectId("707f1f77bcf86cd799439031"), content: "좋은 아이디어네요!", postId: ObjectId("607f1f77bcf86cd799439021"), authorId: ObjectId("507f1f77bcf86cd799439013"), createdAt: new Date("2024-01-16") },
  { _id: ObjectId("707f1f77bcf86cd799439032"), content: "프로젝트 일정은 어떻게 되나요?", postId: ObjectId("607f1f77bcf86cd799439021"), authorId: ObjectId("507f1f77bcf86cd799439015"), createdAt: new Date("2024-01-17") },
  { _id: ObjectId("707f1f77bcf86cd799439033"), content: "React 18의 Concurrent Features가 인상적이네요.", postId: ObjectId("607f1f77bcf86cd799439022"), authorId: ObjectId("507f1f77bcf86cd799439011"), createdAt: new Date("2024-01-21") },
  { _id: ObjectId("707f1f77bcf86cd799439034"), content: "업데이트 시 주의사항도 알려주세요.", postId: ObjectId("607f1f77bcf86cd799439022"), authorId: ObjectId("507f1f77bcf86cd79943901d"), createdAt: new Date("2024-01-22") },
  { _id: ObjectId("707f1f77bcf86cd799439035"), content: "트렌드 분석이 매우 유용했습니다.", postId: ObjectId("607f1f77bcf86cd799439023"), authorId: ObjectId("507f1f77bcf86cd79943901e"), createdAt: new Date("2024-01-26") },
  { _id: ObjectId("707f1f77bcf86cd799439036"), content: "실무에 바로 적용해보겠습니다.", postId: ObjectId("607f1f77bcf86cd799439023"), authorId: ObjectId("507f1f77bcf86cd79943901a"), createdAt: new Date("2024-01-27") },
  { _id: ObjectId("707f1f77bcf86cd799439037"), content: "마케팅 예산 배분은 어떻게 하시나요?", postId: ObjectId("607f1f77bcf86cd799439024"), authorId: ObjectId("507f1f77bcf86cd79943901c"), createdAt: new Date("2024-02-02") },
  { _id: ObjectId("707f1f77bcf86cd799439038"), content: "코드 리뷰 체크리스트도 공유해주세요.", postId: ObjectId("607f1f77bcf86cd799439025"), authorId: ObjectId("507f1f77bcf86cd799439017"), createdAt: new Date("2024-02-06") },
  { _id: ObjectId("707f1f77bcf86cd799439039"), content: "디자인 토큰 관리는 어떤 도구를 쓰시나요?", postId: ObjectId("607f1f77bcf86cd799439026"), authorId: ObjectId("507f1f77bcf86cd799439012"), createdAt: new Date("2024-02-11") },
  { _id: ObjectId("707f1f77bcf86cd79943903a"), content: "GraphQL 성능 최적화 팁도 알고 싶습니다.", postId: ObjectId("607f1f77bcf86cd799439027"), authorId: ObjectId("507f1f77bcf86cd79943901b"), createdAt: new Date("2024-02-16") },
  { _id: ObjectId("707f1f77bcf86cd79943903b"), content: "브랜드 가이드라인 문서가 있나요?", postId: ObjectId("607f1f77bcf86cd799439028"), authorId: ObjectId("507f1f77bcf86cd799439014"), createdAt: new Date("2024-02-21") },
  { _id: ObjectId("707f1f77bcf86cd79943903c"), content: "멘토링 프로그램도 있으면 좋겠네요.", postId: ObjectId("607f1f77bcf86cd799439029"), authorId: ObjectId("507f1f77bcf86cd799439019"), createdAt: new Date("2024-02-26") },
  { _id: ObjectId("707f1f77bcf86cd79943903d"), content: "타입 안전성 확보 방법이 유용했습니다.", postId: ObjectId("607f1f77bcf86cd79943902a"), authorId: ObjectId("507f1f77bcf86cd799439013"), createdAt: new Date("2024-03-02") },
  { _id: ObjectId("707f1f77bcf86cd79943903e"), content: "반응형 디자인 가이드도 부탁드립니다.", postId: ObjectId("607f1f77bcf86cd79943902b"), authorId: ObjectId("507f1f77bcf86cd799439016"), createdAt: new Date("2024-03-06") },
  { _id: ObjectId("707f1f77bcf86cd79943903f"), content: "구조화된 데이터 마크업은 어떻게 하나요?", postId: ObjectId("607f1f77bcf86cd79943902c"), authorId: ObjectId("507f1f77bcf86cd799439018"), createdAt: new Date("2024-03-11") },
  { _id: ObjectId("707f1f77bcf86cd799439040"), content: "Kubernetes 환경에서는 어떻게 적용하나요?", postId: ObjectId("607f1f77bcf86cd79943902d"), authorId: ObjectId("507f1f77bcf86cd799439015"), createdAt: new Date("2024-03-16") },
  { _id: ObjectId("707f1f77bcf86cd799439041"), content: "A/B 테스트 결과도 공유해주세요.", postId: ObjectId("607f1f77bcf86cd79943902e"), authorId: ObjectId("507f1f77bcf86cd79943901c"), createdAt: new Date("2024-03-21") },
  { _id: ObjectId("707f1f77bcf86cd799439042"), content: "Slack vs Discord 비교가 궁금합니다.", postId: ObjectId("607f1f77bcf86cd79943902f"), authorId: ObjectId("507f1f77bcf86cd799439017"), createdAt: new Date("2024-03-26") }
];

// 데이터 삽입
print("Inserting users...");
db.users.insertMany(users);
print(`Inserted ${users.length} users`);

print("Inserting posts...");
db.posts.insertMany(posts);
print(`Inserted ${posts.length} posts`);

print("Inserting comments...");
db.comments.insertMany(comments);
print(`Inserted ${comments.length} comments`);

// 인덱스 생성
print("Creating indexes...");
db.users.createIndex({ "email": 1 }, { unique: true });
db.posts.createIndex({ "authorId": 1 });
db.posts.createIndex({ "createdAt": -1 });
db.comments.createIndex({ "postId": 1 });
db.comments.createIndex({ "authorId": 1 });
db.comments.createIndex({ "createdAt": -1 });

print("Database seeding completed successfully!");