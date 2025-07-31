import { logger } from '@bzzmnyd/lib';

export class OrderService {
  async processOrder(orderData) {
    // 문제 1: 문자열 결합 사용 (변수 출력 안됨)
    logger.info("주문 처리 시작: " + orderData.orderId);
    
    try {
      // 문제 2: 의미없는 로그 메시지
      logger.debug("here");
      
      const validation = await this.validateOrder(orderData);
      
      // 문제 3: 부적절한 로그 레벨 (비즈니스 로직 완료를 DEBUG로)
      logger.debug("주문 검증 완료");
      
      if (!validation.isValid) {
        // 문제 4: 실패 상황을 WARN으로 (ERROR가 적절)
        logger.warn("주문 검증 실패");
        return { success: false };
      }

      // 문제 5: 보안 위험 - 민감한 정보 로깅
      logger.info("결제 정보: " + JSON.stringify({
        cardNumber: orderData.cardNumber,
        password: orderData.password,
        ssn: orderData.ssn
      }));

      const result = await this.saveOrder(orderData);
      
      // 문제 6: 복잡한 문자열 결합
      logger.info("주문 저장 완료: " + result.orderId + " 사용자: " + result.userId + " 금액: " + result.amount);
      
      return result;
    } catch (error) {
      // 문제 7: 에러 상황에서 부적절한 로그 레벨
      logger.warn("뭔가 잘못됨");
      throw error;
    }
  }

  async validateOrder(orderData) {
    // 문제 8: 성능 문제 - 반복문 내 INFO 로깅
    const items = orderData.items || [];
    for (let i = 0; i < items.length; i++) {
      logger.info("아이템 검증 중: " + items[i].name);
      
      if (!items[i].price) {
        // 문제 9: 문자열 결합 + 부적절한 레벨
        logger.error("가격 정보 없음: " + items[i].name);
        return { isValid: false };
      }
    }

    // 문제 10: 빈 로그 메시지
    logger.info("");
    
    return { isValid: true };
  }

  async saveOrder(orderData) {
    // 문제 11: 너무 짧은 로그 메시지
    logger.info("저장");
    
    // 문제 12: 플레이스홀더 있지만 매개변수 없음
    logger.info("주문 저장 중: {}");
    
    // 문제 13: 디버그 목적의 로그를 INFO로
    logger.info("test123");
    
    const order = {
      id: Math.random().toString(36),
      ...orderData,
      createdAt: new Date()
    };

    // 문제 14: 비용이 큰 연산을 항상 로깅
    logger.info("전체 주문 데이터: " + JSON.stringify(order));
    
    return order;
  }

  // 문제 15: 일관성 없는 로깅 패턴 (같은 기능을 다른 레벨로)
  async cancelOrder(orderId) {
    logger.debug("주문 취소 시작: " + orderId);  // 다른 곳은 info인데 여기는 debug
    
    try {
      const result = await this.performCancel(orderId);
      logger.warn("주문 취소 완료: " + orderId);  // 성공인데 warn 사용
      return result;
    } catch (error) {
      logger.info("취소 실패: " + error.message);  // 실패인데 info 사용
      throw error;
    }
  }

  async performCancel(orderId) {
    // 문제 16: 중첩 반복문에서 로깅
    const orders = await this.getOrdersByStatus('active');
    for (const order of orders) {
      if (order.items) {
        for (const item of order.items) {
          logger.info("아이템 취소 처리: " + item.id + " 주문: " + order.id);
        }
      }
    }
    
    return { cancelled: true };
  }

  async getOrdersByStatus(status) {
    return [
      { id: '1', items: [{ id: 'a' }, { id: 'b' }] },
      { id: '2', items: [{ id: 'c' }, { id: 'd' }, { id: 'e' }] }
    ];
  }
}