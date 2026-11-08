# 龙外教学云平台（cn.edu.hiu.cloud）

黑龙江外国语学院教学云平台（jxypt.hiu.edu.cn，BladeX 微服务架构）的 App 原生插件。
提供登录、待办作业与测验、作业详情与截止时间、直播课程、学情概览。

## 版本记录

- **1.0.1**：修复验证码解析——真实接口返回 BladeX R 包装 `{code,success,data:{key,image}}`，此前按顶层字段解析导致「无法加载验证码」。已用真实接口探测确认。
- **1.0.0**：首发。

## 使用说明

1. 在 App 插件页安装本插件（`dist/cn.edu.hiu.cloud-1.0.0.eduplugin`），打开「教学云平台」页面。
2. 首次进入会自动加载云平台登录验证码，输入云平台账号、密码和图片验证码后点「登录」。
   - 密码只用于本次 MD5 摘要提交（与学校网页端行为一致），不会写入插件状态或本地存储。
   - 登录成功后令牌保存在宿主 storage，下次进入自动恢复，无需重复登录。
3. 登录后可查看：
   - **待办作业与测验**：调 `GET /api/ykt-site/site/student/undone`，点条目进入详情（`GET /api/ykt-site/assignment/student-detail?assignmentId=`）。
   - **直播课程**：调 `GET /api/ykt-site/web/live/course-list`，点条目经 `navigation.url` 跳系统浏览器观看（效果层没有视频播放器）。
   - **学情概览**：当前版本以待办数据聚合（类型/课程分布、最近截止），专门学情接口待真实账号确认。
4. 「退出登录」清除本地令牌并重新加载验证码。

## 已知平台约束（重要）

宿主网络契约（`checkNetworkRequest`）只放行 `accept / content-type / x-requested-with / referer / authorization(Bearer) / x-token` 头，
因此与学校网页端相比有两处降级，**真机验证待进行**：

| 项目 | 网页端 | 本插件 |
| --- | --- | --- |
| 门户认证 | `Authorization: Basic portal:portal_secret` 头 | Spring OAuth 表单参数回退：`client_id`/`client_secret` 进 form |
| 租户 | `Tenant-Id: 000000` 头 | form 参数 `tenantId=000000` |
| 业务令牌 | `Blade-Auth: <token>` 头 | `Authorization: Bearer <token>` |

若真机联调发现网关不认表单认证或 Bearer，可选方案：`network[].authHeader: 'X-Token'` + `network.request@3`
（发 `X-Token` 头），或由服务端代理补头。

## 验证范围

- TypeScript 编译、manifest 契约、QuickJS 离线协议装置（5 个 fixture 用例 + 4 个场景 27 步）全部通过。
- **接口已实测确认（2026-10-29，未登录探测）**：
  - `GET /api/ykt-basics/oauth/captcha` 返回 R 包装 `{code:200,success:true,data:{key,image(data:image/png;base64,…)}}`；
  - `POST /api/ykt-basics/oauth/token` **接受表单认证回退**（无 Basic 头，form 带 `client_id/client_secret/tenantId`），错误响应为 401 + `{error:"unauthorized",error_description:"…"}`（含剩余尝试次数提示）。
- 待办/详情/直播/学情为离线合成样本，待真实账号登录后验收。
- MD5 为 RFC 1321 公有领域实现移植，已用 RFC 已知向量验证。
