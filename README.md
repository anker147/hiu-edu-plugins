# hiu-edu-plugins · 黑龙江外国语学院校园插件

为 [校园插件开发套件](https://github.com/)（SDK 3.7.2 / API v3，GPL-3.0）编写的黑龙江外国语学院适配插件集合。本仓库只包含自研插件，不包含套件本体与参考实现。

## 插件列表

### [hiu](./hiu/) · 教务一体化适配 `cn.edu.hiu.academic`

- **形态**：`extension`，继承 `builtin.qz_old`（强智旧版协议库）
- **登录**：验证码弹窗直登（1.3.0 起不再唤起内置浏览器）。1.3.2 起登录响应自带身份块（`xsMain.htmlx` 的 `div.userInfo p`），直接解析姓名完成认证，少一次网络请求
- **覆盖**：`auth.*` 全组、`study.terms`、`study.schedule`（「第 n 大节 = 2n-1~2n 节」的行标签预处理）；成绩/考试/选课由宿主回落到内置 qz_old
- **实测**：登录、学期、2025-2026-2 / 2026-2027-1 两学期课表均已用真实账号在服务器侧验证；成绩已真机验证

### [hiu-cloud](./hiu-cloud/) · 教学云平台 `cn.edu.hiu.cloud`

- **形态**：`native`（原生页面，BladeX 架构，jxypt.hiu.edu.cn）
- **功能**：登录（验证码图 + 密码 MD5）、待办作业与测验、作业详情与截止时间、直播课程（跳系统浏览器）、学情概览
- **协议要点**：宿主网络契约只放行白名单头，BladeX 的 Basic/Tenant-Id/Blade-Auth 头发不出去——采用 Spring OAuth 表单认证回退（`client_id/client_secret/tenantId` 进 form）+ `Authorization: Bearer`，已实测被网关接受
- **状态**：离线合成样本 + 场景测试全绿；真实账号验收待登录凭据确认（密码与教务系统相互独立）

## 已知问题与适配笔记

- **公网 DNS 把 `jwxt.hiu.edu.cn` 解析到内网地址**（A=10.2.2.74 + AAAA=公网 IPv6）：校外网络下每个请求的首次 TCP 连接会先撞内网黑洞约 20 秒，重试才走 IPv6；宿主不复用连接，因此插件尽量压缩登录流程的请求数（v1.3.2 核心 change）。根治需学校在公网 DNS 发布可达的 A 记录
- 云平台验证码返回 BladeX R 包装层 `{code,success,data:{key,image}}`，解析需解包 `.data`

## 本地构建与验证

```bash
npm ci
npm run plugin -- check hiu
npm run plugin -- test hiu        # 12 fixtures
npm run plugin -- pack hiu        # → dist/cn.edu.hiu.academic-*.eduplugin
npm run plugin -- test hiu-cloud  # 32 fixtures（5 用例 + 4 场景 27 步）
npm run plugin -- pack hiu-cloud
```

> 需要先取得官方套件本体（含 `cli/`、`sdk/`、`protocols/`、协议锁）并让本仓库的两个插件目录位于其 `plugins/` 下运行。

## 许可与合规

- 代码以 GPL-3.0 许可发布（见 [LICENSE](./LICENSE)）
- fixtures 全部为**离线合成样本**，不含任何真实账号、密码、Cookie 或可识别个人信息
- 学校接口行为描述仅用于互操作性适配
