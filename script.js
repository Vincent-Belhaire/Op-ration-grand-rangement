"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const welcomeScreen = $("#welcomeScreen");
const missionScreen = $("#missionScreen");
const finalScreen = $("#finalScreen");
const content = $("#challengeContent");
const feedback = $("#feedback");
const feedbackText = $("#feedbackText");
const nextButton = $("#nextButton");
const helpModal = $("#helpModal");
const helpContent = $("#helpContent");
const MAX_SCORE = 870;

const challenges = [
  {
    kicker: "DÉFI 01 · LES BONS GESTES",
    title: "Copier, couper ou coller ?",
    brief: "Choisis l’action qui correspond exactement à chaque situation.",
    time: "≈ 5 min",
    help: `<p><strong>Copier</strong> crée un double et laisse l’original en place.</p><p><strong>Couper</strong> prépare un élément à être déplacé. <strong>Coller</strong> le dépose dans le dossier ouvert.</p>`,
    render: renderChallenge1
  },
  {
    kicker: "DÉFI 02 · CLAVIER D’AGENT",
    title: "Raccourcis éclair",
    brief: "Utilise le clavier — ou les touches à l’écran — pour lancer la bonne action.",
    time: "≈ 6 min",
    help: `<ul><li><kbd>Ctrl</kbd> + <kbd>C</kbd> : copier</li><li><kbd>Ctrl</kbd> + <kbd>X</kbd> : couper</li><li><kbd>Ctrl</kbd> + <kbd>V</kbd> : coller</li><li><kbd>Suppr</kbd> : supprimer</li></ul>`,
    render: renderChallenge2
  },
  {
    kicker: "DÉFI 03 · EXPLORATEUR",
    title: "Le grand tri",
    brief: "Range les fichiers mélangés dans les trois sous-dossiers de TICE.",
    time: "≈ 10 min",
    help: `<p>Lis l’extension du fichier : <strong>.png</strong> et <strong>.jpg</strong> sont des images. Les travaux terminés vont dans <strong>À rendre</strong>.</p><p>Tu peux glisser un fichier, ou le sélectionner puis cliquer sur un dossier.</p>`,
    render: renderChallenge3
  },
  {
    kicker: "DÉFI 04 · DÉPLACEMENT",
    title: "Zéro copie en trop",
    brief: "Déplace un fichier avec le menu contextuel, sans créer de double.",
    time: "≈ 7 min",
    help: `<p>Pour déplacer sans garder l’original : <strong>clic droit → Couper</strong>, ouvre le dossier de destination, puis choisis <strong>Coller ici</strong>.</p>`,
    render: renderChallenge4
  },
  {
    kicker: "DÉFI 05 · NOMS DE CODE",
    title: "Des fichiers bien nommés",
    brief: "Remplace les noms confus par des noms courts, précis et lisibles.",
    time: "≈ 5 min",
    help: `<p>Un bon nom dit ce que contient le fichier. Évite « truc », « nouveau » ou « finalfinal ». Garde toujours l’extension : <strong>.odt</strong>, <strong>.png</strong>…</p>`,
    render: renderChallenge5
  },
  {
    kicker: "DÉFI 06 · CORBEILLE",
    title: "Supprimer… puis sauver",
    brief: "Supprime le bon fichier, puis restaure-le depuis la corbeille simulée.",
    time: "≈ 5 min",
    help: `<p>La touche <kbd>Suppr</kbd> envoie généralement le fichier dans la corbeille. Dans la corbeille, la commande <strong>Restaurer</strong> le replace à son emplacement d’origine.</p>`,
    render: renderChallenge6
  },
  {
    kicker: "DÉFI 07 · ALERTE ROUGE",
    title: "Le dossier catastrophe",
    brief: "Suis la feuille de route : chaque action et chaque nom attendu sont indiqués.",
    time: "≈ 12 min",
    help: `<p>Tu n’as rien à deviner : la feuille de route donne les dossiers de destination et le nouveau nom exact.</p><ol><li>Glisse le fichier sur son dossier de destination.</li><li>Si le glisser-déposer est difficile, clique d’abord sur le fichier puis sur le dossier.</li><li>Pour le compte rendu, sélectionne-le — même après son déplacement — puis clique sur <strong>Renommer</strong>.</li></ol>`,
    render: renderChallenge7
  },
  {
    kicker: "BONUS · RANGEMENT EXPRESS",
    title: "45 secondes chrono !",
    brief: "Associe chaque fichier à son dossier avant la fin du chronomètre.",
    time: "≈ 5 min",
    help: `<p>Sélectionne un fichier à gauche, puis son dossier à droite. Appuie-toi sur le nom et l’extension. Le défi reste terminable même si le temps est écoulé.</p>`,
    render: renderChallenge8
  }
];

const state = {
  index: 0,
  score: 0,
  completed: new Set(),
  challengeScores: new Map(),
  badges: new Set(),
  timer: null,
  timerLeft: 45,
  challengeData: {}
};

