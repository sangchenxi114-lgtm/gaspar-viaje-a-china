# 地理编码与数据校验报告

## 结果

14条均有坐标与来源：5条城市级、7条近似定位、2条现代建筑级。第14条现今旧址按用户提供的已核实资料更新；未创建地图或JSON。

## 权威输入与保护

基础权威输入：`001_最新版Excel替换_重新编号_坐标核验/places_authoritative.xlsx`，为最新版人工Excel原样副本。SHA256：`f8dcb5f710664716dfa4c5c67828178af47fced517abfeb60d807ca245191197`。原有业务字段保留；此前更新latitude、longitude、coordinate_status并新增coordinate_source。此前按用户指示更新第14条的modern_name、latitude、longitude、display_level、location_precision、coordinate_status及coordinate_source；display_level与location_precision的值本已相同。该次坐标更新保留其他手工字段。按阶段03最终指令删除“id重新编号”列，sequence按原行序统一为1–14；同步审核表与报告，其他字段均不变。

## 全部14条坐标审核

| sequence | 地点 | 纬度 | 经度 | 状态／对象精度 | 坐标来源 |
|---|---|---|---|---|---|
| 1 | 澳门 | 22.19 | 113.538056 | city-level：澳门城市代表点 | [来源](https://www.wikidata.org/wiki/Special:EntityData/Q14773.json) |
| 2 | 香港：长洲太平清醮 | 22.278333 | 114.158611 | city-level：香港城市代表点，非长洲节庆地点 | [来源](https://www.wikidata.org/wiki/Special:EntityData/Q8646.json) |
| 3 | 澳门：总督府 | 22.19 | 113.538056 | city-level：澳门城市代表点，非总督府建筑地址 | [来源](https://www.wikidata.org/wiki/Special:EntityData/Q14773.json) |
| 4 | 香港 | 22.278333 | 114.158611 | city-level：香港城市代表点 | [来源](https://www.wikidata.org/wiki/Special:EntityData/Q8646.json) |
| 5 | 虎门 | 22.816245 | 113.6684225 | approximate：现代虎门镇区域代表点 | [来源](https://nominatim.openstreetmap.org/lookup?osm_ids=R5664991&format=jsonv2) |
| 6 | 黄埔 | 23.1829382 | 113.47493 | approximate：现代黄埔区区域代表点 | [来源](https://nominatim.openstreetmap.org/lookup?osm_ids=R3987437&format=jsonv2) |
| 7 | 广州城 | 23.13 | 113.26 | city-level：广州城市代表点，非历史城墙范围中心 | [来源](https://www.wikidata.org/wiki/Special:EntityData/Q16572.json) |
| 8 | 沙面 | 23.1094481 | 113.2393051 | approximate：沙面岛范围代表点 | [来源](https://nominatim.openstreetmap.org/lookup?osm_ids=R6679655&format=jsonv2) |
| 9 | 华林寺/五百罗汉堂 | 23.1186158 | 113.241264 | approximate：华林寺宗教场所范围代表点，非五百罗汉堂精确建筑点 | [来源](https://nominatim.openstreetmap.org/lookup?osm_ids=W431484001&format=jsonv2) |
| 10 | 五仙观／岭南第一楼 | 23.1233478 | 113.2544361 | approximate：五仙观范围代表点，非岭南第一楼单栋建筑点 | [来源](https://nominatim.openstreetmap.org/lookup?osm_ids=W363576776&format=jsonv2) |
| 11 | 海幢寺 | 23.1079575 | 113.2538565 | approximate：海幢寺现存寺院范围代表点 | [来源](https://nominatim.openstreetmap.org/lookup?osm_ids=W363853167&format=jsonv2) |
| 12 | 镇海楼 | 23.1406034 | 113.2602757 | exact：镇海楼现存建筑轮廓内部代表点 | [来源](https://nominatim.openstreetmap.org/lookup?osm_ids=W146688561&format=jsonv2) |
| 13 | 广州圣心大教堂 | 23.1173975 | 113.2547256 | exact：圣心大教堂现存主建筑轮廓内部代表点 | [来源](https://nominatim.openstreetmap.org/lookup?osm_ids=W542890833&format=jsonv2) |
| 14 | 两广总督衙门旧址（今广东省民政厅） | 23.13196 | 113.26091 | approximate：广州市越华路118号现今旧址近似点 | [来源](https://www.yuexiu.gov.cn/data/cms/category/xzzfsj/kejj1548668945490809.pdf) |

## 历史识别及人工核验

- **第1条 澳门**：城市名称层面的定位；不能推定城内活动地址或精确到访日。 交叉核查：[条目](https://www.wikidata.org/wiki/Special:EntityData/Q14773.json)。
- **第2条 香港：长洲太平清醮**：依location_precision=city定位香港；不改变用户将节庆对应长洲太平清醮的解释，但该历史对应仍需核验。城市点不代表长洲，不可作为节庆实地路线节点。 交叉核查：[条目](https://www.wikidata.org/wiki/Special:EntityData/Q8646.json)。
- **第3条 澳门：总督府**：依用户city精度定位澳门；未确定1881年所指总督府具体建筑。不将城市点视为总督府坐标。 交叉核查：[条目](https://www.wikidata.org/wiki/Special:EntityData/Q14773.json)。
- **第4条 香港**：香港城市代表点；引述说明航程，但不单凭本文片段确认行程起始地点或日期。 交叉核查：[条目](https://www.wikidata.org/wiki/Special:EntityData/Q8646.json)。
- **第5条 虎门**：Boca Tigris原文指河口防御设施；现代虎门镇范围不等于历史虎门海口或某座炮台。Wikidata Q477137有两个不同坐标，故采用名称明确的现代虎门镇OSM区域点并标近似，历史对应待核。 交叉核查：[条目](https://www.wikidata.org/wiki/Q477137)。
- **第6条 黄埔**：现代黄埔区边界与历史Wampoa锚地、港口或黄埔村不等同。Wikidata Q1023890和OSM现行政区代表点相差较大，体现对象范围不同；本点只代表现代区，不据此选择历史停靠点。 交叉核查：[条目](https://www.wikidata.org/wiki/Q1023890)。
- **第7条 广州城**：城市代表点；现代城市点不验证1882年靠岸码头或旧城边界。 交叉核查：[条目](https://www.wikidata.org/wiki/Special:EntityData/Q16572.json)。
- **第8条 沙面**：OSM岛屿范围与Wikidata Q529977坐标相近，支持现代沙面岛定位；不确定具体桥梁或登陆点。 交叉核查：[条目](https://www.wikidata.org/wiki/Q529977)。
- **第9条 华林寺/五百罗汉堂**：OSM存在同名地铁站、不同寺院范围及建筑对象，已排除站点，选place_of_worship范围。Wikidata Q2774918点与选用范围相近，但不能确定五百罗汉堂旧址／现存单栋建筑；维持approximate。 交叉核查：[条目](https://www.wikidata.org/wiki/Q2774918)。
- **第10条 五仙观／岭南第一楼**：Wikidata Q10881501的别名包括五仙观及岭南第一楼，现代寺观坐标与OSM相近。引述钟寺对应关系及钟楼单体仍待史料核验；整体范围点标approximate，不改变用户site精度字段。 交叉核查：[条目](https://www.wikidata.org/wiki/Q10881501)。
- **第11条 海幢寺**：Wikidata Q7222524与OSM宗教场所范围点相近，排除了同名公交站。现代寺院经过破坏与修复，原猪圈及19世纪院落位置未核验；标approximate，不证明原文历史识别。 交叉核查：[条目](https://www.wikidata.org/wiki/Q7222524)。
- **第12条 镇海楼**：OSM建筑对象关联Q9373800、标注五层楼；定位现存建筑而非证明1880年代建筑完整性。OSM start_date=1928与塔的早期建造历史不同，需核验重建沿革。exact仅指建筑级定位，不代表测量误差为零或历史匹配已证实。 交叉核查：[条目](https://www.openstreetmap.org/api/0.6/way/146688561.json)。
- **第13条 广州圣心大教堂**：OSM主教堂建筑关联Q1195445，Wikidata点相近。OSM start_date=1888，晚于项目旅行年代；在建阶段的观察及“鞑靼区中心”的对应须核验。exact只表示现代建筑级定位，不更改原日期或引述。 交叉核查：[条目](https://www.openstreetmap.org/api/0.6/way/542890833.json)。
- **第14条 两广总督衙门旧址（今广东省民政厅）**：按用户提供的已核实资料，对应广州市越华路118号，今广东省民政厅；采用用户提供的23.13196、113.26091作为现今旧址的近似定位，来源为越秀区政府PDF。不是历史衙门建筑轮廓的精确坐标，也不据此补写到访日期或确认旅行连线。 [用户提供的官方资料](https://www.yuexiu.gov.cn/data/cms/category/xzzfsj/kejj1548668945490809.pdf)。坐标与识别依据按用户核实信息录入，未声明本轮独立核实PDF或坐标系。

## 一致性与缺失检查

- 权威Excel、更新Excel和CSV：均14条，行序与其他业务字段一致；sequence为1–14，无重复或间隔，编号列已删除。
- 阶段03最终修订仅改变sequence并删除编号列；其余14条业务字段（含已核实的第14条名称及坐标）、日期、西班牙语原文、中文译文、display_level、location_precision及图像／模型字段逐单元格核验不变；Excel保留原值类型。CSV采用UTF-8 BOM，往返读取所有字段一致。
- 更新Excel保留原工作表，包括无业务记录的Sheet1；CSV只导出places表。
- 日期缺失6条：第9条、第10条、第11条、第12条、第13条、第14条。保留原文本null，未补入访问日期。
- image_url及model_3d_url共14条均为原始文本null；未虚构图像或模型链接。
- 坐标缺失：0条。14条坐标成对存在、范围合法且有来源URL；第14条采用用户核实的现今旧址资料，其余13条来源及坐标不变。
- 需要核验的尺度差异：第9条、第10条、第11条的location_precision=site保留，但目前来源只支持寺院范围点，故coordinate_status=approximate。
- 第12条、第13条的exact仅指现代建筑级点，不是定位零误差或历史识别已确认。坐标小数位数不等于真实空间精度。

## 旅行路线限制

所有14条均不得仅凭sequence自动连接成“已确认”旅行路线。城市级记录只能用于概览。第2条节庆对应、第3条总督府、第5条虎门河口与现代镇范围、第6条历史Wampoa与现代区范围、第9条/第10条具体历史建筑、第13条在建教堂均需史料确认。第14条現今旧址按用户核实资料更新，但仍不能仅凭坐标确认加斯帕尔到访日期或旅行连线。第9条–第14条六条记录没有日期；不能把它们自动继承为1882-12-08，也不能按编号假定同日实际到访。原引述中的叙事性导览不一律等同于亲历证明。当前没有依据认定这14条中某条明确非亲历；旧版中被删除的瓷塔等记录不恢复。

## 来源与实际限制

已读取Wikidata EntityData坐标和OSM Nominatim检索／lookup数据，并检查镇海楼、圣心大教堂的OSM建筑对象标签。城市代表点无需与旧城市中心完全重合；虎门及黄埔使用明确现代区域的代表点，并记录与历史对象的差异。

广州市文化广电旅游局[博物馆目录页](https://wglj.gz.gov.cn/mdjl/cjwt/ggfw/content/post_9700460.html)可访问，但附属Excel返回403，故未作为实际核验依据。部分Wiki API受403限制，Google搜索返回反自动化页面；来源可访问性不等于所有API可用。本轮没有取得可核查并地理配准的相关历史地图，第14条现今旧址现按用户提供的已核实资料更新；历史建筑轮廓仍未地理配准，维持approximate，不扩大坐标准确性声明。

OpenStreetMap数据 © OpenStreetMap contributors，ODbL；Wikidata结构化数据CC0。此前坐标使用WGS84。本次第14条坐标按用户给定值原样录入，未独立核实其坐标系或进行偏移转换。

## 保存与验证

本次仅原位更新003文件夹内既有四个指定文件（含最终sequence及编号列清理）；其他文件（含未提交的002诊断文件夹）经SHA256核对未改变。未创建新文件夹或重复产物。已完成14条记录、字段保留、CSV/Excel一致性、UTF-8往返、坐标范围及来源存在性校验。数据尚待用户历史识别审阅，不构建地图。
