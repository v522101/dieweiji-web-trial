export const SPECIALTIES = {
  vanguard: {
    name: "守望者",
    icon: "⬡",
    text: "格挡额外+3护盾（3级+5）；专长技护盾+10（3级+12）并反击4。",
  },
  scout: {
    name: "寻路者",
    icon: "⌁",
    text: "出发多带1补给，解锁隐秘小径；专长技标记弱点，让后两次伤害+4（3级后+6）。",
  },
  medic: {
    name: "行医者",
    icon: "✚",
    text: "休整额外恢复2生命；专长技为存活队员恢复3生命，3级提升至4。",
  },
};
export const CAMP_UPGRADES = {
  lookout: {
    name: "瞭望帐篷",
    cost: 3,
    text: "提前看见下一段的两条路线与事件类型。",
  },
  infirmary: {
    name: "野战医所",
    cost: 4,
    text: "每次出发恢复队员4生命，途中休整再多恢复2。",
  },
  logistics: {
    name: "轻装驮架",
    cost: 4,
    text: "每次远征增加2补给，允许更多绕路和休整。",
  },
};
export const RELICS = {
  wind: { name: "风行纹章", text: "每场战斗第一次普通攻击额外+4伤害。" },
  grove: { name: "共生纹章", text: "每完成一处非战斗事件，全队恢复1生命。" },
  barrier: { name: "壁垒晶片", text: "每回合开始获得2点公共护盾。" },
  capacitor: { name: "蓄能线圈", text: "职业技冷却缩短1回合（最少1回合）。" },
  thorns: { name: "反击徽记", text: "每次格挡同时反击敌人3点伤害。" },
  renewal: {
    name: "疗愈徽记",
    text: "每场战斗第3、6、9…回合，存活队员恢复3生命。",
  },
};
export const ENEMIES = {
  prowler: {
    name: "苔角猎兽",
    art: "beast",
    hp: 24,
    pattern: [
      ["strike", 5],
      ["charge", 9],
      ["cleave", 3],
    ],
  },
  raiders: {
    name: "断桥巡哨",
    art: "raider",
    hp: 30,
    pattern: [
      ["strike", 6],
      ["cleave", 3],
      ["charge", 10],
    ],
  },
  sentinel: {
    name: "遗迹浮卫",
    art: "relayGuard",
    hp: 34,
    pattern: [
      ["shield", 5],
      ["charge", 11],
      ["strike", 6],
      ["cleave", 4],
    ],
  },
  groveBoss: {
    name: "盘根守望者",
    art: "reefGuardian",
    hp: 40,
    pattern: [
      ["strike", 6],
      ["charge", 10],
      ["cleave", 3],
    ],
  },
  ruinBoss: {
    name: "折光执事",
    art: "relayGuard",
    hp: 52,
    pattern: [
      ["shield", 12],
      ["charge", 12],
      ["cleave", 4],
      ["strike", 7],
    ],
  },
  cliffBoss: {
    name: "风崖统领",
    art: "raider",
    hp: 60,
    pattern: [
      ["strike", 7],
      ["charge", 13],
      ["cleave", 4],
      ["shield", 5],
    ],
  },
  finalBoss: {
    name: "风暴之眼",
    art: "frostSentinel",
    hp: 84,
    storm: true,
    pattern: [
      ["charge", 14],
      ["cleave", 5],
      ["shield", 8],
      ["strike", 8],
    ],
  },
};
const event = (name, icon, text, choices) => ({ name, icon, text, choices });
export const NODES = {
  ford: event("涨水溪谷", "≋", "近路被溪水截断。绕行更安全，但会吃掉路粮。", [
    {
      id: "detour",
      label: "走上游石桥",
      hint: "额外补给−1，士气+1",
      supply: -1,
      morale: 1,
    },
    {
      id: "wade",
      label: "结绳涉水",
      hint: "全队失去2生命，勋章+1",
      hurt: 2,
      marks: 1,
    },
    {
      id: "track",
      label: "寻路者找到浅滩",
      hint: "无额外消耗，勋章+1",
      need: "scout",
      marks: 1,
    },
  ]),
  refuge: event(
    "林中求救",
    "✦",
    "两个迷路的孩子躲在树洞里。你们要决定如何把他们带出危险地带。",
    [
      {
        id: "escort",
        label: "分出路粮护送",
        hint: "补给−1，勋章+2，士气+1",
        supply: -1,
        marks: 2,
        morale: 1,
      },
      {
        id: "signal",
        label: "工匠架设引路灯",
        hint: "需要工匠；勋章+2，额外经验+1",
        role: "artisan",
        marks: 2,
        xp: 1,
      },
      {
        id: "guide",
        label: "留下安全路标",
        hint: "士气+1，勋章+1",
        morale: 1,
        marks: 1,
      },
    ],
  ),
  maze: event(
    "会移动的荆棘",
    "⌁",
    "风吹过时，林道的出口就会移动。耐心观察或冒险冲出去？",
    [
      {
        id: "observe",
        label: "留下一份路粮，观察风向",
        hint: "补给−1，全队恢复2生命",
        supply: -1,
        heal: 2,
      },
      {
        id: "cut",
        label: "开路突围",
        hint: "全队失去2生命，额外经验+2",
        hurt: 2,
        xp: 2,
      },
      {
        id: "scout",
        label: "追踪落叶的轨迹",
        hint: "需要寻路者；补给+1，经验+1",
        need: "scout",
        supply: 1,
        xp: 1,
      },
    ],
  ),
  cache: event(
    "旧商队补给",
    "▣",
    "木箱里装着一批尚能使用的物资。带走补给，还是带走能修缮营地的工具？",
    [
      { id: "food", label: "带走路粮", hint: "补给+3", supply: 3 },
      { id: "tools", label: "回收营地工具", hint: "勋章+2", marks: 2 },
    ],
  ),
  camp: event(
    "避风营火",
    "♨",
    "旅人在火边留下热汤。今晚的故事能让疲惫的队伍重新振作。",
    [
      {
        id: "rest",
        label: "围炉休息",
        hint: "全队恢复4生命，士气+1",
        heal: 4,
        morale: 1,
      },
      {
        id: "learn",
        label: "交换沿途见闻",
        hint: "额外经验+2，补给+1",
        xp: 2,
        supply: 1,
      },
    ],
  ),
  bridge: event(
    "断裂的吊桥",
    "⌂",
    "几根绳索仍在风里摆荡。旧职业在这里有了新的用途。",
    [
      {
        id: "repair",
        label: "工匠修好受力点",
        hint: "需要工匠；勋章+2，士气+1",
        role: "artisan",
        marks: 2,
        morale: 1,
      },
      {
        id: "detour",
        label: "沿山壁绕行",
        hint: "补给−2，无人受伤",
        supply: -2,
      },
      {
        id: "climb",
        label: "冒险攀过断口",
        hint: "全队失去3生命，勋章+1",
        hurt: 3,
        marks: 1,
      },
    ],
  ),
  console: event(
    "仍在运转的控制台",
    "⚙",
    "失控屏障挡住出口。读懂它的工作方式，会让下一场战斗更轻松。",
    [
      {
        id: "tune",
        label: "工匠改写脉冲",
        hint: "需要工匠；本次远征每场开局护盾+4，经验+1",
        role: "artisan",
        aegis: 4,
        xp: 1,
      },
      {
        id: "short",
        label: "强行切断电流",
        hint: "全队失去2生命，开局护盾+3",
        hurt: 2,
        aegis: 3,
      },
      {
        id: "wait",
        label: "等待屏障间歇",
        hint: "补给−1，士气+1",
        supply: -1,
        morale: 1,
      },
    ],
  ),
  archive: event(
    "无名者的日记",
    "▤",
    "石柜里记录着早期远征队留下的经验。你可以把知识留给队员，也可以带回营地。",
    [
      { id: "study", label: "全队一起研读", hint: "额外经验+3", xp: 3 },
      { id: "recover", label: "整理并带回营地", hint: "勋章+3", marks: 3 },
    ],
  ),
  storm: event(
    "横穿风眼",
    "ϟ",
    "雷光揭示了两条路：更短的一条危险，更稳的一条耗费口粮。",
    [
      {
        id: "shelter",
        label: "逐个掩体前进",
        hint: "补给−1，士气+1",
        supply: -1,
        morale: 1,
      },
      {
        id: "rush",
        label: "全队快速突进",
        hint: "全队失去3生命，勋章+2",
        hurt: 3,
        marks: 2,
      },
      {
        id: "track",
        label: "寻路者带队避雷",
        hint: "需要寻路者；勋章+1",
        need: "scout",
        marks: 1,
      },
    ],
  ),
  shrine: event("旅人的约定", "◇", "一块石碑上刻着：把能带走的留给后来者。", [
    {
      id: "offer",
      label: "留下两份补给",
      hint: "补给−2，全队恢复5生命，士气+2",
      supply: -2,
      heal: 5,
      morale: 2,
    },
    {
      id: "salute",
      label: "向先行者致意",
      hint: "额外经验+1，士气+1",
      xp: 1,
      morale: 1,
    },
  ]),
  ambush: { name: "苔原伏击", icon: "⚔", battle: "prowler" },
  patrol: { name: "巡逻哨线", icon: "⚔", battle: "raiders" },
  automaton: { name: "失控浮卫", icon: "⚙", battle: "sentinel" },
};
export const REGIONS = {
  grove: {
    name: "回声林地",
    tag: "救援与取舍",
    color: "#77936b",
    art: "forest",
    text: "找回迷失的旅人，让林地同意加入灯路联盟。",
    boss: "groveBoss",
    routes: [
      ["ford", "ambush"],
      ["refuge", "maze"],
      ["camp", "cache"],
      ["archive", "ambush"],
    ],
    relics: ["wind", "grove"],
  },
  ruins: {
    name: "悬空遗址",
    tag: "机巧与干扰",
    color: "#7496a4",
    art: "archive",
    text: "理解遗迹的脉冲，争取天空工匠的支持。",
    boss: "ruinBoss",
    routes: [
      ["bridge", "automaton"],
      ["console", "patrol"],
      ["camp", "archive"],
      ["console", "cache"],
    ],
    relics: ["barrier", "capacitor"],
  },
  cliffs: {
    name: "赤风断崖",
    tag: "护送与防守",
    color: "#b68164",
    art: "boat",
    text: "打通被封锁的风道，让商队重新通航。",
    boss: "cliffBoss",
    routes: [
      ["bridge", "patrol"],
      ["storm", "ambush"],
      ["camp", "shrine"],
      ["patrol", "cache"],
    ],
    relics: ["thorns", "renewal"],
  },
  eye: {
    name: "风暴之眼",
    tag: "终章 · 灯路重连",
    color: "#8c7ca6",
    art: "sunEngine",
    text: "带着三方盟约进入风眼。预判重击、打断蓄力，让最后一盏航灯重燃。",
    boss: "finalBoss",
    routes: [
      ["storm", "cache"],
      ["console", "automaton"],
      ["camp", "shrine"],
      ["bridge", "archive"],
    ],
    final: true,
  },
};
