import type {AcademicPlugin, AuthState, HostSdk, Result, ErrorCode, Term, HttpResponse, Context} from '../../../sdk/index';
import type {Env} from '../../../protocols/3.2.3/shared/common';
import {app, request, nodes, fields, action, query, ok, changed} from '../../../protocols/3.2.3/shared/common';
import {studyPage} from '../../../protocols/3.2.3/shared/study';
import {htmlSchedule, selectedTerm, terms, term} from '../../../protocols/3.2.3/shared/study-parser';

// 黑龙江外国语学院 jwxt.hiu.edu.cn（强智旧版 /jsxsd）。
// auth：账号密码 + 验证码弹窗直登（POST /xk/LoginToXk，encoded=base64(user)+"%%%"+base64(password)，
// 验证码 /verifycode.servlet 与登录会话绑定）。身份优先从登录响应（xsMain.htmlx 的 div.userInfo p）
// 直接解析，省一次 grsz 请求：公网 DNS 把 jwxt 解析到内网地址 10.2.2.74（AAAA 才是公网 IPv6），
// 校外每个请求的首次连接都会先撞约 20 秒黑洞且宿主不复用连接——少一个请求就少一次超时。
// study.terms / study.schedule：菜单里的课表链接是根相对路径 /xskb/xskb_list.do，
// 内置协议 resolve 后丢失 /jsxsd 前缀，导致学期与课表为空；此处直接按 basePath 请求，
// 解析复用公共协议库（HIU 行标签为「第 n 大节」，见 hiuSchedule 内注释）。成绩、考试与选课由宿主回落到内置 qz_old。

const academic = 'https://jwxt.hiu.edu.cn';
const base_ = academic + '/' + 'jsxsd';
const loginEntry = base_ + '/xk/LoginToXk';
const captchaEntry = base_ + '/verifycode.servlet';
const profile = base_ + '/grsz/grsz_xggrxx.do?type=dlym';
const schedulePath = 'xskb/xskb_list.do';
function fail(code: ErrorCode, message: string): never { throw Object.assign(new Error(message), {code}); }
interface Pending {id: string; expires: number; username: string; password: string}
const env = (s: HostSdk, c: Readonly<Context>): Env => ({s, c, family: 'qz_old'});

async function pending(s: HostSdk, id: string) {
  const p = await s.state.get<Pending>('pending');
  if (!p || p.id !== id || p.expires < Date.now()) {
    await s.state.remove('pending');
    fail('SESSION_EXPIRED', '登录验证已过期，请重新开始');
  }
  return p;
}
// 弹出验证码：图片与当前教务会话绑定（verifycode.servlet 会建立会话），resume 提交时须为同一会话。
async function challenge(s: HostSdk, p: Pending): Promise<Result<AuthState>> {
  const cap = await s.http({url: captchaEntry, purpose: 'auth', responseType: 'base64'});
  const mime = ((cap.headers && (cap.headers['Content-Type'] || cap.headers['content-type'])) || 'image/jpeg').split(';')[0] || 'image/jpeg';
  if (cap.status !== 200 || !cap.body) fail('NETWORK_RETRYABLE', '学校验证码获取失败，请重试');
  return ok({status: 'captcha', continuationId: p.id, imageBase64: cap.body, mimeType: mime});
}
// 登录页指纹：会话失效时学校返回强智登录表单而不是个人页。
function loggedIn(page: string) {
  return /退出登录|学期理论课表|选课结果|学生个人中心/.test(page) && !/name="userAccount"/.test(page);
}
// 从登录设置页提取学号与姓名。
async function identity(s: HostSdk): Promise<Result<AuthState>> {
  const info = await s.http({url: profile, purpose: 'query'});
  if (info.status >= 500) fail('NETWORK_RETRYABLE', '学校教务暂时不可用');
  if (info.status !== 200 || /name="userAccount"/.test(info.body)) fail('SESSION_EXPIRED', '黑龙江外国语学院教务登录已失效');
  const account = s.html.select(info.body, 'input#account')[0]?.attributes?.value?.trim() || '';
  const realName = s.html.select(info.body, 'input#realName')[0]?.attributes?.value?.trim() || '';
  if (!account) fail('SESSION_EXPIRED', '请先在学校网页完成教务登录');
  const stored = await s.state.get<string>('account');
  if (stored && stored !== account) fail('INVALID_CREDENTIALS', '登录账号与当前账号不一致');
  await s.state.remove('pending');
  return ok({status: 'authenticated', studentId: account, studentName: realName});
}
// 登录响应（xsMain.htmlx）自带身份块：div.userInfo p 为姓名、其后 span 为身份（学生）。
// 直接解析即可完成认证，移动网络下可省一次 grsz 请求（少挨一次首连黑洞超时）。
async function identityFromLogin(s: HostSdk, body: string, username: string): Promise<Result<AuthState>> {
  const realName = s.html.select(body, 'div.userInfo p')[0]?.text?.trim() || '';
  if (!realName) return identity(s);
  const stored = await s.state.get<string>('account');
  if (stored && stored !== username) fail('INVALID_CREDENTIALS', '登录账号与当前账号不一致');
  await s.state.remove('pending');
  return ok({status: 'authenticated', studentId: username, studentName: realName});
}
async function validate(s: HostSdk): Promise<Result<AuthState>> {
  const main = await s.http({url: base_ + '/framework/xsMain.jsp', purpose: 'query'});
  if (main.status >= 500) fail('NETWORK_RETRYABLE', '学校教务暂时不可用');
  if (main.status !== 200 || !loggedIn(main.body)) fail('SESSION_EXPIRED', '黑龙江外国语学院教务登录已失效');
  // 框架页若自带身份块则一步完成校验（学号用 start 时存下的账号）；否则退回 grsz 设置页补一次请求。
  const realName = s.html.select(main.body, 'div.userInfo p')[0]?.text?.trim() || '';
  const stored = realName ? await s.state.get<string>('account') : '';
  if (realName && stored) return ok({status: 'authenticated', studentId: stored, studentName: realName});
  return identity(s);
}

