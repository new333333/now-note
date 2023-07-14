import log from 'electron-log';
import { useState, useEffect, useContext, useCallback } from 'react';
import { Typography, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { UIControllerContext } from 'renderer/UIControllerContext';
import { UIController } from 'types';

const { Text, Link } = Typography;

interface Props {
  readOnly: boolean;
  noteKey: string;
  initValue: string;
}

export default function DetailsNoteType({
  readOnly,
  noteKey,
  initValue,
}: Props) {
  const [type, setType] = useState<string | null>(initValue);
  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchType = useCallback(async () => {
    const note = await uiController.getNote(noteKey);
    const newType = note !== undefined ? note.type : null;
    setType(newType);
  }, [uiController, noteKey]);

  useEffect(() => {
    fetchType();
  }, [fetchType]);

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

  function getNoteTypeLabel(t: string | null) {
    const foundType = menuItems?.find((menuItem) => {
      return menuItem?.key === t;
    });
    if (foundType !== null && foundType !== undefined) {
      return foundType.label;
    }
    return 'ERROR! Unknown type';
  }

  const handleClickMenu: MenuProps['onClick'] = async ({ key }) => {
    setType(key);
    await uiController.modifyNote({
      key: noteKey,
      type: key,
    });
  };

  return (
    <span style={{ marginRight: '5px' }}>
      {!readOnly && (
        <Dropdown menu={{ items: menuItems, onClick: handleClickMenu }}>
          <Link strong href="#">
            {getNoteTypeLabel(type)}
          </Link>
        </Dropdown>
      )}
      {readOnly && <Text strong>{getNoteTypeLabel(type)}</Text>}
    </span>
  );
}
