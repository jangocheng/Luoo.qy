import { action, observable } from "mobx";
import { getIPC } from "../utils";
import { ViewTypes } from "../types";
import { volStore } from "./vol";
import { singleStore } from "./single";
import { articleStore } from "./article";
import { playerStore } from "./player";

let ipc: IpcObject;

class Store {
  @action
  init = async (): Promise<void> => {
    ipc = await getIPC();
    await Promise.all([
      volStore.init(ipc),
      singleStore.init(ipc),
      articleStore.init(ipc)
    ]);
  };

  protected viewHistory: ViewTypes[] = [];

  @observable
  public view: ViewTypes = ViewTypes.VOLS;

  @action
  public changeView = (viewType: ViewTypes, isBack: boolean = false) => {
    if (viewType === this.view) {
      return;
    }

    const prevView = this.view;
    this.view = viewType;

    if (!isBack) {
      this.viewHistory.push(prevView);
    }

    if (viewType === ViewTypes.PLAYING || prevView === ViewTypes.PLAYING) {
      return;
    }

    const prevViewElement = document.querySelector(
      `.view-${prevView}`
    ) as HTMLElement | null;
    const viewElement = document.querySelector(
      `.view-${viewType}`
    ) as HTMLElement | null;
    if (!prevViewElement || !viewElement) return;

    const isEnterInfoPage =
      (prevView === ViewTypes.VOLS && viewType === ViewTypes.VOL_INFO) ||
      (prevView === ViewTypes.SINGLES && viewType === ViewTypes.SINGLE_INFO) ||
      (prevView === ViewTypes.ARTICLES && viewType === ViewTypes.ARTICLE_INFO);
    const isExitInfoPage =
      (prevView === ViewTypes.VOL_INFO && viewType === ViewTypes.VOLS) ||
      (prevView === ViewTypes.SINGLE_INFO && viewType === ViewTypes.SINGLES) ||
      (prevView === ViewTypes.ARTICLE_INFO && viewType === ViewTypes.ARTICLES);

    if (isEnterInfoPage) {
      viewElement.className += " show-with-cover";
      prevViewElement.className = prevViewElement.className.replace(
        " show",
        ""
      );
    } else if (isExitInfoPage) {
      viewElement.className += " show";
      prevViewElement.className = prevViewElement.className.replace(
        " show-with-cover",
        ""
      );
    } else {
      viewElement.className += " show";
      prevViewElement.className = prevViewElement.className.replace(
        " show",
        ""
      );
    }

    viewElement.style.zIndex = viewType === ViewTypes.VOLS_TYPE ? "20" : "5";
    setTimeout(() => {
      prevViewElement.style.zIndex = "-1";
    }, 500);
  };

  @action
  public backView = () => {
    const prevView = this.viewHistory.pop();
    if (prevView === undefined) {
      throw new Error("Invalid previous view");
    }
    this.changeView(prevView, true);
  };
}

const store = new Store();

export { store, volStore, singleStore, articleStore, playerStore };
