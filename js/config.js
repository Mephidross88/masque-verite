/* ---------- Réglages du randomizer de 2 Ship 2 Harkinian 5.0.1 ----------
   Repris du menu Rando de 2Ship (Rando/Menu.cpp : onglets, cartes, libellés, infobulles), traduits. Une entrée de
   SETTINGS_DEF par option RO_… (clé = identifiant 2Ship, celui du spoiler) ; valeur stockée = nombre de 2Ship (0/1 pour
   oui/non, valeurs des énumérations pour les choix : RO, tiré de CHECKS_DATA.ro). Valeur par défaut : celle de
   StaticData/Options.cpp (CHECKS_DATA.options). show(s) : option visible selon les autres (comme le menu de 2Ship).
   type : 'bool' (oui/non), 'choice' (choices : [valeur, libellé]), 'num' (min, max, unit). */
const RO = window.CHECKS_DATA.ro;
const OPT_DEFAULT = window.CHECKS_DATA.options;

// Onglets et cartes (titre de carte : comme les séparateurs du menu de 2Ship)
const CONFIG_TABS = tWalk([
  { id:'logic', label:'Logique et accès', cards:[['logic', 'Logique'], ['access', 'Accès à Majora et à la Lune']] },
  { id:'checks', label:'Checks mélangés', cards:[['world', 'Monde et personnages'], ['creatures', 'Créatures et objets à ramasser'], ['scenery', 'Décor']] },
  { id:'items', label:'Objets', cards:[['abilities', 'Capacités et améliorations'], ['songs', 'Chants en plus'], ['souls', 'Âmes'],
    ['time', 'Temps mélangé'], ['goals', 'Objectifs'], ['dungeon', 'Objets de donjon'], ['modifiers', 'Réserve d’objets']] },
  { id:'start', label:'Départ', cards:[['start', 'Au départ']] },
  { id:'hints', label:'Indices', cards:[['hints', 'Indices']] },
], ['label', 'cards']);

const YES = [[0, t('Non')], [1, t('Oui')]];
const DUNGEON_ITEM = [[RO.RO_DUNGEON_ITEM_ANYWHERE, t('N’importe où')], [RO.RO_DUNGEON_ITEM_OWN_DUNGEON, t('Dans son donjon')],
  [RO.RO_DUNGEON_ITEM_START_WITH, t('Au départ')]];
const on = (s, k) => !!s[k];

