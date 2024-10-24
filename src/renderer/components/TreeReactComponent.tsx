import React, { forwardRef, useMemo } from 'react';
import log from 'electron-log';
import {
  UncontrolledTreeEnvironment,
  Tree,
  StaticTreeDataProvider,
} from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';
import '../css/react-complex-tree.scss';
import NowTreeDataProvider from 'renderer/NowTreeDataProvider';

const treeLog = log.scope('Tree');

const cx = (...classNames: Array<string | undefined | false>) =>
  classNames.filter(cn => !!cn).join(' ');

const renderDepthOffset = 10;

const TreeReactComponent = React.memo(
  forwardRef(function TreeReactComponent(props, ref) {
    const dataProvider = useMemo(() => {
      return new NowTreeDataProvider();
    }, []);

    return (
      <div className="n3-tree">
        <UncontrolledTreeEnvironment
          canDragAndDrop
          canDropOnFolder
          canReorderItems
          dataProvider={dataProvider}
          getItemTitle={(item) => item.data}
          viewState={{
            'tree-2': {
              expandedItems: [],
            },
          }}
          renderItemArrow={({ item, context }) => (
            // Icons from https://blueprintjs.com/docs/#icons
            <div
              className={cx(
                item.isFolder && 'rct-tree-item-arrow-isFolder',
                context.isExpanded && 'rct-tree-item-arrow-expanded',
                'rct-tree-item-arrow'
              )}
              {...context.arrowProps}
            >
              {item.isFolder &&
                (context.isExpanded ? (
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 16 16"
                    enableBackground="new 0 0 16 16"
                    xmlSpace="preserve"
                  >
                    <g>
                      <g>
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                          className="rct-tree-item-arrow-path"
                        />
                      </g>
                    </g>
                  </svg>
                ) : (
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 16 16"
                    enableBackground="new 0 0 16 16"
                    xmlSpace="preserve"
                  >
                    <g>
                      <g>
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                          className="rct-tree-item-arrow-path"
                        />
                      </g>
                    </g>
                  </svg>
                ))}
            </div>
          )}

          renderItem={({ item, depth, children, title, context, arrow }) => {
            const InteractiveComponent = context.isRenaming ? 'div' : 'button';
            const type = context.isRenaming ? undefined : 'button';
            // TODO have only root li component create all the classes
            return (
              <li
                {...(context.itemContainerWithChildrenProps as any)}
                className={cx(
                  'rct-tree-item-li',
                  item.isFolder && 'rct-tree-item-li-isFolder',
                  context.isSelected && 'rct-tree-item-li-selected',
                  context.isExpanded && 'rct-tree-item-li-expanded',
                  context.isFocused && 'rct-tree-item-li-focused',
                  context.isDraggingOver && 'rct-tree-item-li-dragging-over',
                  context.isSearchMatching && 'rct-tree-item-li-search-match'
                )}
              >
                <div
                  {...(context.itemContainerWithoutChildrenProps as any)}
                  style={{ '--depthOffset': `${(depth + 1) * renderDepthOffset}px` }}
                  className={cx(
                    'rct-tree-item-title-container',
                    item.isFolder && 'rct-tree-item-title-container-isFolder',
                    context.isSelected && 'rct-tree-item-title-container-selected',
                    context.isExpanded && 'rct-tree-item-title-container-expanded',
                    context.isFocused && 'rct-tree-item-title-container-focused',
                    context.isDraggingOver &&
                      'rct-tree-item-title-container-dragging-over',
                    context.isSearchMatching &&
                      'rct-tree-item-title-container-search-match'
                  )}
                >
                  {arrow}
                  <InteractiveComponent
                    type={type}
                    {...(context.interactiveElementProps as any)}
                    className={cx(
                      'rct-tree-item-button',
                      item.isFolder && 'rct-tree-item-button-isFolder',
                      context.isSelected && 'rct-tree-item-button-selected',
                      context.isExpanded && 'rct-tree-item-button-expanded',
                      context.isFocused && 'rct-tree-item-button-focused',
                      context.isDraggingOver && 'rct-tree-item-button-dragging-over',
                      context.isSearchMatching && 'rct-tree-item-button-search-match'
                    )}
                  >
                    {title}
                  </InteractiveComponent>
                </div>
                {children}
              </li>
            );
          }}
        >
          <Tree treeId="tree-2" rootItem="root" treeLabel="Tree Example" />
        </UncontrolledTreeEnvironment>
      </div>
    );
  })
);

export default TreeReactComponent;
