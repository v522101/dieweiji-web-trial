// Original vector illustrations drawn for this project. No external image dependencies.
const line =
  'stroke="#35473c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
const leaf = (x, y, c = "#6c9858") =>
  `<path d="M${x} ${y}q-18-25-26-11q-4 17 26 11q11-26 24-17q8 14-24 17" fill="${c}"/>`;
const tree = (x, y, z = 1) =>
  `<g transform="translate(${x} ${y}) scale(${z})"><path d="M0 35V0" stroke="#73513b" stroke-width="7"/><path d="M-24 12L0-24L24 12H13L30 28H-30L-13 12Z" fill="#4c7c59" ${line}/><path d="M-8 11L0-7L8 11" fill="none" stroke="#89ae76" stroke-width="3"/></g>`;
const wood = `<path d="M21 43L71 20L94 39L44 67Z" fill="#a97449" ${line}/><ellipse cx="36" cy="59" rx="17" ry="13" fill="#e7bd80" ${line}/><ellipse cx="36" cy="59" rx="8" ry="6" fill="none" stroke="#a97449" stroke-width="2"/><path d="M52 39L75 29M58 47L84 34" stroke="#d6a36b" stroke-width="3"/>`;
const stone = `<path d="M21 59L30 34L57 22L85 35L97 61L73 76L39 73Z" fill="#9ca8a1" ${line}/><path d="M30 34L55 47L85 35M55 47L48 71M55 47L73 76" fill="none" stroke="#cdd5c7" stroke-width="3"/>`;
const fire = `<path d="M26 76L87 59M31 59L82 77" stroke="#865437" stroke-width="9" ${line}/><path d="M38 65Q16 42 50 29L58 11Q81 35 75 45L85 35Q104 81 57 80Q39 80 38 65" fill="#e9964b" ${line}/><path d="M50 71Q43 57 61 41Q58 61 71 63Q78 80 61 81Q53 80 50 71" fill="#f8d987"/>`;
const human = (t) =>
  `<path d="M40 71L33 94M72 71L79 94" stroke="#4b5648" stroke-width="9"/><path d="M37 47Q55 37 75 48L81 79H32Z" fill="${t === "guard" ? "#799aa3" : t === "artisan" ? "#b68051" : "#779271"}" ${line}/><path d="M40 48L25 66M73 49L88 66" stroke="#e8c7a0" stroke-width="9"/><circle cx="56" cy="30" r="18" fill="#eccba5" ${line}/><path d="M38 30Q28 6 57 8Q79 5 75 30L64 18L48 25Z" fill="#664d3c" ${line}/><circle cx="51" cy="31" r="1.6"/><circle cx="64" cy="31" r="1.6"/><path d="M53 39Q57 42 61 39" fill="none" ${line}/>${t === "guard" ? '<path d="M91 84V18L84 28L91 5L98 28L91 18" fill="#c5d4cd" ' + line + '/><path d="M28 55L43 61L40 79L28 87L16 79L13 61Z" fill="#c8ac65" ' + line + "/>" : t === "artisan" ? '<path d="M40 55L41 82H73L71 55" fill="#d7b88a" ' + line + '/><path d="M23 77L32 53M22 50L39 56" stroke="#6a7675" stroke-width="7"/>' : '<path d="M47 47V58H65V47" fill="none" stroke="#d8c69e" stroke-width="3"/>'}`;
const house = (t) =>
  `<path d="M24 43H91V88H24Z" fill="${t === "kiln" || t === "furnace" ? "#a27860" : "#b79a70"}" ${line}/><path d="M13 43L56 13L103 43Z" fill="${t === "shed" ? "#7b9180" : "#668675"}" ${line}/><path d="M46 88V58Q57 47 69 58V88" fill="#44584b" ${line}/><path d="M28 55H36V68H28M78 55H87V68H78" fill="#e4c88b" ${line}/><path d="M17 43H98M24 77H42M74 77H91" ${line}/>`;
