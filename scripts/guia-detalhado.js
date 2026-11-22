const root = document.querySelector(".guide-main");
const dataUrl = "../data/guias/hollowKnight.json";
const storageKey = "platinumGames:hollowKnight:detailChecklist:v2";

if (root) {
  fetch(dataUrl).then((response) => {
    if (!response.ok) throw new Error("Não foi possível carregar o guia detalhado.");
    return response.json();
  }).then((data) => render(data)).catch((error) => {
    const message = document.createElement("p");
    message.className = "guide-data-error";
    message.textContent = error.message;
    root.append(message);
  });
}

function render(data) {
  const section = document.createElement("section");
  section.className = "detailed-roadmap";
  section.id = "roteiro-platina";
  const title = document.createElement("h2");
  title.textContent = "Roteiro otimizado e checklist detalhado";
  const intro = document.createElement("p");
  intro.textContent = "Abra cada objetivo para ver instruções, pré-requisitos, alertas, regiões de referência e subchecklist. O progresso é salvo neste navegador.";
  const overall = document.createElement("div");
  overall.className = "roadmap-overall";
  const overallText = document.createElement("p");
  overallText.className = "roadmap-count";
  const overallBar = document.createElement("progress");
  overallBar.max = 1; overallBar.value = 0; overallBar.className = "guide-progress-bar";
  const clear = document.createElement("button");
  clear.type = "button"; clear.className = "button button-secondary"; clear.textContent = "Limpar checklist";
  overall.append(overallText, overallBar, clear);
  const finder = document.createElement("div"); finder.className = "roadmap-finder";
  const finderLabel = document.createElement("label"); finderLabel.textContent = "Central de localização — pesquisar objetivo ou região";
  const finderInput = document.createElement("input"); finderInput.type = "search"; finderInput.placeholder = "Ex.: Deepnest, Grubs, Grimm, Pantheon..."; finderInput.setAttribute("aria-label", finderLabel.textContent);
  finderLabel.append(finderInput); finder.append(finderLabel);
  section.append(title, intro, finder, overall);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch {}
  const inputs = [];
  data.phases.forEach((phase) => {
    const phaseCard = document.createElement("details"); phaseCard.className = "roadmap-phase";
    const summary = document.createElement("summary"); summary.textContent = phase.title;
    const description = document.createElement("p"); description.textContent = phase.summary;
    const phaseCount = document.createElement("p"); phaseCount.className = "roadmap-phase-count";
    const list = document.createElement("div"); list.className = "roadmap-task-list";
    phase.tasks.forEach((task) => {
      const card = document.createElement("article"); card.className = "roadmap-task";
      const header = document.createElement("label");
      const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = Boolean(saved[task.id]); checkbox.dataset.task = task.id;
      const name = document.createElement("strong"); name.textContent = task.title;
      header.append(checkbox,name); card.append(header);
      const detail = document.createElement("p"); detail.textContent = task.details; card.append(detail);
      if(task.locations?.length){const location=document.createElement("p");location.className="roadmap-location";location.textContent="Onde procurar: "+task.locations.join(" • ");card.append(location);}
      if(task.prerequisites){const pre=document.createElement("p");pre.className="roadmap-prerequisites";pre.textContent="Pré-requisitos/observações: "+task.prerequisites;card.append(pre);}
      if(task.warning){const warning=document.createElement("p");warning.className="roadmap-warning";warning.textContent="Atenção: "+task.warning;card.append(warning);}
      if(task.steps?.length){const guide=document.createElement("ol");guide.className="roadmap-steps";task.steps.forEach(s=>{const li=document.createElement("li");li.textContent=s;guide.append(li);});card.append(guide);}
      if(task.checklist?.length){const sub=document.createElement("div");sub.className="roadmap-subchecklist";const heading=document.createElement("strong");heading.textContent="Subchecklist";sub.append(heading);task.checklist.forEach(item=>{const lab=document.createElement("label");lab.className="roadmap-subtask";const cb=document.createElement("input");cb.type="checkbox";cb.checked=Boolean(saved[item.id]);cb.dataset.task=item.id;const text=document.createElement("span");text.textContent=item.text;lab.append(cb,text);sub.append(lab);inputs.push(cb);});card.append(sub);}
      if(task.links?.length){const links=document.createElement("p");links.className="roadmap-relations";links.textContent="Objetivos/troféus relacionados: "+task.links.join(" • ");card.append(links);}
      list.append(card); card.dataset.search = [task.title,task.details,...(task.locations||[]),...(task.links||[]),...(task.steps||[])].join(" ").toLowerCase(); inputs.push(checkbox);
    });
    phaseCard.append(summary,description,phaseCount,list);section.append(phaseCard);phaseCard._inputs=phase.tasks.flatMap(t=>[t.id,...(t.checklist||[]).map(x=>x.id)]).map(id=>inputs.find(input=>input.dataset.task===id));phaseCard._count=phaseCount;
  });
  const editorial=document.createElement("section");editorial.className="guide-editorial";
  const editorialTitle=document.createElement("h2");editorialTitle.textContent="Verificação editorial";
  const editorialText=document.createElement("p");editorialText.textContent=data.metadata.status+". Revisão: "+data.metadata.reviewed+". Versão do guia: "+data.metadata.guideVersion+". Versão do jogo: "+data.metadata.gameVersion+".";
  const caveat=document.createElement("p");caveat.textContent=data.metadata.reviewNotes;
  const sources=document.createElement("ul");data.sourceLinks.forEach(source=>{const li=document.createElement("li");const link=document.createElement("a");link.href=source.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=source.name;li.append(link);sources.append(li);});
  editorial.append(editorialTitle,editorialText,caveat,sources);section.append(editorial);
  const placeholder=document.getElementById("guia-detalhado");if(placeholder)placeholder.replaceWith(section);else root.append(section);
  const update=()=>{const done=inputs.filter(input=>input.checked).length;overallText.textContent=done+" / "+inputs.length+" itens marcados ("+(inputs.length?Math.round(done/inputs.length*100):0)+"%)";overallBar.max=Math.max(inputs.length,1);overallBar.value=done;section.querySelectorAll(".roadmap-phase").forEach(phase=>{const count=phase._inputs.filter(input=>input?.checked).length;phase._count.textContent=count+" / "+phase._inputs.length+" itens marcados";});const state={};inputs.forEach(input=>{if(input.checked)state[input.dataset.task]=true;});try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{}};
  inputs.forEach(input=>input.addEventListener("change",update));
  finderInput.addEventListener("input",()=>{const term=finderInput.value.trim().toLowerCase();section.querySelectorAll(".roadmap-task").forEach(card=>{card.hidden=term.length>0&&!card.dataset.search.includes(term);});section.querySelectorAll(".roadmap-phase").forEach(phase=>{const visible=[...phase.querySelectorAll(".roadmap-task")].some(card=>!card.hidden);phase.hidden=term.length>0&&!visible;if(term&&visible)phase.open=true;});});
  clear.addEventListener("click",()=>{if(!confirm("Limpar o progresso deste roteiro?"))return;inputs.forEach(input=>input.checked=false);update();});
  update();
}
