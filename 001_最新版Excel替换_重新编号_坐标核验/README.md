# 第001次操作：最新版Excel替换、重新编号、坐标核验

权威输入为本轮上传的《places 修订版.xlsx》，原样副本为 `places_authoritative.xlsx`（包含原工作表）。处理 `places` 工作表14条记录，不采用上一轮Excel或旧JSON。

## 文件

- `places.csv`：全部原16列与新增 `coordinate_source`。仅修改用户授权的id、sequence、latitude、longitude、coordinate_status。
- `geocoding_review.xlsx`：逐条审核状态、来源、困难说明与旧新编号对照，保留原有额外工作表。
- `renumbering.csv`：id按行序重编P001–P014，sequence重编1–14；原id列名 `id重新编号` 保留。
- `coordinate_evidence.csv`：实际读取的5个GeoNames镜像条目及来源，用于复核7条已填坐标记录。
- `places_authoritative.xlsx`：上传文件的字节一致副本，不修改原件。

## 坐标与来源

可访问来源：https://raw.githubusercontent.com/lutangar/cities.json/c05addfe79dce8a87076ef3fd487eab7e5fe4abd/cities.json。仓库README明确其数据来自GeoNames Gazetteer；已固定到提交 `c05addfe79dce8a87076ef3fd487eab7e5fe4abd`，避免后续更新改变核验依据。没有使用无法访问的页面作为已验证来源。坐标使用该数据的WGS84经纬度；不混用Google地图或中国地图的偏移坐标。

7条已填坐标：P001澳门、P002香港、P003澳门、P004香港、P007广州为 `city-level`；P005虎门、P006黄埔为 `approximate`。严格保留 `display_level` 和 `location_precision`，香港长洲节庆、澳门总督府按你指定的city精度使用城市代表点。区域坐标是现代地域代表点，并不证明加斯帕尔具体到访位置；黄埔以广州行政代码消除同名地点歧义，历史Wampoa范围仍待核查。

7条尚未定位：P008沙面、P009华林寺/五百罗汉堂、P010五仙观/岭南第一楼、P011海幢寺、P012镇海楼、P013广州圣心大教堂、P014两广总督衙门。Google Maps、Wikidata、OSM、Overpass、GeoNames原站及官方遗产资料被网络代理以403拒绝，GitHub代码搜索需登录。城市镜像不含上述实体，不能以城市中心或记忆中的坐标代替。因此这7条坐标及来源为**空白**，`coordinate_status=unknown`，审核表标记待人工核验；地理编码未全部完成。没有虚构坐标，也没有用字符串null作为坐标结果。

## 保存与清理

上一轮提交 `2699c9e` 生成／修改的4个文件从当前分支删除：`data/places.csv`、`data/README.md`、`data/geocoding_review.xlsx`、`data/places_authoritative.xlsx`。Git历史保留，不重写历史。`data/journey.json`按此前要求字节不变，是旧存档，不能用作本轮权威数据。根目录旧质量报告也是历史存档。

从本次开始，每次操作均创建新的 `NNN_主要操作指令` 文件夹，本次编号001；未来按现存最大序号递增，分开保存产物。不创建网站、地图或新JSON。

原Excel所有非授权修改列均逐值核对，包括引述、译文、日期、层级、地点名称、图像及模型链接；文本null与原空白区别保留。此报告明确区分已有来源支持的代表坐标与尚未完成的具体地点核验。
