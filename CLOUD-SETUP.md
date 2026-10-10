# 开通追问和自然语音

海外部署及连续生成文章请优先看 [OVERSEAS-SETUP.md](OVERSEAS-SETUP.md)。下方保留百炼语音的可选配置。

本版已实现阿里云百炼接口，但需要你的账号、密钥和一个手机可访问的 HTTPS 后端才能实际调用。没有配置时不会模拟 AI 回答。云端服务可能收费，免费额度以控制台为准。

1. 打开 [阿里云百炼控制台](https://bailian.console.aliyun.com/)，注册或登录并按控制台要求开通服务、完成实名。
2. 在中国内地 / 北京地域创建 API Key，确认可调用 `qwen-plus` 和 `qwen3-tts-instruct-flash`。不要将 Key 发到聊天或上传仓库。
3. 在本机项目目录创建 `.env`（已被 Git 忽略），按下面的模板填写。`APP_TOKEN` 是你生成的独立随机口令，不是百炼密钥。

```dotenv
DASHSCOPE_API_KEY=在本机填写百炼密钥
APP_TOKEN=填写至少24位随机连接口令
PORT=4173
HOST=127.0.0.1
```

在 PowerShell 生成连接口令：`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`。

运行 `npm ci`、`npm run build:web`，然后 `node --env-file=.env server.mjs`（Node.js 20.12 或更新版本）。本机可先打开 http://localhost:4173 。

4. 手机使用时，将 `server.mjs` 与 `release/` 放到你选择的国内可访问 Node.js 主机，配置上述环境变量和 HTTPS。部署平台通常要求 `HOST=0.0.0.0` 和平台指定的 `PORT`。若提供网页版，在 `ALLOWED_ORIGINS` 中填完整 HTTPS 站点来源；多个来源用英文逗号分隔。不能把 localhost 当成手机连接电脑的地址。
5. 在 App 设置填写后端 HTTPS 地址和 `APP_TOKEN`，点击“保存并检查连接”，将朗读来源切换到“云端自然语音”。从阅读页下载本文语音后，可以离线重复播放。

系统德语/英语音色下拉只影响系统语音。云端可通过 `TTS_VOICE_DE`、`TTS_VOICE_EN` 配置音色，默认 Cherry。当前模型使用口音指令请求标准德语、英式英语；实际口音应在账号开通后试听确认，不保证指令百分之百遵循。

API Key 只存在后端环境变量。App 只保存连接口令；学习记录导出不包含连接口令或 API Key。服务限流为每分钟 60 次、同时最多 3 次请求；不要与其他人共享个人口令。没有账号云同步，也不在服务器保存学习记录。

# 更新与进度

保持 `com.daily.page.language`、同一 Apple ID 签名与安装身份；用 AltStore 覆盖更新。首次新版本启动自动读取旧版 localStorage，迁移到原生 Preferences，同时保留网页副本。后续启动在渲染前恢复最新有效快照，数据版本不与软件版本绑定。不要卸载后重装来更新。

设置中可导出 JSON 到 iPhone“文件”App，再通过恢复备份导入。导入覆盖现有记录，操作前需确认，并保留一份本机回滚快照。备份包含生词、字号/学习设置、课程进度；不包含音频缓存和聊天临时记录。卸载、换机、系统故障仍需外部备份。

点阵每点代表一篇已完成学习（约 15 分钟），德语显示 A1 至 A2，再向原目标 B1 前进；英语 B2 至 C1。初始计划分别为 180 / 320 篇，仅为可调整的个人规划，不是依据学习次数判定 CEFR 等级。当前仍只有每种语言两篇内置示例，AI 追问不会自动扩充课程。

参考：[Time Timer 的 ADHD 可视化计时设计](https://www.timetimer.com/pages/adhd)、[百炼语音 API](https://help.aliyun.com/zh/model-studio/qwen-tts-api)。点阵是学习量可视化，不是医疗或 ADHD 治疗工具。

# 开发校验

`npm test` 校验迁移数据格式和服务端接口契约。启动本机服务后，运行 `node verify-mobile.cjs` 和 `node verify-native.cjs` 校验移动界面、备份恢复及原生存储迁移流程（原生桥使用测试替身）。需先 `npx playwright install chromium`，或用 `TEST_BROWSER` 指向已有 Chromium。脚本生成 `*-verification.tmp.json` 报告及 `*-check.tmp.png` 截图，可在查验后删除。云端真实音质和真机签名覆盖升级需要实际账号与 iPhone 验证。
