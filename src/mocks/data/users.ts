import type { IUser } from '../../shared/api/types';

// 로그인이 없는 체험판이므로 고정된 게스트 사용자 한 명으로 동작한다.
const users: IUser[] = [{ id: 1, nickname: '게스트', onboardingProgress: 0b111 }];

export default users;
