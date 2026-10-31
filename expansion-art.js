// Original vector illustrations, matching the first chapter's paper-cut palette.
const line =
  'stroke="#455e5a" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"';
const wave =
  '<path d="M9 84Q21 75 33 84T57 84T81 84T105 84M15 94Q27 85 39 94T63 94T87 94" fill="none" stroke="#76a7ad" stroke-width="3"/>';
const crystal =
  '<path d="M43 25L60 8L76 26L72 75L56 90L39 73Z" fill="#a8d4d5" ' +
  line +
  '/><path d="M60 8L55 70L56 90M43 25L55 34L76 26M55 70L39 73M55 70L72 75" fill="none" stroke="#eef4df" stroke-width="2.5"/>';
const fish =
  '<path d="M21 51Q52 17 84 47L104 31L99 57L104 75L83 60Q49 90 21 51Z" fill="#8fb9b5" ' +
  line +
  '/><circle cx="37" cy="49" r="3" fill="#344b48"/><path d="M49 39Q62 53 49 68M63 37L58 26L75 33" fill="none" ' +
  line +
  "/>";
const flame =
  '<path d="M47 69Q29 56 48 37L55 19L70 43Q88 66 67 76Z" fill="#e6b566" ' +
  line +
  '/><path d="M53 66L58 46L67 65Z" fill="#f9e5a5"/>';
const tower =
  '<path d="M31 91L40 37H75L85 91Z" fill="#b6c3b8" ' +
  line +
  '/><path d="M38 57H78M34 76H81" stroke="#809e9a" stroke-width="5"/><path d="M34 37H81V20H34Z" fill="#e5c87b" ' +
  line +
  '/><path d="M29 19L57 3L86 19Z" fill="#6a8d90" ' +
  line +
  "/>";
const glyph =
  '<path d="M57 29L64 45L82 51L64 57L57 76L50 57L33 51L50 45Z" fill="#f0d790" ' +
  line +
  "/>";