function showScreen(screen) {
  welcomeScreen.hidden = screen !== "welcome";
  missionScreen.hidden = screen !== "mission";
  finalScreen.hidden = screen !== "final";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startMission() {
  showScreen("mission");
  renderCurrentChallenge();
}

function renderCurrentChallenge() {
  stopTimer();
  const item = challenges[state.index];
  $("#progressLabel").textContent = `Défi ${state.index + 1} sur ${challenges.length}`;
  $("#progressBar").style.width = `${((state.index + 1) / challenges.length) * 100}%`;
  $("#scoreValue").textContent = state.score;
  $("#challengeKicker").textContent = item.kicker;
  $("#challengeTitle").textContent = item.title;
  $("#briefNumber").textContent = state.index + 1;
  $("#briefText").textContent = item.brief;
  $("#timeChip").textContent = item.time;
  nextButton.disabled = !state.completed.has(state.index);
  nextButton.innerHTML = state.index === challenges.length - 1 ? "Voir mon bilan <span aria-hidden=\"true\">→</span>" : "Défi suivant <span aria-hidden=\"true\">→</span>";
  setFeedback("Prends le temps d’observer avant d’agir.", "neutral");
  item.render();
  $("#challengeTitle").focus?.();
}

function setFeedback(message, tone = "neutral") {
  feedback.className = `feedback${tone === "neutral" ? "" : ` ${tone}`}`;
  $(".feedback-icon", feedback).textContent = tone === "good" ? "✓" : tone === "bad" ? "!" : "i";
  feedbackText.textContent = message;
}

function completeChallenge(points = 100, badge) {
  if (state.completed.has(state.index)) return;
  state.completed.add(state.index);
  state.score += points;
  state.challengeScores.set(state.index, points);
  if (badge) state.badges.add(badge);
  $("#scoreValue").textContent = state.score;
  nextButton.disabled = false;
  setFeedback(`Défi réussi ! +${points} points.`, "good");
  showToast("Défi validé ★");
}

let toastTimeout;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 1800);
}

function openHelp() {
  const inMission = !missionScreen.hidden;
  $("#helpTitle").textContent = inMission ? challenges[state.index].title : "Mode d’emploi de la mission";
  helpContent.innerHTML = inMission
    ? challenges[state.index].help
    : `<p>Cette mission contient huit défis. Lis la consigne, essaie, puis utilise le coup de pouce si nécessaire.</p><ul><li>Le score augmente à chaque défi réussi.</li><li>Les actions donnent un retour immédiat.</li><li>Sur écran tactile, sélectionne un fichier puis son dossier.</li></ul>`;
  helpModal.showModal();
}

function closeHelp() { helpModal.close(); }

function renderChallenge1() {
  const questions = [
    { text: "Tu veux garder l’original et créer un double dans un autre dossier.", answer: "Copier" },
    { text: "Tu veux déplacer le fichier : il ne doit plus rester au départ.", answer: "Couper" },
    { text: "Tu as déjà copié ou coupé. Tu veux déposer le fichier ici.", answer: "Coller" }
  ];
  const answers = {};
  content.innerHTML = `<h2>Choisis le bon outil</h2><p class="instruction">Une seule réponse par situation.</p>
    ${questions.map((q, i) => `<div class="question-block" data-question="${i}"><h3>${i + 1}. ${q.text}</h3><div class="choice-grid">${["Copier", "Couper", "Coller"].map(action => `<button class="choice-card" type="button" data-answer="${action}"><strong>${action}</strong><span>${action === "Copier" ? "Créer un double" : action === "Couper" ? "Préparer un déplacement" : "Déposer ici"}</span></button>`).join("")}</div></div>`).join("")}
    <div class="validate-row"><button class="action-button" id="validateActions" type="button">Vérifier mes choix</button></div>`;

  $$(".choice-card", content).forEach(button => button.addEventListener("click", () => {
    const block = button.closest(".question-block");
    $$(".choice-card", block).forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
    answers[block.dataset.question] = button.dataset.answer;
    setFeedback(`${button.dataset.answer} sélectionné. Continue, puis vérifie tes choix.`, "neutral");
  }));

  $("#validateActions").addEventListener("click", () => {
    if (Object.keys(answers).length < questions.length) {
      setFeedback("Il reste une situation sans réponse.", "bad");
      return;
    }
    let correct = 0;
    questions.forEach((q, i) => {
      const block = $(`.question-block[data-question="${i}"]`, content);
      $$(".choice-card", block).forEach(button => {
        button.classList.remove("correct", "wrong");
        if (button.dataset.answer === answers[i]) button.classList.add(answers[i] === q.answer ? "correct" : "wrong");
      });
      if (answers[i] === q.answer) correct++;
    });
    if (correct === questions.length) completeChallenge(100, "Décideur précis");
    else setFeedback(`${correct} bonne(s) réponse(s) sur 3. Corrige les cartes roses.`, "bad");
  });
}

