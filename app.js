import { Game, PERSON } from "./core.js";
import { CARD, RECIPE, PACKS, CHAPTERS } from "./game-data.js";
import { art } from "./art.js";
import { Sound } from "./audio.js";
import { chapterPanels } from "./chapter-ui.js";
import { productionPanel, equipmentPanel } from "./production-ui.js";
import { frontierPanel } from "./frontier-ui.js";
const frontierUI = { view: "routes", region: "grove", team: null, actor: null };
const $ = (s) => document.querySelector(s),
  world = $("#world"),
  board = $("#board"),
  veil = $("#veil"),
  dialog = $("#dialog");
const preview = false, qaStage = null, qa = false, trialSuffix = "";
const key = preview
    ? "stackwild.preview.chapter4"
    : qa
      ? "stackwild.qa." + qaStage + trialSuffix
      : "stackwild.save.v2",
  bookKey = preview
    ? "stackwild.preview.book"
    : qa
      ? "stackwild.qa.book"
      : "stackwild.book.v2";
let g = new Game(Number(new URL(location.href).searchParams.get("seed")) || 17),
  saved = null,
  saveError = false,
  book = [];
try {
  book = JSON.parse(localStorage.getItem(bookKey) || "[]");
  if (!Array.isArray(book)) book = [];
  const raw =
    localStorage.getItem(key) ||
    (qa || preview
      ? (await (await fetch("./evidence/campaign-checkpoints.json")).json())[
          preview ? "chapter4start" : qaStage
        ]
      : null);
  if (raw) {
    saved = Game.load(raw);
    if (
      JSON.parse(raw).version === 3 &&
      !localStorage.getItem(key + ".before-frontier")
    )
      localStorage.setItem(key + ".before-frontier", raw);
    if (
      JSON.parse(raw).version === 2 &&
      !localStorage.getItem(key + ".before-chapters")
    )
      localStorage.setItem(key + ".before-chapters", raw);
  }
} catch (e) {
  saveError = true;
}
const sound = new Sound();
let audit = [];
if (qa) {
  try {
    audit = JSON.parse(localStorage.getItem(key + ".audit") || "[]");
  } catch {}
}
function record(action, detail = {}) {
  if (qa) {
    audit.push({
      action,
      chapter: g.chapter,
      day: g.day,
      t: Math.round(g.elapsed * 10) / 10,
      ...detail,
    });
    localStorage.setItem(key + ".audit", JSON.stringify(audit));
  }
}
function ops(filter = "chapter") {
  if (g.chapter === 4 && filter === "chapter") filter = "basic";
  open(
    "ops",
    productionPanel(g, { head, names }, filter) +
      (qa
        ? '<button class="secondary full" data-action="audit">导出本次试玩记录</button>'
        : ""),
  );
}
let speed = 1,
  modal = null,
  beforeModal = true,
  camera = { x: -45, y: -43, z: innerWidth < 600 ? 0.86 : 1 },
  selected = null,
  lastEvent = 0,
  endShown = false,
  toastTimer,
  saveTimer = 0;
