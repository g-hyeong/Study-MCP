import axios from 'axios';
import { NaturalLanguageConverter } from './converter';

const converter = new NaturalLanguageConverter();

export const tools = [
  {
    name: "text_to_graphql",
    description: "자연어(한국어)를 GraphQL 쿼리로 변환합니다",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "변환할 한국어 자연어 질의문"
        }
      },
      required: ["text"]
    }
  },
  {
    name: "execute_graphql",
    description: "GraphQL 쿼리를 실행하고 결과를 반환합니다",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "실행할 GraphQL 쿼리"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_schema_info",
    description: "사용 가능한 GraphQL 스키마 정보를 반환합니다",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

export async function handleToolCall(name: string, args: any): Promise<any> {
  const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

  switch (name) {
    case 'text_to_graphql':
      try {
        const graphqlQuery = converter.convertToGraphQL(args.text);
        return {
          success: true,
          query: graphqlQuery,
          originalText: args.text
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          suggestion: "지원되는 패턴: " + converter.getAvailablePatterns().join(', ')
        };
      }

    case 'execute_graphql':
      try {
        const response = await axios.post(graphqlEndpoint, {
          query: args.query
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (response.data.errors) {
          return {
            success: false,
            errors: response.data.errors,
            data: response.data.data
          };
        }

        return {
          success: true,
          data: response.data.data
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return {
            success: false,
            error: `GraphQL 서버 연결 실패: ${error.message}`,
            endpoint: graphqlEndpoint
          };
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

    case 'get_schema_info':
      return {
        success: true,
        schema: {
          types: {
            User: {
              fields: ['id', 'name', 'email', 'age', 'department', 'posts'],
              description: '사용자 정보'
            },
            Post: {
              fields: ['id', 'title', 'content', 'author', 'comments', 'createdAt'],
              description: '게시글 정보'
            },
            Comment: {
              fields: ['id', 'content', 'author', 'post', 'createdAt'],
              description: '댓글 정보'
            }
          },
          queries: {
            users: 'users(filter: UserFilter): [User!]! - 사용자 목록 조회',
            user: 'user(id: ID!): User - 특정 사용자 조회',
            posts: 'posts(filter: PostFilter, limit: Int, offset: Int): [Post!]! - 게시글 목록 조회',
            post: 'post(id: ID!): Post - 특정 게시글 조회',
            comments: 'comments(postId: ID, authorId: ID): [Comment!]! - 댓글 목록 조회',
            comment: 'comment(id: ID!): Comment - 특정 댓글 조회'
          },
          relationships: {
            'User.posts': '사용자가 작성한 게시글들',
            'Post.author': '게시글 작성자',
            'Post.comments': '게시글의 댓글들',
            'Comment.author': '댓글 작성자',
            'Comment.post': '댓글이 달린 게시글'
          },
          supportedPatterns: converter.getAvailablePatterns()
        }
      };

    default:
      return {
        success: false,
        error: `Unknown tool: ${name}`
      };
  }
}