const SETTINGS_DEF = tWalk([
  // --- Logique et accès ---
  { key:'RO_LOGIC', tab:'logic', card:'logic', label:'Logique', type:'choice',
    choices:[[RO.RO_LOGIC_GLITCHLESS, 'Sans glitch'], [RO.RO_LOGIC_NO_LOGIC, 'Aucune logique'], [RO.RO_LOGIC_NEARLY_NO_LOGIC, 'Presque aucune logique'], [RO.RO_LOGIC_VANILLA, 'Vanilla']],
    tip:'Sans glitch : la seed peut être finie sans glitch. Aucune logique : placement totalement aléatoire. Presque aucune logique : aléatoire, sauf l’Ode de l’Appel et les restes hors de la Lune, et les masques Mojo, Zora, la Sonate et la Bossa Nova hors de leur temple. Vanilla : rien n’est mélangé.' },
  { key:'RO_ACCESS_DUNGEONS', tab:'logic', card:'logic', label:'Accès aux temples', type:'choice',
    choices:[[RO.RO_ACCESS_DUNGEONS_FORM_AND_SONG, 'Forme et chant'], [RO.RO_ACCESS_DUNGEONS_FORM_OR_SONG, 'Forme ou chant'],
      [RO.RO_ACCESS_DUNGEONS_FORM_ONLY, 'Forme seulement'], [RO.RO_ACCESS_DUNGEONS_SONG_ONLY, 'Chant seulement'], [RO.RO_ACCESS_DUNGEONS_OPEN, 'Ouverts']],
    tip:'Ce qu’il faut pour entrer dans un temple : la bonne forme et le bon chant (comme le jeu d’origine), l’un ou l’autre, l’un des deux seulement, ou rien.' },
  { key:'RO_ACCESS_TRIALS', tab:'logic', card:'logic', label:'Accès aux épreuves de la Lune', type:'choice',
    choices:[[RO.RO_ACCESS_TRIALS_20_MASKS, '2, 6, 12 et 20 masques'], [RO.RO_ACCESS_TRIALS_REMAINS, 'Restes du boss associé'],
      [RO.RO_ACCESS_TRIALS_FORMS, 'Forme associée'], [RO.RO_ACCESS_TRIALS_OPEN, 'Ouvertes']] },
  { key:'RO_ACCESS_MAJORA_REMAINS_COUNT', tab:'logic', card:'access', label:'Restes pour affronter Majora', type:'num', min:0, max:4 },
  { key:'RO_ACCESS_MAJORA_MASKS_COUNT', tab:'logic', card:'access', label:'Masques pour affronter Majora', type:'num', min:0, max:20 },
  { key:'RO_ACCESS_MOON_REMAINS_COUNT', tab:'logic', card:'access', label:'Restes pour aller sur la Lune', type:'num', min:0, max:4 },
  { key:'RO_ACCESS_MOON_MASKS_COUNT', tab:'logic', card:'access', label:'Masques pour aller sur la Lune', type:'num', min:0, max:20 },
  // --- Checks mélangés ---
  { key:'RO_SHUFFLE_OWL_STATUES', tab:'checks', card:'world', label:'Statues de hibou', type:'bool', tip:'Activer une statue de hibou est un check. Les destinations du Chant de l’Envol ne changent pas.' },
  { key:'RO_SHUFFLE_SHOPS', tab:'checks', card:'world', label:'Boutiques', type:'bool', tip:'Les articles des boutiques sont des checks, à prix tirés au sort. L’article spécial du Bazar et les sacs de bombes de la Boutique de Bombes sont toujours mélangés.' },
  { key:'RO_SHUFFLE_TINGLE_SHOPS', tab:'checks', card:'world', label:'Cartes de Tingle', type:'bool', tip:'Les cartes vendues par Tingle sont des checks, à prix tirés au sort.' },
  { key:'RO_SHUFFLE_BOSS_REMAINS', tab:'checks', card:'world', label:'Restes des boss', type:'bool', tip:'Vaincre un boss de temple donne un objet mélangé au lieu de ses restes.' },
  { key:'RO_SHUFFLE_COWS', tab:'checks', card:'world', label:'Vaches', type:'bool', tip:'Jouer le Chant d’Epona à une vache est un check.' },
  { key:'RO_SHUFFLE_ENEMY_DROPS', tab:'checks', card:'creatures', label:'Drops d’ennemis', type:'bool', tip:'Le premier objet lâché par chaque type d’ennemi (hors boss) est un check.' },
  { key:'RO_SHUFFLE_FROGS', tab:'checks', card:'creatures', label:'Grenouilles', type:'bool', tip:'Parler à chacune des quatre grenouilles de la chorale avec le Masque de Don Gero est un check.' },
  { key:'RO_SHUFFLE_BUTTERFLIES', tab:'checks', card:'creatures', label:'Papillons', type:'bool', tip:'Les nuées de papillons sont des checks.' },
  { key:'RO_SHUFFLE_FREESTANDING_ITEMS', tab:'checks', card:'creatures', label:'Objets au sol', type:'bool', tip:'Les objets posés dans le monde (cœurs, rubis, flèches…) sont des checks.' },
  { key:'RO_SHUFFLE_WONDER_ITEMS', tab:'checks', card:'creatures', label:'Objets cachés', type:'bool', tip:'Les objets invisibles à toucher ou à viser sont des checks.' },
  { key:'RO_SHUFFLE_GOLD_SKULLTULAS', tab:'checks', card:'creatures', label:'Skulltulas d’or', type:'bool', tip:'Les Skulltulas d’or des deux Maisons des Araignées sont des checks.' },
  { key:'RO_SKULLTULA_TOKENS_REQUIRED', tab:'checks', card:'creatures', label:'Jetons pour la récompense', type:'num', min:1, max:30,
    show:s => on(s, 'RO_SHUFFLE_GOLD_SKULLTULAS'), tip:'Jetons de Skulltula d’or qu’il faut pour la récompense de chaque Maison des Araignées.' },
  { key:'RO_SKULLTULA_SHUFFLED', tab:'checks', card:'creatures', label:'Skulltulas mélangées par maison', type:'num', min:1, max:30,
    show:s => on(s, 'RO_SHUFFLE_GOLD_SKULLTULAS'), tip:'Nombre de Skulltulas d’or de chaque maison qui sont des checks, tirées au sort ; les autres donnent leur jeton.' },
  { key:'RO_SHUFFLE_POT_DROPS', tab:'checks', card:'scenery', label:'Pots', type:'bool', tip:'Briser chaque pot est un check.' },
  { key:'RO_SHUFFLE_CRATE_DROPS', tab:'checks', card:'scenery', label:'Caisses', type:'bool', tip:'Briser chaque caisse est un check.' },
  { key:'RO_SHUFFLE_BARREL_DROPS', tab:'checks', card:'scenery', label:'Tonneaux', type:'bool', tip:'Briser chaque tonneau est un check.' },
  { key:'RO_SHUFFLE_SNOWBALL_DROPS', tab:'checks', card:'scenery', label:'Boules de neige', type:'bool', tip:'Briser chaque grosse boule de neige est un check.' },
  { key:'RO_SHUFFLE_GRASS_DROPS', tab:'checks', card:'scenery', label:'Herbe', type:'bool', tip:'Couper chaque touffe d’herbe est un check.' },
  { key:'RO_SHUFFLE_TREE_DROPS', tab:'checks', card:'scenery', label:'Arbres', type:'bool', tip:'Foncer dans chaque arbre qui tremble est un check.' },
  { key:'RO_SHUFFLE_HIVE_DROPS', tab:'checks', card:'scenery', label:'Ruches', type:'bool', tip:'Faire tomber chaque ruche est un check.' },
  // --- Objets ---
  { key:'RO_SHUFFLE_SWIM', tab:'items', card:'abilities', label:'Nage', type:'bool', tip:'La capacité de nager est mélangée : sans elle, entrer dans l’eau profonde ramène Link au bord.' },
  { key:'RO_SHUFFLE_OCARINA_BUTTONS', tab:'items', card:'abilities', label:'Touches de l’ocarina', type:'bool', tip:'Les touches de l’ocarina sont mélangées : un chant n’est jouable qu’avec toutes ses notes.' },
  { key:'RO_SHUFFLE_SKELETON_KEY', tab:'items', card:'abilities', label:'Passe-partout', type:'bool', tip:'Ajoute le passe-partout : il donne toutes les petites clés de tous les donjons.' },
  { key:'RO_SHUFFLE_TYCOON_WALLET', tab:'items', card:'abilities', label:'Bourse de Magnat', type:'bool', tip:'Ajoute une troisième amélioration de la bourse (5 000 rubis).' },
  { key:'RO_PURCHASE_INFINITE_RUPEES', tab:'items', card:'abilities', label:'Rubis rachetables', type:'bool', tip:'Les rubis vendus en boutique peuvent être achetés autant de fois qu’on veut par cycle (sinon une fois).' },
  { key:'RO_SHUFFLE_SONG_SUN', tab:'items', card:'songs', label:'Chant du Soleil', type:'bool', tip:'Ajoute le Chant du Soleil : il avance l’heure à 6 h ou 18 h.' },
  { key:'RO_SHUFFLE_SONG_DOUBLE_TIME', tab:'items', card:'songs', label:'Chant du Temps Accéléré', type:'bool' },
  { key:'RO_SHUFFLE_SONG_INVERTED_TIME', tab:'items', card:'songs', label:'Chant du Temps Inversé', type:'bool' },
  { key:'RO_SHUFFLE_SONG_SARIA', tab:'items', card:'songs', label:'Chant de Saria', type:'bool', tip:'Ajoute le Chant de Saria : le jouer donne un indice sur un objet atteignable, une seule fois.' },
  { key:'RO_SHUFFLE_BOSS_SOULS', tab:'items', card:'souls', label:'Âmes des boss', type:'bool', tip:'Un boss n’apparaît qu’une fois son âme trouvée.' },
  { key:'RO_SHUFFLE_ENEMY_SOULS', tab:'items', card:'souls', label:'Âmes des ennemis', type:'bool', tip:'Un ennemi est invincible tant que son âme n’est pas trouvée.' },
  { key:'RO_CLOCK_SHUFFLE', tab:'items', card:'time', label:'Temps mélangé', type:'bool', tip:'Les trois jours sont coupés en six demi-journées à trouver comme des objets : on ne peut être qu’aux demi-journées possédées.' },
  { key:'RO_CLOCK_SHUFFLE_PROGRESSIVE', tab:'items', card:'time', label:'Ordre des demi-journées', type:'choice', show:s => on(s, 'RO_CLOCK_SHUFFLE'),
    choices:[[RO.RO_CLOCK_SHUFFLE_RANDOM, 'Au hasard'], [RO.RO_CLOCK_SHUFFLE_ASCENDING, 'Progressif : dans l’ordre'], [RO.RO_CLOCK_SHUFFLE_DESCENDING, 'Progressif : à rebours']],
    tip:'Au hasard : les six demi-journées sont mélangées, on commence avec l’une d’elles. Progressif : elles s’obtiennent dans l’ordre (J1, N1, J2…) ou à rebours (N3, J3, N2…).' },
  { key:'RO_CLOCK_TERMINAL_TIME', tab:'items', card:'time', label:'Début des dernières heures', type:'num', min:0, max:359, unit:'min après minuit (nuit 3)',
    show:s => on(s, 'RO_CLOCK_SHUFFLE'), tip:'Heure où commence le compte à rebours final (de 0 h 00 à 5 h 59) quand on n’a plus de demi-journée.' },
  { key:'RO_SHUFFLE_TRIFORCE_PIECES', tab:'items', card:'goals', label:'Chasse à la Triforce', type:'bool', tip:'Des fragments de Triforce sont mélangés : il faut en réunir le nombre demandé.' },
  { key:'RO_TRIFORCE_PIECES_REQUIRED', tab:'items', card:'goals', label:'Fragments demandés', type:'num', min:1, max:1000, show:s => on(s, 'RO_SHUFFLE_TRIFORCE_PIECES') },
  { key:'RO_TRIFORCE_PIECES_MAX', tab:'items', card:'goals', label:'Fragments mélangés', type:'num', min:1, max:1000, show:s => on(s, 'RO_SHUFFLE_TRIFORCE_PIECES') },
  { key:'RO_PLACEMENT_SMALL_KEYS', tab:'items', card:'dungeon', label:'Petites clés', type:'choice', choices:DUNGEON_ITEM },
  { key:'RO_PLACEMENT_BOSS_KEYS', tab:'items', card:'dungeon', label:'Clés d’Or', type:'choice', choices:DUNGEON_ITEM },
  { key:'RO_PLACEMENT_STRAY_FAIRIES', tab:'items', card:'dungeon', label:'Fées perdues', type:'choice', choices:DUNGEON_ITEM,
    tip:'Où sont les fées perdues de chaque temple (pas celle de Bourg-Clocher).' },
  { key:'RO_STRAY_FAIRIES_REQUIRED', tab:'items', card:'dungeon', label:'Fées demandées par la Grande Fée', type:'num', min:1, max:15,
    show:s => s.RO_PLACEMENT_STRAY_FAIRIES !== RO.RO_DUNGEON_ITEM_START_WITH },
  { key:'RO_STRAY_FAIRIES_MAX', tab:'items', card:'dungeon', label:'Fées mélangées par temple', type:'num', min:1, max:15,
    show:s => s.RO_PLACEMENT_STRAY_FAIRIES !== RO.RO_DUNGEON_ITEM_START_WITH },
  { key:'RO_PLENTIFUL_ITEMS', tab:'items', card:'modifiers', label:'Objets en abondance', type:'bool', tip:'Un exemplaire de plus des objets majeurs, masques et clés (et parfois des autres).' },
  { key:'RO_SHUFFLE_TRAPS', tab:'items', card:'modifiers', label:'Pièges', type:'bool', tip:'Des pièges déguisés en objets pas encore obtenus.' },
  { key:'RO_TRAP_AMOUNT', tab:'items', card:'modifiers', label:'Nombre de pièges', type:'num', min:1, max:100, show:s => on(s, 'RO_SHUFFLE_TRAPS') },
  // --- Départ ---
  { key:'RO_STARTING_RUPEES', tab:'start', card:'start', label:'Bourse pleine', type:'bool' },
  { key:'RO_STARTING_CONSUMABLES', tab:'start', card:'start', label:'Bâtons et Noix Mojo au maximum', type:'bool' },
  { key:'RO_STARTING_MAPS_AND_COMPASSES', tab:'start', card:'start', label:'Cartes et boussoles', type:'bool', tip:'Cartes et boussoles partout.' },
  { key:'RO_STARTING_HEALTH', tab:'start', card:'start', label:'Cœurs', type:'num', min:1, max:20 },
  // --- Indices ---
  { key:'RO_HINTS_SPIDER_HOUSES', tab:'hints', card:'hints', label:'Maisons des Araignées', type:'bool', tip:'Récompense de la Maison des Araignées des Marais : indiquée sur place ; de la Côte : par l’homme sur l’échafaudage au Sud de Bourg-Clocher, le premier jour.' },
  { key:'RO_HINTS_GOSSIP_STONES', tab:'hints', card:'hints', label:'Pierres à potins', type:'bool', tip:'Chaque pierre à potins donne un indice fixe sur le contenu d’un emplacement.' },
  { key:'RO_HINTS_GOSSIP_STONE_STRENGTH', tab:'hints', card:'hints', label:'Poids des indices des pierres', type:'num', min:0, max:100, tip:'À 0, tous les checks ont autant de chances d’être indiqués ; à 100, les objets importants sont favorisés.' },
  { key:'RO_HINTS_PURCHASEABLE', tab:'hints', card:'hints', label:'Indices payants', type:'bool', tip:'Les pierres à potins vendent un indice (10 à 250 rubis) sur un check pas encore fait.' },
  { key:'RO_HINTS_BOSS_REMAINS', tab:'hints', card:'hints', label:'Restes des boss', type:'bool', tip:'Les affiches de recrutement de la garde de Bourg-Clocher indiquent où sont les restes.' },
  { key:'RO_HINTS_OATH_TO_ORDER', tab:'hints', card:'hints', label:'Ode de l’Appel', type:'bool', tip:'Avec l’accès à la Lune, Skull Kid au sommet de la Tour de l’Horloge indique où est l’Ode de l’Appel.' },
  { key:'RO_HINTS_TRANSFORMATIONS', tab:'hints', card:'hints', label:'Masques de transformation', type:'bool', tip:'Le panneau près de la Peste Mojo du Sud de Bourg-Clocher indique où sont les masques de transformation (sauf celui du Dieu Démon).' },
  { key:'RO_HINTS_SONG_OF_SOARING', tab:'hints', card:'hints', label:'Chant de l’Envol', type:'bool', tip:'Indique, à son emplacement d’origine, où est le Chant de l’Envol.' },
  { key:'RO_HINTS_HOOKSHOT', tab:'hints', card:'hints', label:'Grappin', type:'bool', tip:'Le Zora de la Plage de la Grande Baie, près de la Forteresse des Pirates, indique où est le Grappin.' },
  { key:'RO_HINTS_BANK_SIGN', tab:'hints', card:'hints', label:'Récompense de la banque', type:'bool', tip:'Le panneau près de la banque, à l’Ouest de Bourg-Clocher, annonce ce que donne son quart de cœur.' },
], ['label', 'tip']).map(d => ({ ...d, def:OPT_DEFAULT[d.key], choices:d.type === 'bool' ? YES : d.choices && d.choices.map(([v, l]) => [v, tl(l)]) }));
const SETTING_BY_KEY = Object.fromEntries(SETTINGS_DEF.map(d => [d.key, d]));

// Contrôle des données : chaque option de 2Ship a sa définition, et inversement (affiché dans la Configuration)
const CONFIG_ERRORS = [
  ...Object.keys(OPT_DEFAULT).filter(k => !SETTING_BY_KEY[k]).map(k => t('Option de 2Ship sans réglage : {k}', { k })),
  ...SETTINGS_DEF.filter(d => d.def === undefined).map(d => t('Réglage inconnu de 2Ship : {k}', { k:d.key })),
];
