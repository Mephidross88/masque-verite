// Libellés des données (extract_checks.mjs) : noms français des scènes, des objets et des checks.
// Noms de lieux, d'objets, de masques et de chants : ceux de la version française du jeu (textes du jeu en français) ;
// noms des checks : composés par règles depuis l'identifiant de 2Ship (RC_…), voir checkLabels.

// --- Scènes du tracker de checks ---
export const SCENE_FR = {
  SCENE_CLOCKTOWER:'Sud de Bourg-Clocher', SCENE_TOWN:'Est de Bourg-Clocher', SCENE_ICHIBA:'Ouest de Bourg-Clocher',
  SCENE_BACKTOWN:'Nord de Bourg-Clocher', SCENE_ALLEY:'Lavoir de Bourg-Clocher', SCENE_TENMON_DAI:'Observatoire Céleste',
  SCENE_OKUJOU:'Sommet de la Tour de l’Horloge', SCENE_00KEIKOKU:'Plaine Termina', SCENE_ROMANYMAE:'Route du Lait',
  SCENE_KOEPONARACE:'Piste des Gorman', SCENE_F01:'Ranch Romani', SCENE_24KEMONOMITI:'Chemin du Marais du Sud',
  SCENE_20SICHITAI:'Marais du Sud', SCENE_KINSTA1:'Maison des Araignées des Marais', SCENE_22DEKUCITY:'Palais Mojo',
  SCENE_DANPEI:'Autel Mojo', SCENE_DEKU_KING:'Salle du Trône Mojo', SCENE_26SARUNOMORI:'Bois Perdus',
  SCENE_21MITURINMAE:'Bois-Cascade', SCENE_MITURIN:'Temple de Bois-Cascade', SCENE_MITURIN_BS:'Antre d’Odolwa',
  SCENE_13HUBUKINOMITI:'Chemin du Village dans la Montagne', SCENE_10YUKIYAMANOMURA:'Village dans la Montagne',
  SCENE_GORON_HAKA:'Cimetière des Gorons', SCENE_17SETUGEN:'Chemin du Village Goron', SCENE_GORONRACE:'Course des Gorons',
  SCENE_11GORONNOSATO:'Village Goron', SCENE_16GORON_HOUSE:'Autel Goron', SCENE_14YUKIDAMANOMITI:'Chemin du Pic des Neiges',
  SCENE_12HAKUGINMAE:'Pic des Neiges', SCENE_HAKUGIN:'Temple du Pic des Neiges', SCENE_HAKUGIN_BS:'Antre de Rhork',
  SCENE_30GYOSON:'Plage de la Grande Baie', SCENE_KINDAN2:'Maison des Araignées de la Côte', SCENE_31MISAKI:'Cap Zora',
  SCENE_33ZORACITY:'Théâtre des Zoras', SCENE_SINKAI:'Puits de Pierre', SCENE_35TAKI:'Rapides de la Cascade',
  SCENE_TORIDE:'Abords de la Forteresse des Pirates', SCENE_KAIZOKU:'Forteresse des Pirates',
  SCENE_PIRATE:'Intérieur de la Forteresse des Pirates', SCENE_SEA:'Temple de la Grande Baie', SCENE_SEA_BS:'Antre de Gyorg',
  SCENE_IKANAMAE:'Route vers Ikana', SCENE_BOTI:'Cimetière d’Ikana', SCENE_HAKASHITA:'Sous le Cimetière',
  SCENE_DANPEI2TEST:'Sous le Cimetière et maison d’Igor', SCENE_IKANA:'Vallée Ikana', SCENE_SECOM:'Repaire de Sakon',
  SCENE_REDEAD:'Au fond du puits', SCENE_RANDOM:'Autel Secret', SCENE_CASTLE:'Vestiges du Château Ikana',
  SCENE_IKNINSIDE:'Salle du trône d’Igos', SCENE_F40:'Forteresse de Pierre', SCENE_INISIE_N:'Temple de la Forteresse de Pierre',
  SCENE_INISIE_BS:'Antre de Skorn', SCENE_SOUGEN:'La Lune', SCENE_LAST_DEKU:'Lune : épreuve Mojo',
  SCENE_LAST_GORON:'Lune : épreuve Goron', SCENE_LAST_ZORA:'Lune : épreuve Zora', SCENE_LAST_LINK:'Lune : épreuve de Link',
  SCENE_LAST_BS:'Antre de Majora', SCENE_DEKUTES:'Aire de Jeu des Pestes Mojo', SCENE_KAKUSIANA:'Autel du Pic Isolé',
};
export function sceneFr(id){
  if (!SCENE_FR[id]) throw new Error('scène sans nom français : ' + id);
  return SCENE_FR[id];
}

