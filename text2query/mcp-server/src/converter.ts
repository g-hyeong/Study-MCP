interface ConversionPattern {
  pattern: RegExp;
  converter: (match: RegExpMatchArray) => string;
}

export class NaturalLanguageConverter {
  private patterns: ConversionPattern[] = [
    // 모든 사용자 조회
    {
      pattern: /^모든\s*사용자(?:의\s*(.*?))?$/,
      converter: (match) => {
        const fields = match[1] ? this.parseFields(match[1]) : 'name email age department';
        return `{ users { ${fields} } }`;
      }
    },
    
    // 특정 부서 사용자 조회
    {
      pattern: /^(\w+팀?)\s*사용자(?:의\s*(.*?))?$/,
      converter: (match) => {
        const department = match[1];
        const fields = match[2] ? this.parseFields(match[2]) : 'name email age department';
        return `{ users(filter: { department: "${department}" }) { ${fields} } }`;
      }
    },
    
    // 모든 게시글 조회
    {
      pattern: /^모든\s*게시글(?:의\s*(.*?))?$/,
      converter: (match) => {
        const fields = match[1] ? this.parseFields(match[1]) : 'title content createdAt author { name }';
        return `{ posts { ${fields} } }`;
      }
    },
    
    // 특정 사용자가 작성한 게시글
    {
      pattern: /^(.*?)가?\s*작성한\s*게시글(?:의\s*(.*?))?$/,
      converter: (match) => {
        const authorName = match[1];
        const fields = match[2] ? this.parseFields(match[2]) : 'title content createdAt';
        return `{ users(filter: { name: "${authorName}" }) { posts { ${fields} } } }`;
      }
    },
    
    // 최근 게시글
    {
      pattern: /^최근\s*게시글\s*(\d+)개(?:의\s*(.*?))?$/,
      converter: (match) => {
        const limit = parseInt(match[1]);
        const fields = match[2] ? this.parseFields(match[2]) : 'title content createdAt author { name }';
        return `{ posts(limit: ${limit}) { ${fields} } }`;
      }
    },
    
    // 모든 댓글 조회
    {
      pattern: /^모든\s*댓글(?:의\s*(.*?))?$/,
      converter: (match) => {
        const fields = match[1] ? this.parseFields(match[1]) : 'content createdAt author { name } post { title }';
        return `{ comments { ${fields} } }`;
      }
    },
    
    // 특정 게시글의 댓글
    {
      pattern: /^"(.*?)"\s*게시글의?\s*댓글(?:의\s*(.*?))?$/,
      converter: (match) => {
        const postTitle = match[1];
        const fields = match[2] ? this.parseFields(match[2]) : 'content createdAt author { name }';
        return `{ posts(filter: { title: "${postTitle}" }) { comments { ${fields} } } }`;
      }
    },
    
    // 특정 사용자의 댓글
    {
      pattern: /^(.*?)가?\s*작성한\s*댓글(?:의\s*(.*?))?$/,
      converter: (match) => {
        const authorName = match[1];
        const fields = match[2] ? this.parseFields(match[2]) : 'content createdAt post { title }';
        return `{ users(filter: { name: "${authorName}" }) { id } comments(authorId: users.id) { ${fields} } }`;
      }
    },
    
    // 개발팀 사용자들
    {
      pattern: /^개발팀\s*(?:사용자들?)?(?:의\s*(.*?))?$/,
      converter: (match) => {
        const fields = match[1] ? this.parseFields(match[1]) : 'name email age';
        return `{ users(filter: { department: "개발팀" }) { ${fields} } }`;
      }
    },
    
    // 나이 조건 조회
    {
      pattern: /^나이가?\s*(\d+)(?:세)?\s*(?:이상|초과|이하|미만)인?\s*사용자(?:의\s*(.*?))?$/,
      converter: (match) => {
        const age = parseInt(match[1]);
        const fields = match[2] ? this.parseFields(match[2]) : 'name email age department';
        return `{ users(filter: { age: ${age} }) { ${fields} } }`;
      }
    }
  ];

  private parseFields(fieldsString: string): string {
    // 한국어 필드명을 GraphQL 필드명으로 매핑
    const fieldMap: { [key: string]: string } = {
      '이름': 'name',
      '이메일': 'email',
      '나이': 'age',
      '부서': 'department',
      '제목': 'title',
      '내용': 'content',
      '작성일': 'createdAt',
      '작성자': 'author { name }',
      '댓글': 'comments { content author { name } }',
      '게시글': 'posts { title content }'
    };

    return fieldsString
      .replace(/과|와|,/g, ' ')
      .split(/\s+/)
      .map(field => fieldMap[field.trim()] || field.trim())
      .filter(field => field.length > 0)
      .join(' ');
  }

  public convertToGraphQL(naturalLanguage: string): string {
    const cleanInput = naturalLanguage.trim();
    
    for (const { pattern, converter } of this.patterns) {
      const match = cleanInput.match(pattern);
      if (match) {
        try {
          return converter(match);
        } catch (error) {
          console.error('Pattern conversion error:', error);
          continue;
        }
      }
    }
    
    // 패턴이 매치되지 않는 경우 기본 쿼리 제안
    if (cleanInput.includes('사용자')) {
      return '{ users { name email age department } }';
    } else if (cleanInput.includes('게시글')) {
      return '{ posts { title content createdAt author { name } } }';
    } else if (cleanInput.includes('댓글')) {
      return '{ comments { content createdAt author { name } post { title } } }';
    }
    
    throw new Error(`자연어 패턴을 인식할 수 없습니다: "${naturalLanguage}"`);
  }

  public getAvailablePatterns(): string[] {
    return [
      "모든 사용자의 이름과 이메일",
      "개발팀 사용자들",
      "김철수가 작성한 게시글",
      "최근 게시글 5개",
      "모든 댓글",
      '"프로젝트 킥오프 미팅" 게시글의 댓글',
      "나이가 30세 이상인 사용자"
    ];
  }
}