const shortcutRounds = [
  { action: "COPIER le fichier sélectionné", key: "Ctrl+C", keys: ["Ctrl", "C"] },
  { action: "COUPER le fichier pour le déplacer", key: "Ctrl+X", keys: ["Ctrl", "X"] },
  { action: "COLLER dans le dossier ouvert", key: "Ctrl+V", keys: ["Ctrl", "V"] },
  { action: "SUPPRIMER le brouillon", key: "Delete", keys: ["Suppr"] }
];

function renderChallenge2() {
  state.challengeData.shortcutRound = 0;
  content.innerHTML = `<div class="shortcut-game"><h2>Le clavier est prêt</h2><p class="instruction">Appuie réellement sur les touches ou utilise les boutons.</p><div id="shortcutStage"></div></div>`;
  renderShortcutRound();
}

function renderShortcutRound() {
  const round = shortcutRounds[state.challengeData.shortcutRound];
  if (!round) { completeChallenge(100, "As du clavier"); return; }
  $("#shortcutStage").innerHTML = `<div class="shortcut-prompt"><strong>${round.action}</strong><span>Quel raccourci déclenche cette action ?</span></div><div class="shortcut-display">${round.keys.map(key => `<kbd>${key}</kbd>`).join("<b>+</b>")}</div><div class="shortcut-options">${shortcutRounds.map(item => `<button class="shortcut-key" type="button" data-shortcut="${item.key}">${item.key === "Delete" ? "Suppr" : item.key}</button>`).join("")}</div><p class="shortcut-progress">Action ${state.challengeData.shortcutRound + 1} sur ${shortcutRounds.length}</p>`;
  $$(".shortcut-key", content).forEach(button => button.addEventListener("click", () => handleShortcut(button.dataset.shortcut)));
}

function handleShortcut(shortcut) {
  if (state.index !== 1 || state.completed.has(1)) return;
  const round = shortcutRounds[state.challengeData.shortcutRound];
  if (shortcut === round.key) {
    setFeedback(`Exact : ${round.key === "Delete" ? "Suppr" : round.key} !`, "good");
    state.challengeData.shortcutRound++;
    setTimeout(renderShortcutRound, 450);
  } else {
    setFeedback("Ce raccourci ne correspond pas à l’action demandée. Essaie encore.", "bad");
  }
}

document.addEventListener("keydown", event => {
  if (state.index !== 1 || missionScreen.hidden || state.completed.has(1)) return;
  let shortcut = null;
  if (event.ctrlKey && event.key.toLowerCase() === "c") shortcut = "Ctrl+C";
  if (event.ctrlKey && event.key.toLowerCase() === "x") shortcut = "Ctrl+X";
  if (event.ctrlKey && event.key.toLowerCase() === "v") shortcut = "Ctrl+V";
  if (event.key === "Delete") shortcut = "Delete";
  if (shortcut) { event.preventDefault(); handleShortcut(shortcut); }
});

function renderChallenge3() {
  const files = [
    { id: "cours", name: "Cours_clavier.pdf", type: "doc", target: "Documents" },
    { id: "photo", name: "Robot_labo.png", type: "image", target: "Images" },
    { id: "schema", name: "Schema_reseau.jpg", type: "image", target: "Images" },
    { id: "devoir", name: "Devoir_TICE_Milo_Dune.odt", type: "doc", target: "À rendre" },
    { id: "notes", name: "Notes_rangement.txt", type: "doc", target: "Documents" }
  ];
  state.challengeData.sorted = 0;
  state.challengeData.selectedFile = null;
  content.innerHTML = `<h2>Explorateur de fichiers</h2><div class="path-bar">💾 P: › 📁 Documents › 📁 TICE</div><div class="explorer"><div class="explorer-bar"><span class="window-dots"><i></i><i></i><i></i></span>Explorateur de fichiers — TICE</div><div class="explorer-body"><div class="folder-row">${["Documents", "Images", "À rendre"].map(folder => `<button class="folder-target" type="button" data-folder="${folder}">${folder}<small id="count-${folder.replace(" ", "-")}"></small></button>`).join("")}</div><div class="file-pool" id="filePool">${files.map(file => `<button class="file-tile" draggable="true" type="button" data-id="${file.id}" data-target="${file.target}" data-type="${file.type}">${file.name}</button>`).join("")}</div><p class="explorer-tip">Astuce : glisse-dépose, ou clique sur un fichier puis sur un dossier.</p></div></div>`;
  const moveFile = (tile, folder) => {
    if (!tile) { setFeedback("Sélectionne d’abord un fichier.", "bad"); return; }
    if (tile.dataset.target !== folder) { setFeedback(`Ce n’est pas le meilleur dossier pour ${tile.textContent}.`, "bad"); return; }
    tile.remove();
    state.challengeData.sorted++;
    state.challengeData.selectedFile = null;
    setFeedback(`Bien rangé dans ${folder}.`, "good");
    if (state.challengeData.sorted === files.length) completeChallenge(100, "Architecte du tri");
  };
  $$(".file-tile", content).forEach(tile => {
    tile.addEventListener("click", () => {
      $$(".file-tile", content).forEach(item => item.classList.remove("selected"));
      tile.classList.add("selected");
      state.challengeData.selectedFile = tile;
      setFeedback(`${tile.textContent} sélectionné. Choisis son dossier.`, "neutral");
    });
    tile.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", tile.dataset.id));
  });
  $$(".folder-target", content).forEach(folder => {
    folder.addEventListener("dragover", event => { event.preventDefault(); folder.classList.add("drag-over"); });
    folder.addEventListener("dragleave", () => folder.classList.remove("drag-over"));
    folder.addEventListener("drop", event => {
      event.preventDefault(); folder.classList.remove("drag-over");
      moveFile($(`.file-tile[data-id="${event.dataTransfer.getData("text/plain")}"]`, content), folder.dataset.folder);
    });
    folder.addEventListener("click", () => moveFile(state.challengeData.selectedFile, folder.dataset.folder));
  });
}

