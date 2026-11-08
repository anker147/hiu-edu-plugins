# 黑龙江外国语学院

教务入口：`https://jwxt.hiu.edu.cn/jsxsd`。扩展型适配（`kind: extension`，继承 `builtin.qz_old` 家族标识）：登录与学期/课表查询由本插件实现，成绩、考试、选退课查询复用内置旧强智协议。

## 适配依据（2026-10-28 实测）

- 登录页表单 POST `/jsxsd/xk/LoginToXk`，字段 `loginMethod=LoginToXk`、`userAccount`、`userPassword`（提交时清空）、`RANDOMCODE`（验证码 `/jsxsd/verifycode.servlet`）与 `encoded=base64(user)+"%%%"+base64(password)`（页面函数 `submitForm1`，`encodeInp` 即 base64）。
- 登录成功后 302 到 `/jsxsd/framework/xsMain.htmlx`。
- 框架页 `xsMain.jsp` 无内置协议可识别的身份选择器；其 iframe 为 `xsMain_new.htmlx`（协议只认 `xsMain_new.jsp`）；学号与姓名实际位于登录设置页 `/jsxsd/grsz/grsz_xggrxx.do?type=dlym` 的 `input#account` 与 `input#realName`。内置 `qz_old` 在该校会以 `PAGE_CHANGED`（学校未返回可识别的学号）失败——这正是 1.0.0 配置型适配在真机上的表现。
- 学校统一身份认证平台为 `https://cas.hiu.edu.cn/authserver/login`，教务登录页不引用 CAS，直登不经过 CAS；仍以 `allowedAcademicHosts` 声明供共享教务登录使用。

## auth 流程（本扩展实现，1.3.0 起为验证码直登）

1. `auth.start` 记录账号并直接请求 `/jsxsd/verifycode.servlet` 验证码图片（该请求自身会建立教务会话，验证码与该会话绑定），返回验证码挑战由 App 弹窗展示。
2. `auth.resume` 携带用户输入的验证码提交 `LoginToXk`：`loginMethod=LoginToXk`、`userAccount`、`userPassword`（提交时清空）、`RANDOMCODE` 与 `encoded=base64(user)+"%%%"+base64(password)`；验证码错误时自动重新弹码。**1.3.2 起登录成功后直接从登录响应（`xsMain.htmlx` 的 `div.userInfo p`）解析姓名完成认证，不再二次请求 `grsz` 设置页**；若响应未带身份块则自动回退旧路径。密码由宿主凭据机制保存，重新登录通常只需输入验证码。
3. `auth.refreshCaptcha` 重新取验证码图片。
4. `auth.validate`：GET `framework/xsMain.jsp` 判定登录态；1.3.2 起框架页自带身份块时单请求完成（学号用 start 时存下的账号），否则回退 `grsz` 补一次请求。账号与登录账号不一致时拒绝。
5. 1.2.0 及之前版本采用内置网页登录（webLogin），1.3.0 改为表单直登，不再唤起内置浏览器。

## 为什么登录要省请求（1.3.2）

公网 DNS 把 `jwxt.hiu.edu.cn` 解析为 **A=10.2.2.74（内网地址）+ AAAA=2409:871a:…（公网 IPv6）**。
校外网络（如手机流量）下 10.2.2.74 是黑洞：宿主每个请求的**首次 TCP 连接**都会先试它并干等约 20 秒超时，
重试才走 IPv6 成功；宿主对同一操作内的多个请求**不复用连接**，因此每个请求都要交一次「20 秒税」。
登录流程请求数越多越容易撞上宿主脚本时间预算（表现为间歇性 `TIMEOUT`、「不知道什么时候就无法登录」）。
1.3.2 把 resume 与 validate 各减一个请求；根治需学校在公网 DNS 上为 jwxt 发布公网 A 记录（或只发布可达地址）。

## study 覆盖（本扩展实现）

内置协议的学期/课表流程按菜单链接解析入口，本校菜单里课表是根相对路径 `/xskb/xskb_list.do`（框架页为 `.htmlx`，协议的 `.jsp` 菜单匹配不到），因此 `study.terms` 与 `study.schedule` 由本扩展直接按 basePath 请求，页面解析复用公共协议库。

课表页行标签为「第一大节…第六大节」（第 n 大节 = 第 2n-1~2n 节，与详情 tooltip 的 `[01-02节]` 一致），内置解析器的行节次识别不支持「大节」写法，`study.schedule` 在解析前把行标签改写为对应的节数区间，其余解析逻辑不变。

## 验证状态

- 登录链路（验证码直登 → `LoginToXk` → 302 → `xsMain.jsp` → `grsz` 身份提取）已于 2026-10-28 使用真实账号在服务器侧完整实测通过（1.3.0 直登流），学号/姓名提取正确。
- 1.3.2 的登录响应直接解析身份已于 2026-10-29 用真实账号实测：`xsMain.htmlx` 中 `div.userInfo > p` 即姓名（唯一匹配），且页面同时满足登录态指纹（学期理论课表/退出登录）。
- `study.terms` 与 `study.schedule` 已于 2026-10-28 使用真实账号在服务器侧实测通过：学期列表与当前学期正确；2025-2026-2、2026-2027-1 两个学期课表均能解析出课程、教师、教室、星期、节次与周次（含同一时段分周次换教室的多段条目）。
- 成绩已于真机验证可拉取（1.1.0）；考试、选退课查询未经真实账号逐项验证；未执行选退课。

## 参考实现

扩展结构与重庆工信职业学院（cqiivc）一致；差异为本校身份页与 `xsMain.htmlx` 完成地址。
