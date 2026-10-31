import { CARD } from "./game-data.js";
import { frontierEnemyArt } from "./frontier-art.js";
import {
  REGIONS,
  NODES,
  ENEMIES,
  SPECIALTIES,
  CAMP_UPGRADES,
  RELICS,
} from "./frontier-data.js";
import {
  level,
  active,
  intent,
  departureStatus,
  pressure,
  stormDamage,
  guardAmount,
  combatReason,
  forecastEnemy,
} from "./frontier.js";
const btn = (action, label, attrs = "", disabled = false, cls = "secondary") =>
  `<button class="${cls}" data-action="frontier" data-command="${action}" ${attrs} ${disabled ? "disabled" : ""}>${label}</button>`;
const hp = (n, max = 12) =>
  `<span class="f-health"><i style="width:${(100 * n) / max}%"></i></span>`;
const badge = (p) =>
  `${CARD[p.type].name} · Lv.${level(p)}${p.specialty ? " · " + SPECIALTIES[p.specialty].name : ""}`;
export function frontierPanel(g, ui, { head, art }) {
  const f = g.frontier,
    r = f.run;
  const top = head(r ? REGIONS[r.region].name : "第四章 · 风帆群岛");
  const portrait = (p, n = p.hp) =>
    `<div class="f-portrait">${art(p.type)}</div><b>${badge(p)}</b>${hp(n)}<small>${n}/12生命 · ${p.weapon ? CARD[p.weapon].name : "无武器"}</small>`;
  if (!r) {
    const nav = `<div class="f-tabs">${[
      ["routes", "远征"],
      ["people", "居民成长"],
      ["camp", "营地与遗物"],
    ]
      .map(([v, n]) =>
        btn(
          "tab",
          n,
          `data-id="${v}"`,
          false,
          ui.view === v ? "primary" : "secondary",
        ),
      )
      .join("")}</div>`;
    let content = "";
    if (ui.view === "people")
      content = `<p class="help-line">远征经验永久保留。2级选择一次专长，3级强化专长，4级远征攻击+1。专长仅作用于远征，原职业和装备继续生效。</p>${g
        .people()
        .map(
          (p) =>
            `<article class="f-person"><div class="f-person-head">${portrait(p)}</div><p class="muted">经验 ${p.xp || 0} · ${level(p) < 4 ? "下一级需累计" + [0, 5, 16, 32][level(p)] + "经验" : "已达到4级"}${p.specialty ? " · " + SPECIALTIES[p.specialty].text : ""}</p>${
              !p.specialty
                ? Object.entries(SPECIALTIES)
                    .map(([id, s]) =>
                      btn(
                        "train",
                        s.icon + " " + s.name + "<small>" + s.text + "</small>",
                        `data-id="${p.id}" data-specialty="${id}"`,
                        level(p) < 2,
                        "f-choice",
                      ),
                    )
                    .join("")
                : ""
            }</article>`,
        )
        .join("")}`;
    else if (ui.view === "camp")
      content = `<p class="help-line">勋章 ${f.marks} · 打通航路和处理事件获得。撤退带回一半勋章，经验全部保留。</p>${Object.entries(
        CAMP_UPGRADES,
      )
        .map(([id, u]) =>
          btn(
            "upgrade",
            u.name +
              `<small>${u.text}<br>${f.upgrades.includes(id) ? "已建成" : u.cost + "勋章"}</small>`,
            `data-id="${id}"`,
            f.upgrades.includes(id) || f.marks < u.cost,
            "f-choice",
          ),
        )
        .join(
          "",
        )}<h3>永久遗物</h3><p class="muted">每份盟约首次达成时二选一。选择会永久影响后续远征。</p>${f.relics.map((id) => `<p class="help-line"><b>${RELICS[id].name}</b><br>${RELICS[id].text}</p>`).join("") || '<p class="muted">尚未取得盟约遗物。</p>'}`;
    else {
      const cap = f.seals.length ? 3 : 2,
        err = departureStatus(g, ui.region, ui.team);
      content = `<div class="f-banner"><span>灯路联盟</span><b>${f.seals.length} / 3 盟约</b><p>选一条航路 → 选择队员 → 出发。首次盟约解锁第三个队员席位。</p></div><p class="muted">已选：${REGIONS[ui.region].name} · ${ui.team.length}名队员</p>${btn("start", err || `出发 · 消耗${ui.team.length * 2}食物`, "", !!err, "primary full")}<div class="f-regions">${Object.entries(
        REGIONS,
      )
        .map(([id, c]) =>
          btn(
            "region",
            `<span class="f-region-art">${art(c.art)}</span><b>${c.name}</b><small>${f.seals.includes(id) ? "✓ 已结盟 · 可再次远征" : c.tag}</small>`,
            `data-id="${id}"`,
            id === "eye" && f.seals.length < 3,
            "f-region " + (ui.region === id ? "selected" : ""),
          ),
        )
        .join(
          "",
        )}</div><p>${REGIONS[ui.region].text}</p><h3>选择队员 ${ui.team.length}/${cap}</h3><button class="secondary full" data-action="ops" data-filter="basic">回聚落安排生产／治疗／停工</button><div class="f-roster">${g
        .people()
        .map((p) => {
          const busy = !g.availableCards().some((c) => c.id === p.id);
          return btn(
            "team",
            portrait(p) +
              `<small>${busy ? "工作中，请先停止工作" : ui.team.includes(p.id) ? "✓ 已入队" : "点击入队"}</small>`,
            `data-id="${p.id}"`,
            busy,
            "f-unit " + (ui.team.includes(p.id) ? "selected" : ""),
          );
        })
        .join(
          "",
        )}</div><p class="muted">出发消耗每人2食物，转为整次远征的补给。聚落时间在远征中暂停；工匠可破解机关，雷刃与工匠可打断重击。</p><p class="muted">可用食物 ${g.foodValue()} · 每次至少1名队员 · 推荐带一位工匠</p>`;
    }
    return `<div class="frontier">${top}${g.chapterCleared ? '<button class="primary full" data-action="endless">继续经营与远征</button>' : ""}${nav}${content}</div>`;
  }
  const stats = `<div class="f-stats"><span>补给 <b>${r.supplies}</b></span><span>士气 <b>${r.morale}/5</b></span><span>勋章 <b>${r.loot}</b></span></div>`;
  const prediction = forecastEnemy(g);
  const team = `${prediction ? '<p class="f-forecast-label">若现在结束回合 · 下回合生命（含防护、风暴与遗物）</p>' : ""}<div class="f-roster combat-roster">${r.units
    .map((u, index) => {
      const p = g.card(u.id);
      return btn(
        "select",
        `<small>队员${index + 1}</small>` +
          portrait(p, r.paid ? p.hp : u.hp) +
          (u.hp === 0
            ? r.paid
              ? "<small>已安全归营</small>"
              : "<small>失去战力 · 归营恢复</small>"
            : prediction
              ? `<small class="f-forecast ${prediction.units[index].next <= 3 ? "danger" : ""}">下回合 ${prediction.units[index].next > 0 ? prediction.units[index].next + "♥" : "将倒下"}</small>`
              : ""),
        `data-id="${u.id}"`,
        u.hp === 0,
        "f-unit " + (ui.actor === u.id ? "selected" : ""),
      );
    })
    .join("")}</div>`;
  const logs = `<div class="f-log" aria-live="polite">${r.log
    .slice(0, 3)
    .map((t) => "<p>" + t + "</p>")
    .join("")}</div>`;
  if (r.stage === "reward")
    return `<div class="frontier">${top}<div class="f-banner"><span>航路打通</span><b>永久遗物 · 二选一</b><p>${r.summary}</p></div>${REGIONS[r.region].relics.map((id) => btn("claim", RELICS[id].name + "<small>" + RELICS[id].text + "</small>", `data-id="${id}"`, false, "f-choice")).join("")}<p class="muted">首次盟约后可派3人。回营记得为2级居民选择专长。</p></div>`;
  if (r.stage === "summary")
    return `<div class="frontier">${top}<p class="help-line">${r.summary}</p>${team}${btn("finish", "返回远征营地", "", "", "primary full")}</div>`;
  let body = "";
  if (r.stage === "map") {
    const region = REGIONS[r.region],
      nodes = r.depth === 4 ? ["boss"] : region.routes[r.depth];
    body = `<div class="f-route-dots">${[0, 1, 2, 3, 4].map((i) => `<span class="${i < r.depth ? "done" : i === r.depth ? "current" : ""}">${i === 4 ? "⚑" : i + 1}</span>`).join("<i></i>")}</div><h3>${r.depth === 4 ? "最后一站 · 航路守卫" : "第" + (r.depth + 1) + "段 · 选一条路"}</h3><p class="muted">${r.supplies ? "前进消耗1补给。每段只能走一条路线。" : "没有补给！继续前进将全队失去2生命、士气−1。"}</p><div class="f-paths">${nodes
      .map((id) => {
        const n =
          id === "boss"
            ? {
                name: ENEMIES[region.boss].name,
                icon: "⚑",
                battle: region.boss,
              }
            : NODES[id];
        return btn(
          "node",
          `<span class="f-node-icon">${n.icon}</span><b>${n.name}</b><small>${n.battle ? "战斗 · " + ENEMIES[n.battle].hp + "生命 · 可提前休整" : "事件 · 两种以上应对方式"}</small>`,
          `data-id="${id}"`,
          false,
          "f-path",
        );
      })
      .join(
        "",
      )}</div>${f.upgrades.includes("lookout") && r.depth < 3 ? '<p class="help-line">瞭望报告 · 下一段：' + region.routes[r.depth + 1].map((id) => NODES[id].name + (NODES[id].battle ? "（战斗）" : "（事件）")).join(" / ") + "</p>" : ""}${team}${btn("rest", "途中休整 · 消耗2补给", "", r.restedAt === r.depth || r.supplies < 2, "secondary full")}<p class="muted">休整恢复全队至少4生命；每段一次。士气为0时攻击−2、承伤+1。</p>`;
  } else if (r.stage === "event") {
    const n = NODES[r.node];
    body = `<div class="f-event-art">${n.icon}</div><h3>${n.name}</h3><p>${n.text}</p>${n.choices
      .map((c) => {
        const disabled =
          (c.need &&
            !active(r).some((u) => g.card(u.id).specialty === c.need)) ||
          (c.role && !active(r).some((u) => g.card(u.id).type === c.role)) ||
          (c.supply < 0 && r.supplies < -c.supply);
        return btn(
          "choice",
          c.label + "<small>" + c.hint + "</small>",
          `data-id="${c.id}"`,
          disabled,
          "f-choice",
        );
      })
      .join("")}${team}`;
  } else if (r.stage === "battle") {
    const b = r.battle,
      enemy = ENEMIES[b.enemy],
      [kind, n] = intent(r),
      unit = active(r).find((u) => u.id === ui.actor) || active(r)[0],
      p = g.card(unit.id);
    ui.actor = unit.id;
    const text = {
      strike: `攻击队员${r.units.findIndex((u) => u.id === prediction.targetId) + 1} · ${n}伤害`,
      charge: `蓄力重击 ${n}伤害 · 可用职业技打断`,
      cleave: `横扫全队 · 每人${n}伤害`,
      shield: `架起${n}屏障 · 本轮不攻击`,
    }[kind];
    const attackDamage = Math.max(
      0,
      Math.max(
        1,
        CARD[p.type].atk +
          (CARD[p.weapon]?.weapon || 0) +
          (level(p) >= 4 ? 1 : 0) -
          (r.morale === 0 ? 2 : 0),
      ) +
        (b.firstHit && f.relics.includes("wind") ? 4 : 0) +
        (b.exposed > 0 ? b.exposeBonus || 3 : 0) -
        b.enemyShield,
    );
    const skill =
      p.type === "artisan"
        ? "机巧干扰"
        : p.weapon === "thunderBlade"
          ? "雷刃震荡"
          : p.type === "guard"
            ? "守势反击"
            : "应急包扎";
    body = `<div class="f-enemy"><div>${frontierEnemyArt(b.enemy, art(enemy.art))}</div><section><small>第${b.round}回合</small><h3>${enemy.name}</h3>${hp(b.hp, enemy.hp)}<b>${b.hp}/${enemy.hp}</b>${b.enemyShield ? "<small> · 屏障 " + b.enemyShield + "</small>" : ""}${b.exposed ? `<small class="f-mark">弱点×${b.exposed} · 每次伤害+${b.exposeBonus || 3}</small>` : ""}</section></div><div class="f-intent ${kind}"><b>敌人下一招</b><span>${text}</span>${b.disrupted && kind === "charge" ? "<strong>✓ 已打断</strong>" : ""}</div><p class="f-pressure">${pressure(r) ? "敌人攻势强化 +" + pressure(r) + " · " : "第5回合起敌人逐渐强化 · "}${enemy.storm ? "风暴场：回合末全队受到" + stormDamage(r) + "穿透伤害（第5回合起增强）" : "尽快结束战斗，避免长时间消耗"}</p><div class="f-turn"><b>我方行动点 ${"●".repeat(b.ap)}${"○".repeat(2 - b.ap)}</b><span>公共护盾 ${b.shield}</span></div>${team}<p class="f-action-label">已选：${badge(p)} · 点击队员切换</p><div class="f-actions">${[
      ["attack", "普通攻击", `预计造成 ${attackDamage}伤害（已扣敌方屏障）`],
      [
        "guard",
        "格挡 / 掩护",
        `护盾+${guardAmount(p)}，吸引单体攻击${f.relics.includes("thorns") ? "；反击" + (3 + (b.exposed > 0 ? b.exposeBonus || 3 : 0)) : ""}`,
      ],
      [
        "skill",
        skill,
        p.type === "artisan" || p.weapon === "thunderBlade"
          ? "穿透伤害，并打断蓄力"
          : p.type === "guard"
            ? "护盾+9，穿透伤害3"
            : "治疗最低生命队员5",
      ],
      [
        "special",
        p.specialty ? SPECIALTIES[p.specialty].name + "专长" : "尚未选择专长",
        p.specialty === "medic"
          ? "存活队员恢复" + (level(p) >= 3 ? 4 : 3)
          : p.specialty === "scout"
            ? "后两次伤害各+" + (level(p) >= 3 ? 6 : 4)
            : `护盾+${guardAmount(p, true)}，穿透伤害${4 + (b.exposed > 0 ? b.exposeBonus || 3 : 0)}`,
      ],
    ]
      .map(([id, label, hint]) => {
        const reason = combatReason(g, unit.id, id),
          disabled = !!reason;
        return btn(
          "combat",
          label + `<small>${reason || hint} · 1行动点</small>`,
          `data-id="${unit.id}" data-kind="${id}"`,
          disabled,
          "f-choice",
        );
      })
      .join(
        "",
      )}</div>${btn("endTurn", "结束回合 · 敌人行动", "", "", "secondary full")}<p class="muted">用完2行动点后敌人自动出招。每人每回合可分别攻击、格挡或施技。护盾在下一轮重置；击败敌人后不受反击。</p>`;
  }
  return `<div class="frontier">${top}${stats}${body}${logs}${btn("retreat", "撤退 · 保留经验，带回一半勋章", "", "", "text-button full")}</div>`;
}
