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

CSV以UTF-8 BOM保存，由Papa Parse读取。改版后只显示笔记有记载的日期；缺日期简记“原笔记未载确切日期”，不写回推定日期，不显示null或空白字段。

- 初始区域概览：珠江三角洲，7条overview记录按城市级记录聚合为5个标记。澳门2条、香港2条、广州1条；虎门、黄埔为独立区域点。底层记录仍保持独立。
- 点击标记：查看该标记关联记录并逐条阅读；广州城市标记提供“探索广州”。
- 广州细读：显示7条detail记录；手动以广州为中心放大到11.5级或以上也自动进入细读。离开广州范围或缩小则回到概览。
- 近邻标记：按屏幕位置合并到可点击的记录列表，放大可分开；锚点使用已有记录坐标，不偏移或改写数据。右侧全部记录始终可选，保证每条可访问。
- 地图／列表选择、可收起面板、桌面／手机布局均支持；原西班牙语及中文译文与现代对应分区阅读。
- 精度及不确定性仍完整保留在CSV。改版不再在阅读面板显示数据库标签、徽章或通用警告框；原本据阶段03审核展示的地点札记，现按本轮指令只保留源文本而不渲染。现代坐标不证明作者到访现存建筑，城市级节庆记录也不证明精确节庆位置。
- 原概览／细读视图不绘制旅行连线；独立“行踪漫游”以示意线呈现用户指定叙事顺序，不加入历史照片、3D模型或完整时间轴。

## 底图与署名

使用OpenFreeMap托管的Positron矢量底图：`https://tiles.openfreemap.org/styles/positron`。此公开实例无需登记或API密钥；不使用OSM志愿者的标准瓦片服务器。图层元数据自动提供“OpenFreeMap © OpenMapTiles Data from OpenStreetMap”署名及链接，MapLibre在地图上持续显示。

