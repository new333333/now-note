import log from 'electron-log';
import { useContext } from 'react';
import { Typography, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

const { Text, Link } = Typography;

export default function DetailsNoteTypeComponent() {
  const detailsNoteKey = useDetailsNoteStore((state) => state.noteKey);
  const detailsNoteType = useDetailsNoteStore((state) => state.type);
  const detailsNoteTrash = useDetailsNoteStore((state) => state.trash);
  const detailsNoteUpdateType = useDetailsNoteStore(
    (state) => state.updateType
  );

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
    if (detailsNoteKey === undefined) {
      return;
    }
    detailsNoteUpdateType(detailsNoteKey, key);
    nowNoteAPI.modifyNote({
      key: detailsNoteKey,
      type: key,
    });
  };

  if (detailsNoteKey === undefined) {
    return null;
  }

  return (
    <span style={{ marginRight: '5px' }}>
      {!detailsNoteTrash && (
        <Dropdown menu={{ items: menuItems, onClick: handleClickMenu }}>
          <Link strong href="#">
            {getNoteTypeLabel(detailsNoteType)}
          </Link>
        </Dropdown>
      )}
      {detailsNoteTrash && (
        <Text strong>{getNoteTypeLabel(detailsNoteType)}</Text>
      )}
    </span>
  );
}
