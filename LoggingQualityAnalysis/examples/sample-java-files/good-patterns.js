import { logger } from '@bzzmnyd/lib';

export class UserService {
  async createUser(userData) {
    logger.info(`사용자 생성 시작: email=${userData.email}`);
    
    try {
      const validation = await this.validateUser(userData);
      if (!validation.isValid) {
        logger.warn(`사용자 검증 실패: ${validation.reason}`);
        return { success: false, error: validation.reason };
      }

      const user = await this.saveUser(userData);
      logger.info(`사용자 생성 완료: userId=${user.id}, email=${user.email}`);
      
      return { success: true, user };
    } catch (error) {
      logger.error(`사용자 생성 실패: ${error.message}`, { 
        email: userData.email,
        error: error.stack 
      });
      throw error;
    }
  }

  async validateUser(userData) {
    logger.debug(`사용자 검증 중: ${userData.email}`);
    
    if (!userData.email) {
      return { isValid: false, reason: '이메일 필수' };
    }
    
    if (!userData.name) {
      return { isValid: false, reason: '이름 필수' };
    }

    logger.debug('사용자 검증 완료');
    return { isValid: true };
  }

  async saveUser(userData) {
    logger.debug('데이터베이스 저장 시작');
    
    const user = {
      id: Math.random().toString(36),
      name: userData.name,
      email: userData.email,
      createdAt: new Date(),
    };

    logger.info(`사용자 데이터베이스 저장 완료: userId=${user.id}`);
    return user;
  }
}