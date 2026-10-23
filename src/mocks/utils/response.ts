// 원본 src/mocks/utils/response.ts 와 같은 응답 봉투 { code, message, data }
export const createSuccessResponse = <T>(data: T, message = '요청 성공', code = 200) =>
  new Response(JSON.stringify({ code, message, data }), {
    status: code,
    headers: { 'Content-Type': 'application/json' },
  });

export const createErrorResponse = (message: string, code: number) =>
  new Response(JSON.stringify({ code, message }), {
    status: code,
    headers: { 'Content-Type': 'application/json' },
  });
