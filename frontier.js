import { CARD } from "./game-data.js";
import {
  REGIONS,
  NODES,
  ENEMIES,
  SPECIALTIES,
  CAMP_UPGRADES,
  RELICS,
} from "./frontier-data.js";
export const freshFrontier = () => ({
  seals: [],
  relics: [],
  upgrades: [],
  marks: 0,
  runs: 0,
  run: null,
  last: null,
});
export const level = (p) =>
  1 + [5, 16, 32].filter((n) => (p.xp || 0) >= n).length;
export const has = (g, id) => g.frontier.relics.includes(id);
export const away = (g, id) =>
  !!g.frontier?.run?.units.some((u) => u.id === id);
export const active = (r) => r.units.filter((u) => u.hp > 0);
export const pressure = (r) =>
  Math.min(8, Math.max(0, Math.floor((r.battle.round - 3) / 2)) * 2);
export const stormDamage = (r) =>
  1 + Math.max(0, Math.floor((r.battle.round - 3) / 2));
export const intent = (r) => {
  const [kind, n] =
    ENEMIES[r.battle.enemy].pattern[
      (r.battle.round - 1) % ENEMIES[r.battle.enemy].pattern.length
    ];
  return [kind, n + (kind === "shield" ? 0 : pressure(r))];
};
export const guardAmount = (p, special = false) =>
  special
    ? level(p) >= 3
      ? 12
      : 10
    : 6 + (p.specialty === "vanguard" ? (level(p) >= 3 ? 5 : 3) : 0);
