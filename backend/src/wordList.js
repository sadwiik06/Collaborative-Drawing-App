const WORDS = {
easy:
 ['cat','dog','sun','car','house','fish','bird','flower','apple','happy'],
 medium: ['guitar','mountain','pizza','dragon','robot','castle','pirate','tiger','umbrella', 'rocket','castle','pirate','tiger','umbrella','rocket'],
 hard:['astronaut','kaleidoscope','labyrinth','photosynthesis','serendipity','xylophone','quarantine','nebula','caligraphy','hologram']
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
