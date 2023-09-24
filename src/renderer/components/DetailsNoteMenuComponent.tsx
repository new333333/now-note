import React, { useContext, useCallback } from 'react';
import { Button, Dropdown, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  EllipsisOutlined,
  PlusOutlined,
  ApartmentOutlined,
  DeleteFilled,
} from '@ant-design/icons';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import UIApiDispatch from 'renderer/UIApiDispatch';

const { useToken } = theme;


export default function DetailsNoteMenuComponent() {
  const noteKey = useDetailsNoteStore((state) => state.noteKey);
  const trash = useDetailsNoteStore((state) => state.trash);
  const updatedAt = useDetailsNoteStore((state) => state.updatedAt);
  const createdAt = useDetailsNoteStore((state) => state.createdAt);
  const createdBy = useDetailsNoteStore((state) => state.createdBy);
  const parent = useDetailsNoteStore((state) => state.parent);

  const uiApi = useContext(UIApiDispatch);

  const menuItems = [];
  if (noteKey !== undefined) {
    if (!trash) {
      menuItems.push({
        key: 'add_note',
        label: 'Add note',
        icon: <PlusOutlined />,
      });
    }
    menuItems.push({
      key: 'open_tree',
      label: 'Focus in tree',
      icon: <ApartmentOutlined />,
    });
    menuItems.push({
      key: 'delete',
      label: trash ? 'Delete Permanently' : 'Move To Trash',
      icon: <DeleteFilled />,
    });
    if (trash) {
      menuItems.push({
        key: 'restore',
        label: 'Restore',
      });
    }

    /*
    menuItems.push({
        key: 'history',
        label: "History",
        icon: <HistoryOutlined />,
    });
    */

    menuItems.push({
      type: 'divider',
    });
  }

  const { token } = useToken();

  const contentStyle: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadowSecondary,
  };

  const menuStyle: React.CSSProperties = {
    boxShadow: 'none',
  };

  const handleClickMenu = useCallback(
    (option): MenuProps['onClick'] => {
      console.log('handleNoteMenu, noteKey=, option=', noteKey, option);
      const key = option.key;
      console.log('handleNoteMenu, key=', key);
      if (key === 'add_note') {
        uiApi.addNote(noteKey);
      } else if (key === 'open_tree') {
        nowNoteAPI.openNoteInTree(noteKey);
      } else if (key === 'delete') {
        console.log("handleNoteMenu, delete noteKey=", noteKey);
        if (uiApi === null) {
          return;
        }
        uiApi.deleteNote(noteKey);
      } else if (key === 'restore') {
        nowNoteAPI.restore(noteKey);
      } else if (key === 'history') {
        nowNoteAPI.showHistory(noteKey);
      }
    },
    [noteKey, uiApi]
  );

  if (noteKey === null) {
    return null;
  }

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleClickMenu }}
      dropdownRender={(menu) => (

        <div style={contentStyle}>
          {React.cloneElement(menu as React.ReactElement, { style: menuStyle })}
          <div style={{padding: 10}}>
                <div className="nn-note-metadata">Last modified: {updatedAt.toLocaleString()}</div>
                <div className="nn-note-metadata">Created on: {createdAt.toLocaleString()}</div>
                <div className="nn-note-metadata">Created by: {createdBy}</div>
                <div className="nn-note-metadata">Id: {noteKey}</div>
              </div>
        </div>
      )}>
      <Button shape="circle" icon={<EllipsisOutlined />} size="small" />
    </Dropdown>
  );
}