// Préfixes des identifiants de checks qui désignent la scène elle-même (retirés du libellé, la scène étant affichée au-dessus)
export const SCENE_PREFIX = {
  SCENE_CLOCKTOWER:['CLOCK_TOWN_SOUTH', 'CLOCK_TOWN'], SCENE_TOWN:['CLOCK_TOWN_EAST', 'CLOCK_TOWN'],
  SCENE_ICHIBA:['CLOCK_TOWN_WEST', 'CLOCK_TOWN'], SCENE_BACKTOWN:['CLOCK_TOWN_NORTH', 'CLOCK_TOWN'],
  SCENE_ALLEY:['CLOCK_TOWN_LAUNDRY_POOL', 'CLOCK_TOWN_LAUNDRY', 'CLOCK_TOWN'], SCENE_TENMON_DAI:['ASTRAL_OBSERVATORY'],
  SCENE_OKUJOU:['CLOCK_TOWER_ROOF'], SCENE_00KEIKOKU:['TERMINA_FIELD'], SCENE_ROMANYMAE:['MILK_ROAD'],
  SCENE_KOEPONARACE:['GORMAN_TRACK'], SCENE_F01:['ROMANI_RANCH'], SCENE_24KEMONOMITI:['ROAD_TO_SOUTHERN_SWAMP'],
  SCENE_20SICHITAI:['SOUTHERN_SWAMP'], SCENE_KINSTA1:['SWAMP_SPIDER_HOUSE'], SCENE_22DEKUCITY:['DEKU_PALACE'],
  SCENE_DANPEI:['DEKU_SHRINE'], SCENE_DEKU_KING:['DEKU_KINGS_CHAMBER'], SCENE_26SARUNOMORI:['WOODS_OF_MYSTERY'],
  SCENE_21MITURINMAE:['WOODFALL'], SCENE_MITURIN:['WOODFALL_TEMPLE'], SCENE_MITURIN_BS:['WOODFALL_TEMPLE_BOSS', 'WOODFALL_TEMPLE'],
  SCENE_13HUBUKINOMITI:['PATH_TO_MOUNTAIN_VILLAGE'], SCENE_10YUKIYAMANOMURA:['MOUNTAIN_VILLAGE'],
  SCENE_GORON_HAKA:['GORON_GRAVEYARD'], SCENE_17SETUGEN:['TWIN_ISLANDS'], SCENE_GORONRACE:['GORON_RACETRACK'],
  SCENE_11GORONNOSATO:['GORON_VILLAGE'], SCENE_16GORON_HOUSE:['GORON_SHRINE'], SCENE_14YUKIDAMANOMITI:['PATH_TO_SNOWHEAD'],
  SCENE_12HAKUGINMAE:['SNOWHEAD'], SCENE_HAKUGIN:['SNOWHEAD_TEMPLE'], SCENE_HAKUGIN_BS:['SNOWHEAD_TEMPLE_BOSS', 'SNOWHEAD_TEMPLE'],
  SCENE_30GYOSON:['GREAT_BAY_COAST'], SCENE_KINDAN2:['OCEAN_SPIDER_HOUSE'], SCENE_31MISAKI:['ZORA_CAPE'],
  SCENE_33ZORACITY:['ZORA_HALL'], SCENE_SINKAI:['PINNACLE_ROCK'], SCENE_35TAKI:['WATERFALL_RAPIDS'],
  SCENE_TORIDE:['PIRATE_FORTRESS_ENTRANCE'], SCENE_KAIZOKU:['PIRATE_FORTRESS_PLAZA'],
  SCENE_PIRATE:['PIRATE_FORTRESS_INTERIOR', 'PIRATE_FORTRESS'], SCENE_SEA:['GREAT_BAY_TEMPLE'],
  SCENE_SEA_BS:['GREAT_BAY_TEMPLE_BOSS', 'GREAT_BAY_TEMPLE'], SCENE_IKANAMAE:['ROAD_TO_IKANA'], SCENE_BOTI:['IKANA_GRAVEYARD'],
  SCENE_HAKASHITA:['BENEATH_THE_GRAVEYARD'], SCENE_DANPEI2TEST:['BENEATH_THE_GRAVEYARD'], SCENE_IKANA:['IKANA_CANYON'],
  SCENE_SECOM:['SAKON_HIDEOUT'], SCENE_REDEAD:['BENEATH_THE_WELL'], SCENE_RANDOM:['SECRET_SHRINE'],
  SCENE_CASTLE:['ANCIENT_CASTLE_OF_IKANA'], SCENE_IKNINSIDE:['ANCIENT_CASTLE_OF_IKANA_BOSS', 'ANCIENT_CASTLE_OF_IKANA'],
  SCENE_F40:['STONE_TOWER'], SCENE_INISIE_N:['STONE_TOWER_TEMPLE'],
  SCENE_INISIE_BS:['STONE_TOWER_TEMPLE_INVERTED_BOSS', 'STONE_TOWER_TEMPLE_INVERTED', 'STONE_TOWER_TEMPLE'],
  SCENE_SOUGEN:['MOON'], SCENE_LAST_DEKU:['MOON_TRIAL_DEKU'], SCENE_LAST_GORON:['MOON_TRIAL_GORON'],
  SCENE_LAST_ZORA:['MOON_TRIAL_ZORA'], SCENE_LAST_LINK:['MOON_TRIAL_LINK'], SCENE_LAST_BS:['MOON_MAJORA', 'MOON'],
  SCENE_DEKUTES:['DEKU_PLAYGROUND'], SCENE_KAKUSIANA:['LONE_PEAK_SHRINE'],
};
// partie du nom après le préfixe de la scène (au moins un mot reste)
export function stripScene(id, scene){
  const body = id.replace(/^RC_/, '');
  for (const p of (SCENE_PREFIX[scene] || []).slice().sort((a, b) => b.length - a.length))
    if (body.startsWith(p + '_')) return body.slice(p.length + 1);
  return body;
}
// nom anglais lisible (comme convertEnumToReadableName de 2Ship) ; nombres sans zéro de tête
export const readable = body => body.split('_').map(w => /^\d+$/.test(w) ? String(Number(w)) : w === 'HP' ? 'HP' : w[0] + w.slice(1).toLowerCase()).join(' ');

// --- Ennemis (drops d'ennemis, âmes) ---
const ENEMY_FR = {
  ALIEN:'Extraterrestres', ALIENS:'Extraterrestres', ARMOS:'Armos', BAD_BAT:'Chauve-souris', BEAMOS:'Beamos', BOE:'Boe',
  BLUE_BUBBLE:'Bulle bleue', RED_BUBBLE:'Bulle rouge', BUBBLE:'Bulles', CAPTAIN_KEETA:'Capitaine Keeta', CHUCHU:'Chuchu',
  DEATH_ARMOS:'Armos de la mort', DEEP_PYTHON:'Python des profondeurs', DEKU_BABA:'Mojo Baba', BIO_DEKU_BABA:'Bio Mojo Baba',
  MINI_BABA:'Mini Baba', DESBREKO:'Desbreko', DEXIHAND:'Dexihand', DINOLFOS:'Dinolfos', DODONGO:'Dodongo',
  DRAGONFLY:'Libellule', EENO:'Eeno', EYEGORE:'Eyegore', FLOORMASTER:'Floormaster', FLYING_POT:'Pot volant',
  FREEZARD:'Freezard', GARO:'Garo', GARO_MASTER:'Maître Garo', GEKKO:'Gekko', GIANT_BEE:'Abeille géante', GOMESS:'Gomess',
  GUAY:'Guay', HIPLOOP:'Hiploop', IGOS_DU_IKANA:'Igos du Ikana', IRON_KNUCKLE:'Hache-Viande', KEESE:'Keese', LEEVER:'Leever',
  LIKE_LIKE:'Like Like', MAD_SCRUB:'Peste Mojo agressive', NEJIRON:'Nejiron', OCTOROK:'Octorok', PEAHAT:'Peahat',
  PIRATE:'Pirate', POE:'Esprit', POE_SISTER:'Sœur Esprit', REAL_BOMBCHU:'Vrai Missile Teigneux', REDEAD:'ReDead',
  SHELLBLADE:'Shellblade', SKULLFISH:'Poisson-crâne', SKULLTULA:'Skulltula', SKULLWALLTULA:'Skullwalltula',
  SNAPPER:'Snapper', STALCHILD:'Stalenfant', TAKKURI:'Takkuri', TEKTITE:'Tektite', WALLMASTER:'Wallmaster', WART:'Wart',
  WIZROBE:'Wizzrobe', WOLFOS:'Wolfos',
};

