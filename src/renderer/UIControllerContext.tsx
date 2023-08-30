import log from 'electron-log';
import { Note, Tag } from 'main/modules/DataModels';
import { createContext } from 'react';
import {
  UIControllerListener,
  ListenerWhen,
  UIController,
  HitMode,
  NoteDTO,
  SearchResult,
  SearchResultOptions,
  PriorityStatDTO,
} from 'types';

export class UIControllerContextImpl
  implements UIController, UIControllerListener
{
  private îpcRenderer: UIController;

  private listeners: Map<string, Function[]> = new Map<string, Function[]>();

  constructor(îpcRenderer: UIController) {
    this.îpcRenderer = îpcRenderer;
  }

  // TODO: this is probably bad idea, look at comments in App.tsx
  async openNote(key: string): Promise<Note | undefined> {
    await this.notify('openNote', 'before', key);
    const note: Note | undefined = await this.îpcRenderer.getNote(key);
    await this.notify('openNote', 'after', key, note);
    return note;
  }

  async getPriorityStat(): Promise<PriorityStatDTO> {
    await this.notify('getPriorityStat', 'before');
    const priorityStat: PriorityStatDTO =
      await this.îpcRenderer.getPriorityStat();
    await this.notify('getPriorityStat', 'after', priorityStat);
    return priorityStat;
  }

  async getNote(key: string): Promise<Note | undefined> {
    await this.notify('getNote', 'before', key);
    const note: Note | undefined = await this.îpcRenderer.getNote(key);
    await this.notify('getNote', 'after', key, note);
    return note;
  }

  async getChildren(key: string, trash: boolean): Promise<Note[] | undefined> {
    await this.notify('getChildren', 'before', key, trash);
    const children: Note[] | undefined = await this.îpcRenderer.getChildren(
      key,
      trash
    );
    await this.notify('getChildren', 'after', key, trash, children);
    return children;
  }

  async getParents(key: string): Promise<Note[] | undefined> {
    await this.notify('getParents', 'before', key);
    const parents: Note[] | undefined = await this.îpcRenderer.getParents(key);
    await this.notify('getParents', 'after', key, parents);
    return parents;
  }

  async getBacklinks(key: string): Promise<Note[]> {
    await this.notify('getBacklinks', 'before', key);
    const backlinks: Note[] | undefined = await this.îpcRenderer.getBacklinks(
      key
    );
    await this.notify('getBacklinks', 'after', key, backlinks);
    return backlinks;
  }

  async search(
    searchText: string,
    limit: number,
    trash: boolean,
    options: SearchResultOptions
  ): Promise<SearchResult> {
    await this.notify('search', 'before', searchText, limit, trash, options);
    const searchResult: SearchResult = await this.îpcRenderer.search(
      searchText,
      limit,
      trash,
      options
    );
    await this.notify(
      'search',
      'after',
      searchText,
      limit,
      trash,
      options,
      searchResult
    );
    return searchResult;
  }

  async modifyNote(note: NoteDTO): Promise<NoteDTO> {
    await this.notify('modifyNote', 'before', note);
    const modifiednote: NoteDTO | undefined = await this.îpcRenderer.modifyNote(
      note
    );
    await this.notify('modifyNote', 'after', note, modifiednote);
    return note;
  }

  async addNote(
    trigger: string,
    parentNoteKey: string,
    note: NoteDTO,
    hitMode: HitMode,
    relativeToKey?: string
  ): Promise<NoteDTO | undefined> {
    await this.notify('addNote', 'before', trigger, note);
    const newNote: NoteDTO | undefined = await this.îpcRenderer.addNote(
      parentNoteKey,
      note,
      hitMode,
      relativeToKey
    );
    await this.notify(
      'addNote',
      'after',
      trigger,
      parentNoteKey,
      note,
      hitMode,
      relativeToKey,
      newNote
    );
    return note;
  }

  async moveNote(key: string, from: string, to: string, hitMode: HitMode, relativTo: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async moveNoteToTrash(key: string): Promise<boolean | undefined> {
    throw new Error('Method not implemented.');
  }

  async restore(key: string): Promise<boolean | undefined> {
    throw new Error('Method not implemented.');
  }

  async deletePermanently(key: string): Promise<boolean | undefined> {
    throw new Error('Method not implemented.');
  }

  async getTags(key: string): Promise<Tag[]> {
    await this.notify('getTags', 'before', key);
    const tags = await this.îpcRenderer.getTags(key);
    await this.notify('getTags', 'after', key, tags);
    return tags;
  }

  async findTag(tag: string): Promise<Tag[]> {
    await this.notify('findTag', 'before', tag);
    const tags = await this.îpcRenderer.findTag(tag);
    await this.notify('findTag', 'after', tag, tags);
    return tags;
  }

  async addTag(key: string, tag: string): Promise<void> {
    await this.notify('addTag', 'before', key, tag);
    await this.îpcRenderer.addTag(key, tag);
    await this.notify('addTag', 'after', key, tag);
  }

  async removeTag(key: string, tag: string): Promise<string[]> {
    await this.notify('removeTag', 'before', key, tag);
    const removedTags: string[] = await this.îpcRenderer.removeTag(key, tag);
    await this.notify('removeTag', 'after', key, tag, removedTags);
    return removedTags;
  }

  subscribe(title: string, when: ListenerWhen, callback: Function): void {
    log.debug(
      `subscribe(title: ${title}, when: ${when}, callback: ${callback})`
    );
    if (!this.listeners.has(`${title}.${when}`)) {
      this.listeners.set(`${title}.${when}`, []);
    }
    const currentListeners: Function[] = this.listeners.get(
      `${title}.${when}`
    ) as Function[];
    currentListeners?.push(callback);
    this.listeners.set(`${title}.${when}`, currentListeners);
  }

  unsubscribe(title: string, when: ListenerWhen, callback: Function): void {
    log.debug(
      `unsubscribe(title: ${title}, when: ${when}, callback: ${callback})`
    );
    if (this.listeners.has(`${title}.${when}`)) {
      const listenerIndex = this.listeners
        .get(`${title}.${when}`)
        ?.findIndex(
          (existingCallback: Function) => existingCallback === callback
        );

      if (listenerIndex !== undefined) {
        const titleListeners = this.listeners.get(`${title}.${when}`);
        titleListeners?.splice(listenerIndex, 1);
        if (titleListeners !== undefined) {
          this.listeners.set(`${title}.${when}`, titleListeners);
        } else {
          this.listeners.delete(`${title}.${when}`);
        }
      }
    }
    log.debug(`unsubscribe listeners: ${this.listeners}`);
  }

  private async notify(title: string, when: ListenerWhen, ...params: any[]) {
    if (this.listeners.has(`${title}.${when}`)) {
      this.listeners.get(`${title}.${when}`)?.forEach((callback: Function) => {
        callback.call(this, ...params);
      });
    }
  }
}

export const uiController = new UIControllerContextImpl(
  window.electron.ipcRenderer
);

export const UIControllerContext = createContext({
  uiController,
});
