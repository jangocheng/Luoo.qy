import {action, computed, observable} from "mobx";
import {Howl, Howler} from 'howler';
import {volStore} from "./vol";
import {
    ArticleInfo,
    ArticleTrack,
    PlayingMode,
    PlayingStatus,
    PlayingTypes,
    Single,
    Track,
    VolInfo,
    VolTrack
} from "../types";
import {singleStore} from "./single";
import {articleStore} from "./article";

let ipc: IpcObject;

class PlayerStore {
    @action
    init = async (IPC: IpcObject) => {
        ipc = IPC;
    };

    /*
    * @desc Vol
     */
    @observable
    public playingVolId: number = volStore.allVols[0].id;

    @observable
    public playingVolTrackIndex: number = 0;

    @computed
    private get playingVol(): VolInfo {
        return volStore.allVols.find(vol => vol.id === this.playingVolId) as VolInfo;
    }

    @computed
    private get playingVolTrack(): VolTrack {
        const { tracks } = this.playingVol;
        return tracks[this.playingVolTrackIndex];
    }

    /*
    * @desc Single
     */
    @observable
    private playingSingleIndex: number = 0;

    @computed
    private get playingSingle(): Single {
        return singleStore.singles[this.playingSingleIndex];
    }

    /*
    * @desc Article
     */
    @observable
    private playingArticleIndex: number = 0;

    @observable
    private playingArticleTrackIndex: number = 0;

    @computed
    private get playingArticle(): ArticleInfo {
        return articleStore.articles[this.playingArticleIndex];
    }

    @computed
    private get playingArticleTrack(): ArticleTrack {
        return this.playingArticle.tracks[this.playingArticleTrackIndex];
    }

    /*
    * @desc Playing
     */
    @computed
    public get playingInfo(): Track {
        switch (this.playingType) {
            case PlayingTypes.VOL: return this.playingVolTrack;
            case PlayingTypes.SINGLE: return this.playingSingle;
            case PlayingTypes.ARTICLE: return this.playingArticleTrack;
        }
    }

    @observable
    public playingStatus: PlayingStatus = PlayingStatus.STOP;

    @observable
    public playingMode: PlayingMode = PlayingMode.ORDER;

    @observable
    public playingType: PlayingTypes = PlayingTypes.VOL;

    /*
    * @desc Duration
     */
    @observable
    public playedTime: number = 33;

    @observable
    public totalTime: number = 100;

    @computed
    public get formatedPlayedTime() {
        return formatPlayingTime(this.playedTime);
    }

    @computed
    public get formatedTotalTime() {
        return formatPlayingTime(this.totalTime);
    }

    @computed
    get playingProgress(): number {
        return Math.ceil((this.playedTime / this.totalTime) * 100);
    }

    /*
    * @desc Control
     */
    @action
    public playVolTrack(volId: number, trackIndex: number = 0) {
        this.playingVolId = volId;
        this.playingVolTrackIndex = trackIndex;
        this.playingStatus = PlayingStatus.PLAYING;
    }

    @action
    public play() {
        this.playingStatus = PlayingStatus.PLAYING;
    }

    @action
    public pause() {
        this.playingStatus = PlayingStatus.PAUSE;
    }

    @action
    public next() {
        switch (this.playingType) {
            case PlayingTypes.VOL: {
                const { tracks } = this.playingVol;
                if (tracks.length === 1) return;

                if (this.playingVolTrackIndex + 1 === tracks.length) {
                    this.playingVolTrackIndex = 0;
                } else {
                    this.playingVolTrackIndex += 1;
                }
                break;
            }
        }
        this.playingStatus = PlayingStatus.PLAYING;
    }

    @action
    public pre() {
        switch (this.playingType) {
            case PlayingTypes.VOL: {
                const { tracks } = this.playingVol;
                if (tracks.length === 1) return;

                if (this.playingVolTrackIndex === 0) {
                    this.playingVolTrackIndex = tracks.length - 1;
                } else {
                    this.playingVolTrackIndex -= 1;
                }
                break;
            }
        }
        this.playingStatus = PlayingStatus.PLAYING;
    }
}

function formatPlayingTime(time: number): string {
    let minutes: number | string = Math.floor(time / 60);
    let seconds: number | string = time - (minutes * 60);

    if (minutes < 10) {minutes = "0" + minutes;}
    if (seconds < 10) {seconds = "0" + seconds;}
    return `${minutes}:${seconds}`;
}


const playerStore = new PlayerStore();

export { playerStore };