export function expansionArt(t) {
  const map = {
    coast: `<path d="M4 66Q35 35 63 66T110 66V88H4Z" fill="#d9c99b"/><path d="M21 73V16M31 77L38 28" stroke="#6e9076" stroke-width="4"/><path d="M21 19V34M37 27L34 44" stroke="#a68f65" stroke-width="8"/>${wave}<path d="M68 66Q84 47 96 67" fill="#f1e0b9" ${line}/>`,
    fish,
    reed: `<path d="M30 90L20 20M48 92L48 9M68 91L78 17M85 90L95 40" stroke="#8f9d6a" stroke-width="4"/><path d="M19 18L22 38M48 9V32M79 15L76 38" stroke="#aa855a" stroke-width="9"/><path d="M22 48L10 38M47 55L64 39M72 62L90 50M28 79H84" fill="none" ${line}/>`,
    rope: `<path d="M35 71C5 30 95 4 94 43C93 79 13 99 25 58C37 13 100 31 80 65C67 87 52 70 61 58L71 48M35 71L17 94M80 65L101 91" fill="none" stroke="#9e8054" stroke-width="10"/><path d="M35 71C5 30 95 4 94 43C93 79 13 99 25 58C37 13 100 31 80 65C67 87 52 70 61 58L71 48" fill="none" stroke="#ead5a7" stroke-width="3" stroke-dasharray="4 6"/>`,
    salt: `<path d="M20 78L45 37L67 25L93 79Z" fill="#f0edda" ${line}/><path d="M20 78L63 61L93 79M45 37L63 61L67 25" fill="none" ${line}/><path d="M12 87H102M26 92H88" stroke="#b6c8c2" stroke-width="3"/>`,
    smokedFish: `<path d="M12 13H102M24 13V39M74 13V39" ${line}/><g transform="translate(-8 18) scale(.65) rotate(25 57 53)" style="filter:sepia(.8)">${fish}</g><g transform="translate(32 18) scale(.65) rotate(25 57 53)" style="filter:sepia(.8)">${fish}</g><path d="M31 91Q22 79 33 73M62 95Q53 83 64 77M88 92Q79 81 90 72" fill="none" stroke="#b6af8f" stroke-width="2"/>`,
    boat: `<path d="M12 70H103L88 87H29Z" fill="#b38c61" ${line}/><path d="M59 69V8" ${line}/><path d="M54 12L22 61H54Z" fill="#f0dfb2" ${line}/><path d="M65 20L94 58H65Z" fill="#90b9b7" ${line}/>${wave}`,
    dock: `${wave}<path d="M13 51L74 36L106 53L40 72Z" fill="#c4a16f" ${line}/><path d="M26 64V88M87 60V88M54 41V68M74 36V62" ${line}/><path d="M20 20V60M90 21V48M20 28Q54 45 90 28" fill="none" stroke="#8f7758" stroke-width="4"/>`,
    wreck: `<path d="M15 57L83 43L101 72L67 87L30 82Z" fill="#859e96" ${line}/><path d="M41 21L62 77M39 20L83 33L52 49Z" fill="#c1c5a5" ${line}/><path d="M30 60L48 72M60 54L72 74M76 50L88 68" ${line}/>${wave}`,
    chart: `<path d="M21 17L47 22L75 13L95 23L90 86L65 78L42 92L18 81Z" fill="#ecdbaf" ${line}/><path d="M47 22L42 92M75 13L65 78" stroke="#c9b383" stroke-width="2"/><path d="M33 66Q40 36 57 52T80 35" fill="none" stroke="#638d8c" stroke-width="3" stroke-dasharray="4 4"/><path d="M75 28L85 40M85 28L75 40" ${line}/>`,
    compass: `<circle cx="57" cy="53" r="37" fill="#bd9c60" ${line}/><circle cx="57" cy="53" r="29" fill="#f0e6c6" ${line}/><path d="M57 25L66 53L57 81L48 53Z" fill="#719d9a" ${line}/><path d="M57 25V53L48 53Z" fill="#bf7766"/><path d="M52 9V2H62V9M25 53H31M83 53H89" ${line}/>`,
    pearl: `<path d="M16 69Q23 32 54 40Q91 26 100 69L59 91Z" fill="#b0a8ba" ${line}/><path d="M16 69Q58 54 100 69M33 52L48 77M79 49L68 78" fill="none" stroke="#ded3cf" stroke-width="3"/><circle cx="58" cy="59" r="18" fill="#f0e8d5" ${line}/><path d="M48 54Q48 46 58 45" stroke="#fffcef" stroke-width="4" fill="none"/>`,
    harpoon: `<path d="M25 95L77 15" stroke="#8f7553" stroke-width="7"/><path d="M61 24L80 3L92 32L79 25L66 42" fill="#a0c4bf" ${line}/><path d="M61 47L76 55M55 55L70 63" stroke="#d7bd82" stroke-width="4"/>`,
    lighthouse: `${tower}<path d="M7 16L27 26L7 36M107 16L88 26L107 36" fill="#ead595" opacity=".65"/>${wave}`,
    reefGuardian: `<path d="M12 66L23 34L45 24L54 13L66 25L92 32L106 70L83 91H30Z" fill="#839e9b" ${line}/><path d="M23 34L39 51L27 71M92 32L73 51L90 71M45 24L54 51L66 25" fill="none" ${line}/><path d="M35 55L47 61M67 61L80 55" stroke="#e9cc7e" stroke-width="5"/><path d="M45 78H70" ${line}/><path d="M14 47V23M14 32L5 27M96 36V13M96 22L105 15" stroke="#c4897c" stroke-width="4"/>`,
    snowfield: `<path d="M4 85L35 23L54 57L78 9L111 85Z" fill="#a8bdc1" ${line}/><path d="M35 23L22 52L36 47L45 53M78 9L61 46L76 36L92 48" fill="#f3f2de" ${line}/><path d="M11 94H103" stroke="#cdded8" stroke-width="4"/>`,
    crystal,
    herb: `<path d="M57 91V35M55 68L33 51M58 58L80 36" stroke="#658d76" stroke-width="4"/><g fill="#e9e9d3" ${line}><ellipse cx="57" cy="31" rx="9" ry="19"/><ellipse cx="57" cy="31" rx="9" ry="19" transform="rotate(60 57 31)"/><ellipse cx="57" cy="31" rx="9" ry="19" transform="rotate(120 57 31)"/></g><circle cx="57" cy="31" r="7" fill="#d1b66f"/><path d="M55 78Q20 84 24 58Q46 59 55 78M59 69Q91 75 91 49Q68 50 59 69" fill="#8dab8a"/>`,
    salve: `<path d="M29 32H85L94 88H20Z" fill="#9daf92" ${line}/><path d="M26 22H89V35H26Z" fill="#b89565" ${line}/><path d="M40 55H74V77H40Z" fill="#efdfb7"/><path d="M57 57V75M48 66H66" stroke="#718f7a" stroke-width="4"/>`,
    lens: `<path d="M77 72L99 94" stroke="#9b825c" stroke-width="10"/><circle cx="50" cy="46" r="34" fill="#baa26a" ${line}/><circle cx="50" cy="46" r="26" fill="#acd2ce" ${line}/><path d="M30 42Q35 23 53 24M30 51L58 28" stroke="#eef4dc" stroke-width="3" fill="none"/>`,
    boiler: `<path d="M25 29H83V86H25Z" fill="#8caaa4" ${line}/><ellipse cx="54" cy="29" rx="29" ry="12" fill="#b6cbc0" ${line}/><path d="M83 42H99V15H86M30 87V96M76 87V96" fill="none" stroke="#967b58" stroke-width="7"/><circle cx="54" cy="44" r="10" fill="#e7d6aa" ${line}/><path d="M54 44L60 38M38 66H72V82H38Z" ${line}/><g transform="translate(24 52) scale(.5)">${flame}</g>`,
    greenhouse: `<path d="M13 46L55 15L102 45V89H13Z" fill="#b9d4be" ${line}/><path d="M13 46H102M34 30V89M55 15V89M78 31V89M13 66H102" stroke="#eee7ce" stroke-width="4"/><path d="M29 83V67M69 83V61M86 84V70M29 73L22 66M69 69L77 62" stroke="#658e69" stroke-width="4"/>`,
    steamCell: `<path d="M36 21H78V87H36Z" fill="#a4c2ba" ${line}/><path d="M30 15H84V28H30ZM30 81H84V94H30Z" fill="#a78e61" ${line}/><path d="M59 38L47 56H61L53 73L70 49H57Z" fill="#efe0a3" ${line}/>`,
    relay: `<path d="M38 95L48 47H65L77 95Z" fill="#93a9a5" ${line}/><path d="M25 91H90M42 72H70M30 12Q57 66 88 12Q59 42 30 12" fill="#c6d4c3" ${line}/><circle cx="57" cy="27" r="8" fill="#ebce8c"/><path d="M57 27V51M14 8L23 18M99 8L91 18" ${line}/>`,
    archive: `<path d="M17 45H96V91H17Z" fill="#b2bfb3" ${line}/><path d="M9 44L54 13L105 44Z" fill="#8a9da7" ${line}/><path d="M16 37L54 13L83 31L67 28L56 21L35 38Z" fill="#e5ead9"/><path d="M45 91V58H67V91M26 54H36V69H26M78 54H88V69H78" fill="#536e70" ${line}/>`,
    sunEngine: `<path d="M18 92H97L85 78H30Z" fill="#99ada8" ${line}/><circle cx="57" cy="48" r="34" fill="#bdab79" ${line}/><circle cx="57" cy="48" r="23" fill="#c5dbcc" ${line}/><path d="M57 7V17M57 80V91M16 48H26M89 48H102M27 18L34 25M80 73L89 82M27 80L34 73M81 25L88 18" stroke="#b8a166" stroke-width="5"/>${glyph}`,
    frostCloak: `<path d="M34 30Q39 4 58 9Q79 7 82 30L103 89Q76 78 58 95Q37 79 12 89Z" fill="#8c9da9" ${line}/><path d="M33 30Q59 47 83 30" fill="none" stroke="#e7e2ce" stroke-width="10"/><path d="M58 42V92M25 76L38 42M90 76L77 43" fill="none" ${line}/>`,
    thunderBlade: `<path d="M23 95L39 74M32 61L56 84" stroke="#a18a59" stroke-width="8"/><path d="M38 66L78 9L100 2L94 26L51 78Z" fill="#afcbd0" ${line}/><path d="M78 18L61 42H72L52 66" fill="none" stroke="#f2dc91" stroke-width="4"/>`,
    frostSentinel: `<path d="M24 39L33 15L53 8L80 19L91 41L100 91H14Z" fill="#8b95b0" ${line}/><path d="M33 15L53 40L80 19M24 39L39 62L25 87M91 41L74 62L88 87" fill="none" ${line}/><path d="M36 43L48 49M65 49L78 43" stroke="#ede0a3" stroke-width="5"/><g transform="translate(24 34) scale(.6)">${glyph}</g><path d="M6 60L17 50M106 51L112 67" stroke="#d1e5de" stroke-width="5"/>`,
    relayGuard: `<path d="M22 41L37 16H77L94 41L86 91H28Z" fill="#9fb3ad" ${line}/><path d="M22 41H94M40 65H76M57 41V85" fill="none" ${line}/><circle cx="43" cy="52" r="5" fill="#e8cd88"/><circle cx="72" cy="52" r="5" fill="#e8cd88"/><path d="M37 16L57 6L77 16" fill="#c4d8c8" ${line}/>`,
    dawnHeart: `<circle cx="57" cy="52" r="33" fill="#adbbb1" ${line}/><path d="M57 6V14M57 89V99M10 52H18M96 52H106M23 18L29 25M87 81L94 88" stroke="#c4aa6f" stroke-width="3"/>${glyph}`,
  };
  return map[t] || "";
}