function renderChallenge4() {
  state.challengeData.cutReady = false;
  state.challengeData.moveOrder = [];
  content.innerHTML = `<h2>Déplace le compte rendu</h2><p class="instruction">Commence par remettre les étapes dans l’ordre, puis réalise vraiment le déplacement.</p><div class="order-board"><h3>1. Ordonne les quatre étapes</h3><div class="step-pool">${[
    [3, "Ouvrir le dossier À rendre"], [1, "Faire un clic droit sur le fichier"], [4, "Coller le fichier"], [2, "Choisir Couper"]
  ].map(([step, label]) => `<button class="step-button" type="button" data-step="${step}">${label}</button>`).join("")}</div><ol class="ordered-steps" id="orderedSteps"></ol></div><div id="moveSimulation" hidden><h3>2. Réalise le déplacement</h3><div class="path-bar">💾 P: › 📁 Documents › 📁 TICE</div><div class="context-area"><div id="sourceZone"><button class="file-tile" id="moveFile" type="button">Compte_rendu_TICE_Sacha_Vern.odt</button><small>Emplacement actuel : TICE</small></div><div><div class="destination-card" id="moveDestination">À rendre<div id="pasteSlot"></div></div></div><div class="context-menu" id="moveMenu" hidden><button type="button" data-menu="copy">📄 Copier</button><button type="button" data-menu="cut">✂ Couper</button><button type="button" data-menu="rename">✎ Renommer</button><button type="button" data-menu="delete">🗑 Supprimer</button></div></div></div>`;
  $$(".step-button", content).forEach(button => button.addEventListener("click", () => {
    button.disabled = true;
    state.challengeData.moveOrder.push(Number(button.dataset.step));
    $("#orderedSteps").insertAdjacentHTML("beforeend", `<li>${button.textContent}</li>`);
    if (state.challengeData.moveOrder.length < 4) {
      setFeedback(`Étape ${state.challengeData.moveOrder.length} placée. Continue.`, "neutral");
      return;
    }
    const correct = state.challengeData.moveOrder.every((step, index) => step === index + 1);
    if (!correct) {
      state.challengeData.moveOrder = [];
      $("#orderedSteps").innerHTML = "";
      $$(".step-button", content).forEach(item => item.disabled = false);
      setFeedback("L’ordre n’est pas encore logique. Repars du clic droit, puis pense à Couper.", "bad");
      return;
    }
    $("#moveSimulation").hidden = false;
    setFeedback("Ordre parfait. Applique maintenant ces quatre étapes dans le faux explorateur.", "good");
  }));
  const file = $("#moveFile");
  const menu = $("#moveMenu");
  const openMenu = event => {
    event.preventDefault();
    menu.hidden = false;
    menu.style.left = "8%";
    menu.style.top = "72px";
    setFeedback("Menu contextuel ouvert. Quelle commande déplace sans copier ?", "neutral");
  };
  file.addEventListener("click", openMenu);
  file.addEventListener("contextmenu", openMenu);
  $$("[data-menu]", menu).forEach(button => button.addEventListener("click", () => {
    menu.hidden = true;
    if (button.dataset.menu !== "cut") { setFeedback("Cette commande ne permet pas le déplacement demandé.", "bad"); return; }
    state.challengeData.cutReady = true;
    file.classList.add("cutting");
    setFeedback("Fichier coupé. Ouvre maintenant le dossier « À rendre ».", "good");
  }));
  $("#moveDestination").addEventListener("click", () => {
    if (!state.challengeData.cutReady) { setFeedback("Il faut d’abord couper le fichier à déplacer.", "bad"); return; }
    $("#pasteSlot").innerHTML = `<button class="action-button paste-button" id="pasteHere" type="button">Coller ici</button>`;
    $("#pasteHere").addEventListener("click", event => {
      event.stopPropagation();
      $("#sourceZone").innerHTML = `<span class="empty-state">Aucun double : le fichier a quitté ce dossier.</span>`;
      $("#pasteSlot").innerHTML = `<div class="file-tile">Compte_rendu_TICE_Sacha_Vern.odt</div>`;
      completeChallenge(100, "Maître du déplacement");
    });
    setFeedback("Dossier ouvert. Colle le fichier ici.", "neutral");
  });
}

