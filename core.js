import { CARD, RECIPE, PACKS, CHAPTERS } from "./game-data.js";
import {
  freshFrontier,
  frontierAction,
  away,
  assertFrontier,
} from "./frontier.js";
export const PERSON = (t) => CARD[t]?.kind === "person";
export class Game {
  constructor(seed = 17) {
    Object.assign(this, {
      version: 4,
      frontier: freshFrontier(),
      chapter: 1,
      clearedChapters: [],
      chapterStart: 0,
      heat: 70,
      flags: {},
      voyages: 0,
      defeated: {},
      seed: seed >>> 0,
      nextId: 1,
      cards: [],
      stacks: [],
      jobs: [],
      coins: 0,
      day: 1,
      clock: 0,
      elapsed: 0,
      paused: true,
      won: false,
      failed: false,
      pantry: 0,
      travelDay: 0,
      chapterCleared: false,
      lit: false,
      explored: false,
      made: {},
      discovered: [],
      completed: [],
      log: [],
      events: [],
      eventId: 0,
    });
    [
      ["villager"],
      ["bush"],
      ["forest"],
      ["rocks"],
      ["berry", "berry", "berry"],
      ["wood"],
      ["fiber"],
      ["seed"],
    ].forEach((t, i) =>
      this.add(t, 76 + Math.floor(i / 2) * 138, 70 + (i % 2) * 175),
    );
    this.note("把居民拖到灌木上，开始第一份采集。");
  }
  id(p) {
    return p + this.nextId++;
  }
  random() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  note(text) {
    this.log.unshift({ text, day: this.day });
    this.log = this.log.slice(0, 30);
  }
  emit(type, detail = {}) {
    this.events.push({ id: ++this.eventId, type, ...detail });
    this.events = this.events.slice(-80);
  }
  card(id) {
    return this.cards.find((c) => c.id === id);
  }
  stack(id) {
    return this.stacks.find((s) => s.id === id);
  }
  types(s) {
    return (s?.cards || []).map((id) => this.card(id)?.type).filter(Boolean);
  }
  count(t) {
    return this.cards.filter((c) => c.type === t).length;
  }
  people() {
    return this.cards.filter((c) => PERSON(c.type));
  }
  beds() {
    return Math.min(2 + this.chapter * 2, 1 + this.count("hut"));
  }
  tide() {
    const t = (this.elapsed - this.chapterStart) % 60;
    return {
      phase: t < 30 ? "low" : "high",
      seconds: Math.max(1, Math.ceil(30 - (t % 30))),
    };
  }
  canAdvance() {
    return (
      !this.failed &&
      this.chapter < 4 &&
      this.clearedChapters.includes(this.chapter)
    );
  }
  advanceChapter() {
    if (!this.canAdvance()) return false;
    this.chapter++;
    this.chapterStart = this.elapsed;
    this.chapterCleared = false;
    this.heat = 70;
    this.paused = true;
    // Existing villagers, health, jobs, resources and timestamps survive unchanged.
    this.give(
      this.chapter === 2
        ? ["coast"]
        : this.chapter === 3
          ? ["snowfield", "archive"]
          : ["waygate"],
    );
    this.give(Array(this.people().length).fill("stew"));
    this.coins += 12;
    this.note(
      "第" +
        this.chapter +
        "章 · " +
        CHAPTERS[this.chapter].name +
        "；来客留下12古币和每人一份炖菜。",
    );
    this.emit("chapter", { chapter: this.chapter });
    return true;
  }
  recipeStatus(r, { ignoreTide = false } = {}) {
    if (!r) return "未知配方";
    if ((r.chapter || 1) > this.chapter) return "第" + r.chapter + "章解锁";
    if (
      r.once &&
      (this.flags[r.once] || this.jobs.some((j) => j.recipeId === r.id))
    )
      return "已经唤醒";
    if (
      r.limit &&
      (this.made[r.outputs[0]] || 0) +
        this.jobs.filter((j) => j.recipeId === r.id).length >=
        r.limit
    )
      return "已经完成全部校准";
    if (!ignoreTide && r.tide && r.tide !== this.tide().phase)
      return r.tide === "low" ? "等待落潮再出航" : "等待涨潮再出航";
    if (r.minHeat && this.heat < r.minHeat) return "供暖至少需要" + r.minHeat;
    if (r.requires === "relays" && this.count("relay") < 3)
      return "需要3座中继器";
    return "";
  }
  busy(id) {
    return this.jobs.find((j) => j.stackId === id);
  }
  reserved() {
    return new Set(this.jobs.flatMap((j) => j.used));
  }
  foodValue() {
    const used = this.reserved();
    return (
      this.pantry +
      this.cards.reduce(
        (n, c) => n + (!used.has(c.id) ? CARD[c.type].food || 0 : 0),
        0,
      )
    );
  }
  freePosition() {
    let i = 0;
    while (i < 240) {
      const x = 76 + (i % 6) * 138,
        y = 70 + Math.floor(i / 6) * 175;
      if (
        !this.stacks.some(
          (s) => Math.abs(s.x - x) < 110 && Math.abs(s.y - y) < 145,
        )
      )
        return { x, y };
      i++;
    }
    return { x: 76, y: 70 + Math.ceil(i / 6) * 175 };
  }
  add(types, x, y) {
    if (!types.length) return null;
    if (x === undefined) {
      const p = this.freePosition();
      x = p.x;
      y = p.y;
    }
    const s = { id: this.id("s"), x, y, cards: [] };
    for (const type of types) {
      if (!CARD[type]) throw Error("未知卡牌");
      const c = {
        id: this.id("c"),
        type,
        hp: CARD[type].hp || 0,
        armor: false,
        hunger: 0,
      };
      this.cards.push(c);
      s.cards.push(c.id);
      if (!this.discovered.includes(type)) this.discovered.push(type);
    }
    this.stacks.push(s);
    return s;
  }
  give(types) {
    const ids = [];
    for (const t of types) {
      const s = this.stacks.find(
        (s) =>
          !this.busy(s.id) &&
          this.types(s).every((x) => x === t) &&
          !["person", "enemy", "site", "building"].includes(CARD[t].kind),
      );
      if (s) {
        const c = {
          id: this.id("c"),
          type: t,
          hp: CARD[t].hp || 0,
          armor: false,
          hunger: 0,
        };
        this.cards.push(c);
        s.cards.push(c.id);
        if (!this.discovered.includes(t)) this.discovered.push(t);
        ids.push(s.id);
      } else ids.push(this.add([t]).id);
    }
    return ids;
  }
  remove(id) {
    this.cards = this.cards.filter((c) => c.id !== id);
    for (const s of this.stacks) s.cards = s.cards.filter((x) => x !== id);
    this.stacks = this.stacks.filter((s) => s.cards.length);
  }
  usedFor(s, inputs) {
    const used = [];
    for (const t of inputs) {
      const id = s.cards.find(
        (id) =>
          !used.includes(id) &&
          (t === "villager"
            ? PERSON(this.card(id).type)
            : this.card(id).type === t),
      );
      if (!id) return null;
      used.push(id);
    }
    return used;
  }
  options(stackOrId) {
    const s = typeof stackOrId === "string" ? this.stack(stackOrId) : stackOrId;
    if (!s || this.busy(s.id) || s.cards.some((id) => away(this, id)))
      return [];
    const out = [],
      people = s.cards.filter((id) => PERSON(this.card(id).type)),
      enemy = s.cards.find((id) => CARD[this.card(id).type].kind === "enemy");
    if (enemy && people.length)
      return [
        {
          id: "battle",
          label: "迎战 · " + CARD[this.card(enemy).type].name,
          seconds: 2,
          used: [...people, enemy],
        },
      ];
    for (const type of [
      "toolbox",
      "spear",
      "armor",
      "harpoon",
      "thunderBlade",
      "frostCloak",
      "salve",
    ]) {
      const gear = s.cards.find((id) => this.card(id).type === type),
        p = people.find((id) =>
          type === "harpoon" || type === "thunderBlade"
            ? this.card(id).weapon !== type
            : type === "frostCloak"
              ? !this.card(id).warm
              : type === "salve"
                ? this.card(id).hp < 12
                : type === "armor"
                  ? !this.card(id).armor
                  : this.card(id).type !==
                    (type === "toolbox" ? "artisan" : "guard"),
        );
      if (gear && p)
        out.push({
          id: "equip:" + type,
          label:
            type === "salve"
              ? "使用草药膏 · 恢复全部生命"
              : type === "frostCloak"
                ? "穿戴御寒斗篷"
                : CARD[type].weapon
                  ? "装备" + CARD[type].name + " · 攻击+" + CARD[type].weapon
                  : type === "armor"
                    ? "穿戴护甲"
                    : type === "toolbox"
                      ? "成为工匠"
                      : "成为守卫",
          seconds: 0,
          used: [p, gear],
        });
    }
    if (people.length) {
      const site = s.cards.find((id) =>
        ["ruins", "mine"].includes(this.card(id).type),
      );
      if (site)
        out.push({
          id: "explore:" + this.card(site).type,
          label: "探索" + CARD[this.card(site).type].name,
          seconds: this.card(site).type === "ruins" ? 25 : 30,
          used: [people[0], site],
        });
      const fire = s.cards.find((id) => this.card(id).type === "campfire"),
        meal = s.cards.find((id) => this.card(id).type === "stew"),
        hurt = people.find((id) => this.card(id).hp < 12);
      if (fire && meal && hurt)
        out.push({
          id: "heal",
          label: "篝火休整 · 恢复生命",
          seconds: 10,
          used: [hurt, fire, meal],
        });
    }
    for (const r of RECIPE) {
      if (r.id === "lightBeacon" && this.lit) continue;
      if (this.recipeStatus(r)) continue;
      const used = this.usedFor(s, r.inputs);
      if (used) out.push({ ...r, used });
    }
    return out;
  }
  availableCards() {
    return this.stacks
      .filter(
        (s) =>
          !this.busy(s.id) &&
          !this.types(s).some((t) => CARD[t].kind === "enemy"),
      )
      .flatMap((s) => s.cards)
      .filter((id) => !away(this, id))
      .map((id) => this.card(id));
  }
  planRecipe(recipeId) {
    if (this.failed) return { error: "聚落已结束，请重试本章" };
    if (this.chapterCleared)
      return { error: "本章已完成，请在章节旅程选择继续经营" };
    const r = RECIPE.find((r) => r.id === recipeId);
    if (!r) return { error: "未知配方" };
    const reason = this.recipeStatus(r, { ignoreTide: true });
    if (reason) return { error: reason };
    if (recipeId === "lightBeacon" && this.lit)
      return { error: "信标已经点亮" };
    const free = this.availableCards(),
      ids = [];
    for (const t of r.inputs) {
      const pool =
        t === "villager"
          ? [...free].sort(
              (a, b) =>
                (({ villager: 0, guard: 1, artisan: 2 })[a.type] ?? 3) -
                ({ villager: 0, guard: 1, artisan: 2 }[b.type] ?? 3),
            )
          : free;
      const c = pool.find(
        (c) =>
          !ids.includes(c.id) &&
          (t === "villager" ? PERSON(c.type) : c.type === t),
      );
      if (!c) return { error: "缺少空闲的" + CARD[t].name, missing: t };
      ids.push(c.id);
    }
    return { ids, waiting: r.tide && r.tide !== this.tide().phase };
  }
  assembleIdle(ids) {
    if (
      !ids.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !this.availableCards().some((c) => c.id === id))
    )
      return false;
    const first = this.stacks.find((s) => s.cards.includes(ids[0]));
    const dest =
      first.cards.length === 1
        ? first.id
        : this.move(first.id, null, { cardId: ids[0], ...this.freePosition() });
    for (const id of ids.slice(1)) {
      const src = this.stacks.find((s) => s.cards.includes(id));
      if (src.id !== dest) this.move(src.id, dest, { cardId: id });
    }
    return dest;
  }
  prepareRecipe(recipeId) {
    if (this.failed || this.chapterCleared)
      return { error: "请先结束本章结算" };
    const plan = this.planRecipe(recipeId);
    if (plan.error) return plan;
    const stackId = this.assembleIdle(plan.ids);
    return stackId && this.start(stackId, recipeId, { waitForTide: true })
      ? { stackId }
      : { error: "安排失败，请检查工作状态" };
  }
  prepareEquipment(type, pid) {
    if (this.failed || this.chapterCleared) return false;
    const p = this.card(pid),
      gear = this.availableCards().find((c) => c.type === type);
    if (!p || !PERSON(p.type) || !gear) return false;
    const preview = { id: "equip-preview", cards: [pid, gear.id] };
    if (!this.options(preview).some((r) => r.id === "equip:" + type))
      return false;
    const stackId = this.assembleIdle([pid, gear.id]);
    return stackId && this.start(stackId, "equip:" + type) ? stackId : false;
  }
  prepareRest(pid) {
    const free = this.availableCards(),
      p = free.find((c) => c.id === pid),
      fire = free.find((c) => c.type === "campfire"),
      meal = free.find((c) => c.type === "stew");
    if (
      !p ||
      !PERSON(p.type) ||
      p.hp >= 12 ||
      !fire ||
      !meal ||
      this.failed ||
      this.chapterCleared
    )
      return false;
    const id = this.assembleIdle([pid, fire.id, meal.id]);
    return id && this.start(id, "heal") ? id : false;
  }
  prepareBattle(enemyId) {
    const enemy = this.card(enemyId),
      s = this.stacks.find((s) => s.cards.includes(enemyId));
    if (
      this.failed ||
      this.chapterCleared ||
      !enemy ||
      CARD[enemy.type].kind !== "enemy" ||
      this.busy(s.id)
    )
      return false;
    const fighters = this.availableCards()
      .filter((c) => PERSON(c.type) && (c.type === "guard" || c.weapon))
      .sort(
        (a, b) =>
          b.hp - a.hp ||
          Number(!!b.armor) - Number(!!a.armor) ||
          Number(!!b.warm) - Number(!!a.warm),
      );
    if (!fighters.length) return false;
    const team = this.assembleIdle(fighters.map((c) => c.id));
    return this.move(s.id, team, { cardId: enemyId }) &&
      this.start(team, "battle")
      ? team
      : false;
  }
  preview(aId, bId, whole = false, cardId) {
    const a = this.stack(aId),
      b = this.stack(bId);
    if (!a || !b || a === b) return [];
    const ids = whole ? a.cards : [cardId || a.cards.at(-1)],
      job = this.busy(b.id);
    if (job)
      return job.recipeId === "battle" &&
        ids.every((id) => PERSON(this.card(id).type))
        ? [{ id: "reinforce", label: "加入战斗", seconds: 0 }]
        : [];
    return this.options({ id: "preview", cards: [...b.cards, ...ids] });
  }
  move(aId, bId, { whole = false, cardId, x, y } = {}) {
    const a = this.stack(aId),
      b = bId ? this.stack(bId) : null;
    if (!a || a === b) return false;
    const incoming = whole ? [...a.cards] : [cardId || a.cards.at(-1)],
      targetJob = b && this.busy(b.id);
    if (
      incoming.some((id) => away(this, id)) ||
      b?.cards.some((id) => away(this, id))
    )
      return false;
    if (
      targetJob &&
      (targetJob.recipeId !== "battle" ||
        !incoming.every((id) => PERSON(this.card(id).type)))
    )
      return false;
    const job = this.busy(a.id);
    if (job) {
      if (whole && !b) {
        a.x = x ?? a.x;
        a.y = y ?? a.y;
        return a.id;
      }
      this.cancel(a.id);
    }
    const ids = whole ? [...a.cards] : [cardId || a.cards.at(-1)];
    if (ids.some((id) => !a.cards.includes(id))) return false;
    a.cards = a.cards.filter((id) => !ids.includes(id));
    let dest = b;
    if (b) {
      b.cards.push(...ids);
      if (targetJob) targetJob.used.push(...ids);
    } else {
      dest = {
        id: this.id("s"),
        cards: ids,
        x: x ?? a.x + 30,
        y: y ?? a.y + 30,
      };
      this.stacks.push(dest);
    }
    this.stacks = this.stacks.filter((s) => s.cards.length);
    this.emit("drop", { stackId: dest.id });
    return dest.id;
  }
  start(stackId, recipeId, { waitForTide = false } = {}) {
    if (this.failed || this.chapterCleared) return false;
    const s = this.stack(stackId);
    if (s?.cards.some((id) => away(this, id))) return false;
    let r = this.options(s).find((r) => r.id === recipeId);
    if (!r && waitForTide && s && !this.busy(stackId)) {
      const candidate = RECIPE.find((r) => r.id === recipeId);
      if (
        candidate?.tide &&
        !this.recipeStatus(candidate, { ignoreTide: true })
      ) {
        const used = this.usedFor(s, candidate.inputs);
        if (used) r = { ...candidate, used };
      }
    }
    if (!r) return false;
    if (recipeId.startsWith("equip:")) {
      const [pid, gid] = r.used,
        p = this.card(pid),
        type = this.card(gid).type;
      if (CARD[type].weapon) {
        if (p.weapon) this.give([p.weapon]);
        p.weapon = type;
      } else if (type === "frostCloak") p.warm = true;
      else if (type === "salve") p.hp = 12;
      else if (type === "armor") p.armor = true;
      else {
        const old = p.type;
        p.type = type === "toolbox" ? "artisan" : "guard";
        if (old !== "villager")
          this.give([old === "artisan" ? "toolbox" : "spear"]);
        this.made[p.type] = (this.made[p.type] || 0) + 1;
        if (!this.discovered.includes(p.type)) this.discovered.push(p.type);
      }
      this.remove(gid);
      this.emit("equip", { stackId });
      this.note(r.label);
      this.quests();
      return true;
    }
    let duration = r.seconds;
    const worker = r.used
      .map((id) => this.card(id))
      .find((c) => PERSON(c.type));
    if (
      worker?.type === "artisan" &&
      !recipeId.startsWith("explore") &&
      recipeId !== "battle"
    )
      duration *= 0.8;
    if (worker?.hunger) duration *= 2;
    if (
      this.chapter === 3 &&
      this.heat < 25 &&
      worker &&
      !worker.warm &&
      recipeId !== "battle"
    )
      duration *= 1.5;
    if (this.day === 6 && recipeId.startsWith("gather") && !this.count("shed"))
      duration *= 1.3;
    this.jobs.push({
      id: this.id("j"),
      stackId,
      recipeId,
      used: r.used,
      duration,
      remaining: duration,
      ...(r.tide && r.tide !== this.tide().phase ? { waitTide: r.tide } : {}),
    });
    this.emit("start", { stackId });
    return true;
  }
  cancel(stackId) {
    const j = this.busy(stackId);
    if (!j) return false;
    this.jobs = this.jobs.filter((x) => x !== j);
    if (j.recipeId === "battle") {
      for (const id of j.used) {
        const c = this.card(id);
        if (c && PERSON(c.type)) c.hp = Math.max(1, c.hp - 2);
      }
      const s = this.stack(stackId);
      if (s) {
        const enemy = s.cards.find(
          (id) => CARD[this.card(id).type].kind === "enemy",
        );
        if (enemy) this.move(stackId, null, { cardId: enemy });
      }
      this.note("队伍撤退，损失2点生命。");
    }
    return true;
  }
  finish(j) {
    const s = this.stack(j.stackId);
    if (!s || j.used.some((id) => !this.card(id))) return;
    if (j.recipeId === "battle") {
      this.fight(j);
      return;
    }
    this.jobs = this.jobs.filter((x) => x !== j);
    let outputs = [],
      label = "";
    if (j.recipeId.startsWith("explore:")) {
      const mine = j.recipeId === "explore:mine",
        p = this.random();
      if (!mine && !this.explored) {
        outputs = ["mine", "clay", "clay"];
        this.explored = true;
        this.coins += 3;
        label = "发现旧矿洞，获得黏土与3枚古币";
      } else if (mine) {
        outputs = ["ironOre", "ironOre"];
        if (p < 0.15) outputs.push("raider");
        label = "采回铁矿" + (p < 0.15 ? "，惊动了掠夺者" : "");
      } else {
        outputs =
          p < 0.35
            ? ["mushroom", "mushroom", "mushroom"]
            : p < 0.65
              ? ["fiber", "fiber"]
              : p < 0.9
                ? ["clay", "clay"]
                : ["beast"];
        label = "废墟探索归来";
      }
    } else if (j.recipeId === "heal") {
      this.card(j.used[0]).hp = 12;
      this.remove(j.used[2]);
      label = "休整完毕，生命恢复";
    } else {
      const r = RECIPE.find((r) => r.id === j.recipeId),
        keep = [];
      for (const t of r.keep) {
        const id = j.used.find(
          (id) =>
            !keep.includes(id) &&
            (t === "villager"
              ? PERSON(this.card(id).type)
              : this.card(id).type === t),
        );
        if (id) keep.push(id);
      }
      for (const id of j.used) if (!keep.includes(id)) this.remove(id);
      outputs = r.outputs;
      label = r.label + "完成";
      for (const t of outputs) this.made[t] = (this.made[t] || 0) + 1;
      if (r.id === "lightBeacon") {
        this.lit = true;
        label = "信标亮起！武装队伍，迎战风暴兽。";
      }
      if (r.once) this.flags[r.once] = true;
      if (r.heat) this.heat = Math.min(100, this.heat + r.heat);
      if (r.id === "sailWreck" && ++this.voyages % 2 === 0) {
        outputs = [...outputs, "raider"];
        label += "，沉船守卫追上了岸";
      }
      if (r.id === "relay") outputs = [...outputs, "relayGuard"];
      if (r.id === "gatherOre" && this.random() < 0.15)
        outputs = [...outputs, "raider"];
    }
    const outputIds = this.give(outputs);
    this.note(label);
    this.emit("produce", {
      stackId: j.stackId,
      outputs: outputIds,
      recipeId: j.recipeId,
      products: outputs,
    });
    this.quests();
    if (j.recipeId.startsWith("gather") && this.stack(j.stackId))
      this.start(j.stackId, j.recipeId);
  }
  fight(j) {
    const fighters = j.used
        .map((id) => this.card(id))
        .filter((c) => c && PERSON(c.type)),
      enemy = j.used
        .map((id) => this.card(id))
        .find((c) => c && CARD[c.type].kind === "enemy");
    if (!fighters.length || !enemy) {
      this.jobs = this.jobs.filter((x) => x !== j);
      return;
    }
    j.round = (j.round || 0) + 1;
    const armed = (t) => fighters.some((c) => c.weapon === t);
    let hit = fighters.reduce(
      (n, c) => n + CARD[c.type].atk + (CARD[c.weapon]?.weapon || 0),
      0,
    );
    if (enemy.type === "reefGuardian" && !armed("harpoon"))
      hit = Math.max(1, hit - 2);
    const heavy =
      (enemy.type === "reefGuardian" && j.round % 3 === 0) ||
      (enemy.type === "frostSentinel" && j.round % 2 === 0);
    const atk = heavy
      ? enemy.type === "reefGuardian"
        ? 6
        : 8
      : CARD[enemy.type].atk;
    enemy.hp -= hit;
    const coldGuard =
      enemy.type === "frostSentinel" && fighters[0].warm ? 2 : 0;
    fighters[0].hp -= Math.max(
      1,
      atk - (fighters[0].armor ? 1 : 0) - coldGuard,
    );
    if (
      enemy.hp > 0 &&
      enemy.type === "frostSentinel" &&
      j.round % 2 === 1 &&
      !armed("thunderBlade")
    )
      enemy.hp = Math.min(CARD[enemy.type].hp, enemy.hp + 4);
    if (
      enemy.hp > 0 &&
      ((enemy.type === "reefGuardian" && j.round % 3 === 2) ||
        (enemy.type === "frostSentinel" && j.round % 2 === 1))
    )
      this.note(
        CARD[enemy.type].name + "正在蓄力！下一击将是重击，可撤退重整。",
      );
    this.emit("hit", { stackId: j.stackId, damage: hit });
    for (const c of fighters)
      if (c.hp <= 0) {
        this.remove(c.id);
        this.note("一名" + CARD[c.type].name + "倒下了。");
      }
    if (enemy.hp <= 0) {
      const bossChapter = { stormBeast: 1, reefGuardian: 2, frostSentinel: 3 }[
        enemy.type
      ];
      const boss = !!bossChapter;
      this.defeated[enemy.type] = (this.defeated[enemy.type] || 0) + 1;
      if (enemy.type === "relayGuard") this.give(["dawnHeart"]);
      this.remove(enemy.id);
      this.jobs = this.jobs.filter((x) => x !== j);
      this.coins += boss ? 20 : 4;
      this.note(
        boss ? CHAPTERS[bossChapter].ending : "战斗胜利，找到4枚古币。",
      );
      if (boss && bossChapter === this.chapter && this.people().length) {
        this.won = true;
        if (!this.clearedChapters.includes(this.chapter))
          this.clearedChapters.push(this.chapter);
        this.chapterCleared = true;
        this.paused = true;
      }
      this.emit(boss ? "victory" : "reward", {});
    } else {
      j.used = j.used.filter((id) => this.card(id));
      if (!j.used.some((id) => PERSON(this.card(id).type)))
        this.jobs = this.jobs.filter((x) => x !== j);
      else j.remaining = j.duration;
    }
    this.checkFailure();
  }
  feed() {
    let available = this.pantry;
    this.pantry = 0;
    const used = this.reserved(),
      foods = this.cards
        .filter((c) => CARD[c.type].food && !used.has(c.id))
        .sort((a, b) => CARD[a.type].food - CARD[b.type].food);
    let hungry = 0;
    for (const p of this.people()) {
      while (available < 2 && foods.length) {
        const c = foods.shift();
        available += CARD[c.type].food;
        this.remove(c.id);
      }
      if (available >= 2) {
        available -= 2;
        p.hunger = 0;
      } else {
        p.hunger++;
        hungry++;
        if (p.hunger >= 2) {
          for (const j of [...this.jobs])
            if (j.used.includes(p.id)) this.cancel(j.stackId);
          this.remove(p.id);
          this.note("连续两晚缺粮，一名居民离开了。");
        }
      }
    }
    this.pantry = available;
    if (this.chapter >= 3) {
      if ((this.chapter > 3 || this.heat >= 25) && this.count("greenhouse")) {
        this.give(Array(this.count("greenhouse") * 2).fill("vegetable"));
        this.note("温室迎来收获，蔬菜已送至桌面。");
      }
      if (this.chapter === 3 && this.heat < 25)
        for (const p of this.people())
          if (!p.warm) p.hp = Math.max(1, p.hp - 2);
    }
    this.day++;
    this.emit("night", { hungry });
    this.note(
      hungry
        ? `夜间供养：${hungry}人未吃饱，请优先采果或种菜。`
        : "供养完成，新的一天开始了。",
    );
    if (this.day === 4) this.note("第6天将有风暴，仓棚能保护采集效率。");
    if (this.day === 6) this.note("风暴来了！没有仓棚时采集耗时增加30%。");
    this.checkFailure();
  }
  checkFailure() {
    if (!this.people().length) {
      this.failed = true;
      this.paused = true;
      this.emit("failure", {});
    }
  }
  tick(dt) {
    if (
      this.frontier.run ||
      this.paused ||
      this.failed ||
      this.chapterCleared ||
      !Number.isFinite(dt) ||
      dt <= 0
    )
      return;
    let remaining = dt;
    while (remaining > 1e-8 && !this.failed && !this.chapterCleared) {
      const step = Math.min(remaining, 0.25, 90 - this.clock);
      if (this.chapter === 3 && !this.clearedChapters.includes(3))
        this.heat = Math.max(
          0,
          this.heat - step * (this.count("boiler") ? 0.1 : 0.18),
        );
      for (const j of this.jobs) {
        if (j.waitTide) {
          if (this.tide().phase !== j.waitTide) continue;
          delete j.waitTide;
          this.note("潮汐已到，船队自动出航。");
        }
        j.remaining -= step;
      }
      for (const j of [...this.jobs])
        if (j.remaining <= 1e-8 && this.jobs.includes(j)) this.finish(j);
      this.clock += step;
      this.elapsed += step;
      remaining -= step;
      if (this.clock >= 90 - 1e-8) {
        this.clock = 0;
        this.feed();
      }
    }
  }
  quests() {
    const goals = [
      [
        "berries",
        () => this.made.berry,
        "第一份收获",
        () => {
          this.coins += 4;
        },
      ],
      [
        "fire",
        () => this.count("campfire"),
        "温暖的营地",
        () => {
          this.give(["ruins", "fiber"]);
          this.coins += 4;
        },
      ],
      [
        "garden",
        () => this.count("garden"),
        "土地的回报",
        () => {
          this.give(["mushroom", "mushroom"]);
        },
      ],
      [
        "meal",
        () => this.made.stew,
        "一锅热饭",
        () => {
          this.coins += 6;
        },
      ],
      [
        "people",
        () => this.people().length >= 2,
        "有人同行",
        () => {
          this.coins += 4;
        },
      ],
      [
        "guard",
        () => this.made.guard,
        "守护聚落",
        () => {
          this.give(["beast"]);
        },
      ],
      [
        "iron",
        () => this.made.iron,
        "炉火与钢铁",
        () => {
          this.give(["clay", "clay"]);
        },
      ],
      [
        "beacon",
        () => this.count("beacon"),
        "远方的灯",
        () => {
          this.note("准备好守卫与护甲，再用两份炭点亮信标。");
        },
      ],
    ];
    for (const [id, test, label, reward] of goals)
      if (!this.completed.includes(id) && test()) {
        this.completed.push(id);
        reward();
        this.note("里程碑：" + label);
        this.emit("quest", { label });
      }
  }
  objective() {
    if (this.chapter > 1) return this.expansionObjective();
    let a;
    if (this.won)
      a = [
        "首章完成 · 风暴后的来信",
        "海岸来客已抵达。打开章节旅程，进入第二章，保留全部聚落进度。",
        null,
      ];
    else if (!this.completed.includes("berries"))
      a = [
        "采集第一份野果",
        "把居民拖到灌木上。居民会持续采集，拖走即可换工作。",
        "gatherBerry",
      ];
    else if (!this.count("campfire"))
      a = [
        "建起第一处篝火",
        "居民 + 木材×2 + 石块。木材和石块分别从林地、石堆采集。",
        "campfire",
      ];
    else if (!this.explored)
      a = [
        "探索废墟",
        "居民 + 废墟。首次必得黏土与旧矿洞，没有敌人。",
        "explore:ruins",
      ];
    else if (!this.count("garden"))
      a = [
        "让食物长出来",
        "居民 + 木材×2 + 黏土×2 → 菜圃。再放入种子。",
        "garden",
      ];
    else if (!this.made.stew)
      a = [
        "煮出第一锅炖菜",
        "菜圃 + 种子 → 蔬菜；篝火 + 蔬菜×2 + 菌菇 → 炖菜。",
        "stewVeg",
      ];
    else if (this.people().length < 2)
      a = [
        "招募第二位同伴",
        "建棚屋增加床位。备足4食物，出售余料攒10币，打开行旅补给。",
        "hut",
      ];
    else if (!this.made.guard)
      a = [
        "给居民装备长矛",
        "居民 + 木材×2 + 石块 → 长矛，再叠到居民上。",
        "spear",
      ];
    else if (!this.count("bench"))
      a = [
        "搭建木工台",
        "居民 + 木材×3 + 石块×2。为工匠准备加工工具。",
        "bench",
      ];
    else if (!this.people().some((c) => c.type === "artisan"))
      a = [
        "培养一名工匠",
        "木工台 + 居民 + 木材×2 → 木板。居民 + 木板 + 石块 → 工具箱。",
        "toolbox",
      ];
    else if (!this.count("kiln"))
      a = [
        "建窑炉，烧砖和炭",
        "居民 + 石块×3 + 黏土×2。黏土来自废墟或荒野补给。",
        "kiln",
      ];
    else if (!this.count("furnace"))
      a = [
        "建造熔炉",
        "窑炉 + 黏土×2 → 砖。居民 + 石块×3 + 砖×2 → 熔炉。",
        "furnace",
      ];
    else if (!this.made.iron)
      a = ["炼出第一块铁锭", "矿洞产铁矿。熔炉 + 铁矿×2 + 炭 → 铁锭。", "iron"];
    else if (!this.count("beacon"))
      a = [
        "建造求援信标",
        "工匠 + 砖×3 + 齿轮×2 + 木板×3。工匠 + 木工台 + 铁锭 → 齿轮。",
        "beacon",
      ];
    else
      a = [
        this.lit ? "击退风暴兽" : "准备好，再点亮信标",
        this.lit
          ? "把武装居民组成一堆，拖到风暴兽上。可暂停或撤退。"
          : "两名守卫、护甲和足够食物更稳妥。居民 + 信标 + 炭×2。",
        "lightBeacon",
      ];
    return { title: a[0], detail: a[1], recipe: a[2] };
  }
  expansionObjective() {
    if (this.chapter === 4)
      return {
        title: this.clearedChapters.includes(4)
          ? "四章完成 · 灯路重连"
          : this.frontier.run
            ? "继续远征 · " +
              {
                map: "选择路线",
                event: "处理事件",
                battle: "战术交锋",
                reward: "选择遗物",
                summary: "队伍归营",
              }[this.frontier.run.stage]
            : this.frontier.seals.length < 3
              ? `灯路联盟 · 取得盟约 ${this.frontier.seals.length}/3`
              : "终章 · 进入风暴之眼",
        detail:
          "点击组队远征。选路、预判敌人意图、培养居民专长；取得三方盟约后挑战风暴之眼。",
        recipe: null,
      };
    let a;
    if (this.clearedChapters.includes(this.chapter))
      a = [
        this.chapter === 3
          ? "黎明归来 · 远征群岛已解锁"
          : "雾海通航 · 前往北方",
        this.chapter === 3
          ? "打开章节旅程，启程第四章；居民与装备全部保留。"
          : "打开章节旅程，沿北方来信进入长夜观测站。",
        null,
      ];
    else if (this.chapter === 2) {
      if (!this.made.fish)
        a = [
          "海岸的第一网鱼",
          "居民 + 芦苇海岸，持续带回鲜鱼与芦苇。",
          "gatherCoast",
        ];
      else if (!this.count("boat"))
        a = ["造一艘自己的船", "把芦苇编成绳索，再用木板与绳索造船。", "boat"];
      else if (!this.count("dock"))
        a = ["建起码头，找到航线", "码头会同时解锁沉船航线。", "dock"];
      else if (!this.made.smokedFish)
        a = [
          "准备远航口粮",
          "海岸 + 篝火 + 木材煮盐；再把鲜鱼加工成熏鱼。",
          "smokedFish",
        ];
      else if (!this.count("compass"))
        a = [
          "拼合两张航图",
          "涨潮：居民 + 帆船 + 沉船航线 + 熏鱼；每趟必得1张航图。凑齐2张制作罗盘。",
          "compass",
        ];
      else if (
        !this.people().some((p) => p.weapon === "harpoon") &&
        !this.count("harpoon")
      )
        a = [
          "浅滩采珠，打造鱼叉",
          "落潮从码头出航必得月光珠，用它打造可破甲的武器。",
          "harpoon",
        ];
      else if (!this.count("lighthouse"))
        a = [
          "修复雾海灯塔",
          "罗盘保留，月光珠可从落潮航线稳定获取。",
          "lighthouse",
        ];
      else
        a = [
          this.flags.reefAwake ? "击败礁岩守卫" : "整备队伍，鸣响海钟",
          "建议3名满生命守卫、护甲与鱼叉。敌人每第3击发动巨浪。",
          "awakenReef",
        ];
    } else {
      if (this.heat < 25)
        a = [
          "先恢复聚落供暖",
          "供暖低于25：未穿斗篷的居民工作变慢，夜间受到2冻伤。添煤或篝火应急取暖。",
          this.count("boiler") ? "stoke" : "campHeat",
        ];
      else if (!this.count("boiler"))
        a = [
          "把温暖留在聚落",
          "锅炉降低热量流失；添煤提高供暖，同时产出蒸汽芯。",
          "boiler",
        ];
      else if (!this.made.steamCell)
        a = ["为锅炉添煤", "两份炭带来50供暖和1枚蒸汽芯。", "stoke"];
      else if (!this.count("greenhouse"))
        a = [
          "让温室度过寒夜",
          "采掘冰晶、打磨聚光镜。供暖足够时温室每天自动产菜。",
          "greenhouse",
        ];
      else if (this.count("relay") < 3)
        a = [
          "校准中继器 " + this.count("relay") + "/3",
          "每座中继器唤醒一名守卫；击败它必得1枚晨曦之心。",
          "relay",
        ];
      else if ((this.defeated.relayGuard || 0) < 3)
        a = [
          "回收三枚晨曦之心",
          "找到桌面的中继守卫，逐一迎战。草药膏可以在战前回满生命。",
          null,
        ];
      else if (!this.count("sunEngine"))
        a = [
          "重启晨曦引擎",
          "三枚晨曦之心和三座中继器，让观测站重新运转。",
          "sunEngine",
        ];
      else
        a = [
          this.flags.frostAwake ? "守住黎明" : "供暖充足，点燃核心",
          "供暖至少50；雷鸣刃阻止回血，御寒斗篷减免首领2点寒霜伤害。建议3名满血守卫携刃，前排同时装备护甲和斗篷。",
          "awakenFrost",
        ];
    }
    return { title: a[0], detail: a[1], recipe: a[2] };
  }
  sell(stackId, cardId) {
    const s = this.stack(stackId);
    if (!s || this.busy(stackId)) return false;
    const id = cardId || s.cards.at(-1);
    if (!s.cards.includes(id)) return false;
    const c = this.card(id);
    if (
      !CARD[c.type].sell ||
      ["person", "site", "building", "enemy"].includes(CARD[c.type].kind)
    )
      return false;
    this.coins += CARD[c.type].sell;
    this.remove(id);
    this.emit("sell", {});
    return true;
  }
  packStatus(kind) {
    const p = PACKS[kind];
    if (!p) return "未知补给";
    if ((p.chapter || 1) > this.chapter) return "第" + p.chapter + "章解锁";
    if (kind === "farm" && !this.count("campfire")) return "先建篝火";
    if (kind === "ruin" && !this.explored) return "先探索废墟";
    if (kind === "travel") {
      if (this.people().length >= this.beds())
        return `需要空余床位（本章最多${2 + this.chapter * 2}人）`;
      if (this.foodValue() < 2 * (this.people().length + 1))
        return "先备足新增人口的当晚粮食";
      if (this.travelDay === this.day) return "今天已招募，明天再来";
    }
    if (this.coins < p.cost) return "游戏币不足，出售余料可获得";
    return "";
  }
  buy(kind) {
    if (this.packStatus(kind)) return null;
    const p = PACKS[kind];
    this.coins -= p.cost;
    if (kind === "travel") this.travelDay = this.day;
    const out = [...p.fixed];
    if (p.pool.length)
      out.push(p.pool[Math.floor(this.random() * p.pool.length)]);
    const ids = out.map((t) => this.add([t]).id);
    this.note("打开" + p.name + "：" + out.map((t) => CARD[t].name).join("、"));
    this.emit("pack", { kind });
    this.quests();
    return { types: out, ids };
  }
  arrange(columns = 6) {
    columns = Math.max(2, Math.min(6, Math.floor(columns)));
    let i = 0;
    for (const s of this.stacks) {
      s.x = 76 + (i % columns) * 138;
      s.y = 70 + Math.floor(i / columns) * 175;
      i++;
    }
    this.emit("arrange", {});
  }
  save() {
    const { events, ...data } = this;
    return JSON.stringify(data);
  }
  static load(raw) {
    const d = JSON.parse(raw);
    if (
      ![2, 3, 4].includes(d.version) ||
      !Array.isArray(d.cards) ||
      !Array.isArray(d.stacks) ||
      !Array.isArray(d.jobs)
    )
      throw Error("存档版本或结构不受支持");
    if (d.version === 2)
      Object.assign(d, {
        version: 3,
        chapter: 1,
        clearedChapters: d.won ? [1] : [],
        chapterStart: 0,
        heat: 70,
        flags: {},
        voyages: 0,
        defeated: {},
      });
    if (d.version === 3) {
      d.version = 4;
      d.frontier = freshFrontier();
    }
    const g = Object.assign(Object.create(Game.prototype), d);
    g.events = [];
    g.paused = true;
    g.assert();
    return g;
  }
  assert() {
    if (
      ![1, 2, 3, 4].includes(this.chapter) ||
      !Array.isArray(this.clearedChapters) ||
      this.clearedChapters.some(
        (n) => ![1, 2, 3, 4].includes(n) || n > this.chapter,
      ) ||
      new Set(this.clearedChapters).size !== this.clearedChapters.length ||
      !Number.isFinite(this.heat) ||
      this.heat < 0 ||
      this.heat > 100 ||
      !Number.isFinite(this.chapterStart) ||
      this.chapterStart > this.elapsed ||
      !this.flags ||
      !this.defeated
    )
      throw Error("章节存档异常");
    if (
      !Number.isFinite(this.elapsed) ||
      this.elapsed < 0 ||
      !Number.isFinite(this.chapterStart) ||
      this.chapterStart < 0 ||
      !Number.isInteger(this.voyages) ||
      this.voyages < 0 ||
      (this.chapter > 1 && !this.clearedChapters.includes(1)) ||
      (this.chapter > 2 && !this.clearedChapters.includes(2)) ||
      (this.chapter > 3 && !this.clearedChapters.includes(3))
    )
      throw Error("章节时间或进度异常");
    if (this.people().some((p) => p.weapon && !CARD[p.weapon]?.weapon))
      throw Error("未知武器");
    const ids = this.cards.map((c) => c.id);
    if (new Set(ids).size !== ids.length) throw Error("卡牌ID重复");
    if (this.cards.some((c) => !CARD[c.type] || !Number.isFinite(c.hp)))
      throw Error("非法卡牌");
    const sid = this.stacks.map((s) => s.id),
      refs = this.stacks.flatMap((s) => s.cards);
    if (
      new Set(sid).size !== sid.length ||
      refs.length !== ids.length ||
      new Set(refs).size !== refs.length ||
      refs.some((id) => !ids.includes(id))
    )
      throw Error("卡堆引用不一致");
    if (this.stacks.some((s) => !Number.isFinite(s.x) || !Number.isFinite(s.y)))
      throw Error("非法位置");
    const reserved = this.jobs.flatMap((j) => j.used);
    if (new Set(reserved).size !== reserved.length) throw Error("资源重复占用");
    for (const j of this.jobs) {
      const s = this.stack(j.stackId);
      if (
        !s ||
        j.used.some((id) => !s.cards.includes(id)) ||
        !Number.isFinite(j.remaining)
      )
        throw Error("工作引用失效");
    }
    if (
      !Number.isFinite(this.coins) ||
      this.coins < 0 ||
      !Number.isFinite(this.clock) ||
      this.clock < 0 ||
      this.clock >= 90 ||
      !Number.isSafeInteger(this.nextId) ||
      this.nextId <=
        Math.max(0, ...ids.concat(sid).map((id) => Number(id.slice(1))))
    )
      throw Error("存档数值异常");
    assertFrontier(this);
    return true;
  }
  frontierAction(action, args) {
    return frontierAction(this, action, args);
  }
}