[OpenFreeMap官方说明](https://openfreemap.org/)明确允许在网站和应用中免费使用公开实例，目前没有地图浏览量或请求数量上限，不需要API密钥。按[官方MapLibre快速指南](https://openfreemap.org/quick_start/)接入并保留必需署名。公共实例没有本项目专属服务等级承诺；只请求当前视图需要的图层，不批量预取／下载。本次不部署。

此前直接访问OSM志愿者服务器，可能受到请求识别、Referer、缓存或共享出口策略的阻挡；403页面无法单独确定是哪条规则被触发，详见[OSM瓦片政策](https://operations.osmfoundation.org/policies/tiles/)。替换提供方不改变任何历史数据。

## 验证

```sh
npm test
```

Playwright使用系统Chromium（若存在）；也可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定浏览器，或执行 `npx playwright install chromium` 使用Playwright浏览器。

测试覆盖14条记录加载、概览5个标记、城市聚合、广州7条详细记录、手动缩放切换、关联记录选择、全部14段西班牙语原文与来源链接、6条缺失日期、考证札记不渲染及介绍链接限制、手机布局及面板收起／展开、CSV加载失败提示。

云环境浏览器可能不信任会话代理CA，导致浏览器直接请求瓦片报证书错误。本环境测试对OpenFreeMap图层资源使用**仅测试进程内**的实际HTTPS代理请求，采用平台提供的 `CODEX_PROXY_CERT` 验证TLS，再将真实响应交给测试浏览器。没有关闭TLS验证、没有持久修改浏览器或系统信任库、没有替换成假瓦片；应用代码仍直接使用OpenFreeMap图层。普通本地浏览器不需要该测试适配。

阶段03最后修订仅涉及sequence与编号列，以及相应审核引用。阶段04以修订后的CSV为基准；001、002及其他既有文件保持不变。

## 更新现有Codespaces预览

在仓库根目录运行 `git pull --ff-only`。已经运行的Vite会热更新；回到现有5173端口的预览页面刷新即可。若仍是旧底图，使用强制刷新；若Vite已停止，进入本目录运行 `npm run dev`。此次未改变依赖，无需重新安装。

## 封面视觉改版

原有地图导航、标记聚合与记录选择保留；纸页改为浮动在地图上方，独立滚动并可收起。缩放控件移到左上，地图为右侧纸页预留可视空间；手机采用可收起的浮动阅读页，不遮挡顶部控件。原文与译文紧邻，地点介绍链接降低视觉优先级；本轮已移除考证札记的界面展示。

配色仅参照用户所给书封：深蓝、墨蓝、印刷朱红、赭褐和旧纸金色。纸页为不透明暖纸色，细线和轻微纸纹，没有渐变或玻璃效果。字体系本地衬线字体栈（Georgia／Palatino及思源宋体／Noto Serif CJK SC／宋体），不依赖远程字体服务。

`public/gaspar-lettering.png` 为依据用户封面“E. GASPAR”字样制作的透明辅助抠图资产，原封面没有被改写。没有用网页字体替代该图像字标。但图像处理可能重构边缘细节，**不能保证与封面原件逐像素一致**，不应作为档案级字样数字化成果；需要高保真再版时仍需原扫描件的可复核像素级提取。

### 可选页码

支持CSV中的可选 `page_number` 字段；目前权威CSV无此字段，所有真实记录的页码引用均隐藏。将来提供已核实值后，`45`显示 `p. 45`，`45–46`或`45-46`显示 `pp. 45–46`，分别放在西班牙语与中文引文下方。缺值、null、非法页码不显示；不从sequence或日期推算页码，不更改阶段03 Excel。自动测试中的45等值仅为测试夹具，不写入真实数据。

`historical_notes`也作为可选字段读取；未提供时，相关简短札记整理自既有阶段03审核记录，并非新增历史识别结论；现保存在src/researchNotes.ts而不显示。

## 临时分享给教授：现有GitHub Codespaces

不使用GitHub Pages、Vercel或任何永久部署，也不改仓库隐私。请在**现有Codespace**中操作：

1. 在仓库根目录的新终端执行 `git pull --ff-only origin main`。若提示本地修改冲突，先保留本地修改，不要使用强制重置。
2. 在运行旧Vite的终端按 `Ctrl+C` 停止它；回到步骤1位于仓库根目录的新终端，运行：

   ```sh
   cd 004_Interactive_Map_MVP
   npm ci
   npm run dev
   ```

   本次配置允许当前Codespace环境变量推导出的准确转发主机名，不使用 `allowedHosts: true`。
3. 打开底部 **PORTS** 标签。若没有5173行，点击 **Forward a Port** 并输入 `5173`。
4. 右键5173这一行 → **Port Visibility** → **Public**（部分界面显示“Change Port Visibility”）。确认显示Public；若组织策略禁用该选项，需要由组织管理员处理，代码不能绕过该策略。
5. 在同一行点击 **Copy Local Address / Copy Forwarded Address**，或右键复制地址。应得到类似 `https://<codespace-name>-5173.app.github.dev/` 的HTTPS链接。复制转发URL，不复制Codespaces编辑器URL，也不要发送localhost地址。
6. 在未登录GitHub的**无痕窗口**打开该地址，检查原文、所有记录、缩放与底图。教授应无需GitHub登录。若跳到`/pf-signin`或收到401，匿名访问仍未成功，需要重新检查端口Public状态、Codespace是否正在运行及组织策略；不能声称已公开验证。
7. 若显示Vite“Blocked request”，停止旧进程后按步骤2重启，以载入新的准确主机名配置。若5173被占用，先停止自己原来的Vite，不要随意关闭其他进程。

现有链接：`https://expert-spork-p77x77jprgwph969p-5173.app.github.dev/`。链接只在该Codespace及5173服务运行期间有效；停止、挂起或删除Codespace后会失效。任何持链接者可访问这个临时开发预览，但仓库权限不变。审阅后可将端口改回Private。

### 本轮可验证范围

已在本工作环境运行真实OpenFreeMap地图和浏览器测试；截图为 `review-desktop.png`、`review-mobile.png`。你现有Codespace是另一台机器，GitHub推送不会自动更新它，需要先执行上述pull和重启。外部匿名访问的实际核验状态见 `VALIDATION.md`；本地通过不等于转发URL已通过。

## 审阅截图

[桌面阅读面板](review-desktop.png) · [手机阅读面板](review-mobile.png)。截图均使用真实OpenFreeMap瓦片，不是静态地图替代应用。

## 行踪漫游与地点介绍（2026-10-27）

新增第三个导航“行踪漫游”，是与原14条源记录分开的12站展示序列：

澳门 → 香港 → 虎门 → 黄埔 → 广州 → 沙面 → 华林寺 → 五仙观 → 海幢寺 → 镇海楼 → 圣心大教堂 → 两广总督衙门。

`src/journey.ts`只引用源记录的已核实坐标，主记录sequence为 `1,4,5,6,7,8,9,10,11,12,13,14`；澳门同时关联源记录1、3，香港关联2、4。不会改写源sequence或合并历史文字。选用香港的城市记录4作为漫游阅读主记录，节庆记录2仍在全部14条列表内。

- 初始为珠江三角洲区域视图，澳门已高亮，点击“播放”开始。
- 默认每段3.2秒，支持暂停、继续、重新开始及0.5×／1×／2×／4×速度。
- 当前站名、英文名和步骤显示在控制栏，可用下拉框或地图标记手动选站；手动选择暂停播放并显示截至该站的线段。
- 进入广州附近逐渐放大；完成后保持整条路线，可自由缩放查看。离开漫游会清理动画，重新进入从澳门开始。
- 原源记录列表保留原阅读／定位行为；从该列表选记录会回到常规概览或详细地图。漫游内选站使用漫游控件或圆形站点标记。
- 路线严格为 `#8D2017` 单一连续实线，桌面2px、手机1.5px，圆头圆角。无虚线、渐变、光晕或附加描边。
- 连接的是叙事选点，不代表历史道路、水道或精确行程。显示曲线采用端点固定的三次贝塞尔插值，曲线采样只用于绘图，不是经考证的道路、水路或中间停留点，不写回历史数据，也不补写日期。

“考证札记”不再显示，但原札记仍保存在 `src/researchNotes.ts`，CSV的historical_notes读取支持及全部坐标来源均保留。

“了解此地”使用独立的 `place_info_url` 元数据（`src/placeInfo.ts`），在读取时附加到阅读模型，不写回CSV、不覆盖 `coordinate_source`。只对六处指定地点显示，新标签打开并设置noopener／noreferrer；其他地点隐藏。其中四个地址按用户最新指定更新；访问限制见下文：

| 源sequence | 地点 | 介绍来源 |
|---|---|---|
| 9 | 华林寺 | [维基百科地点专页](https://zh.wikipedia.org/wiki/华林寺_(广州)) |
| 10 | 五仙观 | [地点介绍](https://www.yuexiu.gov.cn/zjyx/yxjd/ycty/content/post_3560955.html) |
| 11 | 海幢寺 | [地点介绍](https://cn.tripadvisor.com/Attraction_Review-g298555-d1797602-Reviews-Hoi_Tong_Monastery-Guangzhou_Guangdong.html) |
| 12 | 镇海楼 | [广州博物馆镇海楼展区指引](https://www.guangzhoumuseum.cn/website_cn/Web/Visit/VisitGuide.aspx?id=16) |
| 13 | 圣心大教堂 | [地点介绍](https://cn.tripadvisor.com/Attraction_Review-g298555-d553965-Reviews-Sacred_Heart_Cathedral-Guangzhou_Guangdong.html) |
| 14 | 两广总督衙门 | [地点介绍](https://www.zhongguodiqing.cn/dqwh/dqwh_dqyj/201907/t20190725_4938968.shtml) |

华林寺、镇海楼介绍来源不变；五仙观、海幢寺、圣心大教堂和两广总督衙门改用用户提供的网页。当前云环境请求前述前三个新地址返回HTTP403，中国地情网返回200。自动测试验证指定URL和新标签导航，不将第三方拒绝访问误报为页面已成功读取。

漫游控制面板缩窄至330px内容宽度，镜头为控制面板与阅读页预留空间；当前到达站的黄色标记上方单独显示地点浮签。播放时镜头逐帧跟随正在延伸的曲线前端，面板中的路线说明按要求移除；示意路线的方法仍见本README。

Codespaces更新方式不变：停止旧Vite，从仓库根目录 `git pull --ff-only origin main`，进入004后运行 `npm run dev`，打开现有5173转发地址。不创建永久部署、不修改仓库隐私。

圆圈避让仅作用于屏幕显示：当前站保持地理锚点，其他拥挤圆圈按44px最小中心间距偏移，并用细引线指回原坐标；缩放、拖动和播放时实时重排。原始14条记录、12站坐标及历史文本保持不变。