import { expansionArt } from "./expansion-art.js";
export function art(t) {
  let p = expansionArt(t);
  if (["villager", "artisan", "guard"].includes(t)) p = human(t);
  else if (t === "wood") p = wood;
  else if (["stone", "clay", "charcoal", "ironOre"].includes(t))
    p =
      `<g ${t === "clay" ? 'style="filter:sepia(.8) saturate(1.5)"' : t === "charcoal" ? 'style="filter:brightness(.45)"' : ""}>${stone}</g>` +
      (t === "ironOre"
        ? '<path d="M39 44L50 54L42 65M65 30L70 42L82 50" stroke="#dcbd79" stroke-width="6"/>'
        : "");
  else if (t === "forest")
    p = tree(30, 44, 0.8) + tree(74, 35, 1) + tree(52, 58, 0.65);
  else if (t === "bush" || t === "berry")
    p = `${t === "bush" ? '<path d="M57 86V53" stroke="#805a3f" stroke-width="5"/><path d="M17 63Q3 32 31 29Q40 2 62 25Q89 7 93 34Q118 49 91 70Q69 93 47 70Q25 88 17 63" fill="#719b64" ' + line + "/>" : leaf(57, 38)}<g fill="#b9535d" ${line}><circle cx="39" cy="57" r="10"/><circle cx="60" cy="52" r="11"/><circle cx="76" cy="68" r="10"/><circle cx="52" cy="74" r="10"/></g><path d="M35 53L38 51M57 47L60 46M73 63L76 62" stroke="#f7b29f" stroke-width="3"/>`;
  else if (t === "rocks")
    p = `<g transform="translate(-5 16) scale(.8)">${stone}</g><g transform="translate(30 -5) scale(.7)">${stone}</g>`;
  else if (t === "fiber")
    p = `<path d="M36 82Q37 40 20 15M49 84Q53 34 43 12M62 84Q64 36 78 12M73 83Q80 53 99 28" fill="none" stroke="#8d9454" stroke-width="5"/>${leaf(42, 50)}${leaf(69, 55)}<path d="M31 71L79 65M33 76L80 71" stroke="#b17d50" stroke-width="5"/>`;
  else if (t === "seed")
    p = `<path d="M25 62Q30 32 53 29Q64 58 43 72Q32 79 25 62M64 56Q61 26 86 18Q107 40 84 63Q74 72 64 56" fill="#c3a06c" ${line}/><path d="M35 64L49 38M76 55L85 29" stroke="#f0dab0" stroke-width="3"/>`;
  else if (t === "vegetable")
    p = `<path d="M37 43Q84 23 84 56Q80 82 39 94Q52 76 37 43" fill="#dc914e" ${line}/>${leaf(57, 36)}<path d="M48 56L59 60M55 71L64 73" ${line}/>`;
  else if (t === "mushroom")
    p = `<path d="M49 47L45 84Q58 91 71 84L65 47" fill="#eddbb4" ${line}/><path d="M18 51Q20 10 56 13Q91 12 99 51Q58 63 18 51" fill="#b96b59" ${line}/><circle cx="43" cy="32" r="7" fill="#f1d6ad"/><circle cx="74" cy="36" r="5" fill="#f1d6ad"/>`;
  else if (t === "stew")
    p = `<path d="M16 48Q17 94 57 92Q98 94 99 48Z" fill="#729293" ${line}/><ellipse cx="57" cy="48" rx="42" ry="16" fill="#bc8b47" ${line}/><path d="M33 48L47 43L54 51L41 55M66 43L80 47L72 55" fill="#abc076"/><path d="M38 26Q27 16 39 5M60 26Q49 16 61 5M82 26Q71 16 83 5" fill="none" stroke="#a7b5a2" stroke-width="3"/>`;
  else if (t === "flour")
    p = `<path d="M36 31L31 12H80L75 31Q100 82 78 91H32Q13 80 36 31Z" fill="#e5d4ab" ${line}/><path d="M35 29H76M37 35H76" ${line}/><path d="M56 78V46M56 57L45 49M56 64L67 55M56 72L45 64" stroke="#a28b55" stroke-width="3"/>`;
  else if (t === "campfire") p = fire;
  else if (["hut", "shed"].includes(t))
    p =
      house(t) +
      (t === "shed"
        ? '<path d="M11 87H103M35 42V86M81 42V86" ' + line + "/>"
        : "");
  else if (t === "garden")
    p = `<path d="M12 55L68 31L105 55L49 85Z" fill="#9a7454" ${line}/><path d="M12 55V65L49 95L105 68V55M49 85V95" fill="#bb956d" ${line}/>${leaf(38, 56)}${leaf(66, 46)}${leaf(80, 65)}`;
  else if (t === "bench")
    p = `<path d="M25 56L21 91M89 56L94 91M47 66V91M74 65V88" stroke="#855f43" stroke-width="7"/><path d="M12 46L75 28L105 48L42 69Z" fill="#c79967" ${line}/><path d="M38 43L67 38M66 18L53 45M55 17L75 24" stroke="#596c64" stroke-width="5"/>`;
  else if (["kiln", "furnace"].includes(t))
    p = `<path d="M27 35L28 20H40V8H61V30Q93 39 96 89H17Q16 50 27 35Z" fill="${t === "kiln" ? "#b47e62" : "#7e8d88"}" ${line}/><path d="M37 88V65Q57 42 77 65V88Z" fill="#445246" ${line}/><g transform="translate(30 48) scale(.46)">${fire}</g><path d="M25 43H42M71 49H87M22 58H33M80 65H93" ${line}/>`;
  else if (t === "plank")
    p = `<path d="M17 47L75 21L99 35L42 63ZM17 61L75 35L99 49L42 77ZM17 75L75 49L99 63L42 91Z" fill="#c99861" ${line}/><path d="M32 49L77 28M31 63L77 42M31 77L77 56" stroke="#e7bd86" stroke-width="2"/>`;
  else if (["brick", "iron"].includes(t))
    p = `<path d="M17 50L74 26L101 43L44 69Z" fill="${t === "brick" ? "#cc8c6c" : "#b1c2be"}" ${line}/><path d="M17 50V71L44 88V69M44 88L101 63V43" fill="${t === "brick" ? "#ae6c53" : "#78948f"}" ${line}/>`;
  else if (t === "gear" || t === "waterwheel")
    p = `${t === "waterwheel" ? '<path d="M13 91Q29 80 45 91T79 91T110 91" stroke="#7cadac" stroke-width="5" fill="none"/>' : ""}<g transform="translate(57 51)">${Array.from({ length: 8 }, (_, i) => `<path d="M-7-43H7V-24H-7Z" transform="rotate(${i * 45})" fill="#b99c66" ${line}/>`).join("")}<circle r="31" fill="#c8ad78" ${line}/><circle r="15" fill="#f4e8cc" ${line}/>${t === "waterwheel" ? '<path d="M-26-26L26 26M-26 26L26-26M0-34V34M-34 0H34" ' + line + "/>" : ""}</g>`;
  else if (t === "beacon")
    p = `<path d="M35 90L46 34H69L80 90Z" fill="#9aab9c" ${line}/><path d="M24 91H89M39 71H74M44 51H70" ${line}/><path d="M57 7L62 22L78 27L62 32L57 47L52 32L36 27L52 22Z" fill="#f3cb6d" ${line}/><path d="M18 24H28M86 24H98M27 5L34 13M81 5L74 13" stroke="#cfad66" stroke-width="3"/>`;
  else if (t === "ruins")
    p = `<path d="M16 88V38H31V18H45V33H65V20H78V42H96V88Z" fill="#a4ab97" ${line}/><path d="M43 88V60Q57 38 72 60V88M15 87H103M21 51H33M76 60H93M42 34L47 45L41 52" fill="#687d67" ${line}/>${leaf(28, 81)}`;
  else if (t === "mine")
    p = `<path d="M6 91L23 41L50 13L88 32L110 92Z" fill="#88978d" ${line}/><path d="M29 91V56Q57 19 85 56V91Z" fill="#344b43" ${line}/><path d="M25 91V53H88V91M20 53H94" fill="none" stroke="#b18f62" stroke-width="7"/><path d="M45 90L50 64M71 90L65 64M48 75H69" stroke="#9bafa1" stroke-width="3"/>`;
  else if (t === "toolbox")
    p = `<path d="M16 41H98V87H16Z" fill="#829b93" ${line}/><path d="M40 40V26H75V40M15 58H99" fill="none" ${line}/><path d="M51 52H64V65H51Z" fill="#d6b773" ${line}/>`;
  else if (t === "spear")
    p = `<path d="M29 95L82 14" stroke="#9b724d" stroke-width="7"/><path d="M67 20L99 3L91 38L81 29Z" fill="#b6cac1" ${line}/><path d="M63 36L77 45M60 42L73 51" stroke="#c5ae7b" stroke-width="3"/>`;
  else if (t === "armor")
    p = `<path d="M32 13L45 21H68L81 13L101 38L85 53L79 91H34L28 53L12 38Z" fill="#97aaa5" ${line}/><path d="M43 20Q56 45 70 20M31 53H83M35 72H79M57 38V89" fill="none" stroke="#d0d9c8" stroke-width="4"/>`;
  else if (["beast", "raider", "stormBeast"].includes(t))
    p = `<path d="M22 38L15 8L43 24L70 22L99 7L91 41Q108 63 82 85L57 99L30 84Q8 66 22 38Z" fill="${t === "stormBeast" ? "#837398" : t === "raider" ? "#9c796c" : "#8c8d76"}" ${line}/><path d="M25 49L45 55L35 63M87 49L68 55L77 63" fill="#f5d17d" ${line}/><path d="M43 75L57 70L71 75L57 85Z" fill="#34473e" ${line}/>${t === "stormBeast" ? '<path d="M48 5L38 28H55L47 47L73 20H57L65 5" fill="#eed5a4" ' + line + "/>" : ""}`;
  if (t === "waygate")
    p = `<path d="M10 73L38 61L98 72L78 94L28 94Z" fill="#7e9a85" ${line}/><path d="M23 72L45 36L86 74Z" fill="#ead8a6" ${line}/><path d="M45 36L55 74L74 74Z" fill="#c8a76d" ${line}/><path d="M81 71V14L107 25L81 39" fill="#9bbfc1" ${line}/><path d="M30 77L46 65L52 85M15 89H95" fill="none" ${line}/><circle cx="25" cy="24" r="12" fill="#e4bd70"/><path d="M25 15V33M16 24H34" stroke="#fff8df" stroke-width="2"/>`;
  return `<svg viewBox="0 0 114 106" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="57" cy="94" rx="40" ry="6" fill="#35473c" opacity=".09"/>${p}</svg>`;
}