// --- Objets (Items.cpp) : noms de la version française du jeu ---
const ITEM_FR = {
  UNKNOWN:'Inconnu', NONE:'Rien', JUNK:'Babiole', TRAP:'Piège', ABILITY_SWIM:'Nage',
  ARROW_FIRE:'Flèche de Feu', ARROW_ICE:'Flèche de Glace', ARROW_LIGHT:'Flèche de Lumière',
  BLUE_POTION_REFILL:'Potion Bleue (recharge)', GREEN_POTION_REFILL:'Potion Verte (recharge)',
  RED_POTION_REFILL:'Potion Rouge (recharge)', MILK_REFILL:'Lait (recharge)', CHATEAU_ROMANI_REFILL:'Cuvée Romani (recharge)',
  GOLD_DUST_REFILL:'Poudre d’Or (recharge)', FAIRY_REFILL:'Fée', MAGIC_JAR_BIG:'Grande jarre de magie',
  MAGIC_JAR_SMALL:'Petite jarre de magie', RECOVERY_HEART:'Cœur',
  BOMB_BAG_20:'Sac de Bombes', BOMB_BAG_30:'Grand Sac de Bombes', BOMB_BAG_40:'Sac de Bombes Géant',
  BOMBCHU:'Missile Teigneux', BOMBERS_NOTEBOOK:'Journal des Bombers',
  BOTTLE_CHATEAU_ROMANI:'Bouteille de Cuvée Romani', BOTTLE_EMPTY:'Bouteille Vide', BOTTLE_GOLD_DUST:'Bouteille de Poudre d’Or',
  BOTTLE_MILK:'Bouteille de Lait', BOTTLE_RED_POTION:'Bouteille de Potion Rouge', BOW:'Arc du Brave',
  DEED_LAND:'Titre de Terre', DEED_MOUNTAIN:'Titre de Montagne', DEED_OCEAN:'Titre de l’Océan', DEED_SWAMP:'Titre de Marais',
  DEKU_NUT:'Noix Mojo', DEKU_STICK:'Bâton Mojo', DOUBLE_DEFENSE:'Double Défense', DOUBLE_MAGIC:'Pouvoir Magique accru',
  SINGLE_MAGIC:'Pouvoir Magique', FROG_BLUE:'Grenouille bleue', FROG_CYAN:'Grenouille cyan', FROG_PINK:'Grenouille rose',
  FROG_WHITE:'Grenouille blanche', GREAT_FAIRY_SWORD:'Grande Epée des Fées', GREAT_SPIN_ATTACK:'Attaque Cyclone',
  HEART_CONTAINER:'Réceptacle de Cœur', HEART_PIECE:'Quart de Cœur', HOOKSHOT:'Grappin', LENS:'Monocle de Vérité',
  LETTER_TO_KAFEI:'Lettre pour Kafei', LETTER_TO_MAMA:'Lettre Express pour Maman', MAGIC_BEAN:'Haricot Magique',
  MASK_ALL_NIGHT:'Masque de la Nuit Blanche', MASK_BLAST:'Masque d’Explosion', MASK_BREMEN:'Masque de Brême',
  MASK_BUNNY:'Masque du Lapin', MASK_CAPTAIN:'Heaume du Capitaine', MASK_CIRCUS_LEADER:'Masque du Directeur de Cirque',
  MASK_COUPLE:'Masque des Amoureux', MASK_DEKU:'Masque Mojo', MASK_DON_GERO:'Masque de Don Gero',
  MASK_FIERCE_DEITY:'Masque du Dieu Démon', MASK_GARO:'Cagoule Garo', MASK_GIANT:'Masque du Géant',
  MASK_GIBDO:'Masque de la Momie', MASK_GORON:'Masque Goron', MASK_GREAT_FAIRY:'Masque des Grandes Fées',
  MASK_KAFEIS_MASK:'Masque de Kafei', MASK_KAMARO:'Masque de Kamaro', MASK_KEATON:'Masque du Renard',
  MASK_POSTMAN:'Casquette du Facteur', MASK_ROMANI:'Masque de Romani', MASK_SCENTS:'Masque des Parfums',
  MASK_STONE:'Masque de la Pierre', MASK_TRUTH:'Masque de Vérité', MASK_ZORA:'Masque Zora', MOONS_TEAR:'Larme de Lune',
  MUSHROOM:'Champignon Magique', OCARINA:'Ocarina du Temps', OCARINA_BUTTON_A:'Touche A', OCARINA_BUTTON_C_DOWN:'Touche C bas',
  OCARINA_BUTTON_C_RIGHT:'Touche C droite', OCARINA_BUTTON_C_LEFT:'Touche C gauche', OCARINA_BUTTON_C_UP:'Touche C haut',
  PENDANT_OF_MEMORIES:'Pendentif des Amoureux', PICTOGRAPH_BOX:'Boîte à Images', POWDER_KEG:'Baril de Poudre',
  PROGRESSIVE_BOMB_BAG:'Sac de Bombes (progressif)', PROGRESSIVE_BOW:'Arc (progressif)',
  PROGRESSIVE_LULLABY:'Berceuse des Gorons (progressive)', PROGRESSIVE_MAGIC:'Magie (progressive)',
  PROGRESSIVE_SWORD:'Epée (progressive)', PROGRESSIVE_WALLET:'Bourse (progressive)', QUIVER_40:'Grand Carquois',
  QUIVER_50:'Carquois Géant', REMAINS_GOHT:'Restes de Rhork', REMAINS_GYORG:'Restes de Gyorg', REMAINS_ODOLWA:'Restes d’Odolwa',
  REMAINS_TWINMOLD:'Restes de Skorn', ROOM_KEY:'Clé de Chambre', RUPEE_BLUE:'Rubis Bleu', RUPEE_GREEN:'Rubis Vert',
  RUPEE_HUGE:'Rubis Enorme', RUPEE_PURPLE:'Rubis Violet', RUPEE_RED:'Rubis Rouge', RUPEE_SILVER:'Rubis Argenté',
  SHIELD_HERO:'Bouclier du Brave', SHIELD_MIRROR:'Bouclier Miroir', SKELETON_KEY:'Passe-partout',
  SONG_DOUBLE_TIME:'Chant du Temps Accéléré', SONG_ELEGY:'Hymne du Vide', SONG_EPONA:'Chant d’Epona',
  SONG_HEALING:'Chant de l’Apaisement', SONG_INVERTED_TIME:'Chant du Temps Inversé', SONG_LULLABY_INTRO:'Intro de la Berceuse',
  SONG_LULLABY:'Berceuse des Gorons', SONG_NOVA:'Bossa Nova des Flots', SONG_OATH:'Ode de l’Appel', SONG_SARIA:'Chant de Saria',
  SONG_SOARING:'Chant de l’Envol', SONG_SONATA:'Sonate de l’Eveil', SONG_STORMS:'Chant des Tempêtes', SONG_SUN:'Chant du Soleil',
  SONG_TIME:'Chant du Temps', SWORD_GILDED:'Lame Dorée', SWORD_KOKIRI:'Epée Kokiri', SWORD_RAZOR:'Lame Rasoir',
  TIME_PROGRESSIVE:'Temps (progressif)', TRIFORCE_PIECE:'Fragment de Triforce', TRIFORCE_PIECE_PREVIOUS:'Fragment de Triforce',
  WALLET_ADULT:'Bourse d’Adulte', WALLET_GIANT:'Bourse Géante', WALLET_TYCOON:'Bourse de Magnat',
  GS_TOKEN_OCEAN:'Jeton de Skulltula d’Or (Côte)', GS_TOKEN_SWAMP:'Jeton de Skulltula d’Or (Marais)',
};
const PLACE_OF = { CLOCK_TOWN:'Bourg-Clocher', CLOCK_TOWN_SOUTH:'Bourg-Clocher', WOODFALL:'Bois-Cascade', SNOWHEAD:'Pic des Neiges',
  GREAT_BAY:'Grande Baie', GREAT_BAY_COAST:'Plage de la Grande Baie', STONE_TOWER:'Forteresse de Pierre', ROMANI_RANCH:'Ranch Romani',
  IKANA_CANYON:'Vallée Ikana', MILK_ROAD:'Route du Lait', MOUNTAIN_VILLAGE:'Village dans la Montagne', SOUTHERN_SWAMP:'Marais du Sud',
  ZORA_CAPE:'Cap Zora' };
