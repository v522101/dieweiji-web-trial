import { CARD, RECIPE } from "./game-data.js";
export function productionPanel(g, { head, names }, filter = "chapter") {
  const kinds = {
    basic: (r) =>
      [
        "gatherBerry",
        "gatherWood",
        "gatherStone",
        "grow",
        "plank",
        "brick",
        "charcoal",
        "iron",
        "gear",
        "toolbox",
        "spear",
        "armor",
        "hut",
        "stewVeg",
        "stewFlour",
      ].includes(r.id),
    chapter: (r) => (r.chapter || 1) === g.chapter,
    all: (r) => true,
  };
  return (
    head("聚落生产调度") +
    `<p class="muted">只使用空闲居民和材料；安排后仍需正常制作时间。缺工匠时，先把工具箱交给一位空闲居民。</p><div class="ops-stock">${Object.entries(
      CARD,
    )
      .filter(
        ([t, c]) =>
          g.count(t) > 0 &&
          !["site", "building", "person", "enemy"].includes(c.kind),
      )
      .map(([t, c]) => `${c.name} <b>${g.count(t)}</b>`)
      .join(" · ")}</div><h3>居民与工作</h3><div class="ops-workers">${g
      .people()
      .map((p) => {
        const s = g.stacks.find((s) => s.cards.includes(p.id)),
          j = g.busy(s.id);
        return `<div class="ops-worker"><b>${CARD[p.type].name} ${p.hp}/12${p.weapon ? " · " + CARD[p.weapon].name : ""}${p.armor ? " · 护甲" : ""}${p.warm ? " · 斗篷" : ""}</b><small>${j ? (j.waitTide ? "候潮 " + g.tide().seconds + "秒 · " : "") + (RECIPE.find((r) => r.id === j.recipeId)?.label || (j.recipeId === "heal" ? "篝火休整" : j.recipeId === "battle" ? "迎战" : j.recipeId)) + " · " + Math.ceil(j.remaining) + "秒" : "空闲"}</small>${j ? `<button data-action="stopWorker" data-stack="${s.id}">停止这项工作</button>` : `<button data-action="workerGear" data-person="${p.id}">换装／治疗</button>`}</div>`;
      })
      .join("")}${g.jobs
      .filter((j) => !j.used.some((id) => g.people().some((p) => p.id === id)))
      .map(
        (j) =>
          `<div class="ops-worker"><b>${RECIPE.find((r) => r.id === j.recipeId)?.label || j.recipeId}</b><small>设施自动加工 · ${Math.ceil(j.remaining)}秒</small><button data-action="stopWorker" data-stack="${j.stackId}">停止这项工作</button></div>`,
      )
      .join(
        "",
      )}</div><div class="row"><button data-action="ops" data-filter="chapter" class="secondary">本章生产</button><button data-action="ops" data-filter="basic" class="secondary">基础加工</button><button data-action="ops" data-filter="all" class="secondary">全部</button></div><div class="ops-recipes">${RECIPE.filter(
      (r) => (r.chapter || 1) <= g.chapter && (kinds[filter] || kinds.all)(r),
    )
      .map((r) => {
        const plan = g.planRecipe(r.id);
        return `<div class="ops-recipe"><button aria-label="安排：${r.label}" data-action="prepare" data-recipe="${r.id}" ${plan.error ? "disabled" : ""}><b>${r.label}</b><small>${plan.error || (plan.waiting ? "备齐候潮 · 潮汐切换后自动出航" : "材料齐全 · 安排生产")}</small></button><button aria-label="配方：${r.label}" data-action="recipe" data-recipe="${r.id}">配方 ›</button><small>${names(r.inputs)} → ${names(r.outputs)}</small></div>`;
      })
      .join(
        "",
      )}</div><h3>集结出战</h3><p class="muted">只集合空闲守卫或持武器的居民，生命最高者站前排。忙碌居民需先停止工作。</p>${g.cards
      .filter((c) => CARD[c.type].kind === "enemy")
      .map(
        (c) =>
          `<button class="secondary full" data-action="rally" data-enemy="${c.id}">迎战 ${CARD[c.type].name} · ${c.hp}生命</button>`,
      )
      .join(
        "",
      )}<button class="primary full" data-action="resumeProduction">返回桌面，继续时间</button>`
  );
}
export function equipmentPanel(g, p, head) {
  const s = g.stacks.find((s) => s.cards.includes(p.id));
  return (
    head(CARD[p.type].name + " · 换装与治疗") +
    `<p class="help-line">生命 ${p.hp}/12 · 基础攻击 ${CARD[p.type].atk}${p.weapon ? " + 武器 " + CARD[p.weapon].weapon : ""}。转职保留武器与护甲，旧职业工具会退回桌面。</p>` +
    [
      "toolbox",
      "spear",
      "armor",
      "harpoon",
      "thunderBlade",
      "frostCloak",
      "salve",
    ]
      .filter((t) => g.count(t) > 0)
      .map(
        (t) =>
          `<button class="secondary full" data-action="equipWorker" data-person="${p.id}" data-type="${t}" ${g.busy(s.id) ? "disabled" : ""}>使用 ${CARD[t].name}（现有${g.count(t)}）</button>`,
      )
      .join("") +
    `<button class="secondary full" data-action="restWorker" data-person="${p.id}" ${p.hp >= 12 || !g.count("stew") ? "disabled" : ""}>篝火休整（1份炖菜）</button><p class="muted">没有工具箱？基础加工里制作工具箱，再返回换装。药膏只对受伤者有效。篝火+炖菜也可以治疗。</p><button class="primary full" data-action="ops" data-filter="basic">返回基础加工</button>`
  );
}