export function combatReason(g, id, kind) {
  const r = g.frontier.run,
    b = r?.battle,
    u = r && active(r).find((u) => u.id === id);
  if (
    r?.stage !== "battle" ||
    !u ||
    !["attack", "guard", "skill", "special"].includes(kind) ||
    b.ap <= 0
  )
    return "选择仍可行动的队员";
  const p = g.card(id);
  if (b.used.includes(id + ":" + kind)) return "本回合已使用";
  if (kind === "skill" && u.cd > b.round) return `冷却 ${u.cd - b.round}回合`;
  if (kind === "special" && !p.specialty) return "归营后选择专长";
  if (kind === "special" && u.specCd > b.round)
    return `冷却 ${u.specCd - b.round}回合`;
  if (kind === "special" && p.specialty === "scout" && b.exposed > 0)
    return `已有${b.exposed}次弱点标记，请先消耗`;
  const isHeal =
    (kind === "special" && p.specialty === "medic") ||
    (kind === "skill" &&
      p.type !== "artisan" &&
      p.type !== "guard" &&
      p.weapon !== "thunderBlade");
  if (isHeal && active(r).every((u) => u.hp === 12)) return "存活队员生命已满";
  return "";
}
// This read-only forecast is also the single damage calculation used by enemyTurn.
export function forecastEnemy(g) {
  const r = g.frontier.run;
  if (r?.stage !== "battle") return null;
  const b = r.battle,
    [kind, n] = intent(r),
    alive = active(r);
  const target = alive.find((u) => u.id === b.taunt) || alive[0];
  let shield = b.shield;
  const canceled = b.disrupted && kind === "charge";
  const units = r.units.map((u) => {
    const p = g.card(u.id),
      targeted =
        u.hp > 0 &&
        !canceled &&
        kind !== "shield" &&
        (kind === "cleave" || u.id === target.id);
    const raw = targeted
      ? Math.max(1, n - (p.armor ? 1 : 0) + (r.morale === 0 ? 1 : 0))
      : 0;
    const block = Math.min(shield, raw);
    shield -= block;
    const direct = Math.min(u.hp, raw - block),
      remaining = u.hp - direct;
    const storm =
      remaining > 0 && ENEMIES[b.enemy].storm
        ? Math.min(remaining, stormDamage(r))
        : 0;
    const after = remaining - storm,
      renewal =
        after > 0 && has(g, "renewal") && (b.round + 1) % 3 === 0
          ? Math.min(3, 12 - after)
          : 0;
    return {
      id: u.id,
      before: u.hp,
      after,
      next: after + renewal,
      renewal,
      direct,
      storm,
      block,
      targeted,
    };
  });
  return { kind, n, canceled, targetId: target?.id, units, shieldLeft: shield };
}
export function log(r, text) {
  r.log.unshift(text);
  r.log = r.log.slice(0, 12);
}
function heal(r, n) {
  for (const u of active(r)) u.hp = Math.min(12, u.hp + n);
}
function hurt(r, n) {
  for (const u of active(r)) u.hp = Math.max(0, u.hp - n);
}
function xp(g, n) {
  for (const u of g.frontier.run.units) {
    const p = g.card(u.id);
    p.xp = Math.min(48, (p.xp || 0) + n);
  }
}
function consumeFood(g, n) {
  if (g.foodValue() < n) return false;
  let available = g.pantry;
  const used = g.reserved();
  for (const c of g.cards
    .filter((c) => CARD[c.type].food && !used.has(c.id))
    .sort((a, b) => CARD[a.type].food - CARD[b.type].food)) {
    if (available >= n) break;
    available += CARD[c.type].food;
    g.remove(c.id);
  }
  g.pantry = available - n;
  return true;
}
export function departureStatus(g, region, ids) {
  if (g.chapter !== 4 || g.failed || g.chapterCleared)
    return "请先进入第四章或继续自由经营";
  if (g.frontier.run) return "先完成当前远征结算";
  if (!REGIONS[region]) return "未知航路";
  if (region === "eye" && g.frontier.seals.length < 3)
    return "需要林地、遗址和断崖三份盟约";
  const cap = g.frontier.seals.length ? 3 : 2;
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > cap ||
    new Set(ids).size !== ids.length
  )
    return `选择1—${cap}名队员`;
  const free = g.availableCards();
  if (
    ids.some(
      (id) =>
        !g.people().some((p) => p.id === id) || !free.some((c) => c.id === id),
    )
  )
    return "队员正在工作，请先停止工作";
  if (
    ids.some(
      (id) =>
        g.card(id).hp + (g.frontier.upgrades.includes("infirmary") ? 4 : 0) < 4,
    )
  )
    return "生命不足4的队员需要先治疗";
  if (g.foodValue() < ids.length * 2)
    return `需要${ids.length * 2}食物打包路粮`;
  return "";
}
function returnHome(g, win, reason) {
  const f = g.frontier,
    r = f.run;
  if (!r || r.paid) return;
  r.paid = true;
  for (const u of r.units) g.card(u.id).hp = Math.max(1, Math.min(12, u.hp));
  const gain = win ? r.loot + 3 : Math.floor(r.loot / 2);
  f.marks += gain;
  xp(g, win ? 2 : 0);
  f.last = {
    region: r.region,
    win,
    reason,
    marks: gain,
    rounds: r.totalRounds,
    route: [...r.route],
    party: r.units.map((u) => ({ id: u.id, hp: g.card(u.id).hp })),
  };
  if (win && !REGIONS[r.region].final && !f.seals.includes(r.region)) {
    f.seals.push(r.region);
    r.stage = "reward";
    r.summary = `取得${REGIONS[r.region].name}盟约！带回${gain}枚勋章，经验已保留。选择一件永久遗物。`;
  } else {
    r.stage = "summary";
    r.summary =
      reason + ` 带回${gain}枚勋章，经验保留，倒下的居民以1生命撤回。`;
  }
  g.note(win ? "远征归来：" + REGIONS[r.region].name : reason);
  g.emit("expeditionReturn", { region: r.region, win, gain });
  if (win && REGIONS[r.region].final) {
    if (!g.clearedChapters.includes(4)) g.clearedChapters.push(4);
    g.chapterCleared = true;
    g.won = true;
    g.paused = true;
    f.run = null;
    g.emit("victory", { chapter: 4 });
  }
}
function nextNode(g) {
  const r = g.frontier.run;
  xp(g, 1);
  r.depth++;
  r.stage = "map";
  r.node = null;
  r.battle = null;
  if (!active(r).length) returnHome(g, false, "队伍受伤，已安全撤回营地。");
}
function battleWon(g) {
  const r = g.frontier.run;
  r.totalRounds++;
  log(r, "战斗胜利！勋章+2，队员获得经验。");
  r.loot += 2;
  xp(g, 1);
  if (r.depth === 4) returnHome(g, true, "航路已经打通。");
  else nextNode(g);
}
function startRound(g) {
  const r = g.frontier.run,
    b = r.battle;
  b.ap = 2;
  b.used = [];
  b.disrupted = false;
  b.taunt = null;
  b.shield = (has(g, "barrier") ? 2 : 0) + (b.round === 1 ? r.aegis : 0);
  if (has(g, "renewal") && b.round % 3 === 0) heal(r, 3);
}
function enemyTurn(g) {
  const r = g.frontier.run,
    b = r.battle,
    prediction = forecastEnemy(g),
    { kind, n } = prediction;
  if (b.disrupted && kind === "charge")
    log(r, "蓄力被打断！这一轮敌人无法行动。");
  else if (kind === "shield") {
    b.enemyShield = n;
    log(r, "敌人架起" + n + "点屏障；普通攻击先消耗屏障。");
  } else {
    for (const u of prediction.units.filter((u) => u.targeted)) {
      const p = g.card(u.id);
      log(
        r,
        `${CARD[p.type].name}承受${u.direct}伤害${u.block ? "（护盾挡下" + u.block + "）" : ""}。`,
      );
    }
  }
  if (ENEMIES[b.enemy].storm) {
    const damage = stormDamage(r);
    log(r, `风暴侵蚀：全队受到${damage}点穿透伤害。`);
  }
  for (const u of prediction.units)
    r.units.find((p) => p.id === u.id).hp = u.after;
  b.shield = prediction.shieldLeft;
  r.totalRounds++;
  if (!active(r).length) {
    returnHome(g, false, "队伍在战斗中失去行动力，已撤回营地。");
    return;
  }
  b.round++;
  startRound(g);
}
function hit(g, damage, ignoreShield = false) {
  const r = g.frontier.run,
    b = r.battle;
  if (b.exposed > 0) {
    damage += b.exposeBonus || 3;
    b.exposed--;
  }
  if (!ignoreShield) {
    const block = Math.min(b.enemyShield, damage);
    b.enemyShield -= block;
    damage -= block;
  }
  b.hp = Math.max(0, b.hp - damage);
  log(r, "造成" + damage + "伤害。");
}
export function frontierAction(g, action, args = {}) {
  const f = g.frontier;
  if (g.chapter !== 4) return { error: "第四章尚未开启" };
  const r = f.run;
  if (action === "start") {
    const err = departureStatus(g, args.region, args.ids);
    if (err) return { error: err };
    consumeFood(g, args.ids.length * 2);
    const units = args.ids.map((id) => ({
      id,
      hp: Math.min(
        12,
        g.card(id).hp + (f.upgrades.includes("infirmary") ? 4 : 0),
      ),
      cd: 0,
      specCd: 0,
    }));
    f.run = {
      region: args.region,
      units,
      stage: "map",
      depth: 0,
      supplies:
        7 +
        (f.upgrades.includes("logistics") ? 2 : 0) +
        units.filter((u) => g.card(u.id).specialty === "scout").length,
      morale: 3,
      aegis: 0,
      loot: 0,
      restedAt: -1,
      totalRounds: 0,
      log: ["队伍出发。先选择一条路线；战斗每回合只有2行动点。"],
      route: [],
      node: null,
      battle: null,
      paid: false,
    };
    f.runs++;
    g.paused = true;
    g.emit("expeditionStart", { region: args.region, ids: args.ids });
    return { ok: true };
  }
  if (action === "train") {
    const p = g.people().find((p) => p.id === args.id);
    if (r || !p || !SPECIALTIES[args.specialty] || level(p) < 2 || p.specialty)
      return { error: "2级居民可在归营后选择一次专长" };
    p.specialty = args.specialty;
    g.note("居民选择了" + SPECIALTIES[p.specialty].name + "专长。");
    return { ok: true };
  }
  if (action === "upgrade") {
    const u = CAMP_UPGRADES[args.id];
    if (r || !u || f.upgrades.includes(args.id) || f.marks < u.cost)
      return { error: "勋章不足或已建成" };
    f.marks -= u.cost;
    f.upgrades.push(args.id);
    return { ok: true };
  }
  if (!r) return { error: "还没有出发的队伍" };
  if (action === "claim") {
    if (
      r.stage !== "reward" ||
      !REGIONS[r.region].relics.includes(args.id) ||
      f.relics.includes(args.id)
    )
      return { error: "这件遗物不能领取" };
    f.relics.push(args.id);
    f.run = null;
    g.note("永久遗物：" + RELICS[args.id].name);
    return { ok: true };
  }
  if (action === "finish" && r.stage === "summary") {
    f.run = null;
    return { ok: true };
  }
  if (r.paid) return { error: "请先领取本次结算" };
  if (action === "retreat") {
    returnHome(g, false, "主动撤退，保存已获得的经验。");
    return { ok: true };
  }
  if (action === "rest") {
    if (r.stage !== "map" || r.restedAt === r.depth || r.supplies < 2)
      return { error: "每段仅能休整一次，需要2补给" };
    r.restedAt = r.depth;
    r.supplies -= 2;
    const amount =
      4 +
      (f.upgrades.includes("infirmary") ? 2 : 0) +
      (active(r).some((u) => g.card(u.id).specialty === "medic") ? 2 : 0);
    heal(r, amount);
    r.morale = Math.min(5, r.morale + 1);
    log(r, `休整恢复${amount}生命，补给−2。`);
    return { ok: true };
  }
  if (action === "node") {
    if (r.stage !== "map") return { error: "先完成当前事件" };
    const region = REGIONS[r.region],
      allowed = r.depth === 4 ? ["boss"] : region.routes[r.depth];
    if (!allowed?.includes(args.id)) return { error: "此路线不可达" };
    if (r.supplies > 0) r.supplies--;
    else {
      hurt(r, 2);
      r.morale = Math.max(0, r.morale - 1);
      log(r, "路粮耗尽，强行前进：全队失去2生命，士气−1。");
    }
    if (!active(r).length) {
      returnHome(g, false, "补给耗尽，队伍已撤回。");
      return { ok: true };
    }
    r.node = args.id;
    r.route.push(args.id);
    const enemy = args.id === "boss" ? region.boss : NODES[args.id].battle;
    if (enemy) {
      for (const u of r.units) {
        u.cd = 0;
        u.specCd = 0;
      }
      r.stage = "battle";
      r.battle = {
        enemy,
        hp: ENEMIES[enemy].hp,
        round: 1,
        ap: 2,
        shield: 0,
        enemyShield: 0,
        used: [],
        exposed: 0,
        firstHit: true,
        disrupted: false,
      };
      startRound(g);
      log(r, "遭遇" + ENEMIES[enemy].name + "。先看敌人意图，再分配2行动点。");
    } else r.stage = "event";
    return { ok: true };
  }
  if (action === "choice") {
    if (r.stage !== "event") return { error: "当前没有待处理的事件" };
    const c = NODES[r.node]?.choices.find((c) => c.id === args.id);
    if (!c) return { error: "未知选择" };
    if (c.need && !active(r).some((u) => g.card(u.id).specialty === c.need))
      return { error: "需要" + SPECIALTIES[c.need].name };
    if (c.role && !active(r).some((u) => g.card(u.id).type === c.role))
      return { error: "需要" + CARD[c.role].name };
    if (c.supply < 0 && r.supplies < -c.supply)
      return { error: "补给不足，可选择另一种办法" };
    r.supplies = Math.min(14, r.supplies + (c.supply || 0));
    r.morale = Math.max(0, Math.min(5, r.morale + (c.morale || 0)));
    r.loot += c.marks || 0;
    r.aegis = Math.min(8, r.aegis + (c.aegis || 0));
    if (c.hurt) hurt(r, c.hurt);
    if (c.heal) heal(r, c.heal);
    if (has(g, "grove")) heal(r, 1);
    if (c.xp) xp(g, c.xp);
    log(r, c.label + "：" + c.hint);
    nextNode(g);
    return { ok: true };
  }
  if (action === "endTurn") {
    if (r.stage !== "battle") return { error: "当前不在战斗中" };
    enemyTurn(g);
    return { ok: true };
  }
  if (action === "combat") {
    if (r.stage !== "battle") return { error: "当前不在战斗中" };
    const b = r.battle,
      u = active(r).find((u) => u.id === args.id),
      kind = args.kind;
    const reason = combatReason(g, args.id, kind);
    if (reason) return { error: reason };
    const key = u.id + ":" + kind,
      p = g.card(u.id),
      lv = level(p);
    b.ap--;
    b.used.push(key);
    const attack =
      CARD[p.type].atk +
      (CARD[p.weapon]?.weapon || 0) +
      (lv >= 4 ? 1 : 0) -
      (r.morale === 0 ? 2 : 0);
    if (kind === "attack") {
      let damage = Math.max(1, attack);
      if (b.firstHit && has(g, "wind")) damage += 4;
      b.firstHit = false;
      hit(g, damage);
    }
    if (kind === "guard") {
      b.shield += guardAmount(p);
      b.taunt = u.id;
      log(r, "架起护盾，承担这一轮单体攻击。");
      if (has(g, "thorns")) hit(g, 3, true);
    }
    if (kind === "skill") {
      u.cd =
        b.round +
        Math.max(
          1,
          (p.type === "artisan" ? 2 : 3) - (has(g, "capacitor") ? 1 : 0),
        );
      if (p.type === "artisan" || p.weapon === "thunderBlade") {
        b.disrupted = true;
        hit(g, p.type === "artisan" ? 5 : 4, true);
        log(r, "干扰已生效：若敌人本轮蓄力，重击会被取消。");
      } else if (p.type === "guard") {
        b.shield += 9;
        b.taunt = u.id;
        hit(g, 3, true);
      } else {
        const low = active(r).sort((a, b) => a.hp - b.hp)[0];
        low.hp = Math.min(12, low.hp + 5);
        log(r, "应急包扎恢复5生命。");
      }
    }
    if (kind === "special") {
      u.specCd = b.round + 3;
      if (p.specialty === "medic") {
        heal(r, lv >= 3 ? 4 : 3);
        log(r, "行医者照顾了整支队伍。");
      }
      if (p.specialty === "scout") {
        b.exposed = 2;
        b.exposeBonus = lv >= 3 ? 6 : 4;
        log(r, "弱点标记：接下来两次攻击各+" + b.exposeBonus + "。");
      }
      if (p.specialty === "vanguard") {
        b.shield += guardAmount(p, true);
        b.taunt = u.id;
        hit(g, 4, true);
      }
    }
    if (b.hp <= 0) battleWon(g);
    else if (b.ap === 0) enemyTurn(g);
    return { ok: true };
  }
  return { error: "当前阶段不能执行这项操作" };
}
export function assertFrontier(g) {
  const f = g.frontier;
  if (
    !f ||
    !Number.isInteger(f.marks) ||
    f.marks < 0 ||
    !Number.isInteger(f.runs) ||
    f.runs < 0
  )
    throw Error("远征存档异常");
  for (const [list, valid] of [
    [f.seals, ["grove", "ruins", "cliffs"]],
    [f.relics, Object.keys(RELICS)],
    [f.upgrades, Object.keys(CAMP_UPGRADES)],
  ])
    if (
      !Array.isArray(list) ||
      new Set(list).size !== list.length ||
      list.some((x) => !valid.includes(x))
    )
      throw Error("未知远征解锁");
  for (const p of g.people())
    if (
      (p.xp !== undefined &&
        (!Number.isInteger(p.xp) || p.xp < 0 || p.xp > 48)) ||
      (p.specialty && !SPECIALTIES[p.specialty])
    )
      throw Error("居民经验异常");
  const r = f.run;
  if (!r) return true;
  if (
    !Number.isInteger(r.loot) ||
    r.loot < 0 ||
    !Number.isInteger(r.totalRounds) ||
    r.totalRounds < 0 ||
    !Number.isFinite(r.aegis) ||
    r.aegis < 0 ||
    r.aegis > 8 ||
    !Array.isArray(r.route) ||
    !Array.isArray(r.log) ||
    typeof r.paid !== "boolean" ||
    r.paid !== ["reward", "summary"].includes(r.stage)
  )
    throw Error("远征结算异常");
  if (r.stage === "event" && !NODES[r.node]?.choices)
    throw Error("远征事件异常");
  if (
    r.stage === "reward" &&
    (!f.seals.includes(r.region) || !REGIONS[r.region]?.relics)
  )
    throw Error("远征奖励异常");
  if (
    g.chapter !== 4 ||
    !REGIONS[r.region] ||
    !["map", "event", "battle", "reward", "summary"].includes(r.stage) ||
    !Number.isInteger(r.depth) ||
    r.depth < 0 ||
    r.depth > 4 ||
    !Number.isFinite(r.supplies) ||
    r.supplies < 0 ||
    r.supplies > 14 ||
    !Number.isFinite(r.morale) ||
    r.morale < 0 ||
    r.morale > 5
  )
    throw Error("远征阶段异常");
  if (
    !Array.isArray(r.units) ||
    !r.units.length ||
    r.units.length > 3 ||
    new Set(r.units.map((u) => u.id)).size !== r.units.length ||
    r.units.some(
      (u) =>
        !g.people().some((p) => p.id === u.id) ||
        !Number.isFinite(u.hp) ||
        u.hp < 0 ||
        u.hp > 12 ||
        !Number.isInteger(u.cd) ||
        u.cd < 0 ||
        !Number.isInteger(u.specCd) ||
        u.specCd < 0 ||
        g.jobs.some((j) => j.used.includes(u.id)),
    )
  )
    throw Error("远征队伍引用异常");
  if (
    r.stage === "battle" &&
    (!r.battle ||
      !ENEMIES[r.battle.enemy] ||
      !Number.isFinite(r.battle.hp) ||
      r.battle.hp < 0 ||
      r.battle.hp > ENEMIES[r.battle.enemy].hp ||
      !Number.isInteger(r.battle.round) ||
      r.battle.round < 1 ||
      !Number.isInteger(r.battle.ap) ||
      r.battle.ap < 0 ||
      !Number.isFinite(r.battle.shield) ||
      r.battle.shield < 0 ||
      !Number.isFinite(r.battle.enemyShield) ||
      r.battle.enemyShield < 0 ||
      !Array.isArray(r.battle.used) ||
      new Set(r.battle.used).size !== r.battle.used.length ||
      !Number.isInteger(r.battle.exposed) ||
      r.battle.exposed < 0 ||
      r.battle.exposed > 2 ||
      r.battle.ap > 2)
  )
    throw Error("远征战斗异常");
  return true;
}