function renderChallenge5() {
  const names = [
    { old: "trucvolcanfinal.odt", good: "Expose_volcans.odt" },
    { old: "nouvelleimage2.png", good: "Schema_cellule.png" },
    { old: "devoirfinalfinal.odt", good: "Devoir_TICE_Lina_Roche.odt" }
  ];
  content.innerHTML = `<h2>Atelier de renommage</h2><p class="instruction">Recopie le nom conseillé. L’extension ne doit jamais disparaître.</p><div class="rename-list">${names.map((item, i) => `<label class="rename-row"><span class="old-name">📄 ${item.old}</span><input data-name="${i}" autocomplete="off" spellcheck="false" placeholder="Nom conseillé : ${item.good}" aria-label="Nouveau nom pour ${item.old}"></label>`).join("")}</div><div class="validate-row"><button class="action-button" id="validateNames" type="button">Valider les nouveaux noms</button></div>`;
  $$("input", content).forEach(input => input.addEventListener("input", () => {
    const good = names[Number(input.dataset.name)].good;
    input.classList.toggle("correct", input.value.trim() === good);
    input.classList.remove("wrong");
    setFeedback(input.value.trim() === good ? "Nom précis et extension conservée." : "Compare avec le nom conseillé, caractère par caractère.", input.value.trim() === good ? "good" : "neutral");
  }));
  $("#validateNames").addEventListener("click", () => {
    let ok = true;
    $$("input", content).forEach(input => {
      const good = names[Number(input.dataset.name)].good;
      const valid = input.value.trim() === good;
      input.classList.toggle("wrong", !valid);
      input.classList.toggle("correct", valid);
      ok = ok && valid;
    });
    if (ok) completeChallenge(100, "Noms impeccables");
    else setFeedback("Un ou plusieurs noms ne correspondent pas encore.", "bad");
  });
}

function renderChallenge6() {
  state.challengeData.deleted = false;
  content.innerHTML = `<h2>La restauration d’urgence</h2><p class="instruction">Le fichier « Liste_sources.txt » a été supprimé par erreur. Simule d’abord la suppression, puis récupère-le.</p><div class="recycle-layout"><div class="desktop-zone" id="desktopZone"><h3>Dossier Documents</h3><button class="file-tile" id="deleteFile" type="button">Liste_sources.txt</button><div class="context-menu" id="deleteMenu" hidden><button type="button" id="deleteAction">🗑 Supprimer</button><button type="button" id="cancelDelete">Annuler</button></div><p><small>Clique ou fais un clic droit sur le fichier.</small></p></div><div class="bin-zone" id="binZone"><span class="bin-icon">🗑️</span><h3>Corbeille <span id="binCount">(vide)</span></h3><div id="binContent"><span class="empty-state">Aucun élément</span></div></div></div>`;
  const openDeleteMenu = event => {
    event.preventDefault();
    $("#deleteMenu").hidden = false;
    setFeedback("Menu contextuel ouvert. Envoie le fichier dans la corbeille.", "neutral");
  };
  $("#deleteFile").addEventListener("click", openDeleteMenu);
  $("#deleteFile").addEventListener("contextmenu", openDeleteMenu);
  $("#cancelDelete").addEventListener("click", () => $("#deleteMenu").hidden = true);
  $("#deleteAction").addEventListener("click", () => {
    state.challengeData.deleted = true;
    $("#deleteMenu").hidden = true;
    $("#deleteFile").remove();
    $("#binZone").classList.add("active");
    $("#binCount").textContent = "(1)";
    $("#binContent").innerHTML = `<button class="file-tile" id="trashedFile" type="button">Liste_sources.txt</button><button class="action-button" id="restoreAction" type="button">Restaurer</button>`;
    setFeedback("Le fichier est dans la corbeille. Restaure-le maintenant.", "good");
    $("#restoreAction").addEventListener("click", () => {
      $("#desktopZone").insertAdjacentHTML("beforeend", `<div class="file-tile">Liste_sources.txt</div>`);
      $("#binContent").innerHTML = `<span class="empty-state">Aucun élément</span>`;
      $("#binCount").textContent = "(vide)";
      $("#binZone").classList.remove("active");
      completeChallenge(100, "Sauveteur de fichiers");
    });
  });
}

function renderChallenge7() {
  state.challengeData.disaster = {
    selected: null,
    items: [
      { id: "photo", name: "Photo_robot.png", place: "TICE", target: "Images", type: "image" },
      { id: "report", name: "truc_final(2).odt", place: "TICE", target: "À rendre", type: "doc", expectedName: "Compte_rendu_TICE_Nora_Lys.odt" },
      { id: "notes", name: "Notes_expose.txt", place: "TICE", target: "Documents", type: "doc" },
      { id: "temp", name: "copie_temp.tmp", place: "TICE", target: "deleted", type: "trash" }
    ]
  };
  renderDisaster();
}

