import { CHAPTERS } from "./game-data.js";
export function chapterPanels(g, { open, head, art, checkpoint }) {
  return {
    journey() {
      open(
        "journey",
        head("山野与远方") +
          `<p class="muted">同一座聚落，四段旅程。居民、建筑、物资和图鉴全部保留。</p><div class="journey-list">${Object.entries(
            CHAPTERS,
          )
            .map(
              ([n, c]) =>
                `<div class="chapter-panel ${Number(n) === g.chapter ? "current" : ""}"><div class="chapter-art">${art(c.icon)}</div><div><small>第${n}章 · ${g.clearedChapters.includes(Number(n)) ? "已完成" : Number(n) === g.chapter ? "正在进行" : "未启程"}</small><h3>${c.name}</h3><p>${c.intro}</p></div></div>`,
            )
            .join(
              "",
            )}</div>${g.canAdvance() ? `<button class="primary full" data-action="nextChapter">启程 · 第${g.chapter + 1}章 ${CHAPTERS[g.chapter + 1].name}</button>` : '<p class="help-line">' + g.objective().detail + "</p>"}${g.chapterCleared ? '<button class="primary full" data-action="endless">继续自由经营</button>' : ""}<button class="secondary full" data-action="close">留在当前聚落</button>`,
      );
    },
    intro() {
      open(
        "chapterIntro",
        head(`第${g.chapter}章 · ${CHAPTERS[g.chapter].name}`) +
          `<div class="detail-art">${art(CHAPTERS[g.chapter].icon)}</div><p>${CHAPTERS[g.chapter].intro}</p><p class="help-line">${g.chapter === 4 ? "组队远征不推进聚落时间。每回合2行动点；敌人的下一招会提前显示。取得三份盟约，再挑战风暴之眼。原有温室继续产菜。" : g.chapter === 2 ? "先把居民拖到芦苇海岸。每30秒换潮；出发时决定航线，途中涨落不影响收获。人口上限提高到6人。" : "先建锅炉或使用篝火应急取暖。供暖低于25会减速和冻伤，温室也会停产。人口上限提高到8人。"}</p><p class="muted">来客留下12古币和每人一份炖菜。已有物资与工作全部保留，章初进度可用于重试。</p><button class="primary full" data-action="beginChapter">开始这一章</button>${g.chapter === 4 ? "" : '<button class="secondary full" data-action="chapterRecipes">查看新增配方</button>'}`,
      );
    },
    environment() {
      open(
        "environment",
        head(g.chapter === 2 ? "潮汐与航路" : "守住温暖") +
          (g.chapter === 2
            ? `<p class="help-line">每30秒涨落潮交替。落潮去浅滩采珠，涨潮去沉船找航图。只在出发时检查潮水；每次消耗一份熏鱼，取消工作会保留投入。</p><p class="muted">浅滩：固定月光珠×1、盐×2；沉船：固定航图×1、铁矿×2，每第2次出现掠夺者。罗盘需要两张航图。</p><button class="primary full" data-action="recipe" data-recipe="${g.tide().phase === "low" ? "sailShoal" : "sailWreck"}">查看当前可出发的航线</button>`
            : `<p class="help-line">当前供暖 ${Math.ceil(g.heat)}/100。未建锅炉每秒流失0.18；建成后每秒0.1。低于25时，未穿斗篷居民工作耗时×1.5、夜间损失2生命（不会冻死）。</p><p class="muted">温室在供暖≥25的黎明产出2蔬菜。添煤提供50供暖和蒸汽芯；篝火取暖提供20供暖和炭。暂停时不损失热量。</p><button class="primary full" data-action="recipe" data-recipe="${g.count("boiler") ? "stoke" : "campHeat"}">查看取暖配方</button>`) +
          `<button class="secondary full" data-action="close">回到聚落</button>`,
      );
    },
    ending() {
      open(
        "ending",
        `<div class="welcome"><div class="eyebrow">${g.failed ? "A NEW BEGINNING" : `CHAPTER ${g.chapter} · COMPLETE`}</div><h2 style="font-size:28px;letter-spacing:2px">${g.failed ? "聚落暂时沉寂" : CHAPTERS[g.chapter].name}</h2><div class="detail-art">${art(g.failed ? "campfire" : CHAPTERS[g.chapter].icon)}</div><p>${g.failed ? "最后一位居民离开了。可以从本章启程时重新尝试，或开启新的聚落。" : CHAPTERS[g.chapter].ending}</p><div class="endstats"><div><b>${g.day}</b><small>生存天数</small></div><div><b>${g.discovered.length}</b><small>发现卡牌</small></div><div><b>${Math.ceil(g.elapsed / 60)}</b><small>聚落分钟</small></div></div>${g.canAdvance() ? `<button class="primary full" data-action="nextChapter">启程 · 第${g.chapter + 1}章 ${CHAPTERS[g.chapter + 1].name}</button>` : ""}${g.failed ? (checkpoint ? '<button class="primary full" data-action="retryChapter">从本章启程时重试</button>' : "") : '<button class="secondary full" data-action="endless">继续自由经营</button>'}<button class="secondary full" data-action="reset">免费开启新的旅程</button><p class="muted">图鉴保留，无需观看广告。</p></div>`,
      );
    },
  };
}
