import log from 'electron-log';
import { useState, useContext, useCallback, useEffect } from 'react';
import { Dropdown, InputNumber, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { DataService, PriorityStatDTO } from 'types';
import { DataServiceContext } from 'renderer/DataServiceContext';
import { Note } from 'main/modules/DataModels';

const { Text } = Typography;

interface Props {
  readOnly: boolean;
  noteKey: string;
}

type PriorityMenuKeys = 'minimum' | 'average' | 'mediana' | 'maximum';

export default function DetailsTagsComponent({ readOnly, noteKey }: Props) {
  const [priority, setPriority] = useState<number>(0);
  const [priorityStat, setPriorityStat] = useState<PriorityStatDTO | null>(
    null
  );

  const { dataService }: { dataService: DataService } =
    useContext(DataServiceContext);

  const fetchInitialData = useCallback(async () => {
    const note: Note | undefined = await dataService.getNote(noteKey);
    const newPriority = note !== undefined ? note.priority : 0;
    setPriority(newPriority);
    setPriorityStat(await dataService.getPriorityStat());
  }, [dataService, noteKey]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleChangePriority = useCallback(
    async (value: number | null) => {
      if (value != null) {
        setPriority(value);
        await dataService.modifyNote({
          key: noteKey,
          priority: value,
        });
      }
    },
    [dataService, noteKey]
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

  const onClick: MenuProps['onClick'] = async ({ key }) => {
    if (priorityStat !== null) {
      const newPririty = priorityStat[key as PriorityMenuKeys];
      setPriority(newPririty);
      await dataService.modifyNote({
        key: noteKey,
        priority: newPririty,
      });
    }
  };

  const items: MenuProps['items'] = [
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

  return (
    <span style={{ marginRight: '5px' }}>
      <span style={{ marginRight: '5px' }}>Priority:</span>
      {!readOnly && (
        <Dropdown menu={{ items, onClick }}>
          <InputNumber
            disabled
            min={0}
            size="small"
            value={priority}
            onChange={handleChangePriority}
          />
        </Dropdown>
      )}
      {readOnly && <Text strong>{priority}</Text>}
    </span>
  );
}