function renderDisaster() {
  const game = state.challengeData.disaster;
  const folders = ["Documents", "Images", "À rendre"];
  const tile = item => `<button class="file-tile${game.selected === item.id ? " selected" : ""}" draggable="true" type="button" data-disaster-file="${item.id}" data-type="${item.type}"><span>${item.name}</span><small>${item.place === "TICE" ? "À ranger" : "Rangé ici"}</small></button>`;
  const rootItems = game.items.filter(item => item.place === "TICE");
  content.innerHTML = `<h2>Plan d’urgence</h2><section class="disaster-orders" aria-labelledby="routeTitle"><p class="mini-label violet">FEUILLE DE ROUTE</p><h3 id="routeTitle">Voici exactement ce que tu dois obtenir</h3><ol><li>Déplace <strong>Photo_robot.png</strong> dans <strong>Images</strong>.</li><li>Déplace <strong>Notes_expose.txt</strong> dans <strong>Documents</strong>.</li><li>Déplace <strong>truc_final(2).odt</strong> dans <strong>À rendre</strong>.</li><li>Renomme <strong>truc_final(2).odt</strong> en <code>Compte_rendu_TICE_Nora_Lys.odt</code>.</li><li>Supprime <strong>copie_temp.tmp</strong>.</li></ol><p>Tu peux déplacer et renommer le compte rendu dans l’ordre de ton choix.</p></section><div class="interaction-guide"><strong>Pour déplacer :</strong><span>glisse le fichier sur le dossier</span><b>ou</b><span>clique sur le fichier, puis sur le dossier</span></div><div class="path-bar">💾 P: › 📁 Documents › 📁 TICE</div><div class="explorer"><div class="explorer-bar">Explorateur — Dossier catastrophe</div><div class="explorer-body"><div class="folder-row disaster-folders">${folders.map(folder => { const items = game.items.filter(item => item.place === folder); return `<section class="folder-target disaster-folder" data-disaster-folder="${folder}"><button class="folder-drop-zone" type="button" aria-label="Déplacer le fichier sélectionné dans ${folder}">📁 ${folder}</button><div class="folder-contents">${items.map(tile).join("") || `<span class="empty-state">Dossier vide</span>`}</div></section>`; }).join("")}</div><h3 class="root-title">Fichiers encore dans TICE</h3><div class="file-pool disaster-root">${rootItems.map(tile).join("") || `<span class="empty-state">Tous les fichiers utiles ont été rangés.</span>`}</div><div class="disaster-toolbar"><button class="small-button" id="renameDisaster" type="button">✎ Renommer le fichier sélectionné</button><button class="small-button" id="deleteDisaster" type="button">🗑 Supprimer le fichier sélectionné</button></div><div id="renamePanel"></div></div></div><h3 class="mission-progress-title">Avancement de la feuille de route</h3><ul class="task-checks">${disasterChecks(game).map(check => `<li class="${check.done ? "done" : ""}">${check.done ? "✓" : "○"} ${check.label}</li>`).join("")}</ul>`;

  const moveItem = (itemId, folder) => {
    const item = game.items.find(entry => entry.id === (itemId || game.selected));
    if (!item) { setFeedback("Sélectionne d’abord un fichier, puis choisis son dossier.", "bad"); return; }
    if (item.target === "deleted") { setFeedback("Ce fichier temporaire doit être supprimé, pas rangé.", "bad"); return; }
    if (item.target !== folder) { setFeedback(`${folder} n’est pas le bon dossier pour ${item.name}. Consulte la feuille de route.`, "bad"); return; }
    if (item.place === folder) { setFeedback(`${item.name} est déjà rangé dans ${folder}.`, "neutral"); return; }
    item.place = folder;
    game.selected = null;
    renderDisaster();
    evaluateDisaster(`${item.name} a bien été déplacé dans ${folder}.`);
  };

  $$('[data-disaster-file]', content).forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
    game.selected = button.dataset.disasterFile;
    renderDisaster();
      const selected = game.items.find(item => item.id === game.selected);
      setFeedback(`${selected.name} sélectionné. Clique sur son dossier ou glisse-le dessus.`, "neutral");
    });
    button.addEventListener("dragstart", event => {
      event.stopPropagation();
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", button.dataset.disasterFile);
      button.classList.add("dragging");
    });
    button.addEventListener("dragend", () => button.classList.remove("dragging"));
  });
  $$('[data-disaster-folder]', content).forEach(folder => {
    folder.addEventListener("click", () => moveItem(null, folder.dataset.disasterFolder));
    folder.addEventListener("dragover", event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      folder.classList.add("drag-over");
    });
    folder.addEventListener("dragleave", event => {
      if (!folder.contains(event.relatedTarget)) folder.classList.remove("drag-over");
    });
    folder.addEventListener("drop", event => {
      event.preventDefault();
      event.stopPropagation();
      folder.classList.remove("drag-over");
      moveItem(event.dataTransfer.getData("text/plain"), folder.dataset.disasterFolder);
    });
  });
  $("#deleteDisaster").addEventListener("click", () => {
    const item = game.items.find(entry => entry.id === game.selected);
    if (!item) { setFeedback("Sélectionne le fichier à supprimer.", "bad"); return; }
    if (item.target !== "deleted") { setFeedback("Attention : ce fichier est utile. Ne le supprime pas.", "bad"); return; }
    item.place = "deleted";
    game.selected = null;
    renderDisaster();
    evaluateDisaster("Copie temporaire supprimée.");
  });
  $("#renameDisaster").addEventListener("click", () => {
    const item = game.items.find(entry => entry.id === game.selected);
    if (!item) { setFeedback("Sélectionne le fichier mal nommé.", "bad"); return; }
    if (!item.expectedName) { setFeedback("Ce fichier porte déjà un nom clair.", "bad"); return; }
    $("#renamePanel").innerHTML = `<label class="rename-row"><span>Nouveau nom conseillé</span><input id="disasterName" value="${item.name}" aria-label="Nouveau nom"><button class="small-button" id="applyDisasterName" type="button">Appliquer</button></label>`;
    $("#disasterName").select();
    $("#applyDisasterName").addEventListener("click", () => {
      const value = $("#disasterName").value.trim();
      if (value !== item.expectedName) { setFeedback(`Utilise exactement : ${item.expectedName}`, "bad"); return; }
      item.name = value;
      game.selected = null;
      renderDisaster();
      evaluateDisaster("Nom corrigé.");
    });
  });
}

