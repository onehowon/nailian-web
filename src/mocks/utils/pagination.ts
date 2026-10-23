// 원본 src/mocks/utils/pagination.ts 와 같은 모양의 응답을 만든다.
// 단, 실제 앱 클라이언트(useInfiniteQuery)는 page 를 0부터 보내고
// currentPage < totalPages - 1 이면 다음 페이지를 부르므로, 여기서는 0부터 센다.
const createPaginatedResponse = <T>(items: T[], page: number, size: number) => {
  const totalElements = items.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));
  const start = currentPage * size;
  return {
    pageInfo: { currentPage, totalPages, totalElements },
    content: items.slice(start, start + size),
  };
};

export default createPaginatedResponse;
