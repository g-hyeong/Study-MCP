import { z } from 'zod';

// Calculator 도구의 입력 스키마
export const CalculatorInputSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('수행할 연산'),
  a: z.number().describe('첫 번째 숫자'),
  b: z.number().describe('두 번째 숫자')
});

// Calculator 도구의 출력 스키마
export const CalculatorOutputSchema = z.object({
  result: z.number().describe('계산 결과'),
  operation: z.string().describe('수행된 연산')
});

export type CalculatorInput = z.infer<typeof CalculatorInputSchema>;
export type CalculatorOutput = z.infer<typeof CalculatorOutputSchema>;

// Calculator 도구 정의
export const calculatorTool = {
  name: 'calculator',
  description: '기본적인 사칙연산을 수행하는 계산기 도구',
  inputSchema: CalculatorInputSchema,
  execute: async (input: CalculatorInput): Promise<CalculatorOutput> => {
    const { operation, a, b } = input;
    
    let result: number;
    
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          throw new Error('0으로 나눌 수 없습니다');
        }
        result = a / b;
        break;
      default:
        throw new Error(`지원하지 않는 연산: ${operation}`);
    }
    
    return {
      result,
      operation: `${a} ${operation} ${b} = ${result}`
    };
  }
};