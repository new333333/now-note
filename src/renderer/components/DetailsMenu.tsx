import log from 'electron-log';
import { useContext } from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  EllipsisOutlined,
  PlusOutlined,
  ApartmentOutlined,
  UnorderedListOutlined,
  DeleteFilled,
} from '@ant-design/icons';
import { UIController } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';

interface Props {
  readOnly: boolean;
  noteKey: string;
  updatedAt: Date;
  createdAt: Date;
  createdBy: string;
}

export default function DetailsMenu({
  readOnly,
  noteKey,
  updatedAt,
  createdAt,
  createdBy,
}: Props) {
  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const menuItems = [];
  if (noteKey !== undefined) {
    if (!readOnly) {
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
      label: readOnly ? 'Delete Permanently' : 'Move To Trash',
      icon: <DeleteFilled />,
    });
    if (readOnly) {
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

    menuItems.push({
      key: 'metadata',
      disabled: true,
      label: (<>
                <div className="nn-note-metadata">Last modified: {updatedAt.toLocaleString()}</div>
                <div className="nn-note-metadata">Created on: {createdAt.toLocaleString()}</div>
                <div className="nn-note-metadata">Created by: {createdBy}</div>
                <div className="nn-note-metadata">Id: {noteKey}</div>
              </>),
    });

  }

  const handleClickMenu: MenuProps['onClick'] = async ({  key }) => {
    console.log("handleNoteMenu, noteKey=", noteKey);

    if (key === 'add_note') {
      await uiController.addNote(
        'DetailsMenu',
        noteKey,
        { title: '', type: 'note' },
        'over'
      );
    } else if (key === 'open_tree') {
      await uiController.openNoteInTree(noteKey);
    } else if (key === 'open_list') {
      await uiController.openNoteInList(noteKey);
    } else if (key === 'delete') {
      await uiController.deleteNote(noteKey);
    } else if (key === 'restore') {
      await uiController.restore(noteKey);
    } else if (key === 'history') {
      await uiController.showHistory(noteKey);
    }
  };

  return (
    <Dropdown menu={{ items: menuItems, onClick: handleClickMenu }}>
      <Button shape="circle" icon={<EllipsisOutlined />} size="small" />
    </Dropdown>
  );
}