function disasterChecks(game) {
  const find = id => game.items.find(item => item.id === id);
  return [
    { label: "Déplacer Photo_robot.png dans Images", done: find("photo").place === "Images" },
    { label: "Déplacer Notes_expose.txt dans Documents", done: find("notes").place === "Documents" },
    { label: "Déplacer truc_final(2).odt dans À rendre", done: find("report").place === "À rendre" },
    { label: "Renommer en Compte_rendu_TICE_Nora_Lys.odt", done: find("report").name === find("report").expectedName },
    { label: "Supprimer copie_temp.tmp", done: find("temp").place === "deleted" }
  ];
}

function evaluateDisaster(message) {
  const checks = disasterChecks(state.challengeData.disaster);
  if (checks.every(check => check.done)) completeChallenge(125, "Agent anti-chaos");
  else setFeedback(`${message} ${checks.filter(check => check.done).length}/5 actions validées.`, "good");
}

function renderChallenge8() {
  state.challengeData.express = null;
  content.innerHTML = `<div class="timer-board"><h2>Rangement express</h2><p class="instruction">Six fichiers, trois dossiers, 45 secondes. Chaque bon rangement rapporte du temps bonus.</p><div class="timer-ring" id="timerRing">45</div><button class="primary-button" id="startTimer" type="button">Lancer le chrono →</button><div id="expressGame"></div></div>`;
  $("#startTimer").addEventListener("click", startExpressGame);
}

function startExpressGame() {
  const files = [
    { id: "a", name: "Portrait_agent.jpg", target: "Images" },
    { id: "b", name: "Fiche_methode.pdf", target: "Documents" },
    { id: "c", name: "Devoir_TICE_Yuna_Sorel.odt", target: "À rendre" },
    { id: "d", name: "Plan_labo.png", target: "Images" },
    { id: "e", name: "Lexique.txt", target: "Documents" },
    { id: "f", name: "Expose_TICE_Ilan_Rive.odt", target: "À rendre" }
  ];
  state.challengeData.express = { files, selected: null, errors: 0 };
  state.timerLeft = 45;
  $("#startTimer").hidden = true;
  renderExpress();
  state.timer = setInterval(() => {
    state.timerLeft--;
    const ring = $("#timerRing");
    if (ring) ring.textContent = state.timerLeft;
    if (state.timerLeft <= 0) {
      stopTimer();
      setFeedback("Temps écoulé : termine le rangement tranquillement pour valider la mission.", "bad");
    }
  }, 1000);
}

