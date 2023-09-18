import { useState, useContext, useCallback, useEffect } from 'react';
import { Dropdown, InputNumber, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { PriorityStatistics } from 'types';
import useNoteStore from 'renderer/GlobalStore';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

const { Text } = Typography;


type PriorityMenuKeys = 'minimum' | 'average' | 'mediana' | 'maximum';

export default function DetailsNotePriorityComponent() {
  const detailsNoteKey = useDetailsNoteStore((state) => state.noteKey);
  const detailsNotePriority = useDetailsNoteStore((state) => state.priority);
  const detailsNoteTrash = useDetailsNoteStore((state) => state.trash);
  const detailsNoteUpdatePriority = useDetailsNoteStore(
    (state) => state.updatePriority
  );

  const [priorityStat, setPriorityStat] = useState<PriorityStatistics | null>(
    null
  );

  const fetchPriorityStat = useCallback(async () => {
    setPriorityStat(await nowNoteAPI.getPriorityStatistics());
  }, [detailsNotePriority]);
  // 'detailsNotePriority' added as dependency to refresh priorities on every priority change

  useEffect(() => {
    fetchPriorityStat();
  }, [fetchPriorityStat]);

  const handleChangePriority = useCallback(
    (value: number | null) => {
      if (detailsNoteKey === undefined || value === null) {
        return;
      }
      detailsNoteUpdatePriority(detailsNoteKey, value);
      nowNoteAPI.modifyNote({
        key: detailsNoteKey,
        priority: value,
      });
    },
    [detailsNoteKey, detailsNoteUpdatePriority]
  );

  let minimumPriority = 0;
  if (priorityStat) {
    minimumPriority = priorityStat.minimum;
  }

  let maximumPriority = 0;
  if (priorityStat) {
    maximumPriority = priorityStat.maximum;
  }

  let averagePriority = 0;
  if (priorityStat) {
    averagePriority = priorityStat.average;
  }

  let medianaPriority = 0;
  if (priorityStat) {
    medianaPriority = priorityStat.mediana;
  }

  const handleClickMenu: MenuProps['onClick'] = ({ key }) => {
    if (priorityStat === null || detailsNoteKey === undefined) {
      return;
    }
    const newPririty = priorityStat[key as PriorityMenuKeys];
    detailsNoteUpdatePriority(detailsNoteKey, newPririty);
    nowNoteAPI.modifyNote({
      key: detailsNoteKey,
      priority: newPririty,
    });
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'minimum',
      label: `Set: ${minimumPriority} (Minimum)`,
    },
    {
      key: 'average',
      label: `Set: ${averagePriority} (Average)`,
    },
    {
      key: 'mediana',
      label: `Set: ${medianaPriority} (Mediana)`,
    },
    {
      key: 'maximum',
      label: `Set: ${maximumPriority} (Maximum)`,
    },
  ];

  if (detailsNoteKey === undefined) {
    return null;
  }

  if (detailsNoteTrash) {
    return (
      <span style={{ marginRight: '5px' }}>
        <span style={{ marginRight: '5px' }}>Priority:</span>
        <Text strong>{detailsNotePriority}</Text>
      </span>
    );
  }

  return (
    <span style={{ marginRight: '5px' }}>
      <span style={{ marginRight: '5px' }}>Priority:</span>
      <Dropdown menu={{ items: menuItems, onClick: handleClickMenu }}>
        <InputNumber
          disabled
          min={0}
          size="small"
          value={detailsNotePriority}
          onChange={handleChangePriority}
        />
      </Dropdown>
    </span>
  );
}