const TEMPLE_OF = { WOODFALL:'Bois-Cascade', SNOWHEAD:'Pic des Neiges', GREAT_BAY:'Grande Baie', STONE_TOWER:'Forteresse de Pierre' };
export function itemFr(id, en){
  const k = id.replace(/^RI_/, '');
  if (ITEM_FR[k]) return ITEM_FR[k];
  let m;
  if ((m = /^(ARROWS|BOMBCHU|BOMBS|DEKU_NUTS|DEKU_STICKS)_(\d+)$/.exec(k)))
    return m[2] + ' ' + { ARROWS:'Flèches', BOMBCHU:'Missiles Teigneux', BOMBS:'Bombes', DEKU_NUTS:'Noix Mojo', DEKU_STICKS:'Bâtons Mojo' }[m[1]];
  if ((m = /^(\w+?)_(BOSS_KEY|COMPASS|MAP|SMALL_KEY|STRAY_FAIRY)$/.exec(k)) && (TEMPLE_OF[m[1]] || m[1] === 'CLOCK_TOWN'))
    return { BOSS_KEY:'Clé d’Or', COMPASS:'Boussole', MAP:'Carte du Donjon', SMALL_KEY:'Petite Clé', STRAY_FAIRY:'Fée Perdue' }[m[2]]
      + ' (' + (TEMPLE_OF[m[1]] || 'Bourg-Clocher') + ')';
  if ((m = /^OWL_(\w+)$/.exec(k)) && PLACE_OF[m[1]]) return 'Statue de hibou (' + PLACE_OF[m[1]] + ')';
  if ((m = /^TINGLE_MAP_(\w+)$/.exec(k)) && PLACE_OF[m[1]]) return 'Carte de Tingle (' + PLACE_OF[m[1]] + ')';
  if ((m = /^SOUL_BOSS_(\w+)$/.exec(k))) return 'Âme de ' + { GOHT:'Rhork', GYORG:'Gyorg', MAJORA:'Majora', ODOLWA:'Odolwa', TWINMOLD:'Skorn' }[m[1]];
  if ((m = /^SOUL_ENEMY_(\w+)$/.exec(k)) && ENEMY_FR[m[1]]) return 'Âme : ' + ENEMY_FR[m[1]];
  if ((m = /^TIME_(DAY|NIGHT)_(\d)$/.exec(k))) return 'Temps (' + (m[1] === 'DAY' ? 'jour ' : 'nuit ') + m[2] + ')';
  throw new Error('objet sans nom français : ' + id + ' (' + en + ')');
}

