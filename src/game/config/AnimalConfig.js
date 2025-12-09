export const ANIMAL_TYPES = {
  WOLF: 'Wolf',
  FOX: 'Fox',
  RABBIT: 'Rabbit',
  SHEEP: 'Sheep',
  PIG: 'Pig',
  COW: 'Cow',
  HORSE: 'Horse',
  FOXHOUND: 'Foxhound',
  WOLFHOUND: 'Wolfhound'
};

export const BASE_ANIMAL_CONFIG = {
Wolf: {
sprite: 'wolf_001',
voice: 'wolf_howl_001',
isHarmful: true,
canBreed: false,
inBank: false,
tradeable: false,
canRoll: true,
protectedBy: 'Wolfhound',
attacks: ['Rabbit', 'Sheep', 'Pig', 'Cow'] // all except Horse and dogs
},
Fox: {
sprite: 'fox_001',
voice: 'fox_bark_001',
isHarmful: true,
canBreed: false,
inBank: false,
tradeable: false,
canRoll: true,
protectedBy: 'Foxhound',
attacks: ['Rabbit']
},
Rabbit: {
sprite: 'rabbit_001',
voice: 'rabbit_squeak_001',
isHarmful: false,
canBreed: true,
inBank: true,
tradeable: true,
canRoll: true,
bankStartCount: 60
},
Sheep: {
sprite: 'sheep_001',
voice: 'sheep_baa_001',
isHarmful: false,
canBreed: true,
inBank: true,
tradeable: true,
canRoll: true,
bankStartCount: 24
},
// ... etc
};