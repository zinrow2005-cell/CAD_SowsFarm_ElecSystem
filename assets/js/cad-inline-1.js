
(function(){'use strict';
var layers=[{"id":"00_基地與外框","name":"00_基地與外框","count":1,"category":"site","visible":true},{"id":"01_牆線_外牆","name":"01_牆線_外牆","count":50,"category":"wall","visible":true},{"id":"02_牆線_隔間","name":"02_牆線_隔間","count":16,"category":"partition","visible":true},{"id":"03_門與開啟弧","name":"03_門與開啟弧","count":18,"category":"door","visible":true},{"id":"04_走道界線","name":"04_走道界線","count":3,"category":"passage","visible":true},{"id":"05_產床_產房","name":"05_產床_產房","count":150,"category":"bed","visible":true},{"id":"06_欄位_公豬舍","name":"06_欄位_公豬舍","count":20,"category":"boar","visible":true},{"id":"07_欄位_後備女豬","name":"07_欄位_後備女豬","count":15,"category":"nursery","visible":true},{"id":"08_欄位_配種","name":"08_欄位_配種","count":77,"category":"mating","visible":true},{"id":"08A_配種區左側巡情公豬欄","name":"08A_配種區左側巡情公豬欄","count":1,"category":"boar","visible":true},{"id":"09_欄位_妊娠","name":"09_欄位_妊娠","count":508,"category":"pregnancy","visible":true},{"id":"10_衛浴與設備","name":"10_衛浴與設備","count":3,"category":"fixture","visible":true},{"id":"11_家具_附屬設備","name":"11_家具_附屬設備","count":12,"category":"fixture","visible":true},{"id":"12_門洞_定位","name":"12_門洞_定位","count":19,"category":"reference","visible":false},{"id":"13_產床_中心導線","name":"13_產床_中心導線","count":12,"category":"bed","visible":true},{"id":"28_文字_產床編號","name":"28_文字_產床編號","count":150,"category":"bedid","visible":false},{"id":"31_走道範圍_封閉多邊形","name":"31_走道範圍_封閉多邊形","count":1,"category":"reference","visible":false},{"id":"21_文字_原圖面積","name":"21_文字_原圖面積","count":21,"category":"area","visible":true},{"id":"22_文字_原圖尺寸","name":"22_文字_原圖尺寸","count":18,"category":"dimension","visible":true},{"id":"23_文字_註解與推定","name":"23_文字_註解與推定","count":2,"category":"notes","visible":false},{"id":"25_文字_欄位編號","name":"25_文字_欄位編號","count":14,"category":"penid","visible":false},{"id":"26_文字_CAD推估尺寸","name":"26_文字_CAD推估尺寸","count":1,"category":"dimension","visible":true},{"id":"52_配種欄_內部橫條","name":"52_配種欄_內部橫條","count":3,"category":"mating","visible":true},{"id":"53_育成欄_下側橫條","name":"53_育成欄_下側橫條","count":1,"category":"mating","visible":true},{"id":"54_洗曬區_選取輪廓","name":"54_洗曬區_選取輪廓","count":1,"category":"reference","visible":false},{"id":"77_公豬舍_17欄獨立選取","name":"77_公豬舍_17欄獨立選取","count":17,"category":"reference","visible":false},{"id":"78_文字_公豬舍欄號","name":"78_文字_公豬舍欄號","count":17,"category":"penid","visible":false},{"id":"85_公豬舍_全長通道_獨立選取","name":"85_公豬舍_全長通道_獨立選取","count":1,"category":"reference","visible":false},{"id":"118_校核_洗曬區舊輪廓","name":"118_校核_洗曬區舊輪廓","count":1,"category":"reference","visible":false},{"id":"131_區域選取_右側運輸通道_隱藏","name":"131_區域選取_右側運輸通道_隱藏","count":1,"category":"reference","visible":false},{"id":"132_區域選取_棟舍間走道_隱藏","name":"132_區域選取_棟舍間走道_隱藏","count":2,"category":"reference","visible":false},{"id":"141_洗曬區_沿實牆參考_可選","name":"141_洗曬區_沿實牆參考_可選","count":3,"category":"reference","visible":false},{"id":"142_洗曬區_開放門洞與通道_可選","name":"142_洗曬區_開放門洞與通道_可選","count":2,"category":"reference","visible":false},{"id":"164_洗曬區_與育成北牆共線索引","name":"164_洗曬區_與育成北牆共線索引","count":1,"category":"reference","visible":false},{"id":"165_校核_共牆起訖控制點","name":"165_校核_共牆起訖控制點","count":2,"category":"reference","visible":false},{"id":"166_校核_南緣共用牆說明","name":"166_校核_南緣共用牆說明","count":1,"category":"review","visible":false},{"id":"V51_共同面積_候選","name":"V51_共同面積_候選","count":1,"category":"review","visible":false},{"id":"V51_新版增加面積_候選","name":"V51_新版增加面積_候選","count":1,"category":"review","visible":false},{"id":"V51_舊版增加面積_候選","name":"V51_舊版增加面積_候選","count":1,"category":"review","visible":false},{"id":"V51_兩版界線高差_斷面","name":"V51_兩版界線高差_斷面","count":7,"category":"review","visible":false},{"id":"V51_斷面註記_待核","name":"V51_斷面註記_待核","count":7,"category":"review","visible":false},{"id":"V52_門扇開啟弧_真圓弧","name":"V52_門扇開啟弧_真圓弧","count":17,"category":"door","visible":true},{"id":"V53_改線前參考_隱藏","name":"V53_改線前參考_隱藏","count":9,"category":"review","visible":false},{"id":"V54_舊重疊門扇_備份隱藏","name":"V54_舊重疊門扇_備份隱藏","count":2,"category":"review","visible":false},{"id":"V54_門洞拆分前整段外牆_備份隱藏","name":"V54_門洞拆分前整段外牆_備份隱藏","count":2,"category":"review","visible":false},{"id":"V55_舊水平牆_隱藏備份","name":"V55_舊水平牆_隱藏備份","count":2,"category":"review","visible":false},{"id":"V55_舊門扇位置_隱藏備份","name":"V55_舊門扇位置_隱藏備份","count":4,"category":"review","visible":false},{"id":"V55_右端門位_待核隱藏","name":"V55_右端門位_待核隱藏","count":4,"category":"review","visible":false},{"id":"V56_原連續牆_隱藏","name":"V56_原連續牆_隱藏","count":2,"category":"review","visible":false},{"id":"V56_舊門扇_隱藏","name":"V56_舊門扇_隱藏","count":4,"category":"review","visible":false},{"id":"V56_候選雙扇門洞_隱藏","name":"V56_候選雙扇門洞_隱藏","count":2,"category":"review","visible":false},{"id":"V56_待實測門洞文字_隱藏","name":"V56_待實測門洞文字_隱藏","count":2,"category":"review","visible":false},{"id":"V57_右側門扇開向待確認_隱藏","name":"V57_右側門扇開向待確認_隱藏","count":12,"category":"review","visible":false},{"id":"V57_雙牆共同開口區_隱藏","name":"V57_雙牆共同開口區_隱藏","count":2,"category":"review","visible":false},{"id":"V57_兩道牆斷面文字_隱藏","name":"V57_兩道牆斷面文字_隱藏","count":2,"category":"review","visible":false},{"id":"V57_門弧交錯檢查_隱藏","name":"V57_門弧交錯檢查_隱藏","count":3,"category":"review","visible":false},{"id":"V58_舊門洞裝飾短線_隱藏","name":"V58_舊門洞裝飾短線_隱藏","count":8,"category":"review","visible":false},{"id":"V58_雙牆門洞中心偏移_隱藏","name":"V58_雙牆門洞中心偏移_隱藏","count":8,"category":"review","visible":false},{"id":"V58_開口實際CAD尺寸_隱藏","name":"V58_開口實際CAD尺寸_隱藏","count":4,"category":"review","visible":false},{"id":"V58_雙牆對位差_隱藏","name":"V58_雙牆對位差_隱藏","count":4,"category":"review","visible":false},{"id":"V59_右側圍牆影像控制點_隱藏","name":"V59_右側圍牆影像控制點_隱藏","count":6,"category":"review","visible":false},{"id":"V59_右側外界修正前_隱藏","name":"V59_右側外界修正前_隱藏","count":6,"category":"review","visible":false},{"id":"V59_右側原圖尺寸待核_隱藏","name":"V59_右側原圖尺寸待核_隱藏","count":2,"category":"review","visible":false},{"id":"V60_右側通道修正前_隱藏","name":"V60_右側通道修正前_隱藏","count":3,"category":"review","visible":false},{"id":"V60_運輸通道與育成北牆_角點校核_隱藏","name":"V60_運輸通道與育成北牆_角點校核_隱藏","count":4,"category":"review","visible":false},{"id":"V60_育成東側走道_面積候選_隱藏","name":"V60_育成東側走道_面積候選_隱藏","count":1,"category":"review","visible":false},{"id":"V60_圍牆與棟舍分界_待核_隱藏","name":"V60_圍牆與棟舍分界_待核_隱藏","count":2,"category":"review","visible":false},{"id":"V61_育成東側走道_淨地坪估算_隱藏","name":"V61_育成東側走道_淨地坪估算_隱藏","count":1,"category":"review","visible":false},{"id":"V61_走道兩側退縮帶_僅計算_隱藏","name":"V61_走道兩側退縮帶_僅計算_隱藏","count":2,"category":"review","visible":false},{"id":"V61_走道南端門洞_通行核對_隱藏","name":"V61_走道南端門洞_通行核對_隱藏","count":3,"category":"review","visible":false},{"id":"V61_原圖面積與模型尺寸_待核_隱藏","name":"V61_原圖面積與模型尺寸_待核_隱藏","count":6,"category":"review","visible":false},{"id":"V61_牆線中心與地坪界_註記_隱藏","name":"V61_牆線中心與地坪界_註記_隱藏","count":1,"category":"review","visible":false},{"id":"V62_東側三段連通_封閉範圍","name":"V62_東側三段連通_封閉範圍","count":1,"category":"review","visible":false},{"id":"V62_兩處跨棟開口_可選範圍","name":"V62_兩處跨棟開口_可選範圍","count":2,"category":"review","visible":false},{"id":"V62_右側連續動線_中心導線","name":"V62_右側連續動線_中心導線","count":1,"category":"review","visible":false},{"id":"V62_門洞錯位量測_可選","name":"V62_門洞錯位量測_可選","count":10,"category":"review","visible":false},{"id":"V62_連通檢查註記_待確認","name":"V62_連通檢查註記_待確認","count":3,"category":"review","visible":false},{"id":"V63_東側通道外緣_非地籍","name":"V63_東側通道外緣_非地籍","count":1,"category":"passage","visible":true},{"id":"V63_三處寬度斷面_隱藏","name":"V63_三處寬度斷面_隱藏","count":9,"category":"review","visible":false},{"id":"V63_通道幾何中心線_隱藏","name":"V63_通道幾何中心線_隱藏","count":1,"category":"review","visible":false},{"id":"V63_原圖牆長差異_待核_隱藏","name":"V63_原圖牆長差異_待核_隱藏","count":2,"category":"review","visible":false},{"id":"V63_圍牆與基地線差異_待核_隱藏","name":"V63_圍牆與基地線差異_待核_隱藏","count":2,"category":"review","visible":false},{"id":"V63_通道尺寸文字_隱藏","name":"V63_通道尺寸文字_隱藏","count":4,"category":"review","visible":false},{"id":"V64_基地界線_原始穿越_備份_隱藏","name":"V64_基地界線_原始穿越_備份_隱藏","count":1,"category":"review","visible":false},{"id":"V64_穿越範圍_校核_隱藏","name":"V64_穿越範圍_校核_隱藏","count":1,"category":"review","visible":false},{"id":"V64_斜向垂直牆距_校核_隱藏","name":"V64_斜向垂直牆距_校核_隱藏","count":12,"category":"review","visible":false},{"id":"V64_通道外緣垂距文字_隱藏","name":"V64_通道外緣垂距文字_隱藏","count":6,"category":"review","visible":false},{"id":"V64_原圖牆長_不可同時滿足_隱藏","name":"V64_原圖牆長_不可同時滿足_隱藏","count":1,"category":"review","visible":false},{"id":"V64_南側共邊說明_隱藏","name":"V64_南側共邊說明_隱藏","count":1,"category":"review","visible":false},{"id":"V65_基地右側舊輪廓_備份_隱藏","name":"V65_基地右側舊輪廓_備份_隱藏","count":1,"category":"review","visible":false},{"id":"V65_通道上下端_區域界線_隱藏","name":"V65_通道上下端_區域界線_隱藏","count":1,"category":"review","visible":false},{"id":"V65_全邊內縮面積情境_隱藏","name":"V65_全邊內縮面積情境_隱藏","count":6,"category":"review","visible":false},{"id":"V65_通道牆長_端點矛盾_隱藏","name":"V65_通道牆長_端點矛盾_隱藏","count":2,"category":"review","visible":false},{"id":"V65_外緣牆性質待確認_說明_隱藏","name":"V65_外緣牆性質待確認_說明_隱藏","count":1,"category":"review","visible":false},{"id":"V66_通道原圖尺寸控制_待核_隱藏","name":"V66_通道原圖尺寸控制_待核_隱藏","count":6,"category":"review","visible":false},{"id":"V66_牆長差異_來源端點待核_隱藏","name":"V66_牆長差異_來源端點待核_隱藏","count":4,"category":"review","visible":false},{"id":"V66_通道上緣與外緣性質_待核_隱藏","name":"V66_通道上緣與外緣性質_待核_隱藏","count":2,"category":"review","visible":false},{"id":"V67_C段法向選取_隱藏","name":"V67_C段法向選取_隱藏","count":1,"category":"review","visible":false},{"id":"V67_D段法向選取_隱藏","name":"V67_D段法向選取_隱藏","count":1,"category":"review","visible":false},{"id":"V67_CD法向斷面_隱藏","name":"V67_CD法向斷面_隱藏","count":1,"category":"review","visible":false},{"id":"V67_法向牆距及控制點_隱藏","name":"V67_法向牆距及控制點_隱藏","count":3,"category":"review","visible":false},{"id":"V67_原圖尺寸待核_隱藏","name":"V67_原圖尺寸待核_隱藏","count":2,"category":"review","visible":false},{"id":"V67_版本說明_隱藏","name":"V67_版本說明_隱藏","count":1,"category":"review","visible":false},{"id":"V68_舊通道外緣與舊輪廓_歷史隱藏","name":"V68_舊通道外緣與舊輪廓_歷史隱藏","count":2,"category":"review","visible":false},{"id":"V68_原圖上口尺寸校準_隱藏","name":"V68_原圖上口尺寸校準_隱藏","count":1,"category":"review","visible":false},{"id":"V68_可編輯模型尺寸標註_隱藏","name":"V68_可編輯模型尺寸標註_隱藏","count":4,"category":"review","visible":false},{"id":"V68_原圖與模型差異註記_隱藏","name":"V68_原圖與模型差異註記_隱藏","count":3,"category":"review","visible":false},{"id":"V68_控制點編號_隱藏","name":"V68_控制點編號_隱藏","count":10,"category":"review","visible":false},{"id":"V69_外圍候選_東側長線","name":"V69_外圍候選_東側長線","count":1,"category":"review","visible":false},{"id":"V69_外圍候選_南端銜接","name":"V69_外圍候選_南端銜接","count":1,"category":"review","visible":false},{"id":"V69_舊圍牆候選線_備份隱藏","name":"V69_舊圍牆候選線_備份隱藏","count":1,"category":"review","visible":false},{"id":"V69_CD牆長原圖與模型差異_隱藏","name":"V69_CD牆長原圖與模型差異_隱藏","count":6,"category":"review","visible":false},{"id":"V69_外緣上下控制點_待核隱藏","name":"V69_外緣上下控制點_待核隱藏","count":8,"category":"review","visible":false},{"id":"V69_真實CAD尺寸標註_隱藏","name":"V69_真實CAD尺寸標註_隱藏","count":3,"category":"review","visible":false},{"id":"V70_外圍候選北向延伸_截圖推估","name":"V70_外圍候選北向延伸_截圖推估","count":1,"category":"review","visible":false},{"id":"V70_舊北側封口線_預設隱藏","name":"V70_舊北側封口線_預設隱藏","count":1,"category":"review","visible":false},{"id":"V70_上口端點與間距_隱藏校核","name":"V70_上口端點與間距_隱藏校核","count":6,"category":"review","visible":false},{"id":"V70_候選圍牆延伸標記_隱藏","name":"V70_候選圍牆延伸標記_隱藏","count":7,"category":"review","visible":false},{"id":"V70_上口模型尺寸_隱藏","name":"V70_上口模型尺寸_隱藏","count":1,"category":"review","visible":false},{"id":"V71_上方場外L形舊線_隱藏","name":"V71_上方場外L形舊線_隱藏","count":1,"category":"review","visible":false},{"id":"V71_上方道路候選邊_隱藏","name":"V71_上方道路候選邊_隱藏","count":1,"category":"review","visible":false},{"id":"V71_場外東側直線_隱藏","name":"V71_場外東側直線_隱藏","count":1,"category":"review","visible":false},{"id":"V71_場外線與圍牆北延_未接合_隱藏","name":"V71_場外線與圍牆北延_未接合_隱藏","count":4,"category":"review","visible":false},{"id":"V71_D右牆端點11點03_校核_隱藏","name":"V71_D右牆端點11點03_校核_隱藏","count":3,"category":"review","visible":false},{"id":"V71_尺寸來源說明_隱藏","name":"V71_尺寸來源說明_隱藏","count":4,"category":"review","visible":false},{"id":"V72_通道外緣與圍牆候選_7斷面_隱藏","name":"V72_通道外緣與圍牆候選_7斷面_隱藏","count":21,"category":"review","visible":false},{"id":"V72_通道邊界差_尺寸物件_隱藏","name":"V72_通道邊界差_尺寸物件_隱藏","count":3,"category":"review","visible":false},{"id":"V72_C_D右牆長度約束_隱藏","name":"V72_C_D右牆長度約束_隱藏","count":3,"category":"review","visible":false},{"id":"V72_非施工控制說明_隱藏","name":"V72_非施工控制說明_隱藏","count":10,"category":"review","visible":false},{"id":"V73_育成北牆_共牆長度校核_隱藏","name":"V73_育成北牆_共牆長度校核_隱藏","count":1,"category":"review","visible":false},{"id":"V73_三角點與邊界性質_隱藏","name":"V73_三角點與邊界性質_隱藏","count":12,"category":"review","visible":false},{"id":"V73_圍牆與基地線差異_隱藏","name":"V73_圍牆與基地線差異_隱藏","count":2,"category":"review","visible":false},{"id":"V73_南端三角點_可編輯尺寸_隱藏","name":"V73_南端三角點_可編輯尺寸_隱藏","count":2,"category":"review","visible":false},{"id":"V74_外側銜接_區域界線_非育成入口","name":"V74_外側銜接_區域界線_非育成入口","count":1,"category":"passage","visible":true},{"id":"V74_育成北牆連續實牆_通行待確認_隱藏","name":"V74_育成北牆連續實牆_通行待確認_隱藏","count":1,"category":"review","visible":false},{"id":"V74_北端無門洞_連通性校核_隱藏","name":"V74_北端無門洞_連通性校核_隱藏","count":4,"category":"review","visible":false},{"id":"V74_右側走道與病死豬通道_獨立選取_隱藏","name":"V74_右側走道與病死豬通道_獨立選取_隱藏","count":2,"category":"review","visible":false},{"id":"V74_界線量測及兩端控制點_隱藏","name":"V74_界線量測及兩端控制點_隱藏","count":5,"category":"review","visible":false},{"id":"V74_現場確認事項_隱藏","name":"V74_現場確認事項_隱藏","count":5,"category":"review","visible":false},{"id":"V75_育成配種棟_原封閉外框_選取隱藏","name":"V75_育成配種棟_原封閉外框_選取隱藏","count":1,"category":"review","visible":false},{"id":"V75_育成東走道_獨立北側實牆","name":"V75_育成東走道_獨立北側實牆","count":1,"category":"partition","visible":true},{"id":"V75_北牆端點與通行疑義_隱藏","name":"V75_北牆端點與通行疑義_隱藏","count":4,"category":"review","visible":false},{"id":"V75_北牆量測尺寸_隱藏","name":"V75_北牆量測尺寸_隱藏","count":1,"category":"review","visible":false},{"id":"V75_來源標註與狀態_隱藏","name":"V75_來源標註與狀態_隱藏","count":3,"category":"review","visible":false},{"id":"V76_北牆原長線_歷史隱藏","name":"V76_北牆原長線_歷史隱藏","count":1,"category":"review","visible":false},{"id":"V76_D棟下角至育成走道西角_獨立共牆","name":"V76_D棟下角至育成走道西角_獨立共牆","count":1,"category":"partition","visible":true},{"id":"V76_三角點拓樸控制_隱藏","name":"V76_三角點拓樸控制_隱藏","count":4,"category":"review","visible":false},{"id":"V76_三段尺寸_隱藏","name":"V76_三段尺寸_隱藏","count":3,"category":"review","visible":false},{"id":"V76_牆與開放界線說明_隱藏","name":"V76_牆與開放界線說明_隱藏","count":5,"category":"review","visible":false},{"id":"V76_通道邊界與牆線對照_隱藏","name":"V76_通道邊界與牆線對照_隱藏","count":1,"category":"review","visible":false},{"id":"20A_文字_棟舍名稱","name":"20A_文字_棟舍名稱","count":8,"category":"building","visible":true},{"id":"20B_文字_區域名稱","name":"20B_文字_區域名稱","count":15,"category":"zone","visible":true},{"id":"V10.8_B棟污水集中抽取池","name":"V10.8_B棟污水集中抽取池","count":1,"category":"fixture","visible":false},{"id":"V10.8_B棟池上混凝土樓板","name":"V10.8_B棟池上混凝土樓板","count":1,"category":"fixture","visible":false},{"id":"V10.8_B棟池上公豬欄","name":"V10.8_B棟池上公豬欄","count":1,"category":"boar","visible":true},{"id":"V11.12.17_產床頭向","name":"V11.12.17_產床頭向","count":150,"category":"bed","visible":true},{"id":"V11.12.17_產房南北走道配置","name":"V11.12.17_產房南北走道配置","count":4,"category":"dimension","visible":false},{"id":"V11.12.17_中央走道門號_待核","name":"V11.12.17_中央走道門號_待核","count":8,"category":"dimension","visible":false},{"id":"V11.12.21_母豬進出產房專用走道_待核","name":"母豬進出產房專用走道（G-07 東側）","count":7,"category":"passage","visible":true}], annot=[["building", "棟舍名稱", "產房 A～D、公豬舍、妊娠舍"], ["zone", "區域名稱", "走道、浴室、採精室、洗曬區"], ["area", "面積文字", "原始圖面標示面積"], ["dimension", "尺寸文字", "原圖尺寸與 CAD 推估尺寸"], ["notes", "備註文字", "尺寸假設及圖面註記"], ["bedid", "產床編號", "150 張產床的逐床編號"], ["penid", "欄位編號", "育成欄與公豬欄編號"]], geom=[["wall", "外牆"], ["partition", "隔牆與共牆"], ["door", "門與開啟弧"], ["passage", "走道界線"], ["bed", "產床"], ["boar", "公豬欄位"], ["nursery", "育成欄位"], ["mating", "配種欄位"], ["pregnancy", "妊娠欄位"], ["fixture", "衛浴與設備"], ["site", "基地線與外框"], ["reference", "其他參考圖層"], ["review", "歷史校核"]];
var defaults={},state={};layers.forEach(function(l){defaults[l.id]=l.visible;state[l.id]=l.visible;});
try{var saved=JSON.parse((localStorage.getItem('huwei_v81_layer_states')||localStorage.getItem('huwei_v80_layer_states')||'null'));if(saved){Object.keys(state).forEach(function(k){if(Object.prototype.hasOwnProperty.call(saved,k))state[k]=!!saved[k];});}}catch(e){}
var map=document.getElementById('plan'), box=document.getElementById('canvas'), baseline=map.viewBox.baseVal;var home=[baseline.x,baseline.y,baseline.width,baseline.height];
function save(){try{localStorage.setItem('huwei_v81_layer_states',JSON.stringify(state));}catch(e){}}
function update(){var all=0;layers.forEach(function(l){var g=document.querySelector('[data-layer="'+CSSescape(l.id)+'"].cad-layer');if(g)g.style.display=state[l.id]?'':'none';if(state[l.id])all++;});document.getElementById('visibleCount').textContent='目前顯示 '+all+' / '+layers.length+' 個可選圖層';Array.prototype.forEach.call(document.querySelectorAll('input[data-layer]'),function(cb){cb.checked=!!state[cb.getAttribute('data-layer')];});Array.prototype.forEach.call(document.querySelectorAll('input[data-cat]'),function(cb){var rel=layers.filter(function(l){return l.category===cb.getAttribute('data-cat')});var all=rel.length&&rel.every(function(l){return state[l.id]});var any=rel.some(function(l){return state[l.id]});cb.checked=!!all;cb.indeterminate=!all&&any;});save();window.dispatchEvent(new Event('hw-layer-change'));}
function CSSescape(s){return s.replace(/\\/g,'\\\\').replace(/"/g,'\\"');}
function createToggle(parent,label,note,attrs){var row=document.createElement('label');row.className='toggle';var cb=document.createElement('input');cb.type='checkbox';Object.keys(attrs).forEach(function(k){cb.setAttribute(k,attrs[k]);});var txt=document.createElement('div');txt.className='name';txt.appendChild(document.createTextNode(label));if(note){var sm=document.createElement('small');sm.textContent=note;txt.appendChild(sm);}row.appendChild(cb);row.appendChild(txt);parent.appendChild(row);return cb;}
function updateCategory(c,v){layers.forEach(function(l){if(l.category===c)state[l.id]=v;});update();}
annot.forEach(function(item){var cb=createToggle(document.getElementById('annotations'),item[1],item[2],{'data-cat':item[0]});cb.addEventListener('change',function(){updateCategory(item[0],cb.checked);});});
geom.forEach(function(item){var relevant=layers.filter(function(l){return l.category===item[0]});if(!relevant.length)return;var cb=createToggle(document.getElementById('geometries'),item[1],relevant.length+' 個CAD圖層',{'data-cat':item[0]});cb.addEventListener('change',function(){updateCategory(item[0],cb.checked);});});
layers.forEach(function(l){var cb=createToggle(document.getElementById('indiv'),l.name,l.count+' 個CAD物件',{'data-layer':l.id});cb.addEventListener('change',function(){state[l.id]=cb.checked;update();});});
document.getElementById('labelsOn').addEventListener('click',function(){annot.forEach(function(item){layers.forEach(function(l){if(l.category===item[0])state[l.id]=true;});});update();});
document.getElementById('labelsOff').addEventListener('click',function(){annot.forEach(function(item){layers.forEach(function(l){if(l.category===item[0])state[l.id]=false;});});update();});
document.getElementById('reset').addEventListener('click',function(){state=Object.assign({},defaults);update();fit();});
document.getElementById('exportPrefs').addEventListener('click',function(){var s=JSON.stringify(state,null,2);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(s).then(function(){toast('已複製勾選設定');}).catch(function(){fallback(s);});}else fallback(s);});
function fallback(s){var ta=document.createElement('textarea');ta.value=s;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('已複製勾選設定');}catch(e){toast('請直接記錄目前勾選');}ta.remove();}
function toast(s){var o=document.getElementById('toast');o.textContent=s;o.style.display='block';setTimeout(function(){o.style.display='none';},2400);}
function fit(){map.setAttribute('viewBox',home.join(' '));}
function zoom(scale,cx,cy){var b=map.viewBox.baseVal;cx=(cx===undefined?b.x+b.width/2:cx);cy=(cy===undefined?b.y+b.height/2:cy);var w=b.width*scale,h=b.height*scale;map.setAttribute('viewBox',[(cx-(cx-b.x)*scale),(cy-(cy-b.y)*scale),w,h].join(' '));}
document.getElementById('zoomIn').addEventListener('click',function(){zoom(.75);});document.getElementById('zoomOut').addEventListener('click',function(){zoom(1.3333);});document.getElementById('fit').addEventListener('click',fit);
function point(clientX,clientY){var r=map.getBoundingClientRect(),vb=map.viewBox.baseVal;var ratio=Math.min(r.width/vb.width,r.height/vb.height),drawW=vb.width*ratio,drawH=vb.height*ratio;var ox=r.left+(r.width-drawW)/2,oy=r.top+(r.height-drawH)/2;return{x:vb.x+(clientX-ox)/ratio,y:vb.y+(clientY-oy)/ratio};}
// V11.8.4: CAD annotations must not be part of the low-resolution
// composited map texture during pinch/drag. Render CAD labels in a separate
// lightweight SVG using an exact vector viewBox on every animation frame.
// This layer is visual only; original label nodes remain the data source.
function makeLiveCadLabels(){
  var NS='http://www.w3.org/2000/svg';
  var live=document.createElementNS(NS,'svg');
  live.id='cadLiveLabels';live.setAttribute('aria-hidden','true');
  live.setAttribute('focusable','false');
  live.setAttribute('preserveAspectRatio',map.getAttribute('preserveAspectRatio')||'xMidYMid meet');
  live.setAttribute('viewBox',map.getAttribute('viewBox'));
  var pairLayers=[],pairTexts=[];
  function copyTextParts(src,dst){
    Array.prototype.forEach.call(src.children,function(child){
      if(child.localName==='text'){
        var copy=child.cloneNode(true);copy.removeAttribute('id');
        dst.appendChild(copy);pairTexts.push([child,copy]);
      }else if(child.querySelector&&child.querySelector('text')){
        var copyGroup=child.cloneNode(false);copyGroup.removeAttribute('id');
        // Never clone source event handlers or focusable targets.
        copyGroup.removeAttribute('tabindex');copyGroup.removeAttribute('role');
        dst.appendChild(copyGroup);copyTextParts(child,copyGroup);
      }
    });
  }
  Array.prototype.forEach.call(map.querySelectorAll('.cad-layer'),function(layer){
    if(!layer.querySelector('text'))return;
    var copy=layer.cloneNode(false);copy.removeAttribute('id');
    copy.removeAttribute('tabindex');copy.removeAttribute('role');
    copyTextParts(layer,copy);
    if(copy.childNodes.length){live.appendChild(copy);pairLayers.push([layer,copy]);}
  });
  box.appendChild(live);
  function syncLayers(){
    pairLayers.forEach(function(pair){
      pair[1].style.display=getComputedStyle(pair[0]).display==='none'?'none':'';
    });
  }
  function syncSizes(){
    pairTexts.forEach(function(pair){
      var size=pair[0].getAttribute('font-size');
      if(size!==null)pair[1].setAttribute('font-size',size);
    });
  }
  function setViewBox(v){live.setAttribute('viewBox',Array.isArray(v)?v.join(' '):v);}
  // Cover fit/zoom buttons and other modules which change the SVG viewBox.
  var observer=new MutationObserver(function(){
    if(!navGesture)setViewBox(map.getAttribute('viewBox'));
  });
  observer.observe(map,{attributes:true,attributeFilter:['viewBox']});
  window.addEventListener('hw-layer-change',syncLayers);
  var scaleInput=document.getElementById('labelScale');
  if(scaleInput)scaleInput.addEventListener('input',function(){requestAnimationFrame(syncSizes);});
  syncLayers();syncSizes();
  return{updateView:setViewBox,syncLayers:syncLayers,syncSizes:syncSizes,
    count:pairTexts.length,layerCount:pairLayers.length};
}
var liveCadLabels=null;
box.addEventListener('wheel',function(e){e.preventDefault();var p=point(e.clientX,e.clientY);zoom(e.deltaY<0?.86:1.16,p.x,p.y);},{passive:false});
// V11.8.3: composite mobile pan/pinch instead of re-rasterizing all CAD SVG nodes
// for every pointermove. Commit one exact SVG viewBox only when the gesture ends
// or when the pointer count changes. Other modules continue to use #plan viewBox.
var activePointers=new Map(),navGesture=null,navFrame=0,navVisual={x:0,y:0,scale:1};
var navStats={moves:0,frames:0,commits:0};
liveCadLabels=makeLiveCadLabels();
function navDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function navPoints(){return Array.from(activePointers.values());}
function navBegin(){
  if(!activePointers.size)return;
  var vb=map.viewBox.baseVal, r=box.getBoundingClientRect(), pts=navPoints();
  var x=pts.reduce(function(n,p){return n+p.x-r.left;},0)/pts.length;
  var y=pts.reduce(function(n,p){return n+p.y-r.top;},0)/pts.length;
  navGesture={box:[vb.x,vb.y,vb.width,vb.height],width:r.width,height:r.height,left:r.left,top:r.top,
    count:pts.length,x:x,y:y,dist:pts.length>1?navDistance(pts[0],pts[1]):0};
  navVisual={x:0,y:0,scale:1};
  map.style.transformOrigin='0 0';
  map.style.willChange='transform';
  box.classList.add('dragging');
}
function navCompute(){
  if(!navGesture)return;
  var pts=navPoints(),n=pts.length;
  if(n!==navGesture.count)return;
  var cx=pts.reduce(function(sum,p){return sum+p.x-navGesture.left;},0)/n;
  var cy=pts.reduce(function(sum,p){return sum+p.y-navGesture.top;},0)/n;
  var factor=1;
  if(n===2&&navGesture.dist>5){
    // Bound a single pinch gesture, preventing 0-width viewBoxes/overflow.
    factor=Math.max(.20,Math.min(6,navDistance(pts[0],pts[1])/navGesture.dist));
  }
  navVisual={x:cx-factor*navGesture.x,y:cy-factor*navGesture.y,scale:factor};
}
function navViewBox(v){
  if(!navGesture)return null;
  var b=navGesture.box,rw=navGesture.width,rh=navGesture.height;
  var k=Math.min(rw/b[2],rh/b[3]);
  if(!(k>0&&Number.isFinite(v.scale)&&v.scale>0))return null;
  var padX=(rw-b[2]*k)/2,padY=(rh-b[3]*k)/2;
  var x=b[0]+((1-v.scale)*padX-v.x)/(v.scale*k);
  var y=b[1]+((1-v.scale)*padY-v.y)/(v.scale*k);
  var w=b[2]/v.scale,h=b[3]/v.scale;
  return [x,y,w,h].every(Number.isFinite)?[x,y,w,h]:null;
}
function navPaint(){
  navFrame=0;
  if(!navGesture)return;
  navStats.frames++;
  var v=navVisual;
  map.style.transform='translate3d('+v.x+'px,'+v.y+'px,0) scale('+v.scale+')';
  var labelView=navViewBox(v);
  if(labelView&&liveCadLabels)liveCadLabels.updateView(labelView);
}
function navSchedule(){if(!navFrame)navFrame=requestAnimationFrame(navPaint);}
function navCommit(){
  if(!navGesture)return;
  if(navFrame){cancelAnimationFrame(navFrame);navFrame=0;}
  var v=navVisual;
  var newView=navViewBox(v);
  if(newView){
    if(Math.abs(v.x)+Math.abs(v.y)+Math.abs(v.scale-1)>0.005){
      map.setAttribute('viewBox',newView.join(' '));navStats.commits++;
    }
    if(liveCadLabels)liveCadLabels.updateView(map.getAttribute('viewBox'));
  }
  map.style.transform='';map.style.willChange='';navGesture=null;
}
box.addEventListener('pointerdown',function(e){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(navGesture)navCommit();
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  try{box.setPointerCapture(e.pointerId);}catch(err){}
  navBegin();
});
box.addEventListener('pointermove',function(e){
  if(!activePointers.has(e.pointerId))return;
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  navStats.moves++;
  navCompute();navSchedule();
},{passive:true});
function navUp(e){
  if(!activePointers.has(e.pointerId))return;
  // Include the final pointer coordinate, including low-frequency browsers.
  activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  navCompute();navCommit();
  activePointers.delete(e.pointerId);
  try{if(box.hasPointerCapture(e.pointerId))box.releasePointerCapture(e.pointerId);}catch(err){}
  if(activePointers.size)navBegin();else box.classList.remove('dragging');
}
box.addEventListener('pointerup',navUp);
box.addEventListener('pointercancel',navUp);
window.addEventListener('blur',function(){navCommit();activePointers.clear();box.classList.remove('dragging');});
window.HWNavPerformance={stats:function(){return Object.assign({},navStats);},active:function(){return !!navGesture;},labels:function(){return liveCadLabels?{count:liveCadLabels.count,layers:liveCadLabels.layerCount}:null;}};
map.addEventListener('click',function(e){var cur=e.target;while(cur&&cur!==map){if(cur.hasAttribute&&cur.hasAttribute('data-info')){document.getElementById('info').firstChild.textContent='所選圖層：'+cur.getAttribute('data-info');return;}cur=cur.parentNode;}});
document.getElementById('menuOpen').addEventListener('click',function(){document.getElementById('side').classList.toggle('open');});document.querySelector('.viewer').addEventListener('click',function(e){if(window.innerWidth<761&&document.getElementById('side').classList.contains('open'))document.getElementById('side').classList.remove('open');});

window.HWViewer={
  layers:layers.map(function(l){return Object.assign({},l);}),
  defaults:Object.assign({},defaults),
  getState:function(){return Object.assign({},state);},
  setCategory:function(c,v){updateCategory(c,!!v);},
  setAnnotations:function(enabled){var mapping=enabled||{};layers.forEach(function(l){if(Object.prototype.hasOwnProperty.call(mapping,l.category))state[l.id]=!!mapping[l.category];});update();},
  loadState:function(next){if(!next||typeof next!=='object'||Array.isArray(next))throw new Error('無效的設定');var n=0;Object.keys(state).forEach(function(k){if(typeof next[k]==='boolean'){state[k]=next[k];n++;}});if(!n)throw new Error('未找到可匯入的圖層設定');update();return n;},
  resetAnnotations:function(){layers.forEach(function(l){if(['building','zone','area','dimension','notes','bedid','penid'].indexOf(l.category)>=0)state[l.id]=defaults[l.id];});update();}
};
update();
})();