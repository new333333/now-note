import { useContext, useCallback } from 'react';
import { Button, Dropdown, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  EllipsisOutlined,
  PlusOutlined,
  ApartmentOutlined,
  UnorderedListOutlined,
  DeleteFilled,
} from '@ant-design/icons';
import { NoteDTO, UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';
import { Note } from 'main/modules/DataModels';
import useNoteStore from 'renderer/NoteStore';

const { useToken } = theme;

interface Props {
  note: Note;
}

export default function DetailsMenu({ note }: Props) {
  const [updateUpdatedNote, setReloadTreeNoteKey, updateDetailsNote, setAddTreeNoteOnNoteKey] = useNoteStore((state) => [
    state.updateUpdatedNote,
    state.setReloadTreeNoteKey,
    state.updateDetailsNote,
    state.setAddTreeNoteOnNoteKey,
  ]);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const menuItems = [];
  if (note.key !== undefined) {
    if (note !== undefined && !note.trash) {
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
      key: 'open_list',
      label: 'List sub notes',
      icon: <UnorderedListOutlined />,
    });
    menuItems.push({
      key: 'delete',
      label: note.trash ? 'Delete Permanently' : 'Move To Trash',
      icon: <DeleteFilled />,
    });
    if (note.trash) {
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
      console.log('handleNoteMenu, note.key=, option=', note.key, option);
      const key = option.key;
      console.log('handleNoteMenu, key=', key);
      if (key === 'add_note') {
        setAddTreeNoteOnNoteKey(note.key);
      } else if (key === 'open_tree') {
        uiController.openNoteInTree(note.key);
      } else if (key === 'open_list') {
        uiController.openNoteInList(note.key);
      } else if (key === 'delete') {
        console.log("handleNoteMenu, delete note=", note);
        uiController.moveNoteToTrash(note.key);
        setReloadTreeNoteKey(note.parent);
        updateDetailsNote(undefined);
      } else if (key === 'restore') {
        uiController.restore(note.key);
      } else if (key === 'history') {
        uiController.showHistory(note.key);
      }
    },
    [
      note,
      setAddTreeNoteOnNoteKey,
      setReloadTreeNoteKey,
      uiController,
      updateDetailsNote,
    ]
  );

  if (note === undefined) {
    return null;
  }

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleClickMenu }}
      dropdownRender={(menu) => (

        <div style={contentStyle}>
          {React.cloneElement(menu as React.ReactElement, { style: menuStyle })}
          <div style={{padding: 10}}>
                <div className="nn-note-metadata">Last modified: {note.updatedAt.toLocaleString()}</div>
                <div className="nn-note-metadata">Created on: {note.createdAt.toLocaleString()}</div>
                <div className="nn-note-metadata">Created by: {note.createdBy}</div>
                <div className="nn-note-metadata">Id: {note.key}</div>
              </div>
        </div>
      )}>
      <Button shape="circle" icon={<EllipsisOutlined />} size="small" />
    </Dropdown>
  );
}
