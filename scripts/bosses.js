import bossData from '../data/guias/hollowKnight-bosses.json' assert { type: 'json' };

const root=document.querySelector('#boss-tracker');
if(root){
 const key='platinumgames-hk-bosses-v1';
 let completed=new Set(); try{completed=new Set(JSON.parse(localStorage.getItem(key)||'[]'));}catch{}
 const types=['Todos',...new Set(bossData.map(x=>x.type))];
 root.innerHTML=`<details class="boss-tracker" open><summary><h2>⚔️ Checklist de chefes</h2></summary><div class="boss-tools"><p class="boss-progress" aria-live="polite"></p><label>Pesquisar <input class="boss-search" type="search" placeholder="Nome ou região..."></label><label>Categoria <select class="boss-type"></select></label><button type="button" class="boss-reset">Limpar progresso</button></div><div class="boss-list"></div></details>`;
 const list=root.querySelector('.boss-list'),search=root.querySelector('.boss-search'),select=root.querySelector('.boss-type'),counter=root.querySelector('.boss-progress');
 select.innerHTML=types.map(t=>`<option value="${t}">${t}</option>`).join('');
 function render(){const term=search.value.toLowerCase(),type=select.value; const rows=bossData.filter(x=>(type==='Todos'||x.type===type)&&(x.name.toLowerCase().includes(term)||x.area.toLowerCase().includes(term)));list.innerHTML=rows.map(x=>`<label class="boss-row"><input type="checkbox" data-id="${x.id}" ${completed.has(x.id)?'checked':''}><span><strong>${x.name}</strong><small>${x.type} · ${x.area}</small></span></label>`).join('')||'<p>Nenhum resultado.</p>';counter.textContent=`${completed.size} / ${bossData.length} marcados`;list.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{i.checked?completed.add(i.dataset.id):completed.delete(i.dataset.id);localStorage.setItem(key,JSON.stringify([...completed]));render();}));}
 search.addEventListener('input',render);select.addEventListener('change',render);root.querySelector('.boss-reset').addEventListener('click',()=>{if(confirm('Apagar o progresso deste checklist?')){completed.clear();localStorage.removeItem(key);render();}});render();
}