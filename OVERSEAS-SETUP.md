# 海外上线

代码已经包含 Render 免费 Web Service 配置，前端与 AI 后端一起部署。AI 需要独立账号和可用 API 额度；托管免费不意味着模型调用免费。

1. 在 https://platform.deepseek.com/ 注册，创建 API Key，确认账户有可用额度。不要把 Key 发到聊天或提交 GitHub。
2. 在 https://dashboard.render.com/ 用 GitHub 登录。选择 New → Blueprint，授权访问 `zhuomu33/language` 仓库，使用仓库中的 `render.yaml`。
3. 在 Render 提示的 `CHAT_API_KEY` 字段填密钥。检查方案是 Free 后部署。不需要中国大陆备案。
4. 服务成功后复制 `https://你的名称.onrender.com`。在 Render 的 Environment 查看自动生成的 `APP_TOKEN`，仅在自己的 App 设置中填写这个连接口令和服务地址。
5. 点“保存并检查连接”。文章读完后点击“继续学习下一篇”，会生成并保存新文章、中文解析和选择题。无网或生成失败不会推进进度。已保存的当前文章可离线继续读。

若已有其他支持 Chat Completions 和 JSON 输出的服务，可更换 `CHAT_BASE_URL`、`CHAT_MODEL` 和 `CHAT_API_KEY`。地址不含 `/chat/completions`。密钥仅保存在 Render 环境变量。DeepSeek 用于文章生成和追问，不提供本项目的自然语音；语音继续使用手机系统，现有百炼语音接口可另行配置 `DASHSCOPE_API_KEY` 后开启。

免费服务可能休眠，首次连接需要等待唤醒。遇到超时可先打开网站再重试；不要卸载 App。Render 免费实例磁盘不用于保存学习进度，本项目进度仍在手机原生存储和导出备份中。网页与 App 不会自动跨设备同步，换到网页学习需先导出/恢复备份。

当前生成范围是明确标注的 AI 原创故事。近期真实新闻需要另外接入可核验新闻来源，不能用生成模型编造新闻。

参考：https://render.com/docs/blueprint-spec 、https://api-docs.deepseek.com/guides/json_mode 。