function calendarTerm(): Term | undefined {
  const d = new Date(), year = d.getUTCMonth() >= 7 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return term(year + '-' + (year + 1) + '-' + (d.getUTCMonth() >= 7 || d.getUTCMonth() < 1 ? 1 : 2)) || undefined;
}
// 与内置 studyTerms 相同的合并逻辑，仅把课表页来源换成按 basePath 的直接请求。
async function hiuTerms(_a: unknown, c: Readonly<Context>, s: HostSdk) {
  const e = env(s, c);
  const items: Term[] = [], selected: Term[] = [];
  let firstError: unknown;
  const loads: (() => Promise<HttpResponse>)[] = [
    () => request(e, app(e, schedulePath), undefined, 'query'),
    () => studyPage(e, 'grades'),
  ];
  for (const load of loads) {
    try {
      const page = await load(), current = selectedTerm(e, page.body);
      items.push(...terms(e, page.body));
      if (current) {items.push(current); selected.push(current);}
    } catch (error) {
      if (!['NETWORK_RETRYABLE', 'PAGE_CHANGED', 'UNSUPPORTED', 'NOT_OPEN'].includes((error as {code?: string}).code || '')) throw error;
      firstError ??= error;
    }
  }
  const unique = [...new Map(items.map(t => [t.id, t])).values()].sort((a, b) => b.id.localeCompare(a.id));
  if (!unique.length) {if (firstError) throw firstError; changed('学校未返回可识别的学期选项，请刷新学期列表');}
  const current = selected[0] || unique.find(t => t.id === calendarTerm()?.id) || unique[0];
  return ok({items: unique, currentId: current.id});
}
// 与内置 qz schedule 相同的表单提交流程，仅页面来源改为按 basePath 的直接请求。
async function hiuSchedule(a: {termId: string}, c: Readonly<Context>, s: HostSdk) {
  const e = env(s, c);
  const page = await request(e, app(e, schedulePath), undefined, 'query');
  const forms = nodes(e, page.body, 'form');
  const candidates = forms.filter(f => nodes(e, f.html, '[name=xnxq01id]').length);
  if (candidates.length > 1 || !candidates.length && forms.length > 1) changed('无法确定学校课表查询表单');
  const f = candidates[0] || forms[0];
  const data = {...(f ? fields(e, f) : {}), xnxq01id: a.termId, zc: ''};
  const url = f ? action(f, page) : page.url;
  if (!url.split('?')[0].endsWith('/' + schedulePath)) changed('学校课表查询地址已变化');
  const response = await request(e, f?.attributes.method?.toLowerCase() === 'post' ? url : query(url, data),
    f?.attributes.method?.toLowerCase() === 'post' ? data : undefined, 'query', page.url);
  const returned = selectedTerm(e, response.body);
  if (returned && returned.id !== a.termId) changed('学校未返回所选学期的课表');
  // HIU 课表行标签为「第一大节…第六大节」，内置解析器的行节次识别不支持「大节」写法。
  // HIU 固定映射：第 n 大节 = 第 2n-1~2n 节（与页面详情里的 [01-02节] 提示一致），
  // 预处理改写成解析器可识别的区间形式后再交给公共解析器。
  const entries = htmlSchedule(e, response.body.replace(/第([一二三四五六七八])大节/g, (_all: string, cn: string) => {
    const n = '一二三四五六七八'.indexOf(cn) + 1;
    return String(2 * n - 1) + '-' + String(2 * n);
  }));
  return ok({termId: a.termId, entries, maxWeeks: Math.max(25, ...entries.flatMap(r => r.weeks))});
}

export default {
  auth: {
    start: async (a, _c, s) => {
      const username = a.username.trim();
      await s.state.set('account', username);
      const p = {id: 'login_' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2), expires: Date.now() + 15 * 60_000, username, password: a.password};
      await s.state.set('pending', p);
      // verifycode.servlet 自身会建立教务会话，无需先请求登录页（省一次大页面请求）。
      return challenge(s, p);
    },
    resume: async (a, _c, s) => {
      const p = await pending(s, a.continuationId);
      const code = (a.captcha || '').trim();
      if (!code) return challenge(s, p);
      const encoded = (await s.crypto.base64(p.username)) + '%%%' + (await s.crypto.base64(p.password));
      const res = await s.http({url: loginEntry, method: 'POST', purpose: 'auth',
        form: {loginMethod: 'LoginToXk', userAccount: p.username, userPassword: '', RANDOMCODE: code, encoded}});
      if (res.status >= 500) fail('NETWORK_RETRYABLE', '学校教务暂时不可用');
      if (res.status === 200 && (loggedIn(res.body) || /framework\/xsMain/.test(res.url || ''))) return identityFromLogin(s, res.body, p.username);
      if (/验证码|校验码/.test(res.body)) return challenge(s, p);
      fail('INVALID_CREDENTIALS', '账号、密码或验证码不正确');
    },
    refreshCaptcha: async (a, _c, s) => challenge(s, await pending(s, a.continuationId)),
    validate: async (_a, _c, s) => validate(s),
  },
  study: {
    terms: hiuTerms,
    schedule: hiuSchedule,
  },
} satisfies AcademicPlugin;
