# Windows 安装到自己的 iPhone

目标仓库：https://github.com/zhuomu33/language

## 构建 IPA

GitHub Actions 的 Build unsigned IPA 执行锁定依赖安装、网页构建、Capacitor iOS 项目生成及未签名真机编译。成功后下载 daily-page-ipa artifact，解压取得 daily-page.ipa。

私有仓库消耗账号的 Actions 免费额度，并非无限免费。不要启用付费额度或升级套餐来运行此项目；额度不足时暂停构建。生成的 IPA 保留三天。

Windows 本地可运行：

```sh
npm ci
npm run build:web
node verify-release.mjs
npx cap add ios
npx cap sync ios
```

cap add ios 仅在尚无 ios 目录时执行。Windows 无法执行 Xcode 编译；只有云端成功构建才表示 IPA 已生成。

## 个人安装

按 AltStore Classic 官方 Windows 安装说明准备 AltServer 和所需 Apple 驱动。用数据线连接 iPhone，确认信任电脑，再用自己的 Apple ID 安装 AltStore 并导入 IPA。

登录、双重认证、设备信任和开发者模式确认需要本人操作。不要把密码、验证码或令牌上传到仓库。免费开发签名需定期刷新，实际限制以 Apple 和 AltStore 当期规则为准。

当前包是 Capacitor 容器中的学习原型；AI、录音评分和原生语音插件尚未实现。

## 正式 App Store

另需开发者计划、签名、隐私说明、应用元数据及审核。未签名 IPA 仅用于个人侧载，不能直接用于 App Store 发布。