try {
  const prefs = JSON.parse(localStorage.getItem("stackwild.audio") || "null");
  if (prefs) {
    sound.fx = prefs.fx ?? 0.35;
    sound.music = prefs.music ?? 0.15;
  }
} catch {}
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const names = (types) => {
  const m = {};
  for (const t of types) m[t] = (m[t] || 0) + 1;
  return Object.entries(m)
    .map(([t, n]) => CARD[t].name + (n > 1 ? "×" + n : ""))
    .join(" + ");
};
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3300);
}
function save() {
  if (saveError || modal === "welcome" || modal === "confirmNew") return;
  try {
    localStorage.setItem(key, g.save());
    book = [...new Set([...book, ...g.discovered])];
    localStorage.setItem(bookKey, JSON.stringify(book));
  } catch {
    toast("浏览器无法保存，请勿关闭此页。");
  }
}
function transform() {
  world.style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.z})`;
}
function focusStack(id) {
  const s = g.stack(id);
  if (!s) return;
  camera.x = board.clientWidth / 2 - (s.x + 57) * camera.z;
  camera.y = board.clientHeight / 2 - (s.y + 75) * camera.z;
  selected = id;
  transform();
  render();
}
function focusType(type) {
  const s = g.stacks.find((s) =>
    s.cards.some((id) =>
      type === "villager" ? PERSON(g.card(id).type) : g.card(id).type === type,
    ),
  );
  if (s) {
    close();
    focusStack(s.id);
    toast("已定位：" + CARD[type].name);
  } else toast("暂时没有" + CARD[type].name + "，查看它的制作配方。");
}
function home() {
  camera.x = -45;
  camera.y = -43;
  camera.z = innerWidth < 600 ? 0.86 : 1;
  transform();
}
function face(s) {
  const cards = s.cards.map((id) => g.card(id));
  return (
    cards.find((c) => PERSON(c.type)) ||
    cards.find((c) =>
      ["enemy", "building", "site"].includes(CARD[c.type].kind),
    ) ||
    cards.at(-1)
  );
}
function cardHTML(s) {
  const c = face(s),
    d = CARD[c.type],
    types = g.types(s);
  return `<div class="card"><div class="cardhead"><span>${d.name}</span>${s.cards.length > 1 ? `<span class="count">${s.cards.length}</span>` : ""}</div>${art(c.type)}${PERSON(c.type) || d.kind === "enemy" ? `<span class="hp">${c.armor ? "▱ " : ""}${c.hp} ♥${c.hunger ? " · 饿" : ""}</span>` : ""}<div class="cardfoot">${s.cards.length > 1 ? esc(names(types)) : d.food ? "食物 +" + d.food : d.kind === "site" ? "叠放居民来工作" : d.kind === "person" ? "拖到资源上开始工作" : d.kind === "enemy" ? "叠放守卫迎战" : d.sell ? "可售 " + d.sell + " 古币" : "等待新的组合"}</div><div class="joblabel" hidden></div><div class="jobbar" hidden><i></i></div></div><div class="grip" title="拖动这里移动整堆">${s.cards.length > 1 ? "整堆拖动" : "⋯"}</div>`;
}
function render() {
  const alive = new Set(g.stacks.map((s) => s.id));
  for (const el of [...world.children])
    if (!alive.has(el.dataset.stack)) el.remove();
  for (const s of g.stacks) {
    let el = world.querySelector(`[data-stack="${s.id}"]`);
    if (!el) {
      el = document.createElement("div");
      el.dataset.stack = s.id;
      el.className = "stack";
      el.setAttribute("role", "button");
      el.tabIndex = 0;
      world.append(el);
    }
    const signature = s.cards
      .map((id) => {
        const c = g.card(id);
        return `${id}${c.type}${c.hp}${c.armor}${c.hunger}${c.weapon}${c.warm}`;
      })
      .join();
    if (el.dataset.signature !== signature) {
      el.innerHTML = cardHTML(s);
      el.dataset.signature = signature;
    }
    const c = face(s);
    el.classList.toggle("multiple", s.cards.length > 1);
    el.classList.toggle("person", PERSON(c.type));
    el.classList.toggle("enemy", CARD[c.type].kind === "enemy");
    el.classList.toggle("selected", s.id === selected);
    el.setAttribute("aria-label", names(g.types(s)));
    el.style.left = s.x + "px";
    el.style.top = s.y + "px";
    const job = g.busy(s.id);
    el.classList.toggle("busy", !!job);
    const bar = el.querySelector(".jobbar"),
      label = el.querySelector(".joblabel");
    bar.hidden = label.hidden = !job;
    if (job) {
      bar.firstElementChild.style.width =
        Math.min(100, 100 * (1 - job.remaining / job.duration)) + "%";
      label.textContent =
        (job.waitTide ? "候潮 " + g.tide().seconds + "秒 · " : "") +
        (job.recipeId === "battle"
          ? "交战"
          : job.recipeId.startsWith("explore")
            ? "探索"
            : RECIPE.find((r) => r.id === job.recipeId)?.label || "休整") +
        " " +
        Math.max(0, Math.ceil(job.remaining)) +
        "秒";
    }
  }
  $("#day").textContent = `第 ${g.day} 天`;
  if (qa) $("#status").title = "独立验证进度，来自合法操作回放；不使用玩家存档";
  document.body.dataset.chapter = g.chapter;
  $("#journey").textContent =
    `第${g.chapter}章 · ${CHAPTERS[g.chapter].name} ›`;
  $("#environment").hidden = g.chapter === 1;
  if (g.chapter === 2) {
    const tide = g.tide();
    $("#environment").textContent =
      `${tide.phase === "low" ? "☽ 落潮 · 适合浅滩采珠" : "≋ 涨潮 · 可打捞沉船"}　${tide.seconds}秒后换潮 ›`;
  } else if (g.chapter === 3)
    $("#environment").textContent =
      `♨ 供暖 ${Math.ceil(g.heat)}/100 · ${g.heat < 25 ? "低温！需要添煤" : "温室可以生长"}　中继 ${g.count("relay")}/3 ›`;
  if (g.chapter === 3 && g.clearedChapters.includes(3))
    $("#environment").textContent = "☀ 黎明归来 · 供暖不再流失 · 自由经营";
  if (g.chapter === 4)
    $("#environment").textContent =
      "⚑ 风帆群岛 · " +
      (g.frontier.run
        ? "继续远征"
        : "组队出发 · 盟约 " + g.frontier.seals.length + "/3");
  $("#environment").classList.toggle("cold", g.chapter === 3 && g.heat < 25);
  $("#clock").textContent = `距夜晚 ${Math.ceil(90 - g.clock)}秒`;
  $("#dayfill").style.width = (g.clock / 90) * 100 + "%";
  $("#foodnum").textContent = `${g.foodValue()} / ${g.people().length * 2}`;
  $("#foodnum").classList.toggle(
    "danger",
    g.foodValue() < g.people().length * 2,
  );
  $("#coins").textContent = g.coins;
  $("#population").textContent = `居民 ${g.people().length} / 床位 ${g.beds()}`;
  $("#pause").textContent = g.paused ? "▶" : "Ⅱ";
  $("#pausedbadge").hidden = !g.paused || !!modal;
  $("#goal").textContent = g.objective().title;
  $("#onboarding").hidden = !!g.made.berry || !!modal;
  $("#sun").textContent = g.day === 6 ? "☂" : g.clock > 65 ? "☾" : "☀";
  $("#speed").textContent = speed + "×";
  if (g.paused) $("#status").textContent = "已暂停 · 可以自由叠放与整理";
  else if (g.clock > 70 && g.foodValue() < g.people().length * 2)
    $("#status").textContent = "今晚食物不足，先让居民采果或种菜";
  else
    $("#status").textContent =
      g.log[0]?.text || "拖动空白处移动桌面 · 双指缩放";
  for (const e of g.events.filter((e) => e.id > lastEvent)) {
    lastEvent = e.id;
    if (["produce", "night", "victory", "failure", "chapter"].includes(e.type))
      record(e.type, { ...e });
    sound.play(e.type);
    const el = world.querySelector(`[data-stack="${e.stackId}"]`);
    if (el) {
      el.classList.remove("pulse", "hit");
      void el.offsetWidth;
      el.classList.add(e.type === "hit" ? "hit" : "pulse");
    }
    if (e.type === "produce") {
      for (const id of e.outputs || []) {
        const n = world.querySelector(`[data-stack="${id}"]`);
        if (n) n.classList.add("pulse");
      }
    }
    if (e.type === "quest") toast("里程碑完成 · " + e.label);
    if (e.type === "night") toast(g.log[0]?.text || "新的一天");
  }
  if ((g.failed || g.chapterCleared) && !endShown) {
    endShown = true;
    ending();
  }
}
function open(type, html, wide = false) {
  sound.init();
  if (!modal) beforeModal = g.paused;
  g.paused = true;
  modal = type;
  dialog.className = wide ? "wide" : "";
  dialog.innerHTML = html;
  veil.hidden = false;
  render();
  dialog.querySelector("button")?.focus({ preventScroll: true });
}
function close() {
  if (modal === "welcome") return;
  veil.hidden = true;
  modal = null;
  if (!g.failed && !g.chapterCleared)
    g.paused = g.frontier.run ? true : beforeModal;
  render();
  save();
}
const head = (t) =>
  `<div class="modalhead"><h2>${t}</h2><button class="close" data-action="close" aria-label="关闭">×</button></div>`;
function welcome() {
  open(
    "welcome",
    `<div class="welcome"><div class="eyebrow">A LITTLE WORLD IN YOUR HANDS</div><h2>叠野纪</h2><p>山野 · 雾海 · 长夜 · 群岛</p><div class="welcome-art">${["forest", "boat", "sunEngine"].map((t) => `<div class="mini">${art(t)}<span>${CARD[t].name}</span></div>`).join("")}</div><p>把人和物叠在一起。<br>让一座聚落的故事，走向更远的地方。</p>${saveError ? '<div class="help-line">旧存档无法读取，原数据已保留。开始新聚落前会再次确认。</div>' : ""}${saved ? '<button class="primary full" data-action="continue">继续我的聚落 · 第 ' + saved.day + ' 天</button><p class="muted">第' + saved.chapter + "章 · " + CHAPTERS[saved.chapter].name + (saved.canAdvance() ? " · 下一章已解锁" : "") + "</p>" : ""}<button class="${saved ? "secondary" : "primary"} full" data-action="new">${saved ? "开启新的聚落" : "开始我的聚落"}</button><p style="font-size:10px">${preview ? "第四章独立体验 · 不影响原聚落存档" : qa ? "独立验证进度 · 不使用玩家存档" : "四章连续旅程 · 自动存档"}<br>旧版进度可继续 / 无广告与付费</p></div>`,
  );
}
function startNew() {
  if ((saved || saveError) && modal !== "confirmNew") {
    open(
      "confirmNew",
      head("开始新的旅程") +
        '<p class="muted">当前进度会重置，已经发现的卡牌图鉴会保留。旧存档会备份到本机浏览器。</p><button class="primary full" data-action="newConfirmed">确认开始新聚落</button><button class="secondary full" data-action="welcome">返回</button>',
    );
    return;
  }
  newConfirmed();
}
function newConfirmed() {
  try {
    const raw = localStorage.getItem(key);
    if (raw) localStorage.setItem(key + ".backup", raw);
  } catch {}
  g = new Game(
    Number(new URL(location.href).searchParams.get("seed")) ||
      Math.floor(Date.now() % 1e8),
  );
  saveError = false;
  saved = null;
  lastEvent = 0;
  endShown = false;
  modal = null;
  veil.hidden = true;
  g.paused = false;
  home();
  render();
  save();
}
function inventory(s) {
  if (
    g.chapter === 4 &&
    s.cards.some(
      (id) =>
        g.card(id).type === "waygate" ||
        g.frontier.run?.units.some((u) => u.id === id),
    )
  ) {
    frontier();
    return;
  }
  const job = g.busy(s.id),
    opts = g.options(s);
  const blocked = job
    ? []
    : RECIPE.filter(
        (r) =>
          (r.chapter || 1) <= g.chapter &&
          g.usedFor(s, r.inputs) &&
          g.recipeStatus(r),
      );
  const assignable =
    !job &&
    !g.types(s).some(PERSON) &&
    g
      .types(s)
      .some((t) =>
        [
          "bush",
          "forest",
          "rocks",
          "ruins",
          "mine",
          "coast",
          "snowfield",
        ].includes(t),
      );
  selected = s.id;
  open(
    "inspect",
    head(names(g.types(s))) +
      (assignable
        ? `<button class="primary full" data-action="assign" data-stack="${s.id}">派空闲居民来工作</button>`
        : "") +
      s.cards
        .filter((id) => PERSON(g.card(id).type))
        .map((id) => {
          const p = g.card(id);
          return `<p class="equipment">${CARD[p.type].name} · ${p.hp}/12生命 · 攻击${CARD[p.type].atk + (CARD[p.weapon]?.weapon || 0)}${p.weapon ? " · " + CARD[p.weapon].name : ""}${p.armor ? " · 护甲" : ""}${p.warm ? " · 御寒斗篷" : ""}</p>`;
        })
        .join("") +
      (CARD[face(s).type].text
        ? `<p class="help-line">${CARD[face(s).type].text}</p>`
        : "") +
      s.cards
        .map((id) => g.card(id))
        .filter((c) => CARD[c.type].kind === "enemy" && CARD[c.type].text)
        .map(
          (c) =>
            `<p class="help-line">${CARD[c.type].name}：${CARD[c.type].text}</p>`,
        )
        .join("") +
      `<div class="detail-art">${art(face(s).type)}</div><p class="muted">${job ? "正在工作，取出卡牌会取消当前工作并保留投入。" : "拖出一张卡，或把需要的材料继续叠到这里。底部把手可以移动整堆。"}</p><div class="cardlist">${s.cards
        .filter(
          (id, i, ids) =>
            PERSON(g.card(id).type) ||
            ids.findIndex((x) => g.card(x).type === g.card(id).type) === i,
        )
        .map(
          (id) =>
            `<button data-action="extract" data-id="${id}" data-stack="${s.id}">取出 ${CARD[g.card(id).type].name}</button><button class="touch-move" data-action="tapMove" data-id="${id}" data-stack="${s.id}">点选 ${CARD[g.card(id).type].name} 放到另一堆</button>`,
        )
        .join("")}</div>` +
      (job
        ? `<div class="help-line">剩余 ${Math.ceil(job.remaining)} 秒${job.recipeId.startsWith("gather") ? " · 会持续采集，拖走居民换工作" : ""}</div><button class="secondary full" data-action="cancelJob" data-stack="${s.id}">${job.recipeId === "battle" ? "撤退（队员损失2生命）" : "取消工作，保留材料"}</button>`
        : opts
            .map(
              (r) =>
                `<button class="recipe-row" data-action="start" data-stack="${s.id}" data-recipe="${r.id}"><strong>${r.label} →</strong><small>${r.outputs ? names(r.outputs) : r.id.startsWith("explore") ? (r.id === "explore:mine" ? "固定铁矿×2，15%出现掠夺者" : g.explored ? "菌菇35% / 纤维30% / 黏土25% / 野兽10%" : "首次必得旧矿洞、黏土×2，无危险") : r.id === "battle" ? "每2秒攻击一次，敌人优先攻击排在前面的居民" : "装备即时生效"} · ${r.seconds || 0}秒</small></button>`,
            )
            .join("")) +
      blocked
        .map(
          (r) =>
            `<p class="help-line">${r.label}：${g.recipeStatus(r)}${r.tide ? "。关闭面板并继续时间；换潮后点击这堆卡选择出航。" : ""}</p>`,
        )
        .join("") +
      `<div class="row"><button class="secondary" data-action="spread" data-stack="${s.id}">拆开整堆</button><button class="secondary" data-action="close">返回桌面</button></div>${!job && CARD[g.card(s.cards.at(-1)).type].sell ? `<button class="secondary full" data-action="sell" data-stack="${s.id}">出售最上面一张 · +${CARD[g.card(s.cards.at(-1)).type].sell} 古币</button>` : ""}`,
  );
}
function startOnStack(id) {
  const opts = g.options(id);
  if (opts.length === 1) {
    g.start(id, opts[0].id);
    if (opts[0].id === "battle") toast("战斗开始，点击卡堆可以撤退。");
  } else if (opts.length > 1) {
    inventory(g.stack(id));
    toast("这些材料有多种用途，请选择要做的工作。");
  }
  render();
  save();
}
function packs() {
  open(
    "packs",
    head("行旅商人的补给") +
      '<p class="muted">出售余料赚取古币。每个补给都有固定收获，卡包只用游戏内古币购买。</p><div class="packgrid">' +
      Object.entries(PACKS)
        .filter(([id, p]) => (p.chapter || 1) <= g.chapter)
        .map(
          ([id, p]) =>
            `<button class="pack" data-action="buy" data-pack="${id}" ${g.packStatus(id) ? "disabled" : ""}>${art(p.art || { wild: "forest", farm: "vegetable", ruin: "ruins", travel: "villager" }[id])}<b>${p.name}</b><div class="price">${p.cost} 古币</div><small>必得：${names(p.fixed)}</small><small>${p.pool.length ? "随机：" + names(p.pool) + "（各" + (100 / p.pool.length).toFixed(1) + "%）" : "新增1人 · 每天限一次"}</small><small>${g.packStatus(id) || "轻点打开"}</small></button>`,
        )
        .join("") +
      '</div><p class="muted">招募需要空余床位与足够的当晚食物。当前 ' +
      g.people().length +
      " / " +
      g.beds() +
      " 床位。</p>",
  );
}
function reveal(result) {
  const remaining = new Set(result.ids);
  open(
    "reveal",
    `<div class="eyebrow" style="color:#e6d6b1">新的可能，来到你的聚落</div><h2>补给已抵达</h2><p class="muted">轻点每张卡，收进桌面</p><div class="reveal">${result.types.map((t, i) => `<button style="animation-delay:${i * 0.09}s" data-action="claim" data-stack="${result.ids[i]}">${art(t)}<strong>${CARD[t].name}</strong></button>`).join("")}</div><button class="secondary" data-action="close">全部收好，返回聚落</button>`,
  );
  dialog.className = "pack-open";
}
function recipes(filter = "all") {
  const target = g.objective().recipe;
  const list =
    filter === "goal"
      ? RECIPE.filter((r) => r.id === target)
      : RECIPE.filter(
          (r) =>
            (r.chapter || 1) <= g.chapter &&
            (filter !== "chapter" || (r.chapter || 1) === g.chapter),
        );
  open(
    "recipes",
    head("聚落配方册") +
      `<p class="muted">将列出的卡牌叠成一堆。普通工作可由任意居民承担。配方随章节开放。</p><div class="row"><button class="secondary" data-action="recipes">全部配方</button><button class="secondary" data-action="chapterRecipes">本章新增</button><button class="secondary" data-action="goal">当前目标</button></div>` +
      list
        .map(
          (r) =>
            `<button class="recipe-row ${r.id === target ? "current" : ""}" data-action="recipe" data-recipe="${r.id}"><strong>${r.label} <span class="badge">${r.seconds}秒</span></strong><small>${names(r.inputs)} → ${names(r.outputs)}</small></button>`,
        )
        .join(""),
    true,
  );
}
function recipeDetail(id) {
  const r = RECIPE.find((r) => r.id === id);
  if (!r) {
    goal();
    return;
  }
  const req = {};
  for (const t of r.inputs) req[t] = (req[t] || 0) + 1;
  const plan = g.planRecipe(r.id);
  open(
    "recipe",
    head(r.label) +
      `<div class="detail-art">${art(r.outputs[0])}</div>${r.hint ? '<p class="help-line">' + r.hint + "</p>" : ""}${g.recipeStatus(r) ? '<p class="help-line">' + g.recipeStatus(r) + "</p>" : ""}<p class="muted">把这些卡牌叠到同一堆。轻点下面已有的材料，可定位它在桌面的位置。</p><div class="recipe-inputs">${Object.entries(
        req,
      )
        .map(([t, n]) => {
          const count = t === "villager" ? g.people().length : g.count(t);
          return `<button class="${count < n ? "missing" : ""}" data-action="locate" data-type="${t}">${CARD[t].name} ${count} / ${n}</button>`;
        })
        .join(
          "",
        )}</div><div class="help-line">产出：${names(r.outputs)}<br>耗时：${r.seconds}秒<br>保留：${names(r.keep)}<br>其余列出的材料完成时消耗，额外材料保留。</div><button class="primary full" data-action="prepare" data-recipe="${r.id}" ${plan.error ? "disabled" : ""}>${plan.error || (plan.waiting ? "备齐材料，自动候潮" : "用空闲材料安排生产")}</button><button class="secondary full" data-action="ops">查看居民与生产调度</button><button class="secondary full" data-action="recipes">返回全部配方</button>`,
  );
}
function goal() {
  if (g.chapter === 4) {
    frontier();
    return;
  }
  const o = g.objective();
  const targetEnemy =
    g.chapter === 3
      ? g.flags.frostAwake
        ? "frostSentinel"
        : "relayGuard"
      : g.chapter === 2
        ? "reefGuardian"
        : "stormBeast";
  open(
    "goal",
    head(o.title) +
      (g.count(targetEnemy)
        ? `<button class="primary full" data-action="locate" data-type="${targetEnemy}">定位 ${CARD[targetEnemy].name}</button>`
        : "") +
      `<div class="stepnumber">${String(g.chapter).padStart(2, "0")}</div><p class="help-line">${o.detail}</p>${g.canAdvance() ? '<button class="primary full" data-action="journey">进入下一章</button>' : ""}${o.recipe && RECIPE.some((r) => r.id === o.recipe) ? `<button class="primary full" data-action="recipe" data-recipe="${o.recipe}">查看材料与配方</button>` : ""}<p class="muted">拖动空白处移动桌面；点击卡堆查看内容；底部把手移动整堆。取出居民可立即更换工作。</p><button class="secondary full" data-action="close">回到聚落</button>`,
  );
}
function menu() {
  open(
    "menu",
    head("聚落手册") +
      '<button class="primary full" data-action="journey">章节旅程 · 保留聚落继续冒险</button>' +
      `<div class="row"><button class="secondary" data-action="collection">卡牌图鉴 · ${new Set([...book, ...g.discovered]).size}/${Object.keys(CARD).length}</button><button class="secondary" data-action="sound">声音设置</button></div><div class="help-line">居民 + 资源点：采集<br>材料叠成一堆：制作与建造<br>同样的材料可能有不同配方，请明确选择<br>每90秒每人消耗2食物，连续两晚没吃饱会离开<br>拖动空白平移；双指或滚轮缩放<br>页面离开和查看面板时自动暂停</div><h3 style="font-size:13px">聚落日志</h3>${g.log
        .slice(0, 8)
        .map((x) => `<div class="logline">第${x.day}天 · ${esc(x.text)}</div>`)
        .join(
          "",
        )}<button class="primary full" data-action="save">保存并返回</button><button class="secondary full dangerbutton" data-action="reset">重新开始</button><p class="muted">本机浏览器存档 · 不依赖账号或网络<br>叠野纪 v0.3 · 四章旅程 / 原创美术</p>`,
  );
}
function settings() {
  open(
    "settings",
    head("山野的声音") +
      `<div class="settings"><label>环境音乐<input id="musicvol" type="range" min="0" max="1" step=".01" value="${sound.music}"></label><label>操作音效<input id="fxvol" type="range" min="0" max="1" step=".01" value="${sound.fx}"></label></div><p class="muted">柔和的循环琴音与落卡、收获、战斗音效。拖到最左即可静音。</p><button class="secondary full" data-action="close">完成</button>`,
  );
}
function panels() {
  let checkpoint = false;
  try {
    checkpoint = !!localStorage.getItem(key + ".chapter" + g.chapter);
  } catch {}
  return chapterPanels(g, { open, head, art, checkpoint });
}
function journey() {
  panels().journey();
}
function ending() {
  panels().ending();
  save();
}
$("#journey").onclick = journey;
$("#production").onclick = () => ops();
function frontier() {
  if (!frontierUI.team) {
    const previous = g.frontier.run?.units || g.frontier.last?.party;
    if (previous) frontierUI.team = previous.map((p) => p.id);
    else {
      const free = g
        .availableCards()
        .filter(
          (c) =>
            PERSON(c.type) &&
            c.hp + (g.frontier.upgrades.includes("infirmary") ? 4 : 0) >= 4,
        );
      const artisan = free.find((c) => c.type === "artisan");
      const fighter = free.find((c) => c.type === "guard") || free[0];
      frontierUI.team = [
        ...new Set([fighter?.id, artisan?.id].filter(Boolean)),
      ];
    }
  }
  frontierUI.team = frontierUI.team.filter((id) =>
    g.people().some((p) => p.id === id),
  );
  open("frontier", frontierPanel(g, frontierUI, { head, art }));
  dialog.classList.add("frontier-dialog");
}
$("#environment").onclick = () =>
  g.chapter === 4 ? frontier() : panels().environment();
dialog.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b || b.disabled) return;
  sound.init();
  const a = b.dataset.action,
    id = b.dataset.stack;
  record("click", {
    command: a,
    recipe: b.dataset.recipe,
    person: b.dataset.person,
    stack: id,
    type: b.dataset.type,
  });
  if (a === "frontier") {
    const command = b.dataset.command,
      id = b.dataset.id;
    if (command === "tab") frontierUI.view = id;
    else if (command === "region") frontierUI.region = id;
    else if (command === "select") frontierUI.actor = id;
    else if (command === "team") {
      if (frontierUI.team.includes(id))
        frontierUI.team = frontierUI.team.filter((x) => x !== id);
      else if (frontierUI.team.length < (g.frontier.seals.length ? 3 : 2))
        frontierUI.team.push(id);
      else toast("队员已满，先点击已选队员移出队伍。");
    } else {
      const result = g.frontierAction(command, {
        id,
        kind: b.dataset.kind,
        specialty: b.dataset.specialty,
        region: frontierUI.region,
        ids: frontierUI.team,
      });
      record("frontier", {
        command,
        id,
        kind: b.dataset.kind,
        specialty: b.dataset.specialty,
        region: frontierUI.region,
        error: result.error,
      });
      if (result.error) toast(result.error);
      else sound.play(command === "combat" ? "hit" : "quest");
      if (command === "claim" || command === "finish")
        frontierUI.view = "people";
    }
    save();
    if (g.chapterCleared) {
      render();
      return;
    }
    frontier();
    return;
  }
  if (a === "audit") {
    open(
      "audit",
      head("独立试玩记录") +
        '<textarea id="qa-audit" readonly style="width:100%;height:300px"></textarea>',
    );
    $("#qa-audit").value = JSON.stringify({
      audit,
      save: JSON.parse(g.save()),
    });
  } else if (a === "ops") ops(b.dataset.filter);
  else if (a === "resumeProduction") {
    beforeModal = false;
    close();
  } else if (a === "prepare") {
    const result = g.prepareRecipe(b.dataset.recipe);
    if (result.error) toast(result.error);
    else {
      close();
      focusStack(result.stackId);
      save();
    }
  } else if (a === "stopWorker") {
    g.cancel(id);
    ops();
    save();
  } else if (a === "workerGear") {
    const p = g.card(b.dataset.person);
    if (p) open("gear", equipmentPanel(g, p, head));
  } else if (a === "equipWorker") {
    const stackId = g.prepareEquipment(b.dataset.type, b.dataset.person);
    if (stackId) {
      ops();
      save();
    } else toast("装备在忙或已经装备，请先停止相关工作。");
  } else if (a === "restWorker") {
    const id = g.prepareRest(b.dataset.person);
    if (id) {
      close();
      focusStack(id);
      save();
    } else toast("需要受伤且空闲的居民、空闲篝火和一份炖菜。");
  } else if (a === "rally") {
    const id = g.prepareBattle(b.dataset.enemy);
    if (id) {
      close();
      focusStack(id);
      save();
    } else toast("没有空闲战斗人员，请先停止工作或装备武器。");
  } else if (a === "close") close();
  else if (a === "welcome") welcome();
  else if (a === "new") startNew();
  else if (a === "newConfirmed") newConfirmed();
  else if (a === "continue") {
    g = saved;
    saved = null;
    lastEvent = g.eventId;
    endShown = false;
    modal = null;
    veil.hidden = true;
    g.paused = false;
    home();
    render();
    if (g.frontier.run) frontier();
  } else if (a === "reset") {
    saved = g;
    startNew();
  } else if (a === "save") {
    save();
    close();
    toast("聚落已保存");
  } else if (a === "recipes") recipes();
  else if (a === "chapterRecipes") recipes("chapter");
  else if (a === "journey") journey();
  else if (a === "nextChapter") {
    if (g.advanceChapter()) {
      endShown = false;
      try {
        localStorage.setItem(key + ".chapter" + g.chapter, g.save());
      } catch {
        toast("章初重试点保存失败，请保留当前页面。");
      }
      beforeModal = true;
      save();
      panels().intro();
    }
  } else if (a === "beginChapter") {
    beforeModal = false;
    close();
    if (g.chapter === 4) frontier();
    else focusType(g.chapter === 2 ? "coast" : "snowfield");
  } else if (a === "retryChapter") {
    try {
      const restored = Game.load(
        localStorage.getItem(key + ".chapter" + g.chapter),
      );
      if (restored.chapter !== g.chapter || restored.failed) throw Error();
      localStorage.setItem(key + ".before-retry", g.save());
      g = restored;
      lastEvent = g.eventId;
      endShown = false;
      beforeModal = true;
      panels().intro();
      save();
    } catch {
      toast("本章重试点不可用，当前进度已保留。");
    }
  } else if (a === "recipe") recipeDetail(b.dataset.recipe);
  else if (a === "goal") goal();
  else if (a === "sound") settings();
  else if (a === "locate") focusType(b.dataset.type);
  else if (a === "assign") {
    const person = g.people().find((p) => {
      const pile = g.stacks.find((s) => s.cards.includes(p.id));
      return (
        pile &&
        !g.busy(pile.id) &&
        !g.types(pile).some((t) => CARD[t].kind === "enemy")
      );
    });
    if (!person) {
      toast("没有空闲居民，请先取消一处工作。");
      return;
    }
    const from = g.stacks.find((s) => s.cards.includes(person.id));
    if (g.move(from.id, id, { cardId: person.id })) {
      close();
      startOnStack(id);
      focusStack(id);
    }
  } else if (a === "tapMove") {
    const source = g.stack(id),
      cardId = b.dataset.id;
    if (!source?.cards.includes(cardId)) {
      toast("卡牌已变化，请重新选择。");
      return;
    }
    tapMove = { source: id, cardId };
    close();
    $("#tapmove-label").textContent =
      `已选 ${CARD[g.card(cardId).type].name} · 点击目标卡堆`;
    $("#tapmove").hidden = false;
    toast("点目标卡堆完成叠放；拖动空白处可移动桌面。");
  } else if (a === "tapTarget") {
    close();
    placeTapMove(id);
  } else if (a === "start") {
    g.start(id, b.dataset.recipe);
    close();
    render();
    save();
  } else if (a === "cancelJob") {
    g.cancel(id);
    close();
    render();
    save();
  } else if (a === "extract") {
    const s = g.stack(id),
      p = g.freePosition(),
      out = g.move(id, null, { cardId: b.dataset.id, ...p });
    close();
    if (out) focusStack(out);
    save();
  } else if (a === "spread") {
    const s = g.stack(id);
    if (s) {
      g.cancel(id);
      for (const cid of [...s.cards].slice(1)) {
        const p = g.freePosition();
        g.move(id, null, { cardId: cid, ...p });
      }
    }
    close();
    render();
    save();
  } else if (a === "sell") {
    if (g.sell(id)) {
      close();
      render();
      save();
    } else toast("这张卡无法出售");
  } else if (a === "buy") {
    const r = g.buy(b.dataset.pack);
    if (r) {
      reveal(r);
      save();
    }
  } else if (a === "claim") {
    b.style.opacity = ".3";
    b.disabled = true;
    sound.play("drop");
    if (
      [...dialog.querySelectorAll('[data-action="claim"]')].every(
        (x) => x.disabled,
      )
    ) {
      close();
      focusStack(id);
    }
  } else if (a === "endless") {
    g.chapterCleared = false;
    g.paused = false;
    beforeModal = false;
    close();
  } else if (a === "collection") {
    const known = new Set([...book, ...g.discovered]);
    open(
      "collection",
      head("山野图鉴") +
        `<p class="muted">已发现 ${known.size} / ${Object.keys(CARD).length} · 重开后仍保留</p><div class="collection">${Object.entries(
          CARD,
        )
          .map(
            ([t, d]) =>
              `<div class="${known.has(t) ? "" : "unknown"}">${art(t)}${known.has(t) ? d.name : "未发现"}</div>`,
          )
          .join("")}</div>`,
      true,
    );
  }
});
dialog.addEventListener("input", (e) => {
  if (e.target.id === "musicvol") sound.music = Number(e.target.value);
  if (e.target.id === "fxvol") {
    sound.fx = Number(e.target.value);
    sound.play("produce");
  }
  try {
    localStorage.setItem(
      "stackwild.audio",
      JSON.stringify({ fx: sound.fx, music: sound.music }),
    );
  } catch {}
});
$("#packs").onclick = packs;
$("#coin").onclick = packs;
$("#recipes").onclick = () => recipes();
$("#objective").onclick = goal;
$("#menu").onclick = menu;
$("#sound").onclick = settings;
$("#tidy").onclick = () => {
  g.arrange(innerWidth < 600 ? 3 : 6);
  home();
  render();
  sound.play("drop");
  save();
};
$("#home").onclick = home;
$("#pause").onclick = () => {
  sound.init();
  if (g.frontier.run) {
    frontier();
    return;
  }
  if (!g.failed && !g.chapterCleared) g.paused = !g.paused;
  render();
  save();
};
$("#speed").onclick = () => {
  speed = speed === 1 ? 2 : 1;
  render();
};
$("#food").onclick = () =>
  open(
    "food",
    head("今晚的餐桌") +
      `<div class="help-line">可用食物：${g.foodValue()}<br>今晚需要：${g.people().length * 2}<br>饭锅剩余：${g.pantry}（已烹饪食物结余）</div><p class="muted">野果/菌菇/鲜鱼 = 1，蔬菜 = 2，炖菜 = 6，熏鱼 = 8。第二章以后，把两条鱼和一份盐做成熏鱼，可明显提高口粮产量。第三章温室每天自动产菜。正在制作或候潮中的材料不会被吃掉。连续两晚没吃饱才会离开。</p><button class="primary full" data-action="ops">安排食物生产</button>`,
  );
function zoom(f, x = board.clientWidth / 2, y = board.clientHeight / 2) {
  const old = camera.z;
  camera.z = Math.max(0.45, Math.min(1.45, camera.z * f));
  camera.x = x - ((x - camera.x) * camera.z) / old;
  camera.y = y - ((y - camera.y) * camera.z) / old;
  transform();
}
$("#zoomout").onclick = () => zoom(0.85);
$("#zoomin").onclick = () => zoom(1.15);
board.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const r = board.getBoundingClientRect();
    zoom(e.deltaY < 0 ? 1.08 : 0.92, e.clientX - r.left, e.clientY - r.top);
  },
  { passive: false },
);
let drag = null;
let tapMove = null;
function cancelTapMove() {
  tapMove = null;
  $("#tapmove").hidden = true;
}
$("#tapmove-cancel").onclick = cancelTapMove;
$("#tapmove-target").onclick = () => {
  if (!tapMove || !g.stack(tapMove.source)?.cards.includes(tapMove.cardId)) {
    cancelTapMove(); toast("卡牌已变化，请重新选择。"); return;
  }
  const targets = g.stacks.filter(s=>s.id!==tapMove.source).map(s=>({s,opts:g.preview(tapMove.source,s.id,false,tapMove.cardId)})).sort((a,b)=>Number(b.opts.length>0)-Number(a.opts.length>0));
  open("tapTargets", head("选择叠放目标") + '<p class="muted">优先列出可以立即工作的组合；也可以选择其他卡堆。</p>' + targets.map(({s,opts})=>`<button class="recipe-row" data-action="tapTarget" data-stack="${s.id}"><strong>${esc(names(g.types(s)))}</strong><small>${opts.length?esc(opts.map(o=>o.label).join(' / ')):g.busy(s.id)?'正在工作，可能无法加入':'叠放到这里'}</small></button>`).join(''));
};
function placeTapMove(targetId) {
  if (!tapMove) return;
  if (targetId === tapMove.source) { cancelTapMove(); toast("已取消点选。"); return; }
  const source = g.stack(tapMove.source);
  if (!source?.cards.includes(tapMove.cardId)) { cancelTapMove(); toast("卡牌已变化，请重新选择。"); return; }
  const dest = g.move(source.id, targetId, { cardId: tapMove.cardId });
  if (dest) { cancelTapMove(); startOnStack(dest); focusStack(dest); }
  else toast("无法叠到这里，请选择其他卡堆或取消。");
}
const pointers = new Map();
let pinch = null;
function clearDrag() {
  for (const el of world.children)
    el.classList.remove("dragging", "match", "hover");
  $("#ghost").style.display = "none";
  $("#sellzone").style.display = "none";
  $("#dragtip").style.display = "none";
  drag = null;
}
board.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".maptools, #tapmove") || modal) return;
  sound.init();
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  board.setPointerCapture(e.pointerId);
  if (pointers.size === 2) {
    clearDrag();
    const [a, b] = [...pointers.values()];
    pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y) };
    return;
  }
  const el = e.target.closest("[data-stack]");
  drag = {
    id: el?.dataset.stack,
    whole: !!e.target.closest(".grip"),
    startX: e.clientX,
    startY: e.clientY,
    lastX: e.clientX,
    lastY: e.clientY,
    moved: false,
  };
  if (drag.id) {
    const s = g.stack(drag.id);
    drag.cardId = s.cards.at(-1);
    drag.html = el.querySelector(".card").outerHTML;
  }
});
board.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()],
      d = Math.hypot(a.x - b.x, a.y - b.y),
      r = board.getBoundingClientRect();
    if (pinch)
      zoom(
        d / Math.max(1, pinch.distance),
        (a.x + b.x) / 2 - r.left,
        (a.y + b.y) / 2 - r.top,
      );
    pinch = { distance: d };
    return;
  }
  if (!drag) return;
  const dx = e.clientX - drag.lastX,
    dy = e.clientY - drag.lastY;
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  if (
    !drag.moved &&
    Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 7
  )
    return;
  drag.moved = true;
  if (!drag.id) {
    camera.x += dx;
    camera.y += dy;
    transform();
    return;
  }
  const ghost = $("#ghost");
  if (ghost.style.display !== "block") {
    ghost.innerHTML = drag.html;
    ghost.style.display = "block";
    world.querySelector(`[data-stack="${drag.id}"]`)?.classList.add("dragging");
    for (const s of g.stacks)
      if (
        s.id !== drag.id &&
        g.preview(drag.id, s.id, drag.whole, drag.cardId).length
      )
        world.querySelector(`[data-stack="${s.id}"]`)?.classList.add("match");
  }
  ghost.style.left = e.clientX - 57 + "px";
  ghost.style.top = e.clientY - 65 + "px";
  const r = board.getBoundingClientRect(),
    wx = (e.clientX - r.left - camera.x) / camera.z,
    wy = (e.clientY - r.top - camera.y) / camera.z;
  drag.target = [...g.stacks]
    .reverse()
    .find(
      (s) =>
        s.id !== drag.id &&
        wx >= s.x &&
        wx <= s.x + 114 &&
        wy >= s.y &&
        wy <= s.y + 150,
    )?.id;
  for (const el of world.children)
    el.classList.toggle("hover", el.dataset.stack === drag.target);
  const opts = drag.target
    ? g.preview(drag.id, drag.target, drag.whole, drag.cardId)
    : [];
  const tip = $("#dragtip");
  tip.style.display = "block";
  tip.textContent = opts.length
    ? opts.map((x) => x.label).join(" / ")
    : drag.target
      ? g.busy(drag.target)
        ? "对方正在工作，先等待或取消"
        : "叠放材料，凑齐配方后开始工作"
      : "放到空白处，单独摆放";
  const c = g.card(drag.cardId);
  const canSell = !drag.whole && CARD[c?.type]?.sell && !g.busy(drag.id);
  $("#sellzone").style.display = canSell ? "block" : "none";
  $("#sellprice").textContent = CARD[c?.type]?.sell || 0;
  const sr = $("#sellzone").getBoundingClientRect();
  drag.sell =
    canSell &&
    e.clientX >= sr.left &&
    e.clientX <= sr.right &&
    e.clientY >= sr.top &&
    e.clientY <= sr.bottom;
  $("#sellzone").classList.toggle("over", !!drag.sell);
});
function pointerEnd(e, cancelled = false) {
  pointers.delete(e.pointerId);
  if (pinch) {
    if (!pointers.size) pinch = null;
    clearDrag();
    return;
  }
  if (!drag) return;
  const d = drag;
  if (!cancelled && d.id) {
    if (!d.moved) {
      const s = g.stack(d.id);
      if (s && tapMove) {
        placeTapMove(s.id);
      } else if (s) inventory(s);
    } else if (d.sell) {
      g.sell(d.id, d.cardId);
    } else {
      const r = board.getBoundingClientRect();
      if (
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom
      ) {
        const dest = g.move(d.id, d.target, {
          whole: d.whole,
          cardId: d.cardId,
          x: (e.clientX - r.left - camera.x) / camera.z - 57,
          y: (e.clientY - r.top - camera.y) / camera.z - 65,
        });
        if (dest && d.target) startOnStack(dest);
        else if (!dest) toast("这里正在工作，请先等待或取消。");
      }
    }
  }
  clearDrag();
  render();
  save();
}
board.addEventListener("pointerup", (e) => pointerEnd(e));
board.addEventListener("pointercancel", (e) => pointerEnd(e, true));
board.addEventListener("keydown", (e) => {
  const id = e.target.closest("[data-stack]")?.dataset.stack;
  if (id && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    inventory(g.stack(id));
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal !== "welcome") close();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    g.paused = true;
    beforeModal = true;
    save();
    render();
  }
});
window.addEventListener("pagehide", () => {
  g.paused = true;
  save();
});
let last = performance.now(),
  paint = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  g.tick(dt * speed);
  sound.tick(dt, !g.paused && !document.hidden);
  paint += dt;
  saveTimer += dt;
  if (paint > 0.1) {
    paint = 0;
    render();
  }
  if (saveTimer > 5) {
    saveTimer = 0;
    save();
  }
  requestAnimationFrame(frame);
}
// Read-only inspection for QA; no game state mutation endpoints are exposed.

let boardSize = { width: board.clientWidth, height: board.clientHeight };
new ResizeObserver(() => {
  const w = board.clientWidth,
    h = board.clientHeight;
  camera.x += (w - boardSize.width) / 2;
  camera.y += (h - boardSize.height) / 2;
  boardSize = { width: w, height: h };
  transform();
}).observe(board);
transform();
render();
welcome();
requestAnimationFrame(frame);