function renderExpress() {
  const game = state.challengeData.express;
  if (!game) return;
  $("#expressGame").innerHTML = `<div class="speed-grid"><div class="speed-files">${game.files.map(file => `<button class="speed-file${game.selected === file.id ? " selected" : ""}" type="button" data-speed-file="${file.id}">📄 ${file.name}</button>`).join("")}</div><div class="speed-arrow">→</div><div class="speed-folders">${["Documents", "Images", "À rendre"].map(folder => `<button class="speed-folder" type="button" data-speed-folder="${folder}">📁 ${folder}</button>`).join("")}</div></div>`;
  $$('[data-speed-file]', content).forEach(button => button.addEventListener("click", () => {
    game.selected = button.dataset.speedFile;
    renderExpress();
  }));
  $$('[data-speed-folder]', content).forEach(button => button.addEventListener("click", () => {
    const file = game.files.find(item => item.id === game.selected);
    if (!file) { setFeedback("Sélectionne d’abord un fichier.", "bad"); return; }
    if (file.target !== button.dataset.speedFolder) {
      game.errors++;
      setFeedback("Mauvais dossier. Observe le nom et l’extension.", "bad");
      return;
    }
    game.files = game.files.filter(item => item.id !== file.id);
    game.selected = null;
    setFeedback(`${file.name} bien rangé !`, "good");
    if (game.files.length === 0) {
      stopTimer();
      const bonus = Math.max(0, state.timerLeft - game.errors * 2);
      completeChallenge(100 + bonus, bonus >= 20 ? "Éclair du rangement" : "Mission terminée");
    } else renderExpress();
  }));
}

function stopTimer() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

function nextChallenge() {
  if (!state.completed.has(state.index)) return;
  if (state.index === challenges.length - 1) { showFinal(); return; }
  state.index++;
  renderCurrentChallenge();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showFinal() {
  stopTimer();
  showScreen("final");
  $("#finalScore").textContent = state.score;
  $("#finalScoreMax").textContent = MAX_SCORE;
  const stars = state.score >= 850 ? 3 : state.score >= 800 ? 2 : 1;
  $("#starRow").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
  $("#starRow").setAttribute("aria-label", `${stars} étoile${stars > 1 ? "s" : ""} sur 3`);

  let level = "Mission réussie";
  let levelText = "Tu maîtrises les gestes essentiels du rangement numérique.";
  let advice = "Continue à vérifier le nom du fichier et le dossier ouvert avant chaque action.";
  if (state.score >= 860) {
    level = "Expert du rangement";
    levelText = "Tu ranges avec précision, rapidité et autonomie.";
    advice = "Excellent travail : conserve ces bonnes habitudes dans toutes les matières.";
  } else if (state.score >= 840) {
    level = "Agent confirmé";
    levelText = "Tu maîtrises les gestes et tu sais organiser un dossier complexe.";
    advice = "Pour progresser encore, entraîne-toi à utiliser les raccourcis sans regarder le clavier.";
  }
  $("#finalLevel").textContent = level;
  $("#finalLevelText").textContent = levelText;
  $("#finalAdvice").textContent = advice;
  $("#studentDate").value = new Date().toLocaleDateString("fr-FR");

  const report = [
    { title: "Les bons gestes", skill: "Copier, couper ou coller", max: 100 },
    { title: "Raccourcis éclair", skill: "Ctrl+C, Ctrl+X, Ctrl+V, Suppr", max: 100 },
    { title: "Le grand tri", skill: "Classer dans le bon dossier", max: 100 },
    { title: "Zéro copie en trop", skill: "Déplacer sans dupliquer", max: 100 },
    { title: "Noms de fichiers", skill: "Renommer clairement", max: 100 },
    { title: "Restauration d’urgence", skill: "Supprimer et restaurer", max: 100 },
    { title: "Dossier catastrophe", skill: "Enchaîner plusieurs actions", max: 125 },
    { title: "Rangement express", skill: "Classer rapidement", max: 145 }
  ];
  $("#challengeResults").innerHTML = report.map((item, index) => {
    const points = state.challengeScores.get(index) || 0;
    return `<article class="challenge-result"><span class="result-number">${String(index + 1).padStart(2, "0")}</span><div><strong>${item.title}</strong><small>${item.skill}</small></div><span class="result-status">✓ Validé</span><b>${points} / ${item.max}</b></article>`;
  }).join("");
  $("#badges").innerHTML = [...state.badges].map(badge => `<span class="badge">🏅 ${badge}</span>`).join("");
}

function resetMission() {
  stopTimer();
  state.index = 0;
  state.score = 0;
  state.completed.clear();
  state.challengeScores.clear();
  state.badges.clear();
  state.challengeData = {};
  startMission();
}

$("#startButton").addEventListener("click", startMission);
$("#homeButton").addEventListener("click", () => { stopTimer(); showScreen("welcome"); });
$("#quitButton").addEventListener("click", () => { stopTimer(); showScreen("welcome"); });
$("#globalHelp").addEventListener("click", openHelp);
$("#challengeHelp").addEventListener("click", openHelp);
$("#closeHelp").addEventListener("click", closeHelp);
$("#gotItButton").addEventListener("click", closeHelp);
nextButton.addEventListener("click", nextChallenge);
$("#replayButton").addEventListener("click", resetMission);
$("#printButton").addEventListener("click", () => window.print());
helpModal.addEventListener("click", event => { if (event.target === helpModal) closeHelp(); });

if (navigator.modelContext?.registerTool) {
  navigator.modelContext.registerTool({
    name: "start_operation_grand_rangement",
    description: "Ouvre la séance 4 Opération grand rangement au premier défi.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: async () => { startMission(); return { content: [{ type: "text", text: "Mission démarrée." }] }; }
  });
}
