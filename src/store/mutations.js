
export default {
    updateData: (state, options) =>
        state[options.type].data = Object.freeze(options.data),
    updateUserData: (state, data) => state.user = data,
    changeView: (state, view) => {
        if (state.view.pre === view) return;
        state.view.prev = state.view.pre;
        state.view.pre = view;
        setTimeout(() => {
            document.getElementById(state.view.prev.includes('user') ?
                'user' : state.view.prev).style.zIndex = -2
        }, 500);
        document.getElementById(state.view.pre.includes('user') ?
            'user' : state.view.pre).style.zIndex = 2;
    },
    changeViewVol: (state, vol) => state.view.vol = vol,
    changeVolType: (state, type) => state.vols.type = type,
    loadMoreVols: (state, options) => {
        if (options.init)
            return state.vols.index = 18;
        const preIndex = state.vols.index;
        if (preIndex + 18 >= options.max)
            state.vols.index = options.max;
        else state.vols.index = preIndex + 18
    },
    loadMoreSingles: (state, options) => {
        if (options.init)
            return state.singles.index = 18;
        const preIndex = state.singles.index;
        if (preIndex + 18 >= state.singles.data.length)
            state.singles.index = state.singles.data.length;
        else state.singles.index = preIndex + 18
    },
    play:(state, {options, getters, commit}) => {
        if (options.type) {
            state.play.type = options.type;
            if (options.type === 'vol' || options.type === 'likedVol')
                state.play.vol = options.data;
        }
        state.play.index = options.index;
        state.play.playing = true;

        if (!state.play.audio) {
            state.play.audio = new Audio();
            addAudioEvent.bind(this)(state.play.audio, getters, commit);
        }
        const audio = state.play.audio;
        audio.pause();
        audio.src = getters.playData.url;
        audio.volume = state.play.volume / 100;
        audio.load();
    },
    toggle: state => {
        if (!state.play.audio) return;
        if (state.play.playing) {
            state.play.playing = false;
            state.play.audio.pause();
        }
        else
            (state.play.playing = true) && state.play.audio.play();
    },
    control: (state, {type, getters, commit}) => {
        if (!state.play.audio) return;
        let index = state.play.index;
        if (state.play.mode === 1) do {
            index = (index + Math.ceil(Math.random() * 30)) % getters.playList.length;
        } while (index === state.play.index);
        else if (type === 'next')
            index = index + 1 === getters.playList.length ?
                0 : index + 1;
        else index = index - 1 === -1 ?
                getters.playList.length - 1 : index - 1;
        const options = { index : index };
        commit('play', {options, getters})
    },
    changePlayMode: state => state.play.mode === 2 ?
        state.play.mode = 0 : state.play.mode ++,
    changePlayRatio: (state, ratio) => state.play.audio.currentTime =
        state.play.audio.duration * ratio / 100,
    changePlayVolume: (state, volume) => {
        state.play.audio.volume = volume / 100;
        state.play.volume = volume;
    },
    updateTime: (state, {type, value}) => state.play.time[type] = value,
}


function addAudioEvent(audio, getters, commit) {
    audio.addEventListener('canplay', event => event.target.play());
    audio.addEventListener('durationchange', event =>
        commit('updateTime', {
            type: 'total',
            value: event.target.duration
        })
    );
    audio.addEventListener('timeupdate', event =>
        commit('updateTime', {
            type: 'current',
            value: event.target.currentTime,
        })
    );
    audio.addEventListener('ended', () =>
        commit('control', {type: 'next', getters, commit}));
}