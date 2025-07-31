#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { LoggingAnalyzer } from './analyzers/LoggingAnalyzer.js';
import { JavaScriptParser } from './parsers/JavaScriptParser.js';
import { ResultFormatter } from './utils/ResultFormatter.js';

class LoggingQualityAnalysisMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'logging-quality-analysis',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.analyzer = new LoggingAnalyzer();
    this.parser = new JavaScriptParser();
    this.formatter = new ResultFormatter();

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze-file',
            description: 'JavaScript 파일의 로깅 품질을 분석합니다',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: '분석할 JavaScript 파일의 경로',
                },
                options: {
                  type: 'object',
                  properties: {
                    checkLogLevel: {
                      type: 'boolean',
                      description: '로그 레벨 적정성 검사 여부',
                      default: true,
                    },
                    checkMessageQuality: {
                      type: 'boolean', 
                      description: '메시지 품질 검사 여부',
                      default: true,
                    },
                    checkSecurity: {
                      type: 'boolean',
                      description: '보안 위험 검사 여부',
                      default: true,
                    },
                    checkStringPattern: {
                      type: 'boolean',
                      description: '문자열 패턴 검사 여부 (+ vs 템플릿 리터럴)',
                      default: true,
                    },
                  },
                },
              },
              required: ['filePath'],
            },
          },
          {
            name: 'analyze-directory',
            description: '디렉토리 내 모든 JavaScript 파일의 로깅 품질을 분석합니다',
            inputSchema: {
              type: 'object',
              properties: {
                directoryPath: {
                  type: 'string',
                  description: '분석할 디렉토리 경로',
                },
                pattern: {
                  type: 'string',
                  description: '파일 패턴 (기본값: **/*.js)',
                  default: '**/*.js',
                },
                options: {
                  type: 'object',
                  properties: {
                    checkLogLevel: { type: 'boolean', default: true },
                    checkMessageQuality: { type: 'boolean', default: true },
                    checkSecurity: { type: 'boolean', default: true },
                    checkStringPattern: { type: 'boolean', default: true },
                  },
                },
              },
              required: ['directoryPath'],
            },
          },
          {
            name: 'check-logging-patterns',
            description: '@bzzmnyd/lib logger 사용 패턴을 체크합니다',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: '분석할 JavaScript 파일의 경로',
                },
                patterns: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '검사할 패턴들 (string-concat, template-literal, log-level, security)',
                  default: ['string-concat', 'template-literal', 'log-level', 'security'],
                },
              },
              required: ['filePath'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze-file':
            return await this.handleAnalyzeFile(args);
          case 'analyze-directory':
            return await this.handleAnalyzeDirectory(args);
          case 'check-logging-patterns':
            return await this.handleCheckLoggingPatterns(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error in ${name}: ${error.message}`
        );
      }
    });
  }

  async handleAnalyzeFile(args) {
    const { filePath, options = {} } = args;
    
    try {
      const ast = await this.parser.parseFile(filePath);
      const results = await this.analyzer.analyzeFile(ast, filePath, options);
      
      return {
        content: [
          {
            type: 'text',
            text: this.formatter.formatResults(results, 'file', filePath),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `파일 분석 실패: ${error.message}`
      );
    }
  }

  async handleAnalyzeDirectory(args) {
    const { directoryPath, pattern = '**/*.js', options = {} } = args;
    
    try {
      const results = await this.analyzer.analyzeDirectory(directoryPath, pattern, options);
      
      return {
        content: [
          {
            type: 'text',
            text: this.formatter.formatResults(results, 'directory', directoryPath),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `디렉토리 분석 실패: ${error.message}`
      );
    }
  }

  async handleCheckLoggingPatterns(args) {
    const { filePath, patterns = ['string-concat', 'template-literal', 'log-level', 'security'] } = args;
    
    try {
      const ast = await this.parser.parseFile(filePath);
      const results = await this.analyzer.checkSpecificPatterns(ast, filePath, patterns);
      
      return {
        content: [
          {
            type: 'text',
            text: this.formatter.formatPatternResults(results, patterns, filePath),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `패턴 검사 실패: ${error.message}`
      );
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Logging Quality Analysis MCP Server가 시작되었습니다');
  }
}

const server = new LoggingQualityAnalysisMCPServer();
server.run().catch(console.error);