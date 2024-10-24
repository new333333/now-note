import { TreeDataProvider, TreeItem, TreeItemIndex } from 'react-complex-tree';

const items = {
  root: {
    index: 'root',
    isFolder: true,
    children: ['child1', 'child2'],
    data: 'Root item',
  },
  child1: {
    index: 'child1',
    children: [],
    data: 'Child item 1Child item 1Child item 1Child item 1Child item 1Child item 1Child item 1Child item 1Child item 1Child item 1Child item 1',
    isFolder: true,
  },
  child2: {
    index: 'child2',
    isFolder: true,
    children: ['child3'],
    data: 'Child item 2Child item 2Child item 2Child item 2Child item 2Child item 2Child item 2Child item 2Child item 2',
  },
  child3: {
    index: 'child3',
    children: [],
    data: 'Child item 3Child item 3Child item 3Child item 3Child item 3Child item 3Child item 3Child item 3Child item 3Child item 3',
    isFolder: true,
  },
};

class NowTreeDataProvider implements TreeDataProvider {
  private data: Record<TreeItemIndex, TreeItem> = { ...items };

  private treeChangeListeners: ((changedItemIds: TreeItemIndex[]) => void)[] =
    [];

  public async getTreeItem(itemId: TreeItemIndex) {
    return this.data[itemId];
  }

  public async onChangeItemChildren(
    itemId: TreeItemIndex,
    newChildren: TreeItemIndex[]
  ) {
    this.data[itemId].children = newChildren;
    this.treeChangeListeners.forEach(listener => listener([itemId]));
  }

  public onDidChangeTreeData(
    listener: (changedItemIds: TreeItemIndex[]) => void
  ): Disposable {
    this.treeChangeListeners.push(listener);
    return {
      dispose: () =>
        this.treeChangeListeners.splice(
          this.treeChangeListeners.indexOf(listener),
          1
        ),
    };
  }

  public async onRenameItem(item: TreeItem<any>, name: string): Promise<void> {
    this.data[item.index].data = name;
  }

  // custom handler for directly manipulating the tree data
  public injectItem(name: string) {
    const rand = `${Math.random()}`;
    this.data[rand] = { data: name, index: rand } as TreeItem;
    this.data.root.children?.push(rand);
    this.treeChangeListeners.forEach(listener => listener(['root']));
  }
}

export default NowTreeDataProvider;
