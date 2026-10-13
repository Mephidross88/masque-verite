/* Walkthrough des quatre temples (page Donjons) — écrit à la main : déroulé des salles d'après un guide du jeu de base
   (Zelda's Palace, walkthrough de Majora's Mask), conditions d'après la logique de 2Ship (Regions/*.cpp, data/logic-data.js).
   Dans le randomizer, les coffres contiennent d'autres objets et l'on peut arriver avec des clés ou des objets d'avance :
   chaque étape dit ce qu'il faut avoir, l'ordre n'est qu'une route conseillée. À valider en jouant.
   WALKTHROUGHS : [{ id (donjon de DUNGEONS), fr, en, sections:[{ fr, en, steps:[{ id, rc?, fr, en }] }] }]
   - rc : check de 2Ship ; l'étape est cochée avec lui (page Checks, auto-tracking). Sans rc, ou check hors de la seed :
     étape à cocher à la main (store.game.walk), remise à zéro d'un bouton (nouveau cycle).
   - Textes : ce qu'il faut faire ; entre parenthèses, ce qu'il faut avoir. */
window.WALKTHROUGHS = [
{ id:'woodfall', fr:'Temple de Bois-Cascade', en:'Woodfall Temple', sections:[
  { fr:'Entrée', en:'Entrance', steps:[
    { id:'wf-entrance-sf', rc:'RC_WOODFALL_TEMPLE_SF_ENTRANCE', fr:'Fée perdue : la toucher d’un projectile (bulle Mojo, arc, Grappin), ou le Masque des Grandes Fées l’attire.', en:'Stray Fairy: hit it with a projectile (Deku bubble, bow, Hookshot), or the Great Fairy Mask draws it in.' },
    { id:'wf-entrance-chest', rc:'RC_WOODFALL_TEMPLE_ENTRANCE_CHEST', fr:'Coffre sur la plateforme de droite : en Mojo, de fleur en fleur (ou au Grappin).', en:'Chest on the right platform: as Deku, flower to flower (or with the Hookshot).' },
    { id:'wf-entrance-north', fr:'Porte du nord : la grande salle (eau empoisonnée).', en:'North door: the main room (poisoned water).' },
  ]},
  { fr:'Grande salle (en bas)', en:'Main room (lower level)', steps:[
    { id:'wf-main-baba', rc:'RC_WOODFALL_TEMPLE_SF_MAIN_DEKU_BABA', fr:'Fée perdue : en bas de la pente de gauche, vaincre le Mojo Baba.', en:'Stray Fairy: down the left slope, defeat the Deku Baba.' },
    { id:'wf-main-pot', rc:'RC_WOODFALL_TEMPLE_SF_MAIN_POT', fr:'Fée perdue : dans les pots du coin sud-est.', en:'Stray Fairy: in the pots in the southeast corner.' },
  ]},
  { fr:'Salle de l’eau', en:'Water room', steps:[
    { id:'wf-water-chest', rc:'RC_WOODFALL_TEMPLE_WATER_CHEST', fr:'Porte de droite : par la plateforme de gauche, le coffre (petite clé dans le jeu de base) (en Mojo, ou au Grappin).', en:'Right door: via the left platform, the chest (small key in the base game) (as Deku, or with the Hookshot).' },
    { id:'wf-water-hive', rc:'RC_WOODFALL_TEMPLE_SF_WATER_ROOM_BEEHIVE', fr:'Fée perdue dans la ruche, à gauche du coffre : la faire tomber (bulle Mojo, arc), puis le Masque des Grandes Fées.', en:'Stray Fairy in the beehive left of the chest: knock it down (Deku bubble, bow), then the Great Fairy Mask.' },
  ]},
  { fr:'Salle de la carte', en:'Map room', steps:[
    { id:'wf-map-chest', rc:'RC_WOODFALL_TEMPLE_MAP_CHEST', fr:'Porte de l’est : en Mojo, plonger dans une fleur et s’envoler sous chaque Snapper pour le retourner ; les trois vaincus, coffre de la carte.', en:'East door: as Deku, dive into a flower and take off under each Snapper to flip it; with all three defeated, map chest.' },
  ]},
  { fr:'Salle de l’arc', en:'Bow room', steps:[
    { id:'wf-water-up', fr:'Avec l’arc déjà en main, dès ce premier passage : en Mojo, monter à l’étage de la salle de l’eau (un œil à viser fait monter un ascenseur), puis la porte du Dinolfos. Sans arc : passer d’abord par le labyrinthe et la salle sombre (plus bas).', en:'With the bow already in hand, right on this first visit: as Deku, go up to the water room’s upper level (shooting an eye raises a lift), then the Dinolfos door. Without the bow: go through the maze and the dark room first (further down).' },
    { id:'wf-bow-chest', rc:'RC_WOODFALL_TEMPLE_BOW_CHEST', fr:'Vaincre le Dinolfos : coffre (arc dans le jeu de base).', en:'Defeat the Dinolfos: chest (bow in the base game).' },
    { id:'wf-bow-eye', fr:'Tirer sur l’œil : l’ascenseur monte ; en Mojo, planer vers la porte nord (arc).', en:'Shoot the eye: the lift rises; as Deku, glide to the north door (bow).' },
  ]},
  { fr:'Salle de la Clé d’Or', en:'Boss key room', steps:[
    { id:'wf-bk-chest', rc:'RC_WOODFALL_TEMPLE_BOSS_KEY_CHEST', fr:'Vaincre le Gekko (fleurs Mojo contre le Snapper, flèches au mur) : coffre (Clé d’Or dans le jeu de base).', en:'Defeat the Gekko (Deku flowers against the Snapper, arrows on the walls): chest (Boss Key in the base game).' },
    { id:'wf-bk-frog', rc:'RC_WOODFALL_TEMPLE_GEKKO_FROG', fr:'Grenouille : vaincre le Gekko en portant le Masque de Don Gero.', en:'Frog: defeat the Gekko wearing the Don Gero’s Mask.' },
  ]},
  { fr:'Grande salle : purifier l’eau', en:'Main room: cleanse the water', steps:[
    { id:'wf-torch-middle', fr:'Porte de l’ouest (en Mojo) : sur l’interrupteur, tirer une flèche à travers la torche centrale pour allumer l’autre. L’eau est purifiée, la fleur de métal monte.', en:'West door (as Deku): on the switch, shoot an arrow through the central torch to light the other one. The water is cleansed, the metal flower rises.' },
    { id:'wf-main-bubble', rc:'RC_WOODFALL_TEMPLE_SF_MAIN_BUBBLE', fr:'Au nord, fée perdue dans une bulle.', en:'To the north, Stray Fairy in a bubble.' },
    { id:'wf-center-chest', rc:'RC_WOODFALL_TEMPLE_CENTER_CHEST', fr:'Planer au coin nord-ouest : l’interrupteur fait apparaître un coffre (en Mojo).', en:'Glide to the northwest corner: the switch makes a chest appear (as Deku).' },
    { id:'wf-torch-corner', fr:'Sur la fleur qui tourne, tirer une flèche à travers la torche allumée vers celle du nord-ouest : la porte nord s’ouvre.', en:'On the spinning flower, shoot an arrow through the lit torch at the northwest one: the north door opens.' },
  ]},
  { fr:'Labyrinthe (sans arc, et ses checks)', en:'Maze room (without the bow, and its checks)', steps:[
    { id:'wf-maze-door', fr:'Retour à l’ouest : en Mojo, par les fleurs sur l’eau, la porte à petite clé (1).', en:'Back west: as Deku, over the water flowers, the small key door (1).' },
    { id:'wf-maze-skulltula', rc:'RC_WOODFALL_TEMPLE_SF_MAZE_SKULLTULA', fr:'Pousser le bloc de pierre, puis vaincre la Skulltula : fée perdue.', en:'Push the stone block, then defeat the Skulltula: Stray Fairy.' },
    { id:'wf-maze-bubble', rc:'RC_WOODFALL_TEMPLE_SF_MAZE_BUBBLE', fr:'Fée perdue dans une bulle.', en:'Stray Fairy in a bubble.' },
    { id:'wf-maze-torch', fr:'Allumer un Bâton Mojo à la torche et l’apporter à la torche éteinte du sud : la porte s’ouvre (ou Flèche de Feu).', en:'Light a Deku Stick at the torch and carry it to the unlit south torch: the door opens (or a Fire Arrow).' },
  ]},
  { fr:'Salle de la boussole', en:'Compass room', steps:[
    { id:'wf-compass-chest', rc:'RC_WOODFALL_TEMPLE_COMPASS_CHEST', fr:'Vaincre les deux libellules : coffre de la boussole.', en:'Defeat both Dragonflies: compass chest.' },
    { id:'wf-maze-hive', rc:'RC_WOODFALL_TEMPLE_SF_MAZE_BEEHIVE', fr:'Labyrinthe : fée perdue dans la ruche au-dessus du bloc (projectile ou explosif).', en:'Maze: Stray Fairy in the beehive above the block (projectile or explosive).' },
    { id:'wf-maze-web', fr:'Bâton Mojo allumé : monter la pente, allumer la torche, sauter les plateformes et brûler la toile de la porte nord.', en:'Lit Deku Stick: up the slope, light the torch, jump the platforms and burn the web on the north door.' },
  ]},
  { fr:'Salle sombre', en:'Dark room', steps:[
    { id:'wf-dark-chest', rc:'RC_WOODFALL_TEMPLE_DARK_CHEST', fr:'Vaincre les Boes : un coffre apparaît.', en:'Defeat the Boes: a chest appears.' },
    { id:'wf-dark-torches', fr:'Allumer les trois torches au Bâton Mojo : la porte s’ouvre.', en:'Light the three torches with a Deku Stick: the door opens.' },
    { id:'wf-dark-out', fr:'Ressortir à l’étage de la grande salle, voler vers le nord-est, descendre : l’interrupteur ouvre la porte voisine (le chemin du Dinolfos, sans arc).', en:'Come out on the main room’s upper level, fly northeast, go down: the switch opens the nearby door (the way to the Dinolfos, without the bow).' },
  ]},
  { fr:'Avant le boss', en:'Before the boss', steps:[
    { id:'wf-pre-left', rc:'RC_WOODFALL_TEMPLE_SF_PRE_BOSS_LEFT', fr:'Fée perdue : en Mojo, voler à gauche le long du mur sud, puis plus haut.', en:'Stray Fairy: as Deku, fly left along the south wall, then higher.' },
    { id:'wf-pre-topright', rc:'RC_WOODFALL_TEMPLE_SF_PRE_BOSS_TOP_RIGHT', fr:'Fée perdue : encore plus haut dans le même coin (en Mojo).', en:'Stray Fairy: even higher in the same corner (as Deku).' },
    { id:'wf-pre-bottomright', rc:'RC_WOODFALL_TEMPLE_SF_PRE_BOSS_BOTTOM_RIGHT', fr:'Fée perdue : depuis le bas de l’échelle, planer trois fois vers l’est le long du mur (en Mojo).', en:'Stray Fairy: from the foot of the ladder, glide east along the wall three times (as Deku).' },
    { id:'wf-pre-pillar', rc:'RC_WOODFALL_TEMPLE_SF_PRE_BOSS_PILLAR', fr:'Fée perdue : percer la bulle à l’arc, puis le Masque des Grandes Fées (en Mojo pour s’approcher).', en:'Stray Fairy: pop the bubble with the bow, then the Great Fairy Mask (as Deku to get close).' },
    { id:'wf-pre-flames', fr:'Tirer sur le diamant pour éteindre les flammes, puis planer jusqu’à la porte du boss.', en:'Shoot the diamond to put out the flames, then glide to the boss door.' },
  ]},
  { fr:'Odolwa', en:'Odolwa', steps:[
    { id:'wf-boss-door', fr:'Porte du boss : Clé d’Or (en Mojo, avec l’arc).', en:'Boss door: Boss Key (as Deku, with the bow).' },
    { id:'wf-boss-heart', rc:'RC_WOODFALL_TEMPLE_BOSS_CONTAINER', fr:'Vaincre Odolwa : réceptacle de cœur.', en:'Defeat Odolwa: Heart Container.' },
    { id:'wf-boss-warp', rc:'RC_WOODFALL_TEMPLE_BOSS_WARP', fr:'Restes d’Odolwa (téléporteur).', en:'Odolwa’s Remains (warp).' },
    { id:'wf-boss-oath', rc:'RC_GIANTS_CHAMBER_OATH_TO_ORDER', fr:'Ode de l’Appel, chez les Géants (au premier boss vaincu).', en:'Oath to Order, with the Giants (at the first boss defeated).' },
    { id:'wf-princess', fr:'Couper les lianes derrière : mettre la princesse Mojo en bouteille et la ramener au Palais Mojo.', en:'Cut the vines behind: bottle the Deku Princess and bring her back to the Deku Palace.' },
  ]},
]},
{ id:'snowhead', fr:'Temple du Pic des Neiges', en:'Snowhead Temple', sections:[
  { fr:'Entrée', en:'Entrance', steps:[
    { id:'sh-entrance-block', fr:'En Goron, casser la glace et pousser le bloc gravé ; porte de droite.', en:'As Goron, break the ice and push the carved block; right door.' },
    { id:'sh-fire-first', fr:'Beaucoup d’étapes demandent les Flèches de Feu : sans elles, faites d’abord le premier Wizzrobe (son coffre les contient dans le jeu de base), puis revenez aux étapes sautées.', en:'Many steps need Fire Arrows: without them, do the first Wizzrobe first (its chest holds them in the base game), then come back to the skipped steps.' },
  ]},
  { fr:'Salle du pont', en:'Bridge room', steps:[
    { id:'sh-bridge-under', rc:'RC_SNOWHEAD_TEMPLE_SF_BRIDGE_UNDER_PLATFORM', fr:'Fée perdue dans une bulle : à l’arc, puis le Masque des Grandes Fées.', en:'Stray Fairy in a bubble: with the bow, then the Great Fairy Mask.' },
    { id:'sh-bridge-pillar', rc:'RC_SNOWHEAD_TEMPLE_SF_BRIDGE_PILLAR', fr:'Fée perdue prise dans le pilier : projectile, puis le Masque des Grandes Fées.', en:'Stray Fairy stuck in the pillar: projectile, then the Great Fairy Mask.' },
    { id:'sh-bridge-chest', rc:'RC_SNOWHEAD_TEMPLE_BRIDGE_ROOM_CHEST', fr:'Coffre : faire fondre sa glace et brûler les Freezards (Flèches de Feu), ou au Grappin ; traverser en Goron (petite clé dans le jeu de base).', en:'Chest: melt its ice and burn the Freezards (Fire Arrows), or with the Hookshot; cross as Goron (small key in the base game).' },
    { id:'sh-bridge-cross', fr:'Franchir le vide en Goron roulé (magie), ou au Grappin et en Zora ; chemin du nord.', en:'Cross the gap as a rolling Goron (magic), or with the Hookshot as Zora; north path.' },
  ]},
  { fr:'Salle de la carte', en:'Map room', steps:[
    { id:'sh-map-sf', rc:'RC_SNOWHEAD_TEMPLE_SF_MAP_ROOM', fr:'À droite, fée perdue.', en:'On the right, Stray Fairy.' },
    { id:'sh-map-chest', rc:'RC_SNOWHEAD_TEMPLE_MAP_CHEST', fr:'Coffre de la carte.', en:'Map chest.' },
    { id:'sh-map-up', fr:'Avec les Flèches de Feu, dès ce passage : sur la dalle, une ou deux flèches sur la glace au sud, la plateforme monte vers le haut de la salle (et le 2e étage de la salle centrale).', en:'With Fire Arrows, right on this visit: on the slab, one or two arrows at the ice to the south, the platform rises to the top of the room (and the central room’s 2nd floor).' },
    { id:'sh-map-alcove', rc:'RC_SNOWHEAD_TEMPLE_MAP_ALCOVE_CHEST', fr:'Monocle de Vérité : marches invisibles jusqu’au coffre (arc, Flèches de Feu).', en:'Lens of Truth: invisible steps up to the chest (bow, Fire Arrows).' },
  ]},
  { fr:'Salle centrale et salle du bloc', en:'Central room and block room', steps:[
    { id:'sh-to-central', fr:'Sauter à l’ouest : la grande salle centrale (le pilier). Porte jaune à droite : la salle du bloc.', en:'Jump west: the large central room (the pillar). Yellow door on the right: the block room.' },
    { id:'sh-block-hidden', rc:'RC_SNOWHEAD_TEMPLE_BLOCK_ROOM_HIDDEN_CHEST', fr:'Tirer les blocs et passer derrière : coffre (petite clé dans le jeu de base).', en:'Pull the blocks and go behind them: chest (small key in the base game).' },
    { id:'sh-block-sink', fr:'Pousser les blocs tout à gauche : ils s’enfoncent et un coffre apparaît.', en:'Push the blocks all the way left: they sink and a chest appears.' },
    { id:'sh-central-bottom', rc:'RC_SNOWHEAD_TEMPLE_CENTRAL_ROOM_BOTTOM_CHEST', fr:'Au sous-sol de la salle centrale : en Goron sur l’interrupteur, un coffre apparaît.', en:'In the central room’s basement: as Goron on the switch, a chest appears.' },
    { id:'sh-block-ledge', rc:'RC_SNOWHEAD_TEMPLE_BLOCK_ROOM_LEDGE_CHEST', fr:'Pousser le bloc vers le nord, monter, la salle suivante : coffre (au Grappin ou en Zora d’en bas).', en:'Push the block north, climb up, next room: chest (with the Hookshot or as Zora from below).' },
  ]},
  { fr:'Salle des piliers', en:'Pillars room', steps:[
    { id:'sh-pillars-access', fr:'Avec les Flèches de Feu : faire fondre la glace des portes de la salle centrale (porte verte de l’ouest).', en:'With Fire Arrows: melt the ice off the central room’s doors (green west door).' },
    { id:'sh-pillars-chest', rc:'RC_SNOWHEAD_TEMPLE_PILLARS_ROOM_CHEST', fr:'Faire fondre la glace des portes ; salle verte de l’ouest : vaincre les trois ennemis, coffre (Flèches de Feu, ou en Mojo).', en:'Melt the ice off the doors; green west room: defeat the three enemies, chest (Fire Arrows, or as Deku).' },
    { id:'sh-pillars-torches', fr:'Allumer vite les trois torches : la porte sud-est s’ouvre ; en Goron, écraser la dalle pour faire monter une grande plateforme.', en:'Quickly light the three torches: the southeast door opens; as Goron, pound the slab to raise a huge platform.' },
  ]},
  { fr:'Salle de la boussole', en:'Compass room', steps:[
    { id:'sh-compass-access', fr:'Porte bleue, descendre, l’échelle ramène à la première salle : la porte d’en face s’ouvre avec une petite clé (1).', en:'Blue door, drop down, the ladder leads back to the first room: the opposite door opens with a small key (1).' },
    { id:'sh-compass-chest', rc:'RC_SNOWHEAD_TEMPLE_COMPASS_CHEST', fr:'Coffre de la boussole.', en:'Compass chest.' },
    { id:'sh-compass-ledge', rc:'RC_SNOWHEAD_TEMPLE_COMPASS_ROOM_LEDGE_CHEST', fr:'Salle de la boussole : faire fondre la glace autour de l’interrupteur (coffre) et du bloc, pousser le bloc pour l’atteindre.', en:'Compass room: melt the ice around the switch (chest) and the block, push the block to reach it.' },
    { id:'sh-compass-crate', rc:'RC_SNOWHEAD_TEMPLE_SF_COMPASS_ROOM_CRATE', fr:'Fée perdue dans la caisse sur un pilier : explosif.', en:'Stray Fairy in the crate on a pillar: explosive.' },
    { id:'sh-compass-wall', fr:'Explosif sur le mur fissuré près de l’escalier : monter au 2e étage.', en:'Explosive on the cracked wall by the stairs: up to the 2nd floor.' },
  ]},
  { fr:'Salle des stalactites', en:'Icicle room', steps:[
    { id:'sh-icicle-alcove', rc:'RC_SNOWHEAD_TEMPLE_ICICLE_ROOM_ALCOVE_CHEST', fr:'Monocle de Vérité : ouverture cachée au-dessus de la neige ; y sauter (Masque du Lapin utile) : coffre.', en:'Lens of Truth: hidden opening above the snow; jump there (Bunny Hood helps): chest.' },
    { id:'sh-icicle-chest', rc:'RC_SNOWHEAD_TEMPLE_ICICLE_ROOM_CHEST', fr:'Faire tomber les stalactites (arc, explosif), frapper la grosse boule de neige en Goron : coffre (petite clé dans le jeu de base).', en:'Bring the icicles down (bow, explosive), punch the big snowball as Goron: chest (small key in the base game).' },
  ]},
  { fr:'Salle des dalles', en:'Slab room', steps:[
    { id:'sh-dual-access', fr:'Porte à petite clé (2), à droite de la salle des stalactites.', en:'Small key door (2), on the right of the icicle room.' },
    { id:'sh-dual-sf', rc:'RC_SNOWHEAD_TEMPLE_SF_DUAL_SWITCHES', fr:'Fée perdue au plafond : Monocle de Vérité, une flèche, puis le Masque des Grandes Fées.', en:'Stray Fairy on the ceiling: Lens of Truth, an arrow, then the Great Fairy Mask.' },
    { id:'sh-dual-slabs', fr:'En Goron, écraser la dalle jaune (l’autre monte), puis la verte ; revenir vite écraser la jaune pour dégager la porte.', en:'As Goron, pound the yellow slab (the other one rises), then the green one; hurry back to pound the yellow one to clear the door.' },
  ]},
  { fr:'Le premier Wizzrobe (à tout moment)', en:'First Wizzrobe (any time)', steps:[
    { id:'sh-wiz1-access', fr:'Rouler (Goron, magie) par-dessus le vide et sur la neige jusqu’à la porte ouest.', en:'Roll (Goron, magic) across the gap and over the snow to the west door.' },
    { id:'sh-fire-arrow', rc:'RC_SNOWHEAD_TEMPLE_FIRE_ARROW_CHEST', fr:'Vaincre le Wizzrobe : coffre (Flèches de Feu dans le jeu de base).', en:'Defeat the Wizzrobe: chest (Fire Arrows in the base game).' },
  ]},
  { fr:'3e étage', en:'3rd floor', steps:[
    { id:'sh-third-access', fr:'Porte ouest, rouler sur la neige en Goron, faire fondre la glace à l’est, monter (Flèches de Feu).', en:'West door, roll over the snow as Goron, melt the ice to the east, go up (Fire Arrows).' },
    { id:'sh-central-alcove', rc:'RC_SNOWHEAD_TEMPLE_CENTRAL_ROOM_ALCOVE_CHEST', fr:'Monocle de Vérité : une fleur Mojo au nord-ouest, plus bas ; y sauter (Masque du Lapin) : coffre (en Mojo et en Goron, ou Monocle et Grappin).', en:'Lens of Truth: a Deku flower to the northwest, lower down; jump to it (Bunny Hood): chest (as Deku and Goron, or Lens and Hookshot).' },
  ]},
  { fr:'Salle de neige', en:'Snow room', steps:[
    { id:'sh-snow-access', fr:'Rouler sur la neige, porte à petite clé (3).', en:'Roll over the snow, small key door (3).' },
    { id:'sh-snow-sf', rc:'RC_SNOWHEAD_TEMPLE_SF_SNOW_ROOM', fr:'Monocle de Vérité au sud-ouest, une flèche, puis le Masque des Grandes Fées : fée perdue.', en:'Lens of Truth to the southwest, an arrow, then the Great Fairy Mask: Stray Fairy.' },
    { id:'sh-snow-out', fr:'Faire fondre la glace au nord (Flèches de Feu) : 4e étage.', en:'Melt the ice to the north (Fire Arrows): 4th floor.' },
  ]},
  { fr:'4e étage', en:'4th floor', steps:[
    { id:'sh-dino1', rc:'RC_SNOWHEAD_TEMPLE_SF_DINOLFOS_01', fr:'Vaincre le premier Dinolfos : fée perdue.', en:'Defeat the first Dinolfos: Stray Fairy.' },
    { id:'sh-dino2', rc:'RC_SNOWHEAD_TEMPLE_SF_DINOLFOS_02', fr:'Vaincre le second Dinolfos : fée perdue.', en:'Defeat the second Dinolfos: Stray Fairy.' },
    { id:'sh-boss-key', rc:'RC_SNOWHEAD_TEMPLE_BOSS_KEY', fr:'Porte de droite : vaincre le second Wizzrobe, coffre (Clé d’Or dans le jeu de base).', en:'Right door: defeat the second Wizzrobe, chest (Boss Key in the base game).' },
  ]},
  { fr:'Le pilier central', en:'The central pillar', steps:[
    { id:'sh-pillar-2', fr:'2e étage : en Goron, frapper les deux blocs bleus du pilier pour qu’ils tombent.', en:'2nd floor: as Goron, punch the pillar’s two blue blocks so they fall.' },
    { id:'sh-pillar-3', fr:'3e étage : frapper un autre bloc bleu, rouler vers l’ouest sur la neige et faire tomber le dernier.', en:'3rd floor: punch another blue block, roll west over the snow and knock the last one down.' },
    { id:'sh-pillar-top', fr:'Rouler vers le nord, frapper les boules de neige au centre, l’escalier mène au 4e étage et à la porte du boss.', en:'Roll north, punch the snowballs in the middle, the stairs lead to the 4th floor and the boss door.' },
  ]},
  { fr:'Rhork', en:'Goht', steps:[
    { id:'sh-boss-door', fr:'Porte du boss : Clé d’Or.', en:'Boss door: Boss Key.' },
    { id:'sh-boss-heart', rc:'RC_SNOWHEAD_TEMPLE_BOSS_HEART_CONTAINER', fr:'Vaincre Rhork (Flèche de Feu pour le dégeler, puis en Goron roulé) : réceptacle de cœur.', en:'Defeat Goht (a Fire Arrow to thaw it, then as a rolling Goron): Heart Container.' },
    { id:'sh-boss-warp', rc:'RC_SNOWHEAD_TEMPLE_BOSS_WARP', fr:'Restes de Rhork (téléporteur).', en:'Goht’s Remains (warp).' },
    { id:'sh-boss-oath', rc:'RC_GIANTS_CHAMBER_OATH_TO_ORDER', fr:'Ode de l’Appel, chez les Géants (au premier boss vaincu).', en:'Oath to Order, with the Giants (at the first boss defeated).' },
  ]},
]},
{ id:'greatBay', fr:'Temple de la Grande Baie', en:'Great Bay Temple', sections:[
  { fr:'Entrée et roue à aubes', en:'Entrance and water wheel', steps:[
    { id:'gb-entrance-chest', rc:'RC_GREAT_BAY_TEMPLE_ENTRANCE_CHEST', fr:'Allumer les quatre torches : coffre (Bâton Mojo ou Flèches de Feu).', en:'Light the four torches: chest (Deku Stick or Fire Arrows).' },
    { id:'gb-yellow-tap', fr:'En Zora, plonger au nord-est et pousser la vanne jaune : l’eau du tuyau jaune forme une plateforme.', en:'As Zora, dive to the northeast and push the yellow valve: the yellow pipe’s water forms a platform.' },
    { id:'gb-wheel-platform', rc:'RC_GREAT_BAY_TEMPLE_SF_WATER_WHEEL_PLATFORM', fr:'Fée perdue sous la corniche (en Zora, ou à l’arc avec le Masque des Grandes Fées).', en:'Stray Fairy under the ledge (as Zora, or with the bow and the Great Fairy Mask).' },
    { id:'gb-wheel-skulltula', rc:'RC_GREAT_BAY_TEMPLE_SF_WATER_WHEEL_SKULLTULA', fr:'Ascenseur de droite, corniche sud-ouest : vaincre la Skulltula, fée perdue.', en:'Right lift, southwest ledge: defeat the Skulltula, Stray Fairy.' },
    { id:'gb-to-central', fr:'L’autre ascenseur, le geyser, puis le tuyau vers le nord : la salle centrale.', en:'The other lift, the geyser, then the pipe to the north: the central room.' },
  ]},
  { fr:'Salle centrale (le tourbillon)', en:'Central room (the whirlpool)', steps:[
    { id:'gb-central-barrel', rc:'RC_GREAT_BAY_TEMPLE_SF_CENTRAL_ROOM_BARREL', fr:'Échelle de gauche : fée perdue dans un tonneau.', en:'Left ladder: Stray Fairy in a barrel.' },
    { id:'gb-central-pot', rc:'RC_GREAT_BAY_TEMPLE_SF_CENTRAL_ROOM_UNDERWATER_POT', fr:'Pot sous l’eau au centre : le casser, puis le Masque des Grandes Fées (ou en Zora).', en:'Underwater pot in the middle: break it, then the Great Fairy Mask (or as Zora).' },
    { id:'gb-central-flow', fr:'En Zora, se laisser porter par le courant jusqu’au passage sud-est.', en:'As Zora, ride the current to the southeast passage.' },
  ]},
  { fr:'Salle de la carte', en:'Map room', steps:[
    { id:'gb-map-chest', rc:'RC_GREAT_BAY_TEMPLE_MAP_CHEST', fr:'Plateforme du nord : coffre de la carte, au Grappin (ou Flèches de Glace).', en:'North platform: map chest, with the Hookshot (or Ice Arrows).' },
    { id:'gb-map-pot', rc:'RC_GREAT_BAY_TEMPLE_SF_MAP_ROOM_POT', fr:'Pots de l’autre côté : fée perdue (au Grappin, en Zora ou aux Flèches de Glace).', en:'Pots on the far side: Stray Fairy (with the Hookshot, as Zora or Ice Arrows).' },
    { id:'gb-baba-chest', rc:'RC_GREAT_BAY_TEMPLE_BABA_CHEST', fr:'Au fond, vers l’est : écarter les mains (nageoires), vaincre les Mojo Babas : coffre.', en:'At the bottom, to the east: get rid of the hands (fins), defeat the Deku Babas: chest.' },
  ]},
  { fr:'Salle de la boussole', en:'Compass room', steps:[
    { id:'gb-compass-tunnel-pot', rc:'RC_GREAT_BAY_TEMPLE_SF_COMPASS_ROOM_TUNNEL_POT', fr:'Pot gardé par deux mains : le casser, puis le Masque des Grandes Fées (ou en Zora).', en:'Pot guarded by two hands: break it, then the Great Fairy Mask (or as Zora).' },
    { id:'gb-compass-chest', rc:'RC_GREAT_BAY_TEMPLE_COMPASS_CHEST', fr:'Coffre de l’ouest, au Grappin : la boussole.', en:'West chest, with the Hookshot: the compass.' },
    { id:'gb-compass-underwater', rc:'RC_GREAT_BAY_TEMPLE_COMPASS_ROOM_UNDERWATER', fr:'En Zora, au fond, vaincre les ennemis : coffre (petite clé dans le jeu de base).', en:'As Zora, at the bottom, defeat the enemies: chest (small key in the base game).' },
    { id:'gb-ice-first', fr:'La suite demande les Flèches de Glace (et de Feu, et le Grappin). Sans elles, faire d’abord le Wart (plus bas) : son coffre les contient dans le jeu de base.', en:'What follows needs Ice Arrows (and Fire Arrows, and the Hookshot). Without them, do Wart first (further down): its chest holds them in the base game.' },
  ]},
  { fr:'Le Gekko', en:'Gekko', steps:[
    { id:'gb-gekko-access', fr:'Salle de la boussole, si vous avez déjà les Flèches de Glace et de Feu (sinon, revenez après le Wart) : Flèches de Glace sur l’eau pour faire un chemin au nord ; Flèche de Feu sur la glace de la porte.', en:'Compass room, if you already have Ice and Fire Arrows (otherwise, come back after Wart): Ice Arrows on the water to make a path north; a Fire Arrow on the ice by the door.' },
    { id:'gb-gekko-frog', rc:'RC_GREAT_BAY_TEMPLE_GEKKO_FROG', fr:'Grenouille : vaincre le Gekko et sa gelée (Flèches de Glace) en portant le Masque de Don Gero.', en:'Frog: defeat the Gekko and its jelly (Ice Arrows) wearing the Don Gero’s Mask.' },
    { id:'gb-boss-key', rc:'RC_GREAT_BAY_TEMPLE_BOSS_KEY', fr:'Coffre (Clé d’Or dans le jeu de base) ; sortir par la cible au plafond (Grappin).', en:'Chest (Boss Key in the base game); leave by the ceiling target (Hookshot).' },
  ]},
  { fr:'Vanne verte 1', en:'Green valve 1', steps:[
    { id:'gb-green-1', fr:'Échelle de l’est, une pale, la plateforme verte ; geler le haut de la cascade (Flèche de Glace) ; geler l’eau et pousser la vanne verte.', en:'East ladder, a blade, the green platform; freeze the top of the waterfall (Ice Arrow); freeze the water and push the green valve.' },
    { id:'gb-green-1-chest', rc:'RC_GREAT_BAY_TEMPLE_GREEN_PIPE_1_CHEST', fr:'Chemin de glace au nord-ouest, cible au plafond (Grappin) : coffre.', en:'Ice path to the northwest, ceiling target (Hookshot): chest.' },
  ]},
  { fr:'Vannes rouges : inverser le courant', en:'Red valves: reverse the flow', steps:[
    { id:'gb-red-1', fr:'Passage sud-est : geler la gelée, monter dessus, pousser la vanne rouge (Flèches de Glace).', en:'Southeast passage: freeze the jelly, climb on it, push the red valve (Ice Arrows).' },
    { id:'gb-red-2', fr:'Plateforme sud, depuis le passage rouge : geler un ennemi, sauter dessus, pousser la seconde vanne rouge (Flèches de Glace ; âme des Octoroks si les âmes sont mélangées).', en:'South platform, from the red passage: freeze an enemy, jump on it, push the second red valve (Ice Arrows; Octorok soul if souls are shuffled).' },
    { id:'gb-wheel', fr:'Salle de la roue : cible au plafond (Grappin), vanne rouge (un geyser arrête la roue), puis la vanne jaune : la roue tourne dans l’autre sens, le courant s’inverse.', en:'Wheel room: ceiling target (Hookshot), red valve (a geyser stops the wheel), then the yellow valve: the wheel turns the other way, the flow reverses.' },
  ]},
  { fr:'Passage vert (avant le boss)', en:'Green passage (before the boss)', steps:[
    { id:'gb-pre-above', rc:'RC_GREAT_BAY_TEMPLE_SF_PRE_BOSS_ABOVE_WATER', fr:'Salle centrale, passage vert au sud-est : sous la plateforme centrale, bulle au Grappin, puis le Masque des Grandes Fées.', en:'Central room, green passage to the southeast: under the central platform, a bubble with the Hookshot, then the Great Fairy Mask.' },
    { id:'gb-green-3', fr:'Sur le tuyau vert, pousser la vanne.', en:'On the green pipe, push the valve.' },
    { id:'gb-pre-under', rc:'RC_GREAT_BAY_TEMPLE_SF_PRE_BOSS_UNDERWATER', fr:'Au nord-ouest, sous l’eau : percer la bulle aux nageoires (en Zora), fée perdue.', en:'To the northwest, underwater: pop the bubble with the fins (as Zora), Stray Fairy.' },
  ]},
  { fr:'Salle des pales', en:'Blades room', steps:[
    { id:'gb-blades-access', fr:'Nouveau passage au nord-est (courant inversé) ; ascenseurs et axe tournant.', en:'New passage to the northeast (flow reversed); lifts and spinning axle.' },
    { id:'gb-green-2-low', rc:'RC_GREAT_BAY_TEMPLE_GREEN_PIPE_2_LOWER_CHEST', fr:'Grappin sur la torche du sud-est : coffre.', en:'Hookshot the torch to the southeast: chest.' },
    { id:'gb-green-2-up', rc:'RC_GREAT_BAY_TEMPLE_GREEN_PIPE_2_UPPER_CHEST', fr:'Geler la cascade (Flèche de Glace) pour arrêter les pales, l’axe, la petite roue : coffre au Grappin.', en:'Freeze the waterfall (Ice Arrow) to stop the blades, the axle, the small wheel: chest with the Hookshot.' },
  ]},
  { fr:'Salle des bascules', en:'Seesaw room', steps:[
    { id:'gb-green-3-barrel', rc:'RC_GREAT_BAY_TEMPLE_SF_GREEN_PIPE_3_BARREL', fr:'Plonger dans le trou voisin, nager dans le tonneau : fée perdue (en Zora).', en:'Dive into the nearby hole, swim into the barrel: Stray Fairy (as Zora).' },
    { id:'gb-seesaws', fr:'Flèches de Feu sur la glace au bout des bascules ; pousser la dernière vanne verte.', en:'Fire Arrows at the ice at the end of the seesaws; push the last green valve.' },
    { id:'gb-green-3-chest', rc:'RC_GREAT_BAY_TEMPLE_GREEN_PIPE_3_CHEST', fr:'Tuyau vert vers le sud, la cage de droite : coffre au Grappin (Flèches de Feu).', en:'Green pipe south, the cage on the right: chest with the Hookshot (Fire Arrows).' },
  ]},
  { fr:'Le Wart (à tout moment)', en:'Wart (any time)', steps:[
    { id:'gb-wart-access', fr:'Salle centrale, en Zora : le passage rouge au nord-ouest, le tuyau rouge, la porte à petite clé (1).', en:'Central room, as Zora: the red passage to the northwest, the red pipe, the small key door (1).' },
    { id:'gb-ice-arrow', rc:'RC_GREAT_BAY_TEMPLE_ICE_ARROW_CHEST', fr:'Vaincre le Wart : coffre (Flèches de Glace dans le jeu de base).', en:'Defeat Wart: chest (Ice Arrows in the base game).' },
  ]},
  { fr:'Gyorg', en:'Gyorg', steps:[
    { id:'gb-boss-route', fr:'Les trois vannes vertes poussées : salle centrale, passage vert au sud, le geyser mène au boss.', en:'With the three green valves pushed: central room, green passage south, the geyser leads to the boss.' },
    { id:'gb-boss-door', fr:'Porte du boss : Clé d’Or.', en:'Boss door: Boss Key.' },
    { id:'gb-boss-heart', rc:'RC_GREAT_BAY_TEMPLE_BOSS_HEART_CONTAINER', fr:'Vaincre Gyorg (arc depuis la plateforme, puis en Zora) : réceptacle de cœur.', en:'Defeat Gyorg (bow from the platform, then as Zora): Heart Container.' },
    { id:'gb-boss-warp', rc:'RC_GREAT_BAY_TEMPLE_BOSS_WARP', fr:'Restes de Gyorg (téléporteur).', en:'Gyorg’s Remains (warp).' },
    { id:'gb-boss-oath', rc:'RC_GIANTS_CHAMBER_OATH_TO_ORDER', fr:'Ode de l’Appel, chez les Géants (au premier boss vaincu).', en:'Oath to Order, with the Giants (at the first boss defeated).' },
  ]},
]},
{ id:'stoneTower', fr:'Temple de la Forteresse de Pierre', en:'Stone Tower Temple', sections:[
  { fr:'Entrée', en:'Entrance', steps:[
    { id:'st-entrance-chest', rc:'RC_STONE_TOWER_TEMPLE_ENTRANCE_CHEST', fr:'Tirer sur l’œil au nord : un coffre apparaît, l’atteindre au Grappin (arc).', en:'Shoot the eye to the north: a chest appears, reach it with the Hookshot (bow).' },
    { id:'st-light-early', fr:'Avec les Flèches de Lumière : tirer sur le soleil de l’entrée dès maintenant (débloque le coffre de l’entrée à l’envers). Elles remplacent aussi le Bouclier Miroir sur les blocs du soleil.', en:'With Light Arrows: shoot the sun in the entrance right away (unlocks the inverted entrance chest). They also replace the Mirror Shield on sun blocks.' },
    { id:'st-switch-room', fr:'Porte ouest, mur fissuré (explosif) ; interrupteurs : caisses, l’Hymne du Vide pour en tenir un, le gros interrupteur en Goron, le dernier en Zora.', en:'West door, cracked wall (explosive); switches: crates, the Elegy of Emptiness to hold one, the big switch as Goron, the last one as Zora.' },
    { id:'st-switch-floor', fr:'Explosif sur le sol : descendre par le trou.', en:'Explosive on the floor: drop through the hole.' },
    { id:'st-light-first', fr:'Sans Flèches de Lumière, le Maître Garo est le passage obligé (son coffre les contient dans le jeu de base) : le temple à l’envers et plusieurs coffres en dépendent.', en:'Without Light Arrows, the Garo Master is the way forward (its chest holds them in the base game): the inverted temple and several chests depend on it.' },
  ]},
  { fr:'Sous le jardin ouest (Armos)', en:'Under the west garden (Armos)', steps:[
    { id:'st-map-chest', rc:'RC_STONE_TOWER_TEMPLE_MAP_CHEST', fr:'Effacer le bloc du soleil au Bouclier Miroir (ou Flèche de Lumière) : coffre de la carte au Grappin.', en:'Clear the sun block with the Mirror Shield (or a Light Arrow): map chest with the Hookshot.' },
    { id:'st-armos-lava', rc:'RC_STONE_TOWER_TEMPLE_UNDER_WEST_GARDEN_LAVA_CHEST', fr:'En Goron, frapper deux fois chaque Armos contre le mur : coffre sur la lave (petite clé dans le jeu de base) (âme des Armos si les âmes sont mélangées).', en:'As Goron, punch each Armos twice into the wall: chest on the lava (small key in the base game) (Armos soul if souls are shuffled).' },
    { id:'st-armos-ledge', rc:'RC_STONE_TOWER_TEMPLE_UNDER_WEST_GARDEN_LEDGE_CHEST', fr:'Cible au plafond au nord-ouest (Grappin) : coffre.', en:'Ceiling target to the northwest (Hookshot): chest.' },
  ]},
  { fr:'Le bassin (est)', en:'The pool (east)', steps:[
    { id:'st-shallow-access', fr:'Porte de l’est : petite clé (1) ; plonger en Zora au fond du bassin.', en:'East door: small key (1); dive as Zora to the bottom of the pool.' },
    { id:'st-shallow-across', rc:'RC_STONE_TOWER_TEMPLE_CENTER_ACROSS_WATER_CHEST', fr:'Détruire les mines, l’interrupteur sur la corniche : coffre (petite clé dans le jeu de base) (en Zora).', en:'Destroy the mines, the switch on the ledge: chest (small key in the base game) (as Zora).' },
    { id:'st-west-sun', fr:'Avec les Flèches de Lumière, dès ce passage : en Zora, la corniche de l’ouest ; Flèche de Lumière sur le bloc du soleil (Masque de Pierre).', en:'With Light Arrows, right on this visit: as Zora, the west ledge; a Light Arrow at the sun block (Stone Mask).' },
    { id:'st-shallow-sun', rc:'RC_STONE_TOWER_TEMPLE_CENTER_SUN_BLOCK_CHEST', fr:'Coffre derrière le bloc du soleil (en Zora, Flèches de Lumière).', en:'Chest behind the sun block (as Zora, Light Arrows).' },
    { id:'st-deep-switch', fr:'Plus loin sous l’eau : l’interrupteur fait apparaître un coffre au plafond.', en:'Further underwater: the switch makes a chest appear on the ceiling.' },
  ]},
  { fr:'Salle des miroirs', en:'Mirror room', steps:[
    { id:'st-mirror-eye', fr:'Tirer sur l’œil au nord : un coffre au plafond.', en:'Shoot the eye to the north: a ceiling chest.' },
    { id:'st-compass', rc:'RC_STONE_TOWER_TEMPLE_COMPASS_CHEST', fr:'Bouclier Miroir : renvoyer la lumière sur le miroir (10 s), puis vers le bloc du soleil ; coffre de gauche : la boussole (ou Flèches de Lumière).', en:'Mirror Shield: reflect light onto the mirror (10 s), then at the sun block; left chest: the compass (or Light Arrows).' },
    { id:'st-deep-sun', rc:'RC_STONE_TOWER_TEMPLE_WATER_SUN_SWITCH_CHEST', fr:'Coffre sous l’eau, une fois l’interrupteur du soleil activé : Flèches de Lumière et de Glace ici, dès ce passage, ou plus tard depuis le temple à l’envers (en Zora).', en:'Underwater chest, once the sun switch is on: Light and Ice Arrows here, right on this visit, or later from the inverted temple (as Zora).' },
    { id:'st-mirror-access', fr:'Porte du nord : petite clé (2).', en:'North door: small key (2).' },
  ]},
  { fr:'Salle des piliers miroirs', en:'Mirror pillar room', steps:[
    { id:'st-mirror-right', rc:'RC_STONE_TOWER_TEMPLE_MIRRORS_ROOM_RIGHT_CHEST', fr:'En Goron, frapper le pilier ; monter, Masque de Pierre, renvoyer la lumière sur les soleils de l’est : coffre (Bouclier Miroir, ou Flèches de Lumière).', en:'As Goron, punch the pillar; climb up, Stone Mask, reflect light onto the eastern suns: chest (Mirror Shield, or Light Arrows).' },
    { id:'st-mirror-center', rc:'RC_STONE_TOWER_TEMPLE_MIRRORS_ROOM_CENTER_CHEST', fr:'Lumière du pilier central sur le bloc du soleil ; à l’est : coffre.', en:'Light from the central pillar onto the sun block; to the east: chest.' },
    { id:'st-mirror-north', fr:'Miroir de gauche vers le mur, puis vers le bloc du soleil du nord : porte suivante.', en:'Left mirror onto the wall, then at the northern sun block: next door.' },
  ]},
  { fr:'Salle du vent et de la lave', en:'Wind and lava room', steps:[
    { id:'st-wind-ledge', rc:'RC_STONE_TOWER_TEMPLE_WIND_ROOM_LEDGE_CHEST', fr:'En Mojo, planer à gauche avec les courants d’air : coffre.', en:'As Deku, glide left with the updrafts: chest.' },
    { id:'st-wind-jail', rc:'RC_STONE_TOWER_TEMPLE_WIND_ROOM_JAIL_CHEST', fr:'En Goron, sauter dans la lave et écraser la dalle près de l’entrée, puis rouler à l’interrupteur avant le retour des flammes : coffre.', en:'As Goron, jump into the lava and pound the slab near the entrance, then roll to the switch before the flames come back: chest.' },
  ]},
  { fr:'Maître Garo (à tout moment)', en:'Garo Master (any time)', steps:[
    { id:'st-light-arrow', rc:'RC_STONE_TOWER_TEMPLE_LIGHT_ARROW_CHEST', fr:'Échelle du sud-est, courants d’air en Mojo, porte : vaincre le Maître Garo, coffre (Flèches de Lumière dans le jeu de base).', en:'Southeast ladder, updrafts as Deku, door: defeat the Garo Master, chest (Light Arrows in the base game).' },
  ]},
  { fr:'Salles du sud', en:'Southern rooms', steps:[
    { id:'st-before-bridge', rc:'RC_STONE_TOWER_TEMPLE_BEFORE_WATER_BRIDGE_CHEST', fr:'Explosif au-dessus du diamant sous la plateforme suspendue, descendre au nord : coffre (puis Grappin pour remonter).', en:'Explosive above the diamond under the hanging platform, drop north: chest (then the Hookshot to climb back).' },
    { id:'st-bridge-chest', rc:'RC_STONE_TOWER_TEMPLE_WATER_BRIDGE_CHEST', fr:'Porte du sud : vaincre l’Eyegore (bouclier levé, puis Flèches de Lumière dans l’œil jaune) : coffre.', en:'South door: defeat the Eyegore (shield up, then Light Arrows in its yellow eye): chest.' },
  ]},
  { fr:'Retourner la forteresse', en:'Invert the tower', steps:[
    { id:'st-invert', fr:'Dehors (Flèches de Lumière, dès qu’on les a) : sur le premier bloc, se retourner et tirer sur l’emblème rouge. Plus tard, l’Hymne du Vide remet les blocs en place.', en:'Outside (Light Arrows, as soon as you have them): on the first block, turn around and shoot the red emblem. Later, the Elegy of Emptiness puts the blocks back.' },
  ]},
  { fr:'À l’envers : 1er étage', en:'Inverted: first floor', steps:[
    { id:'st-inv-entrance', rc:'RC_STONE_TOWER_TEMPLE_INVERTED_ENTRANCE_CHEST', fr:'Au symbole de Majora, se retourner : Flèche de Lumière sur le soleil au-dessus, un coffre apparaît.', en:'At the Majora symbol, turn around: a Light Arrow at the sun above, a chest appears.' },
    { id:'st-inv-wind-access', fr:'Porte de l’est : Flèche de Lumière sur le bloc du soleil, fleur Mojo pour traverser vers le nord.', en:'East door: a Light Arrow at the sun block, a Deku flower to cross north.' },
    { id:'st-inv-east-low', rc:'RC_STONE_TOWER_TEMPLE_INVERTED_EAST_LOWER_CHEST', fr:'Flèche de Feu sur l’œil derrière soi : un coffre ; courants d’air en Mojo jusqu’à l’alcôve du nord.', en:'A Fire Arrow at the eye behind you: a chest; updrafts as Deku up to the north alcove.' },
    { id:'st-inv-east-up', rc:'RC_STONE_TOWER_TEMPLE_INVERTED_EAST_UPPER_CHEST', fr:'Plateforme de l’interrupteur bleu : marcher dessus, jouer l’Hymne du Vide, planer au nord : coffre (en Mojo).', en:'Blue switch platform: step on it, play the Elegy of Emptiness, glide north: chest (as Deku).' },
  ]},
  { fr:'À l’envers : 2e étage', en:'Inverted: second floor', steps:[
    { id:'st-inv-east-mid', rc:'RC_STONE_TOWER_TEMPLE_INVERTED_EAST_MIDDLE_CHEST', fr:'Au nord, l’interrupteur fait apparaître un coffre dans la salle précédente (petite clé dans le jeu de base) (en Mojo).', en:'To the north, the switch makes a chest appear in the previous room (small key in the base game) (as Deku).' },
    { id:'st-inv-sun', fr:'Coin nord-ouest : Flèche de Lumière sur le soleil au sud (il débloque aussi le coffre sous l’eau du temple à l’endroit) ; porte à petite clé (3).', en:'Northwest corner: a Light Arrow at the sun to the south (it also unlocks the upright temple’s underwater chest); small key door (3).' },
  ]},
  { fr:'À l’envers : 3e étage', en:'Inverted: third floor', steps:[
    { id:'st-inv-flip', fr:'Flèche de Lumière sur la pierre rouge : la salle se retourne ; traverser en Goron, rouvrir la porte avec une autre flèche.', en:'A Light Arrow at the red stone: the room flips; cross as Goron, reopen the door with another arrow.' },
    { id:'st-inv-block', fr:'Pousser le bloc vers sa marque en retournant la salle à chaque fois (pierre rouge) jusqu’à dégager la porte.', en:'Push the block toward its mark, flipping the room each time (red stone), until the door is clear.' },
    { id:'st-inv-wizzrobe', rc:'RC_STONE_TOWER_TEMPLE_INVERTED_WIZZROBE_CHEST', fr:'Vaincre le Wizzrobe : coffre du nord-ouest au Grappin.', en:'Defeat the Wizzrobe: northwest chest with the Hookshot.' },
  ]},
  { fr:'À l’envers : en bas (les Poes)', en:'Inverted: lower level (Poes)', steps:[
    { id:'st-inv-death-armos', rc:'RC_STONE_TOWER_TEMPLE_INVERTED_DEATH_ARMOS_CHEST', fr:'Fleurs Mojo vers le sud-est ; Masque de Pierre, interrupteur bleu : un coffre à l’ouest, Hymne du Vide et Grappin (petite clé dans le jeu de base) (en Mojo).', en:'Deku flowers to the southeast; Stone Mask, blue switch: a chest to the west, Elegy of Emptiness and Hookshot (small key in the base game) (as Deku).' },
    { id:'st-inv-to-gomess', fr:'Salle des Poes, porte de droite : détruire les pics au Grappin, planer, le couloir des crânes.', en:'Poe room, right door: destroy the spikes with the Hookshot, glide, the skull corridor.' },
  ]},
  { fr:'Gomess', en:'Gomess', steps:[
    { id:'st-boss-key', rc:'RC_STONE_TOWER_TEMPLE_INVERTED_BOSS_KEY', fr:'Vaincre le Gomess (Flèches de Lumière contre ses chauves-souris) : porte de l’est, coffre (Clé d’Or dans le jeu de base).', en:'Defeat Gomess (Light Arrows against its bats): east door, chest (Boss Key in the base game).' },
  ]},
  { fr:'Vers le boss', en:'To the boss', steps:[
    { id:'st-inv-bridge-access', fr:'Retour vers l’ouest, les mines, au nord puis à l’ouest ; Masque de Pierre, interrupteur : un coffre au plafond, au Grappin. Porte à petite clé (4).', en:'Back west, the mines, north then west; Stone Mask, switch: a ceiling chest, with the Hookshot. Small key door (4).' },
    { id:'st-giant-mask', rc:'RC_STONE_TOWER_TEMPLE_INVERTED_GIANT_MASK', fr:'Vaincre l’Eyegore (bouclier, Flèches de Lumière) : coffre (Masque du Géant dans le jeu de base).', en:'Defeat the Eyegore (shield, Light Arrows): chest (Giant’s Mask in the base game).' },
    { id:'st-boss-door', fr:'Les pics (Grappin), le Beamos (explosif), porte du boss : Clé d’Or, puis sauter dans le vide.', en:'The spikes (Hookshot), the Beamos (explosive), boss door: Boss Key, then jump into the void.' },
  ]},
  { fr:'Skorn', en:'Twinmold', steps:[
    { id:'st-boss-heart', rc:'RC_STONE_TOWER_TEMPLE_INVERTED_BOSS_HEART_CONTAINER', fr:'Vaincre Skorn avec le Masque du Géant : réceptacle de cœur.', en:'Defeat Twinmold with the Giant’s Mask: Heart Container.' },
    { id:'st-boss-warp', rc:'RC_STONE_TOWER_TEMPLE_INVERTED_BOSS_WARP', fr:'Restes de Skorn (téléporteur).', en:'Twinmold’s Remains (warp).' },
    { id:'st-boss-oath', rc:'RC_GIANTS_CHAMBER_OATH_TO_ORDER', fr:'Ode de l’Appel, chez les Géants (au premier boss vaincu).', en:'Oath to Order, with the Giants (at the first boss defeated).' },
  ]},
  { fr:'Retour à l’endroit', en:'Back upright', steps:[
    { id:'st-revert', fr:'Remettre la forteresse à l’endroit (Flèche de Lumière sur l’emblème rouge).', en:'Turn the tower upright again (a Light Arrow at the red emblem).' },
    { id:'st-switch-chest', rc:'RC_STONE_TOWER_TEMPLE_ENTRANCE_SWITCH_CHEST', fr:'Entrée : sauter au centre, coffre (débloqué par l’interrupteur à côté de l’entrée, à l’envers).', en:'Entrance: jump to the middle, chest (unlocked by the switch beside the inverted entrance).' },
  ]},
]},
];
