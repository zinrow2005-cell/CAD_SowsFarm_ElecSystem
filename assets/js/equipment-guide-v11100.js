/* V11.10.0 Equipment guide — select → learn → confirm → place. No project data is changed by opening this dialog. */
(function(){'use strict';
const hw=window.HWEquipment;
if(!hw)return;
const entries={
 waterTower:['集中儲存供水用水，通常位於供水系統的上游。','在圖上標註各座高架水塔，並連結出水管線。','這是水塔位置圖示，不代表現場水量或水位已被即時監測。'],
 waterTank:['低位或局部儲水容器，用於暫存、補水或調節供水。','標記各棟舍的小水箱、緩衝水桶或補水桶。','與高架水塔不同；依現場設備實際用途選擇。'],
 groundwater:['標記地下水來源及抽水井所在的位置。','可由此記錄井水供應來源並連接水路。','抽水泵浦請另外用「加壓泵」標示；此圖示代表井位。'],
 tap:['標註自來水進入豬場管路的位置。','適用於自來水總入口、供水接入點。','與「給水接點」不同：這裡是自來水來源。'],
 threeWay:['表示可在不同水源或流向之間切換的閥件。','例如地下水／水塔水切換，記錄閥門及管線關聯。','僅記錄管路配置；不會遠端操作實體閥門。'],
 manualValve:['需要人員手動開啟或關閉的管路閥門。','標記維修隔離閥、各棟供水總開關。','若會由控制器自動驅動，請改選「自動閥門」。'],
 autoValve:['透過電控或其他自動化機制開關的閥門。','適合定時供水、電磁閥或自動供水切換的位置。','此圖示只記錄設備，不代表已接入控制系統。'],
 filter:['水路過濾裝置，用來攔截泥沙或雜質。','標註前置濾器、供水處理濾心的位置。','可在設備資料裡記錄濾芯規格及更換日期。'],
 pump:['用馬達提供水壓或輸送水的泵浦。','標記抽水、加壓、循環供水泵。','地下水井是水源；泵浦才是提供抽送動力的設備。'],
 meter:['用於量測供水量的水表或計量表。','記錄各棟、分路或總進水水表位置。','圖示不會自動讀取流量，可另行登錄讀數。'],
 manifold:['把單一路供水分配到多條支管的分配器。','例如母豬舍不同排或不同區域的分水歧管。','若只需要記錄水管分叉座標，可用「水管分支接點」。'],
 waterPoint:['水管接點或分支供水位置。','用在一般水管給水連接點。','如果要標註實際有水可以取用的出水位置，請選「出水口」。'],
 waterOutlet:['實際可取水、接水或出水的管線出口。','可標註地下水、水塔水或自來水的出水口，放置時勾選來源（可複選）。','所選水源是人工標記；不代表閥門已開、管路已核對或目前實際有水。'],
 drainPoint:['污水、清洗水或其他排水的排放位置。','可用於落水口、排水管銜接處。','不是污水處理廠本身；請另外註明去向。'],
 flushPoint:['供水管線上的沖洗或清管位置。','標註可接水管清洗、放水沖洗的區域。','與一般給水點不同，重點是沖洗作業用途。'],
 waterJunction:['只標示水管分叉、接頭或 T 字連接的位置。','適合沒有獨立設備、但要準確繪製水路拓樸的節點。','本圖示是管線節點，不是可操作的實體閥門。'],
 transformer:['變壓或變電設備的配置位置。','記錄變電器位置、額定電壓與相關電力管線。','請依銘牌及現場接線核對；標示本身不表示已帶電。'],
 panel:['全場主要配電盤，集中管理大型電力迴路。','標記主進線、全場電力配電盤，方便追蹤下游分盤。','與區域分電盤不同；實際配電層級仍須依現場核對。'],
 subPanel:['從主配電盤分出的棟舍或區域配電盤。','例如產房、保育舍各自的分電盤。','可用設備照片標記內部斷路器及迴路。'],
 controlBox:['控制風扇、水泵或其他機械的控制箱。','例如自動溫控、供水及設備控制電箱。','控制箱與配電盤用途可能不同，請依實物選擇。'],
 generator:['停電時提供備援電力的發電機組。','標記發電機位置、設備銘牌及供電關聯。','圖示不會啟動發電機，也不代表備援電力已連接。'],
 ats:['市電與備援電源間自動切換的 ATS 裝置。','供電系統若有自動切換盤，可用此圖示標註。','請勿將 ATS 與發電機當成同一台設備。'],
 socket:['一般插座、接電口或設備用電端點。','適合標記現場需要維修或查電源來源的接點。','不等於開關，主要用途是電力接入位置。'],
 switch:['人工或設備控制用的電源開關。','標記照明、馬達、控制迴路等開關的位置。','這是 CAD 管理圖示，點圖不會直接控制實際電源。'],
 lighting:['燈具、燈座及固定照明的位置。','供記錄故障燈具、區域照明與電路來源。','若要標註控制它的開關，請另放「電源開關」。'],
 motorPower:['供應馬達運作的電力接點或電源位置。','可用於水泵、排風扇、送料馬達的動力來源標記。','馬達本體請搭配對應設備類型記錄。'],
 alarm:['異常時發出聲響、燈號或警示訊號的設備。','例如配電異常、溫度過高或控制系統警報器。','本圖示不會提供即時推播或監測功能。'],
 ups:['短時間維持控制器或電子設備供電的不斷電系統。','標記控制盤、監控主機的 UPS 位置。','與大型發電機不同，後備時間及負載需另核對。'],
 electricJunction:['只標註電線分接、端子或接線盒的位置。','用來呈現迴路分支、便於維修追線。','不是一個可直接供電或切換的開關。'],
 curtain:['豬舍的水簾降溫設備。','標記水簾牆的位置，搭配風扇規劃氣流。','注意記錄水簾實際尺寸、水源及維修資料。'],
 fan:['主要負責抽排豬舍空氣的大型排風扇。','適合產房、妊娠舍與其他負壓通風區。','請依現場機型記錄尺寸，不要一律視為 42 吋。'],
 smallFan:['較小型的排氣或局部通風風扇。','可用於公豬舍或較小區域的通風配置。','依實際風扇用途決定，與大型排風扇區分。'],
 guideFan:['協助引導室內氣流方向的中繼或導引風扇。','適合長型豬舍內部，改善氣流分布。','不代表主排風量；可搭配水簾與排風設備標註。'],
 ceilingFan:['裝在頂部或高處的循環送風設備。','適合有實際頂部循環扇或吊掛扇的位置。','若豬舍沒有天花板，不要誤當成必備設備。'],
 roofFan:['安裝於屋頂的抽排風裝置。','只用於現場確實設置屋頂抽風機的位置。','屋頂有太陽能板不代表一定有屋頂抽風機。'],
 airInlet:['讓外氣進入豬舍的開口或風道。','標記側牆進氣口、進風窗及導入位置。','不是風扇；與「排氣口」方向相反。'],
 airOutlet:['供空氣離開豬舍的出風口或排氣端。','標記排風出口或通風管末端的位置。','若是實際馬達風扇，請使用風扇圖示。'],
 sensor:['量測溫度、濕度的感測器探頭。','可標記不同棟舍的溫濕度測點。','不會自動讀取感測器數據，需另外整合系統。'],
 controller:['用於控制風扇、水簾或其他溫控設備的控制器。','標記溫控主機或控制箱內的溫控裝置。','控制器與溫濕度探頭可能是兩個不同設備。'],
 mist:['藉由噴霧協助降溫的設備與噴頭。','標註實際有配置的噴霧系統、噴頭區域。','請依實際使用需求標記，並注意濕度管理。'],
 feedSilo:['場內儲存散裝飼料的大型料塔或筒倉。','標記不同飼料配方與儲料來源。','可以搭配送料管與送料馬達形成完整流向。'],
 feedBin:['分區儲料、暫存或緩衝使用的飼料桶。','標記棟舍的小料桶、緩衝桶。','與場外大型料塔不同。'],
 feedLine:['代表送料管線的終端或末端送料設備。','適合標記供料區域的末端料線設備。','如果只是連續管線，優先用「畫飼料管」工具繪製。'],
 feedAuger:['透過螺旋絞龍輸送飼料的機械。','可記錄絞龍傳送機、螺旋送料的動力與位置。','只標註有實際絞龍的裝置，不代表所有送料管。'],
 feedMotor:['驅動飼料輸送設備的馬達。','方便建立送料設備維修、電源與規格資料。','與「馬達電源」不同，此處代表馬達設備本體。'],
 feedDistributor:['把一路飼料輸送分配到多個方向的裝置。','標記分料器、輸送分流機構。','若只有管路分叉點可選「飼料管分流接點」。'],
 feedValve:['切換飼料輸送方向的閥門或分流機構。','適用於實際具有切換機制的送料系統。','和水用三向閥用途不同，不要混用。'],
 feedDrop:['飼料從輸送管掉落到料槽的出料口。','標註落料口、料管末端出口。','若是整個料槽，請另用「飼料槽」。'],
 feedSensor:['偵測儲料桶、料塔或料槽高低料位的裝置。','標記缺料、滿料感測器與維修位置。','本系統的圖示不會自動偵測料位。'],
 feedControl:['送料系統的控制盤、配電／開關箱。','可記錄送料定時、馬達控制與線路關聯。','如果是主配電盤，請選電力類別的配電箱。'],
 feedTrough:['豬隻實際取食的飼槽、落料終點。','標註重要的餵料設備位置。','非送料管線節點，可用來表示輸送目的地。'],
 feedService:['飼料管線上的維修、清潔與檢查點。','標註檢修孔、易堵塞處或維護位置。','這是維護用途標記，未必是一台獨立機械。'],
 feedJunction:['只標註送料管路的分支或銜接點。','適合繪製不需獨立設備檔案的送料管拓樸。','若存在實體切換機構，請改選分料器或切換閥。'],
 drinker:['豬隻喝水的飲水器或飲水嘴。','標註保育舍、肉豬舍或母豬舍飲水設備。','與供水管的單純出水接點不同。'],
 sprayer:['用於噴水、消毒或清洗的噴灑設備。','依實際用途記錄噴頭、噴灑器位置。','消毒與降溫用途可能不同，請在設備資料注明。'],
 camera:['監控場內影像的攝影機設備。','標註鏡頭位置、照射區域與供電關聯。','本圖示不會自行串接監視畫面。'],
 gate:['門禁控制器、控制開關或重要出入口。','標示特殊管制區的門禁設備。','普通門牆仍屬 CAD 底圖，不一定需要設備圖示。'],
 washUnit:['消毒、沖洗或洗淨設備的位置。','記錄清洗設備、洗消機具與供水電位置。','單純沖洗出水口可用水路「沖洗點」。'],
 repairPoint:['需要追蹤處理的設備維修或檢查位置。','現場若無單獨設備類型，可暫用維修點標記。','長期設備仍建議使用其真正設備類型加上維修紀錄。'],
 reservePoint:['未來可能增設的設備或管線預留位置。','規劃尚未施工的管線端點或設備位置。','避免與已安裝設備混淆，建議註明「預留」。'],
 other:['沒有適合預設分類時的通用設備圖示。','可在設備記錄輸入真實名稱、用途及照片。','建議常用的特殊設備另外建立自訂種類。']
};
entries.ventWall=['以區段方式標示連續的排風牆或排風牆面。','沿豬舍牆面兩點定位，長條標示實際配置範圍。','僅是 CAD 配置標記，不表示已接入風扇供電或風量資料。'];
entries.cableTrunk=['代表電纜幹線的配置區段示意。','沿通道或牆面標示電纜幹線的大致區域。','與真正電線迴路不同；供電連線仍應用畫電線工具記錄。'];
entries.warningZone=['走道或設備旁的警示與管制區段標示。','用兩點標記長條警戒位置，避免一般圖示拉伸失真。','不會修改底圖牆線，且不取代現場的警告標線。'];
const groupTitles={water:'給排水',electric:'電力',ventilation:'通風與環控',feed:'飼料輸送',equipment:'其他設備'};
const E=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el;};
const overlay=E('div','v11100-backdrop');overlay.id='v11100Backdrop';overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
const dialog=E('section','v11100-card');dialog.tabIndex=-1;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','v11100Title');dialog.setAttribute('aria-describedby','v11100Purpose');
const header=E('div','v11100-header');const eyebrow=E('div','v11100-kicker','EQUIPMENT GUIDE · 設備用途說明');const close=E('button','v11100-close','×');close.type='button';close.setAttribute('aria-label','取消選擇並關閉說明');
header.append(eyebrow,close);
const hero=E('div','v11100-hero');const art=E('div','v11100-art');const names=E('div','v11100-names');const typeText=E('span','v11100-type');const name=E('h2','');name.id='v11100Title';names.append(typeText,name);hero.append(art,names);
const body=E('div','v11100-body');
const purpose=E('div','v11100-section');const purposeTitle=E('strong','','這是什麼設備？');const purposeText=E('p','');purposeText.id='v11100Purpose';purpose.append(purposeTitle,purposeText);
const usage=E('div','v11100-section');const usageTitle=E('strong','','什麼時候使用？');const usageText=E('p','');usage.append(usageTitle,usageText);
const note=E('div','v11100-note');const noteTitle=E('strong','','使用提醒');const noteText=E('p','');note.append(noteTitle,noteText);body.append(purpose,usage,note);
const waterOutletChoices=E('fieldset','v11100-water-source');waterOutletChoices.hidden=true;
const sourceLegend=E('legend','','出水口來源（可複選）');waterOutletChoices.appendChild(sourceLegend);
const outletChecks={};
for(const [id,text] of [['groundwater','地下水'],['tower','水塔水'],['tap','自來水']]){
 const row=E('label','v11100-source-row');const input=E('input');input.type='checkbox';input.value=id;outletChecks[id]=input;
 row.append(input,document.createTextNode(text));waterOutletChoices.appendChild(row);
}
const outletWarning=E('p','v11100-source-warning','請至少勾選一種出水來源');outletWarning.hidden=true;waterOutletChoices.appendChild(outletWarning);
body.appendChild(waterOutletChoices);
const footer=E('div','v11100-footer');const cancel=E('button','v11100-cancel','取消');const confirm=E('button','v11100-confirm','確認使用・開始放置');cancel.type=confirm.type='button';const arrayBtn=E('button','v11100-confirm','改用陣列・兩點放置');arrayBtn.type='button';arrayBtn.hidden=true;const segmentBtn=E('button','v11100-confirm','改用長條・兩點放置');segmentBtn.type='button';segmentBtn.hidden=true;footer.append(cancel,arrayBtn,segmentBtn,confirm);
dialog.append(header,hero,body,footer);overlay.appendChild(dialog);document.body.appendChild(overlay);
let pending=null,prevFocus=null;
function dismiss(){if(!pending)return;pending=null;overlay.hidden=true;overlay.setAttribute('aria-hidden','true');document.body.classList.remove('v11100-dialog-open');if(prevFocus?.isConnected)prevFocus.focus({preventScroll:true});prevFocus=null;}
function infoFor(t){let item=entries[t.type];if(item)return item;
 const own=(t.defaultNote||'').trim();const group=groupTitles[t.group]||'設備';
 return [own||'這是你自訂的「'+t.label+'」設備種類，可用來管理圖面上的實際設備。','在 CAD 上標記「'+t.label+'」位置，之後可補充規格、照片與設備資料。','自訂設備｜'+group+'；如用途不夠清楚，可至左側「自訂設備圖庫」修改預設說明。'];}
function request(type,cb,opts={}){const t=hw.getType(type);if(!t||hw.getRole()!=='admin')return false;if(pending)dismiss();prevFocus=document.activeElement;pending={type,cb};
 art.replaceChildren();const svg=window.HWIconArt?.draw(t.type,t.graphic);if(svg)art.appendChild(svg);else art.appendChild(E('span','',t.symbol||'設'));
 waterOutletChoices.hidden=type!=='waterOutlet';outletWarning.hidden=true;Object.values(outletChecks).forEach(x=>{x.checked=false;});
 const info=infoFor(t);name.textContent=t.label;typeText.textContent=(groupTitles[t.group]||'設備')+' · CAD 圖面標記';purposeText.textContent=info[0];usageText.textContent=info[1];noteText.textContent=info[2];const supported=['curtain','airInlet','airOutlet','feedLine','feedAuger','feedTrough','mist','ventWall','cableTrunk','warningZone'];arrayBtn.hidden=!!opts.drop||!!opts.preferArray||!['fan','smallFan','guideFan','ceilingFan','roofFan','lighting','drinker','sprayer'].includes(type);segmentBtn.hidden=!!opts.drop||!!opts.preferSegment||!supported.includes(type);confirm.textContent=opts.preferArray?'確認・兩點建立陣列':opts.preferSegment?'確認・兩點放置長條':opts.drop?'確認使用・放置於此位置':'確認使用・一般圖示';
 overlay.hidden=false;overlay.setAttribute('aria-hidden','false');document.body.classList.add('v11100-dialog-open');confirm.focus({preventScroll:true});return true;}
function approve(){
 if(pending?.type==='waterOutlet'){
  const selected=Object.entries(outletChecks).filter(([,input])=>input.checked).map(([id])=>id);
  if(!selected.length){outletWarning.hidden=false;return;}
  hw.setPlacementSources(selected);
 }
 const run=pending?.cb;dismiss();if(typeof run==='function')run();
}
arrayBtn.addEventListener('click',()=>{const type=pending?.type;dismiss();if(type)hw.begin(type,'array');});
segmentBtn.addEventListener('click',()=>{const type=pending?.type;dismiss();if(type)hw.begin(type,'segment');});
close.addEventListener('click',dismiss);cancel.addEventListener('click',dismiss);confirm.addEventListener('click',approve);
overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)dismiss();});
document.addEventListener('keydown',e=>{if(!pending)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss();}else if(e.key==='Tab'){
 const focus=[close,cancel,...(arrayBtn.hidden?[]:[arrayBtn]),...(segmentBtn.hidden?[]:[segmentBtn]),confirm];const at=focus.indexOf(document.activeElement);if(e.shiftKey&&at===0){e.preventDefault();confirm.focus();}else if(!e.shiftKey&&at===focus.length-1){e.preventDefault();close.focus();}
}},true);
const beginNow=hw.begin.bind(hw),placeNow=hw.placeAt.bind(hw);
hw.begin=(type,mode)=>{if(mode!=='place')return beginNow(type,mode);return request(type,()=>beginNow(type,mode));};
hw.placeAt=(type,x,y)=>request(type,()=>placeNow(type,x,y),{drop:true});
window.HWEquipmentGuide={request,beginNow,placeNow,isOpen:()=>!!pending,getDescription:type=>{const t=hw.getType(type);return t?infoFor(t):null;}};
})();