// --- Checks : libellés complets (personnages, mini-jeux, boutiques…), par identifiant ---
const CHECK_FR = {
  RC_CLOCK_TOWN_SCRUB_DEED:'Peste Mojo : échange du Titre de Terre', RC_CLOCK_TOWN_BOMBERS_NOTEBOOK:'Journal des Bombers',
  RC_CLOCK_TOWN_EAST_HONEY_DARLING_ALL_DAYS:'Manège des Amoureux : les trois jours', RC_CLOCK_TOWN_EAST_HONEY_DARLING_ANY_DAY:'Manège des Amoureux : un jour',
  RC_CLOCK_TOWN_EAST_POSTMAN_HAT:'Facteur : Casquette du Facteur', RC_CLOCK_TOWN_EAST_SHOOTING_GALLERY_HIGH_SCORE:'Stand de Tir : record',
  RC_CLOCK_TOWN_EAST_SHOOTING_GALLERY_PERFECT_SCORE:'Stand de Tir : score parfait',
  RC_CLOCK_TOWN_EAST_TREASURE_CHEST_GAME_DEKU:'Chasse au Trésor (Mojo)', RC_CLOCK_TOWN_EAST_TREASURE_CHEST_GAME_GORON:'Chasse au Trésor (Goron)',
  RC_CLOCK_TOWN_EAST_TREASURE_CHEST_GAME_HUMAN:'Chasse au Trésor (Humain)', RC_CLOCK_TOWN_EAST_TREASURE_CHEST_GAME_ZORA:'Chasse au Trésor (Zora)',
  RC_CLOCK_TOWN_POSTBOX:'Boîte aux lettres', RC_CLOCK_TOWN_STRAY_FAIRY:'Fée perdue de Bourg-Clocher',
  RC_MAYORS_OFFICE_KAFEIS_MASK:'Résidence du Maire : Masque de Kafei', RC_MAYORS_OFFICE_PIECE_OF_HEART:'Résidence du Maire : quart de cœur',
  RC_MILK_BAR_CIRCUS_LEADER_MASK:'Lactel : Masque du Directeur de Cirque', RC_MILK_BAR_MADAME_AROMA:'Lactel : Madame Aroma',
  RC_MILK_BAR_PURCHASE_CHATEAU:'Lactel : achat de Cuvée Romani', RC_MILK_BAR_PURCHASE_MILK:'Lactel : achat de lait',
  RC_STOCK_POT_INN_COUPLES_MASK:'Auberge : Masque des Amoureux', RC_STOCK_POT_INN_GRANDMA_LONG_STORY:'Auberge : longue histoire de Grand-mère',
  RC_STOCK_POT_INN_GRANDMA_SHORT_STORY:'Auberge : courte histoire de Grand-mère', RC_STOCK_POT_INN_GUEST_ROOM_CHEST:'Auberge : coffre de la chambre',
  RC_STOCK_POT_INN_LETTER_TO_KAFEI:'Auberge : Lettre pour Kafei', RC_STOCK_POT_INN_ROOM_KEY:'Auberge : Clé de Chambre',
  RC_STOCK_POT_INN_STAFF_ROOM_CHEST:'Auberge : coffre du bureau', RC_STOCK_POT_INN_TOILET_HAND:'Auberge : main des toilettes',
  RC_BOMB_SHOP_ITEM_04_OR_CURIOSITY_SHOP_ITEM:'Boutique de Bombes, article 4 (ou Bazar)',
  RC_CLOCK_TOWN_WEST_BANK_ADULTS_WALLET:'Banque : Bourse d’Adulte', RC_CLOCK_TOWN_WEST_BANK_INTEREST:'Banque : intérêts',
  RC_CLOCK_TOWN_WEST_BANK_PIECE_OF_HEART:'Banque : quart de cœur', RC_CLOCK_TOWN_WEST_LOTTERY:'Loterie',
  RC_CLOCK_TOWN_WEST_POSTMAN_MINIGAME:'Facteur : jeu du chronomètre', RC_CLOCK_TOWN_WEST_SISTERS_PIECE_OF_HEART:'Sœurs danseuses : quart de cœur',
  RC_CURIOSITY_SHOP_SPECIAL_ITEM:'Bazar : article spécial', RC_SWORDSMAN_SCHOOL_PIECE_OF_HEART:'Ecole du Maître d’armes : quart de cœur',
  RC_CLOCK_TOWN_GREAT_FAIRY:'Grande Fée de Bourg-Clocher', RC_CLOCK_TOWN_GREAT_FAIRY_ALT:'Grande Fée de Bourg-Clocher (forme humaine)',
  RC_CLOCK_TOWN_NORTH_BOMB_LADY:'Vieille dame : Masque d’Explosion', RC_CLOCK_TOWN_NORTH_TREE_PIECE_OF_HEART:'Quart de cœur (arbre)',
  RC_KEATON_QUIZ:'Quiz du Renard', RC_CLOCK_TOWN_LAUNDRY_FROG:'Grenouille', RC_CLOCK_TOWN_LAUNDRY_GURU_GURU:'Guru-Guru : Masque de Brême',
  RC_KAFEIS_HIDEOUT_KEATON_MASK:'Arrière-salle du Bazar : Masque du Renard', RC_KAFEIS_HIDEOUT_LETTER_TO_MAMA:'Arrière-salle du Bazar : Lettre Express pour Maman',
  RC_KAFEIS_HIDEOUT_PENDANT_OF_MEMORIES:'Arrière-salle du Bazar : Pendentif des Amoureux',
  RC_CLOCK_TOWER_ROOF_OCARINA:'Skull Kid : Ocarina du Temps', RC_CLOCK_TOWER_ROOF_SONG_OF_TIME:'Chant du Temps',
  RC_ASTRAL_OBSERVATORY_MOON_TEAR:'Larme de Lune',
  RC_TERMINA_FIELD_BIO_BABA_GROTTO:'Grotte du Bio Mojo Baba : quart de cœur', RC_TERMINA_FIELD_GOSSIP_STONE_GROTTO:'Grotte aux pierres à potins : quart de cœur',
  RC_TERMINA_FIELD_GROTTO_SCRUB:'Peste Mojo de la grotte', RC_TERMINA_FIELD_KAMARO_MASK:'Kamaro : Masque de Kamaro',
  RC_GORMAN_MILK_PURCHASE:'Frères Gorman : achat de lait', RC_GORMAN_TRACK_GARO_MASK:'Frères Gorman : Cagoule Garo',
  RC_CREMIA_ESCORT:'Escorte de Cremia', RC_DOGGY_RACETRACK_CHEST:'Course pour Chiens : coffre',
  RC_DOGGY_RACETRACK_PIECE_OF_HEART:'Course pour Chiens : quart de cœur', RC_ROMANI_RANCH_ALIENS:'Extraterrestres (Romani)',
  RC_ROMANI_RANCH_EPONAS_SONG:'Chant d’Epona', RC_ROMANI_RANCH_GROG:'Grog : Masque du Lapin',
  RC_SWAMP_SHOOTING_GALLERY_HIGH_SCORE:'Stand de Tir des Marais : record', RC_SWAMP_SHOOTING_GALLERY_PERFECT_SCORE:'Stand de Tir des Marais : score parfait',
  RC_HAGS_POTION_SHOP_KOTAKE:'Hutte des Sorcières : Kotake', RC_SOUTHERN_SWAMP_FROG:'Grenouille',
  RC_SOUTHERN_SWAMP_SCRUB_BEANS:'Peste Mojo : haricots magiques', RC_SOUTHERN_SWAMP_SCRUB_DEED:'Peste Mojo : échange du Titre de Marais',
  RC_SOUTHERN_SWAMP_SONG_OF_SOARING:'Chant de l’Envol', RC_TOURIST_INFORMATION_ARCHERY:'Office du Tourisme : tir à l’arc en barque',
  RC_TOURIST_INFORMATION_GOOD_PHOTO:'Office du Tourisme : bonne photo', RC_TOURIST_INFORMATION_PICTOBOX:'Office du Tourisme : Boîte à Images',
  RC_SWAMP_SPIDER_HOUSE_MASK_OF_TRUTH:'Masque de Vérité', RC_DEKU_SHRINE_MASK_OF_SCENTS:'Majordome : Masque des Parfums',
  RC_DEKU_KINGS_CHAMBER_MONKEY:'Singe : Sonate de l’Eveil', RC_WOODFALL_GREAT_FAIRY:'Grande Fée de Bois-Cascade',
  RC_WOODFALL_TEMPLE_GEKKO_FROG:'Grenouille (Gekko)', RC_WOODFALL_TEMPLE_BOSS_CONTAINER:'Réceptacle de cœur',
  RC_WOODFALL_TEMPLE_BOSS_WARP:'Restes d’Odolwa', RC_MOUNTAIN_VILLAGE_DON_GERO_MASK:'Masque de Don Gero',
  RC_MOUNTAIN_VILLAGE_FROG_CHOIR:'Chorale des Grenouilles', RC_MOUNTAIN_VILLAGE_SMITHY_GILDED_SWORD:'Forgeron : Lame Dorée',
  RC_MOUNTAIN_VILLAGE_SMITHY_RAZOR_SWORD:'Forgeron : Lame Rasoir', RC_GORON_GRAVEYARD_DARMANI:'Darmani : Masque Goron',
  RC_PATH_TO_GORON_VILLAGE_LULLABY_INTRO:'Intro de la Berceuse', RC_GORON_RACETRACK_GOLD_DUST:'Course des Gorons : Poudre d’Or',
  RC_GORON_VILLAGE_MEDIGORON:'Médigoron : Baril de Poudre', RC_GORON_VILLAGE_SCRUB_BOMB_BAG:'Peste Mojo : Sac de Bombes',
  RC_GORON_VILLAGE_SCRUB_DEED:'Peste Mojo : échange du Titre de Montagne', RC_GORON_SHRINE_FULL_LULLABY:'Berceuse des Gorons',
  RC_SNOWHEAD_GREAT_FAIRY:'Grande Fée du Pic des Neiges', RC_SNOWHEAD_TEMPLE_BOSS_KEY:'Clé d’Or',
  RC_SNOWHEAD_TEMPLE_BOSS_HEART_CONTAINER:'Réceptacle de cœur', RC_SNOWHEAD_TEMPLE_BOSS_WARP:'Restes de Rhork',
  RC_GREAT_BAY_COAST_FISHERMAN_MINIGAME:'Pêcheur : jeu des Mouettes', RC_GREAT_BAY_COAST_MARINE_LAB_FISH_PIECE_OF_HEART:'Labo de Recherche Océanique : poissons',
  RC_GREAT_BAY_COAST_MIKAU:'Mikau : Masque Zora', RC_GREAT_BAY_COAST_NEW_WAVE_BOSSA_NOVA:'Bossa Nova des Flots',
  RC_OCEAN_SPIDER_HOUSE_CHEST_PIECE_OF_HEART:'Coffre (quart de cœur)', RC_OCEAN_SPIDER_HOUSE_WALLET:'Homme riche : Bourse Géante',
  RC_GREAT_BAY_GREAT_FAIRY:'Grande Fée de la Grande Baie', RC_ZORA_HALL_EVANS_PIECE_OF_HEART:'Evan : quart de cœur',
  RC_ZORA_HALL_SCENE_LIGHTS:'Projecteurs de la scène', RC_ZORA_HALL_SCRUB_DEED:'Peste Mojo : échange du Titre de l’Océan',
  RC_ZORA_HALL_SCRUB_PIECE_OF_HEART:'Peste Mojo : quart de cœur', RC_ZORA_HALL_SCRUB_POTION_REFILL:'Peste Mojo : potion',
  RC_PINNACLE_ROCK_REUNITE_SEAHORSE:'Hippocampes réunis', RC_WATERFALL_RAPIDS_BEAVER_RACE_01:'Course des castors 1',
  RC_WATERFALL_RAPIDS_BEAVER_RACE_02:'Course des castors 2', RC_GREAT_BAY_TEMPLE_BOSS_KEY:'Clé d’Or',
  RC_GREAT_BAY_TEMPLE_GEKKO_FROG:'Grenouille (Gekko)', RC_GIANTS_CHAMBER_OATH_TO_ORDER:'Ode de l’Appel (Géants)',
  RC_GREAT_BAY_TEMPLE_BOSS_HEART_CONTAINER:'Réceptacle de cœur', RC_GREAT_BAY_TEMPLE_BOSS_WARP:'Restes de Gyorg',
  RC_ROAD_TO_IKANA_STONE_MASK:'Shiro : Masque de la Pierre', RC_IKANA_GRAVEYARD_CAPTAIN_MASK:'Heaume du Capitaine',
  RC_IKANA_GRAVEYARD_GROTTO:'Grotte (coffre)', RC_BENEATH_THE_GRAVEYARD_SONG_OF_STORMS:'Chant des Tempêtes',
  RC_BENEATH_THE_GRAVEYARD_DAMPE_CHEST:'Igor : coffre', RC_IKANA_CANYON_GHOST_HUT_PIECE_OF_HEART:'Hutte des Fantômes : quart de cœur',
  RC_IKANA_CANYON_SCRUB_HUGE_RUPEE:'Peste Mojo : Rubis Enorme', RC_IKANA_CANYON_SCRUB_PIECE_OF_HEART:'Peste Mojo : quart de cœur',
  RC_IKANA_CANYON_SCRUB_POTION_REFILL:'Peste Mojo : potion', RC_IKANA_GREAT_FAIRY:'Grande Fée d’Ikana',
  RC_MUSIC_BOX_HOUSE_FATHER:'Moulin à Musique : Masque de la Momie', RC_BENEATH_THE_WELL_MIRROR_SHIELD:'Bouclier Miroir',
  RC_ANCIENT_CASTLE_OF_IKANA_BOSS:'Igos du Ikana : Hymne du Vide', RC_STONE_TOWER_TEMPLE_INVERTED_BOSS_KEY:'Clé d’Or (à l’envers)',
  RC_STONE_TOWER_TEMPLE_INVERTED_GIANT_MASK:'Masque du Géant (à l’envers)',
  RC_STONE_TOWER_TEMPLE_INVERTED_BOSS_HEART_CONTAINER:'Réceptacle de cœur', RC_STONE_TOWER_TEMPLE_INVERTED_BOSS_WARP:'Restes de Skorn',
  RC_MOON_FIERCE_DEITY_MASK:'Masque du Dieu Démon', RC_DEKU_PLAYGROUND_ALL_DAYS:'Les trois jours', RC_DEKU_PLAYGROUND_ANY_DAY:'Un jour',
  RC_GREAT_BAY_TEMPLE_COMPASS_ROOM_UNDERWATER:'Coffre sous l’eau (salle de la boussole)',
};

