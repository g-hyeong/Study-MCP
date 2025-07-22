# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MCP (Model Context Protocol) server that converts natural Korean language to GraphQL queries. The project consists of multiple services working together in a containerized environment to provide a complete text-to-query translation system.

## Architecture

The project follows a multi-service architecture with:

- **MCP Server**: Main server implementing MCP tools for natural language processing
- **GraphQL Server**: Apollo Server with MongoDB backend for data operations  
- **MongoDB**: Database with sample User, Post, Comment collections
- **Mongo Express**: Web UI for database management

## Development Commands

```bash
# Start all services
docker-compose up -d

# Stop all services  
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Development mode (MCP server)
npm install
npm run dev        # If configured
npx tsx src/index.ts

# Build TypeScript
npx tsc

# Access services
# GraphQL Playground: http://localhost:4000
# Mongo Express: http://localhost:8081
# MongoDB: localhost:27017
```

## Technical Stack

- **MCP Framework**: @modelcontextprotocol/sdk v1.16.0
- **Backend**: Node.js + TypeScript + Apollo Server + Mongoose  
- **Database**: MongoDB with relationship data
- **Container**: Docker Compose
- **Build Tools**: tsx, TypeScript compiler

## MCP Tools Implementation

The server implements three core MCP tools:

1. **`text_to_graphql`**: Converts Korean natural language to GraphQL queries
2. **`execute_graphql`**: Executes GraphQL queries against the Apollo server
3. **`get_schema_info`**: Returns available GraphQL schema information

## Data Models

### User Collection
- name, email, age, department fields
- Relationships: posts (authored posts)

### Post Collection  
- title, content, authorId, createdAt fields
- Relationships: author (User), comments (Comment array)

### Comment Collection
- content, postId, authorId, createdAt fields  
- Relationships: author (User), post (Post)

## Korean Language Patterns

The natural language converter handles:
- **Complete queries**: "모든 X", "전체 X" 
- **Specific queries**: "X의 Y", "X에서 Y"
- **Conditional queries**: "X where 조건", "조건에 맞는 X"
- **Relationship queries**: "X가 작성한 Y", "X에 달린 Y"

## Project Structure Reference

Based on Cursor rules, the expected structure includes:
- `mongo-init/seed-data.js`: MongoDB initialization data
- `graphql-server/src/`: Apollo Server implementation  
- `mcp-server/src/`: MCP tools and natural language processing
- `docker-compose.yml`: Service orchestration
- `.env`: Environment configuration

## Development Notes

- Currently in initial setup phase - only package.json exists
- Uses tsx for direct TypeScript execution without compilation
- No testing framework configured yet  
- Extensive TODO list available in `.cursor/rules/TODO.mdc`
- Detailed PRD specifications in `.cursor/rules/prd.mdc`