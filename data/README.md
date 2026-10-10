# 加斯帕尔历史地理数据：人工修订版

当前唯一权威来源是用户上传的《places 修订版.xlsx》，在本目录原样保存为 `places_authoritative.xlsx`。共14条记录，保持原编号、行序和全部原有列及值；不沿用旧版32条记录。

- `places.csv`：权威Excel的表格导出，UTF-8 BOM编码。原15列保持不变，新增 `coordinate_source`。文本 `null` 与真正空白区别保留。
- `geocoding_review.xlsx`：保留原表全部数据，增加来源、人工核验标记及逐条说明；另含来源访问检查和方法说明页。
- `places_authoritative.xlsx`：上传文件的字节一致副本，供核查原始人工修订。
- `journey.json`：按用户明确指示保持不变，属于旧版存档，**不是当前数据来源**；不得用其覆盖修订版CSV。
- 仓库根目录 `data_quality_report.md`：旧版32条数据的历史报告，不适用于当前修订版。

## 本次坐标核验结果

访问Wikidata、OpenStreetMap Nominatim、澳门世界遗产网站、香港古物古迹办事处和广州市政府网站均被网络代理拒绝，返回 `Tunnel connection failed: 403 Forbidden`。未获取可核验的地理数据，因此没有添加任何坐标，原有 `coordinate_status=unknown` 保持不变，新增 `coordinate_source=null`。全部14条都标记为需要人工核验。来源访问URL只是连接诊断记录，不是已验证的坐标来源。

附件实际包含 `map_level`，没有 `display_level` 或 `location_precision`；保留 `map_level` 的原值及空白，不擅自创建或推定上述字段。城市级记录后续可用有来源的城市代表点；区域代表点应标记 approximate；具体历史建筑需要核实旧址与建筑层级，不能用现代行政中心或同名机构代替。

手工历史解释、日期、引述、译文、地点名称、顺序及其他现有值没有改动。未创建JSON、网站或交互式地图。

## 待解决事项

需要开放 `www.wikidata.org`、`nominatim.openstreetmap.org`、`www.wh.mo`、`www.amo.gov.hk`、`www.gz.gov.cn` 的访问，或提供可核查的来源材料后再进行坐标核验。未完成核验前，不应将本版描述为已完成地理编码。