// --- Checks : mots et expressions des identifiants (après le préfixe de la scène) ---
// o : objet (en tête du libellé), a : qualificatif de l'objet (placé après lui), p : lieu ou précision (entre parenthèses).
// L'objet retenu est le dernier « o » ; une fée perdue (SF), une Skulltula d'or ou un drop d'ennemi est l'objet même en tête.
const W = {};
const def = (kind, list) => { for (const [k, fr] of Object.entries(list)) W[k] = [kind, fr]; };
def('o', {
  GRASS:'Herbe', KEATON_GRASS:'Herbe du Renard', POT:'Pot', CHEST:'Coffre', JAR:'Jarre', FREESTANDING_RUPEE:'Rubis au sol',
  FREESTANDING_HEART:'Cœur au sol', RUPEE:'Rubis', WONDER_ITEM:'Objet caché', LARGE_SNOWBALL:'Grosse boule de neige',
  SMALL_SNOWBALL:'Petite boule de neige', LARGE_CRATE:'Grande caisse', SMALL_CRATE:'Petite caisse', CRATE:'Caisse',
  TREE:'Arbre', BARREL:'Tonneau', BUTTERFLY:'Papillon', BEEHIVE:'Ruche', HIVE:'Ruche', PIECE_OF_HEART:'Quart de cœur',
  HEART_CONTAINER:'Réceptacle de cœur', OWL_STATUE:'Statue de hibou', TINGLE_MAP:'Carte de Tingle', COW:'Vache',
  STRAY_FAIRY:'Fée perdue', GREAT_FAIRY:'Grande Fée', SHOP_ITEM:'Article', ITEM:'Article', GUAY_RUPEE_DROP:'Rubis de Guay',
  MAP_CHEST:'Coffre de la carte', COMPASS_CHEST:'Coffre de la boussole', BOSS_KEY_CHEST:'Coffre de la Clé d’Or',
  BOW_CHEST:'Coffre de l’arc', FIRE_ARROW_CHEST:'Coffre des Flèches de Feu', ICE_ARROW_CHEST:'Coffre des Flèches de Glace',
  LIGHT_ARROW_CHEST:'Coffre des Flèches de Lumière', HOOKSHOT_CHEST:'Coffre du Grappin', SILVER_RUPEE_CHEST:'Coffre du rubis argenté',
  PIECE_OF_HEART_CHEST:'Coffre du quart de cœur', MAP_ALCOVE_CHEST:'Coffre de l’alcôve de la carte',
  TRADING_POST_SHOP_ITEM:'Troc en Trop : article', BOMB_SHOP_ITEM:'Boutique de Bombes : article',
  GORON_SHOP_ITEM:'Boutique Goron : article', ZORA_SHOP_ITEM:'Boutique Zora : article',
  HAGS_POTION_SHOP_ITEM:'Hutte des Sorcières : article',
});
def('a', {
  UPPER:'du haut', LOWER:'du bas', TOP:'du haut', BOTTOM:'du bas', LEFT:'de gauche', RIGHT:'de droite', MIDDLE:'du milieu',
  CENTER:'du centre', EARLY:'du début', FRONT:'de devant', BACK:'du fond', HIDDEN:'caché', INVISIBLE:'invisible',
  DARK:'dans le noir', UNDERWATER:'sous l’eau', SURFACE:'en surface', GUARDED:'gardé', WEBBED:'derrière une toile',
  LEDGE:'sur la corniche', ALCOVE:'dans l’alcôve', BOULDER:'sous le rocher', LENS:'du Monocle de Vérité',
  TOP_RIGHT:'en haut à droite', BOTTOM_RIGHT:'en bas à droite', UPPER_LEFT:'en haut à gauche', UPPER_RIGHT:'en haut à droite',
  LOWER_LEFT:'en bas à gauche', LOWER_RIGHT:'en bas à droite', ABOVE_WATER:'hors de l’eau', WATER:'dans l’eau',
});
def('p', {
  ROOM:'salle', MAIN_ROOM:'salle principale', MAIN:'salle principale', SECOND_ROOM:'deuxième salle', '2ND_ROOM':'deuxième salle',
  FIRST_ROOM:'première salle', THIRD_ROOM:'troisième salle', GROTTO:'grotte', COW_GROTTO:'grotte aux vaches',
  FISHERMAN_GROTTO:'grotte du pêcheur', BEAN_SALESMAN_GROTTO:'grotte du vendeur de haricots', BIO_BABA_GROTTO:'grotte du Bio Mojo Baba',
  GOSSIP_STONE_GROTTO:'grotte aux pierres à potins', PEAHAT_GROTTO:'grotte du Peahat', PILLAR_GROTTO:'grotte du pilier',
  TALL_GRASS_GROTTO:'grotte des hautes herbes', DODONGO_GROTTO:'grotte des Dodongos', TUNNEL_GROTTO:'grotte du tunnel',
  RAMP_GROTTO:'grotte de la rampe', FROZEN_GROTTO:'grotte gelée', TALL_GRASS:'hautes herbes', TREE_STUMP:'souche',
  SPRING:'printemps', WINTER:'hiver', POISON:'empoisonné', CLEARED:'purifié', CLEAR:'purifié', TOURIST:'office du tourisme',
  WOODS:'bois', ENTRANCE:'entrée', INVERTED:'à l’envers', PRE_BOSS:'avant le boss', BOSS:'salle du boss',
  CENTRAL_ROOM:'salle centrale', GREEN_PIPE:'tuyau vert', RED_PIPE:'tuyau rouge', SEWERS:'égouts', SEWERS_END:'fin des égouts',
  WATERWAY:'canal', WART:'Wart', BEFORE_WART:'avant le Wart', SWITCH_ROOM:'salle de l’interrupteur',
  RED_PIPE_SWITCH_ROOM:'salle de l’interrupteur du tuyau rouge', DUAL_SWITCHES:'deux interrupteurs',
  DUAL_SWITCHES_ROOM:'salle aux deux interrupteurs', SCARECROW:'épouvantail', LOWER_SCARECROW:'épouvantail du bas',
  HIGHER_SCARECROW:'épouvantail du haut', SPIKED_BAR_ROOM:'salle des barreaux à pointes', FOUR_SPIKED_BARS:'quatre barreaux à pointes',
  TWO_SPIKED_BARS:'deux barreaux à pointes', DAY:'jour', NIGHT:'nuit', PILLAR:'pilier', PILLARS_ROOM:'salle des piliers',
  WALL:'mur', GEKKO:'Gekko', BRIDGE:'pont', BRIDGE_ROOM:'salle du pont', BRIDGE_ROOM_AFTER:'salle du pont, après',
  WIZZROBE:'Wizzrobe', WIZZROBE_SIDE:'côté Wizzrobe', POE_WIZZROBE_SIDE:'côté Esprit et Wizzrobe', POE_MAZE_SIDE:'côté labyrinthe de l’Esprit',
  NEAR:'près de', OWL:'hibou', NEAR_OWL:'près du hibou', OWL_STATUE:'statue de hibou', STATUE:'statue',
  LEVEL:'niveau', STORAGE:'réserve', STORAGE_ROOM:'réserve', STORAGE_TOP:'haut de la réserve', COURTYARD:'cour', STOCK_POT_INN:'Auberge',
  GARO:'Garo', GARO_MASTER:'Maître Garo', BEHIND:'derrière', MAZE:'labyrinthe', WALKWAY:'passerelle',
  UPPER_WALKWAY:'passerelle du haut', ICICLE_ROOM:'salle des stalactites', END:'fin', DAMPE:'Igor',
  GOMESS:'Gomess', PATH_TO_GOMESS:'chemin vers Gomess', CUCCO_SHACK:'Hutte des Cocottes', AFTER:'après',
  TRADING_POST:'Troc en Trop', BLOCK_ROOM:'salle du bloc', BLOCK:'bloc',
  AFTER_BLOCK:'après le bloc', SNOW_ROOM:'salle de neige', POE:'Esprit', BIG_POE:'Grand Esprit', SIDE:'côté', HIGHER:'plus haut',
  LAVA_ROOM:'salle de lave', LAVA:'lave', DINOLFOS:'Dinolfos', COLORED_SKULLS:'crânes colorés', KEY:'clé',
  SWORDSMAN_SCHOOL:'Ecole du Maître d’armes', GREAT:'grand',
  POTION:'potion', CEILING:'plafond', NEAR_CEILING:'près du plafond', CEILING_EDGE:'bord du plafond', CEILING_PLANK:'planche du plafond',
  CEILING_WEB:'toile du plafond', PATH:'chemin', LIBRARY:'bibliothèque', WHEEL:'roue', WATER_WHEEL:'roue à aubes', BARS:'barreaux',
  MILK:'lait', BOMB_SHOP:'Boutique de Bombes', BIO:'Bio', DOGGY_RACETRACK:'Course pour Chiens',
  PIT:'fosse', AFTER_PIT:'après la fosse', BEFORE_PIT:'avant la fosse', KEESE:'Keese', RIGHT_FIRE_KEESE:'Keese de feu de droite',
  UPDRAFTS:'courants d’air', UPDRAFTS_BRIDGE:'pont des courants d’air', UPDRAFTS_LEDGE:'corniche des courants d’air',
  GORON:'Goron', FROG:'grenouille', PASSAGE:'passage', BARN:'étable', HAGS_POTION_SHOP:'Hutte des Sorcières',
  DUAL:'double', SWITCHES:'interrupteurs', FIRE:'feu', CAPTAIN_ROOM:'salle du capitaine',
  FOUR:'quatre', DEKU:'Mojo', ZORA:'Zora', FIELD:'pâturage', TUNNEL:'tunnel',
  MINIBOSS_ROOM:'salle du mini-boss', MINIBOSS:'mini-boss', BUBBLE:'bulle', AQUARIUM:'aquarium',
  CHEST_AQUARIUM:'aquarium du coffre', MIRRORS_ROOM:'salle des miroirs', MIRROR_ROOM:'salle des miroirs', PLATFORM:'plateforme',
  UNDER_PLATFORM:'sous la plateforme', HOUSE:'maison', NEAR_HOUSE:'près de la maison', SOFT_SOIL:'terre meuble',
  LOWER_LEFT_SOFT_SOIL:'terre meuble en bas à gauche', LOWER_RIGHT_SOFT_SOIL:'terre meuble en bas à droite', UPPER_SOFT_SOIL:'terre meuble du haut',
  UNDER:'sous', EDGE:'bord', HOLE:'trou', PICTURE:'tableau', BEHIND_PICTURE:'derrière le tableau',
  HOLE_BEHIND_PICTURE:'trou derrière le tableau', HOLE_BEHIND_CABINET:'trou derrière le meuble', CHANDELIER:'lustre', WEB:'toile',
  WEBBED_HOLE:'trou derrière une toile', WEBBED_POT:'pot derrière une toile', BATS:'chauves-souris', ARMOS:'Armos',
  EAST:'est', WEST:'ouest', WEST_GARDEN:'jardin ouest', UNDER_WEST_GARDEN:'sous le jardin ouest', CLIMB:'montée',
  SKULLTULA:'Skulltula', SKULL:'crâne', BEHIND_SKULL:'derrière le crâne', BOOKCASE:'bibliothèque', BEHIND_BOOKCASE:'derrière la bibliothèque',
  ON_CORNER_BOOKSHELF:'sur l’étagère du coin', BEHIND_BOAT:'derrière la barque', BEHIND_CRATE:'derrière la caisse', BEHIND_VINES:'derrière les lianes',
  BEAVERS:'castors', NEAR_BEAVERS:'près des castors', ON_MONUMENT:'sur le monument', MONUMENT_ROOM:'salle du monument',
  TORCH:'torche', POT_ROOM:'salle des pots', TREE_ROOM:'salle de l’arbre', GOLD_ROOM:'salle dorée', JAR_ROOM:'salle des jarres',
  ENTRANCE_LEFT_WALL:'mur gauche de l’entrée', ENTRANCE_RIGHT_WALL:'mur droit de l’entrée', ENTRANCE_WEB:'toile de l’entrée',
  WIND_ROOM:'salle du vent', JAIL:'cellule', SUN_BLOCK:'bloc du soleil', SUN_SWITCH:'interrupteur du soleil', WATER_ROOM:'salle de l’eau',
  WATER_BRIDGE:'pont de l’eau', BEFORE_WATER_BRIDGE:'avant le pont de l’eau', ACROSS_WATER:'de l’autre côté de l’eau',
  DEATH_ARMOS:'Armos de la mort', MOON:'Lune', COMPASS_ROOM:'salle de la boussole', MAP_ROOM:'salle de la carte',
  HEART_PIECE_ROOM:'salle du quart de cœur', BARREL_MAZE:'labyrinthe de tonneaux', BEEHIVE_POT:'pot de la ruche',
  EXTERIOR:'extérieur', LEFT_FIRST_ROOM:'aile gauche, première salle',
  LEFT_SECOND_ROOM:'aile gauche, deuxième salle', LEFT_THIRD_ROOM:'aile gauche, troisième salle', 
  LEFT_SIDE:'côté gauche', COW_ROOM:'salle de la vache', BOSS_UNDERWATER:'salle du boss, sous l’eau', PLAZA:'place',
  DEKU_BABA:'Mojo Baba', MAIN_DEKU_BABA:'salle principale, Mojo Baba',
  SHOOTING_GALLERY:'Stand de Tir', CENTRAL:'central', GIANT:'géant', TWIN:'jumeau',
  ENTRANCE_SWITCH:'interrupteur de l’entrée', SNOW:'neige', ICICLE:'stalactite', BLOCK_ROOM_HIDDEN:'salle du bloc',
  WATER_ROOM_UNDERWATER:'salle de l’eau, sous l’eau', CENTRAL_ROOM_UNDERWATER:'salle centrale, sous l’eau',
  COMPASS_ROOM_TUNNEL:'tunnel de la salle de la boussole', PRE_BOSS_ABOVE_WATER:'avant le boss, hors de l’eau',
  PRE_BOSS_UNDERWATER:'avant le boss, sous l’eau', NEAR_HOUSE_BACK:'près de la maison, au fond', NEAR_HOUSE_FRONT:'près de la maison, devant',
  NEAR_BOSS_KEY:'près de la Clé d’Or', CENTRAL_ROOM_NEAR_BOSS_KEY:'salle centrale, près de la Clé d’Or',
  MAN_IN_THE_TREE:'homme dans l’arbre', 
  CENTER_ACROSS_WATER:'salle centrale, de l’autre côté de l’eau', CENTER_SUN_BLOCK:'salle centrale, bloc du soleil',
  SKULLTULLA:'Skulltula', NEAR_OWL_STATUE:'près de la statue de hibou', MAZE_ROOM:'labyrinthe', BABA:'Mojo Baba', IRON_KNUCKLE:'Hache-Viande', WATERFALL:'cascade', BOE:'Boe', SCRUB:'Peste Mojo',
});
// forme autonome d'un qualificatif qui ne se rattache à rien
const ALONE = { UPPER:'en haut', LOWER:'en bas', TOP:'en haut', BOTTOM:'en bas', LEFT:'à gauche', RIGHT:'à droite',
  MIDDLE:'au milieu', CENTER:'au centre', EARLY:'au début', FRONT:'devant', BACK:'au fond', WATER:'dans l’eau' };
