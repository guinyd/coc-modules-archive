/**
 * 统一错误类型与错误处理中间件。
 * 原则：对外只暴露「可预期、已脱敏」的错误信息，绝不返回堆栈或内部结构。
 */

export class HttpError extends Error {
  constructor(status, message, code = 'error') {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.expose = true;
  }
}

export const badRequest = (msg, code = 'bad_request') => new HttpError(400, msg, code);
export const unauthorized = (msg = '未登录', code = 'unauthorized') => new HttpError(401, msg, code);
export const forbidden = (msg = '权限不足', code = 'forbidden') => new HttpError(403, msg, code);
export const notFound = (msg = '资源不存在', code = 'not_found') => new HttpError(404, msg, code);
export const tooMany = (msg = '操作过于频繁，请稍后再试', code = 'rate_limited') => new HttpError(429, msg, code);

/** 404 兜底（仅 API 前缀会走到这里） */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: '接口不存在' });
}

/** 非 HttpError 的 4xx 通用文案：只按状态码给安全话术，绝不回显原始错误信息 */
const CLIENT_ERROR_MESSAGES = {
  400: '请求参数不合法',
  401: '未登录',
  403: '权限不足',
  404: '资源不存在',
  405: '请求方法不被允许',
  408: '请求超时',
  409: '请求冲突',
  413: '请求体过大',
  415: '不支持的请求格式',
  422: '请求参数不合法',
  429: '操作过于频繁，请稍后再试',
};

/** 解析状态码：HttpError 用自身 status；其它错误只认 4xx，其余一律按 500 处理 */
function statusOf(err) {
  if (err instanceof HttpError) return err.status;
  const status = Number(err?.status ?? err?.statusCode);
  return Number.isInteger(status) && status >= 400 && status <= 499 ? status : 500;
}

/** 对外文案：HttpError 保留业务文案；body-parser 与其它 4xx 使用通用文案 */
function messageOf(err, status) {
  if (err instanceof HttpError) return err.expose ? err.message : '服务器内部错误';
  if (err?.type === 'entity.parse.failed') return '请求体不是合法 JSON';
  if (err?.type === 'entity.too.large') return '请求体过大';
  if (status >= 400 && status <= 499) return CLIENT_ERROR_MESSAGES[status] || '请求无法处理';
  return '服务器内部错误';
}

/** 统一错误出口 */
export function errorHandler(err, req, res, _next) {
  const status = statusOf(err);
  const message = messageOf(err, status);
  // 4xx 是客户端问题：不打堆栈，避免畸形请求放大日志；只有真正的 5xx 才记详细日志
  if (status >= 500) {
    // 仅服务端可见的详细日志；响应体不泄露细节
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }
  if (res.headersSent) return;
  res.status(status).json({ error: message });
}
