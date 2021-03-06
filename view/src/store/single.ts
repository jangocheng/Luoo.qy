import { action, computed, observable } from "mobx";
import {events, EventTypes, genRange, getIPC, promiseWrapper} from "../utils";
import { store } from "./index";
import { ViewTypes, Single } from "../@types";


const ipc: IpcObject = getIPC();

class SingleStore {
  @action
  init = async () => {
    this.updateSingles(await ipc.db.single.getSingles());
    setTimeout(() => {
      this.updateFromCGI().catch(console.error);
    }, 10);
  };

  @action
  private updateFromCGI = async () => {
    const latestSingle = await ipc.db.single.getLatestSingle();
    const [singles, error] = await promiseWrapper(
      ipc.request.requestSingles(latestSingle ? latestSingle.date + 1 : 0)
    );

    if (error) {
      throw error;
    }

    if (singles && singles.length > 0) {
      await ipc.db.single.saveSingles(singles);
    }

    this.updateSingles(await ipc.db.single.getSingles());
  };

  @action
  private updateSingles = (singles: Single[]) => {
    const readonlySingles = singles.map(i => Object.freeze(i));
    this.singles = Object.freeze(readonlySingles);
  };

  @observable
  public singles: ReadonlyArray<Single> = [];

  protected singlePageScale = 3 * 4;

  @observable
  public singleCurrentPage: number = 0;

  @computed
  public get singleTotalPage(): number {
    return Math.ceil(this.singles.length / this.singlePageScale);
  }

  @computed
  public get displaySingles(): Single[] {
    const start = this.singleCurrentPage * this.singlePageScale;
    const end = Math.min(
      (this.singleCurrentPage + 1) * this.singlePageScale,
      this.singles.length
    );
    return this.singles.slice(start, end);
  }

  @action
  public toggleSingleIndex = (page: number) => {
    events.emit(EventTypes.ScrollBackSingles, true);
    this.singleCurrentPage = page;
  };

  protected paginationScale = 9;

  @observable
  public singlePaginationCurrentIndex: number = 0;

  @computed
  public get singlePaginationTotalIndex(): number {
    return Math.ceil(this.singleTotalPage / this.paginationScale);
  }

  @computed
  public get displaySinglePaginations(): number[] {
    const start = this.singlePaginationCurrentIndex * this.paginationScale;
    const end = Math.min(
      (this.singlePaginationCurrentIndex + 1) * this.paginationScale,
      this.singleTotalPage
    );
    return genRange(start, end);
  }

  @action
  public nextSinglePagination = () => {
    this.singlePaginationCurrentIndex += 1;
  };

  @action
  public preSinglePagination = () => {
    this.singlePaginationCurrentIndex -= 1;
  };

  @observable
  private selectedSingleIndex: number = 0;

  @computed
  public get selectedSingle(): Single {
    return this.displaySingles[this.selectedSingleIndex];
  }

  @action
  public selectSingle = (singleIndex: number) => {
    this.selectedSingleIndex = singleIndex;
    store.changeView(ViewTypes.SINGLE_INFO);
    store.changeBackground(ViewTypes.SINGLES);
  };

  @action
  public selectSingleById = (singleId: number) => {
    if (
      singleId === this.selectedSingle.id &&
      store.view === ViewTypes.SINGLE_INFO
    ) {
      return;
    }

    const singleIndex = this.singles.findIndex(i => i.id === singleId);
    const index = singleIndex % this.singlePageScale;
    this.singleCurrentPage = (singleIndex - index) / this.singlePageScale;

    store.changeView(ViewTypes.SINGLES, false, () => {
      setTimeout(() => events.emit(EventTypes.SelectSingle, index), 200);
    });
  };
}

const singleStore = new SingleStore();

export { singleStore };