// pour un objet ou un qualificatif employé comme précision (entre parenthèses) : minuscule
const asPlace = s => s[0].toLowerCase() + s.slice(1);
const cap = s => s[0].toUpperCase() + s.slice(1);

// libellé français d'un nom de check (partie après la scène) ; missing : mots inconnus relevés
function composeFr(body, missing, flat){
  const t = body.split('_'), segs = [];
  for (let i = 0; i < t.length;){
    if (/^\d+$/.test(t[i])){ if (segs.length) segs[segs.length - 1].num = Number(t[i]); else segs.push({ k:'p', fr:String(Number(t[i])) }); i++; continue; }
    let hit = null;
    for (let len = Math.min(6, t.length - i); len >= 1; len--){ const k = t.slice(i, i + len).join('_'); if (W[k]){ hit = [k, len]; break; } }
    if (!hit){ missing.add(t[i]); segs.push({ k:'p', fr:t[i].toLowerCase() }); i++; continue; }
    segs.push({ k:W[hit[0]][0], fr:W[hit[0]][1], key:hit[0] }); i += hit[1];
  }
  const fmt = s => s.fr + (s.num !== undefined ? ' ' + s.num : '');
  let oi = -1;
  for (let i = segs.length - 1; i >= 0; i--) if (segs[i].k === 'o'){ oi = i; break; }
  // qualificatif qui ne touche pas l'objet (que des qualificatifs entre eux) : accroché au lieu qui le suit (« pilier du
  // haut ») ; sinon, seul, sous sa forme autonome (« à gauche »). Précision à plat (fée perdue, Skulltula d'or) : un
  // qualificatif voisin d'un objet s'y accroche (« pot du bas »).
  const near = i => oi >= 0 && segs.slice(Math.min(i, oi) + 1, Math.max(i, oi)).every(s => s.k === 'a');
  for (let i = 0; i < segs.length; i++){
    const s = segs[i];
    if (s.k !== 'a') continue;
    const o = flat && (segs[i + 1]?.k === 'o' ? segs[i + 1] : segs[i - 1]?.k === 'o' ? segs[i - 1] : null);
    if (o){ o.fr = o.fr + ' ' + fmt(s); s.k = 'x'; continue; }
    if (!flat && near(i)) continue;
    const to = segs[i + 1]?.k === 'p' ? segs[i + 1] : null;
    if (to){ to.fr = to.fr + ' ' + fmt(s); s.k = 'x'; }
    else { s.k = 'p'; s.fr = ALONE[s.key] || s.fr; }
  }
  for (let i = segs.length - 1; i >= 0; i--) if (segs[i].k === 'x'){ segs.splice(i, 1); if (i < oi) oi--; }
  if (flat) return segs.map(s => s.k === 'o' ? asPlace(fmt(s)) : fmt(s)).join(', ');
  if (oi < 0) return cap(segs.map(fmt).join(', '));
  const obj = segs[oi], used = new Set([oi]);
  const quals = [];
  for (let i = oi - 1; i >= 0 && segs[i].k === 'a'; i--){ quals.unshift(segs[i].fr); used.add(i); }
  for (let i = oi + 1; i < segs.length && segs[i].k === 'a'; i++){ quals.push(fmt(segs[i])); used.add(i); }
  const rest = segs.filter((s, i) => !used.has(i)).map(s => s.k === 'o' ? asPlace(fmt(s)) : fmt(s));
  return obj.fr + (quals.length ? ' ' + quals.join(' ') : '') + (obj.num !== undefined ? ' ' + obj.num : '')
    + (rest.length ? ' (' + rest.join(', ') + ')' : '');
}

export function checkLabels(list, report){
  const missing = new Set(), out = new Map();
  for (const c of list){
    const b = stripScene(c.id, c.scene);
    let fr = CHECK_FR[c.id], m;
    if (!fr && (m = /^(?:\w+_)?SF_(\w+)$/.exec(b))) fr = 'Fée perdue (' + composeFr(m[1], missing, true) + ')';
    else if (!fr && (m = /^(SWAMP|OCEAN)_SKULLTULA_(\w+)$/.exec(b))) fr = 'Skulltula d’or (' + composeFr(m[2], missing, true) + ')';
    else if (!fr && (m = /^ENEMY_DROP_(\w+)$/.exec(b))){ fr = 'Ennemi : ' + (ENEMY_FR[m[1]] || m[1]); if (!ENEMY_FR[m[1]]) missing.add(m[1]); }
    else if (!fr) fr = composeFr(b, missing);
    out.set(c.id, { en:readable(b), fr, body:b });
  }
  if (report) report(missing);
  else if (missing.size) throw new Error('mots sans traduction (translate.mjs) : ' + [...missing].join(' '));
  return out;
}
