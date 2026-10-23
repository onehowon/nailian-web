import type { MockHandler } from '../server';
import users from '../data/users';
import { createSuccessResponse } from '../utils/response';

export const userHandlers: MockHandler[] = [
  /** GET /users/me — 내 정보 조회 (체험판은 게스트 고정) */
  {
    method: 'GET',
    path: '/users/me',
    resolver: () =>
      createSuccessResponse(
        { nickname: users[0].nickname, onboardingProgress: users[0].onboardingProgress },
        '내 정보 조회 성공',
      ),
  },
];
