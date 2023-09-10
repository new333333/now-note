import log from 'electron-log';
import { useContext } from 'react';
import { Typography, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { UIControllerContext } from 'renderer/UIControllerContext';
import { UIController } from 'types';
import useNoteStore from 'renderer/NoteStore';

const { Text, Link } = Typography;

export default function DetailsNoteType() {
  const [note, setType] = useNoteStore((state) => [
    state.detailsNote,
    state.setType,
  ]);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const menuItems: MenuProps['items'] = [
    {
      key: 'note',
      label: `Note`,
    },
    {
      key: 'task',
      label: `Task`,
    },
    {
      key: 'link',
      label: `Link`,
    },
  ];

  function getNoteTypeLabel(t: string | null | undefined) {
    const foundType = menuItems?.find((menuItem) => {
      return menuItem?.key === t;
    });
    if (foundType !== null && foundType !== undefined) {
      return foundType.label;
    }
    return 'ERROR! Unknown type';
  }

  const handleClickMenu: MenuProps['onClick'] = async ({ key }) => {
    if (note === undefined) {
      return;
    }
    setType(note.key, key);
    uiController.modifyNote({
      key: note.key,
      type: key,
    });
  };

  if (note === undefined) {
    return;
  }

  return (
    <span style={{ marginRight: '5px' }}>
      {!note.trash && (
        <Dropdown menu={{ items: menuItems, onClick: handleClickMenu }}>
          <Link strong href="#">
            {getNoteTypeLabel(note.type)}
          </Link>
        </Dropdown>
      )}
      {note.trash && <Text strong>{getNoteTypeLabel(note.type)}</Text>}
    </span>
  );
}
