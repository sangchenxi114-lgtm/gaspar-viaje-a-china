# 加斯帕尔南中国行记 · 交互式历史地图 MVP

React / TypeScript / Vite / MapLibre GL JS 实现的阶段04地图初稿，供本地审阅，未公开部署。

## 安装与运行

需要 Node.js 20.19+（或22.12+）与npm。

```sh
cd 004_Interactive_Map_MVP
npm ci
npm run dev
```

Vite开发服务使用5173端口并监听 `0.0.0.0`，端口占用时明确报错。使用浏览器打开开发服务。生产构建与本地构建预览：

```sh
npm run build
npm run preview
```

依赖由 `package-lock.json` 固定；`.npmrc` 将缓存放在项目忽略目录，适用于限制HOME写入的云环境。`node_modules`、缓存、构建及测试输出不提交。无需数据库或付费API密钥。

## 数据与方法

唯一应用数据为 `public/data/places_geocoded.csv`，与阶段03最后修订的 `003_Geocoding_and_Validation/places_geocoded.csv` 字节一致。共14条，sequence=1–14，编号列已按用户指令删除。应用不更改坐标、日期、引述、名称、显示层级或精度字段；无需生成JSON。

CSV以UTF-8 BOM保存，由Papa Parse读取，缺值在展示层处理。日期缺失显示“1882年12月之后”，旁注“原笔记未载确切日期；此标签仅用于展示分组”；不写回日期，也不创建虚构日期的HTML datetime。

- 初始区域概览：珠江三角洲，7条overview记录按城市级记录聚合为5个标记。澳门2条、香港2条、广州1条；虎门、黄埔为独立区域点。底层记录仍保持独立。
- 点击标记：查看该标记关联记录并逐条阅读；广州城市标记提供“探索广州”。
- 广州细读：显示7条detail记录；手动以广州为中心放大到11.5级或以上也自动进入细读。离开广州范围或缩小则回到概览。
- 近邻标记：按屏幕位置合并到可点击的记录列表，放大可分开；锚点使用已有记录坐标，不偏移或改写数据。右侧全部记录始终可选，保证每条可访问。
- 地图／列表选择、可收起面板、桌面／手机布局均支持；原西班牙语及中文译文与现代对应分区阅读。
- `exact`表示现代建筑定位；`approximate`表示近似范围／旧址；`city-level`表示城市代表点。现代坐标不证明作者到访现存建筑，城市级节庆记录不证明精确节庆位置。原location_precision标签保留。
- 不绘制任何旅行连线，不加入历史照片、3D模型、完整时间轴。

## 底图与署名

使用OpenFreeMap托管的Positron矢量底图：`https://tiles.openfreemap.org/styles/positron`。此公开实例无需登记或API密钥；不使用OSM志愿者的标准瓦片服务器。图层元数据自动提供“OpenFreeMap © OpenMapTiles Data from OpenStreetMap”署名及链接，MapLibre在地图上持续显示。

[OpenFreeMap官方说明](https://openfreemap.org/)明确允许在网站和应用中免费使用公开实例，目前没有地图浏览量或请求数量上限，不需要API密钥。按[官方MapLibre快速指南](https://openfreemap.org/quick_start/)接入并保留必需署名。公共实例没有本项目专属服务等级承诺；只请求当前视图需要的图层，不批量预取／下载。本次不部署。

此前直接访问OSM志愿者服务器，可能受到请求识别、Referer、缓存或共享出口策略的阻挡；403页面无法单独确定是哪条规则被触发，详见[OSM瓦片政策](https://operations.osmfoundation.org/policies/tiles/)。替换提供方不改变任何历史数据。

## 验证

```sh
npm test
```

Playwright使用系统Chromium（若存在）；也可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定浏览器，或执行 `npx playwright install chromium` 使用Playwright浏览器。

测试覆盖14条记录加载、概览5个标记、城市聚合、广州7条详细记录、手动缩放切换、关联记录选择、全部14段西班牙语原文与来源链接、6条缺失日期、精度提示、手机布局及面板收起／展开、CSV加载失败提示。

云环境浏览器可能不信任会话代理CA，导致浏览器直接请求瓦片报证书错误。本环境测试对OpenFreeMap图层资源使用**仅测试进程内**的实际HTTPS代理请求，采用平台提供的 `CODEX_PROXY_CERT` 验证TLS，再将真实响应交给测试浏览器。没有关闭TLS验证、没有持久修改浏览器或系统信任库、没有替换成假瓦片；应用代码仍直接使用OpenFreeMap图层。普通本地浏览器不需要该测试适配。

阶段03最后修订仅涉及sequence与编号列，以及相应审核引用。阶段04以修订后的CSV为基准；001、002及其他既有文件保持不变。

## 更新现有Codespaces预览

在仓库根目录运行 `git pull --ff-only`。已经运行的Vite会热更新；回到现有5173端口的预览页面刷新即可。若仍是旧底图，使用强制刷新；若Vite已停止，进入本目录运行 `npm run dev`。此次未改变依赖，无需重新安装。
