/* V11.8 quick access to named switch markers. Reads original device photo
 * metadata; never duplicates photos or changes their normalized coordinates. */
(function(){'use strict';
const main=document.getElementById('v90PhotoMain');if(!main)return;
const pane=document.createElement('details');pane.id='v118MarkerIndex';pane.className='v118-marker-index';
pane.innerHTML='<summary id="v118MarkerSummary">照片開關／設備標記清單</summary><div id="v118MarkerRows" class="v118-marker-rows"></div>';
const stage=document.getElementById('v90Stage');stage?.insertAdjacentElement('afterend',pane);
const rows=document.getElementById('v118MarkerRows'),summary=document.getElementById('v118MarkerSummary');
function refresh(detail){const marks=Array.isArray(detail?.markers)?detail.markers:[];
 summary.textContent=`開關／設備標記清單 · ${marks.length} 處（點選直接定位）`;
 rows.replaceChildren();
 if(!marks.length){const p=document.createElement('p');p.textContent='這張照片尚未建立標記。可以先按「＋ 標記照片位置」。';rows.appendChild(p);return;}
 marks.forEach((mark,i)=>{const b=document.createElement('button');b.type='button';b.className='v118-marker-row';
  const title=document.createElement('strong');title.textContent=`${i+1}. ${mark.title||'未命名標記'}`;
  const note=document.createElement('small');note.textContent=mark.note||'尚未填寫功能說明';
  b.append(title,note);b.addEventListener('click',()=>{
   const target=[...document.querySelectorAll('#v90Pins .v90-pin')].find(x=>x.dataset.markerId===mark.id);
   if(target){target.click();target.focus({preventScroll:true});document.getElementById('v90MarkerForm')?.scrollIntoView?.({block:'nearest',behavior:'smooth'});}
  });rows.appendChild(b);
 });
}
window.addEventListener('hw-v118-photo-view',e=>refresh(e.detail));
window.HWPhotoMarkerIndexV118={refresh};
})();
