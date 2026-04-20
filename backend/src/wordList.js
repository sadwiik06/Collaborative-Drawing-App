const WORDS = {
  easy: [
    'cat', 'dog', 'sun', 'car', 'house', 'fish', 'bird', 'flower', 'apple', 'happy',
    'moon', 'star', 'tree', 'ball', 'hat', 'shoe', 'eye', 'nose', 'mouth', 'hand',
    'leg', 'arm', 'bed', 'chair', 'table', 'cup', 'plate', 'spoon', 'fork', 'knife',
    'book', 'pen', 'paper', 'clock', 'phone', 'computer', 'tv', 'remote', 'door', 'window',
    'wall', 'floor', 'ceiling', 'lamp', 'light', 'rug', 'pillow', 'blanket', 'towel', 'soap',
    'toothbrush', 'toothpaste', 'shampoo', 'comb', 'mirror', 'picture', 'frame', 'vase', 'plant', 'flowerpot'
  ],
  medium: [
    'guitar', 'mountain', 'pizza', 'dragon', 'robot', 'castle', 'pirate', 'tiger', 'umbrella', 'rocket',
    'elephant', 'giraffe', 'kangaroo', 'penguin', 'zebra', 'lion', 'monkey', 'snake', 'crocodile', 'dolphin',
    'whale', 'shark', 'octopus', 'jellyfish', 'seahorse', 'butterfly', 'dragonfly', 'ladybug', 'spider', 'scorpion',
    'volcano', 'waterfall', 'desert', 'jungle', 'ocean', 'island', 'cave', 'bridge', 'tower', 'skyscraper',
    'airplane', 'helicopter', 'submarine', 'spaceship', 'train', 'truck', 'tractor', 'bulldozer', 'crane', 'forklift',
    'piano', 'violin', 'drums', 'flute', 'trumpet', 'saxophone', 'microphone', 'headphones', 'speaker', 'amplifier',
    'wizard', 'witch', 'ghost', 'vampire', 'werewolf', 'zombie', 'fairy', 'elf', 'dwarf', 'giant',
    'knight', 'archer', 'mage', 'thief', 'assassin', 'paladin', 'druid', 'necromancer', 'bard', 'monk'
  ],
  hard: [
    'astronaut', 'kaleidoscope', 'labyrinth', 'photosynthesis', 'serendipity', 'xylophone', 'quarantine', 'nebula', 'calligraphy', 'hologram',
    'onomatopoeia', 'sesquipedalian', 'floccinaucinihilipilification', 'pseudopseudohypoparathyroidism', 'antidisestablishment', 'counterrevolution', 'electroencephalograph', 'spectrophotometer', 'chromatography', 'deoxyribonucleic',
    'bioluminescence', 'cryptocurrency', 'extraterrestrial', 'inconspicuous', 'juxtaposition', 'mnemonic', 'neuroscience', 'omnipotent', 'philanthropist', 'quintessential',
    'rhapsody', 'subterranean', 'transcendental', 'ubiquitous', 'vociferous', 'whippersnapper', 'xenophobia', 'yesterday', 'zeppelin', 'alphabet',
    'battleship', 'chrysanthemum', 'dichotomy', 'ephemeral', 'facetious', 'gregarious', 'hypotenuse', 'idiosyncrasy', 'jackhammer', 'kleptomaniac',
    'lollipop', 'mellifluous', 'nomenclature', 'obfuscate', 'picturesque', 'quizzical', 'rhinoceros', 'shenanigan', 'tintinnabulation', 'unrequited'
  ]
};

function getRandomWord(difficulty="medium"){
    const list=WORDS[difficulty] || WORDS.medium;
    return list[Math.floor(Math.random()*list.length)];
}

function getWordOptions(difficulty='medium'){
    const list = WORDS[difficulty] || WORDS.medium;
    const shuffled = [...list];
    for(let i=shuffled.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];

    }
    return shuffled.slice(0,3);


}
module.exports = {WORDS,getRandomWord,getWordOptions};
