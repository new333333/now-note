import { useState, useContext, useCallback, useEffect } from 'react';
import { Dropdown, InputNumber, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { UIController, PriorityStatistics } from 'types';
import { UIControllerContext } from 'renderer/UIControllerContext';
import useNoteStore from 'renderer/NoteStore';

const { Text } = Typography;


type PriorityMenuKeys = 'minimum' | 'average' | 'mediana' | 'maximum';

export default function DetailsPriorityComponent() {
  const [note, setPriority] = useNoteStore((state) => [
    state.detailsNote,
    state.setPriority,
  ]);

  const [priorityStat, setPriorityStat] = useState<PriorityStatistics | null>(
    null
  );

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchPriorityStat = useCallback(async () => {
    setPriorityStat(await uiController.getPriorityStatistics());
  }, [uiController, note]);
  // note added as dependency to refresh priorities on every note change

  useEffect(() => {
    fetchPriorityStat();
  }, [fetchPriorityStat]);

  const handleChangePriority = useCallback(
    (value: number | null) => {
      if (note === undefined || value === null) {
        return;
      }
      setPriority(note.key, value);
      uiController.modifyNote({
        key: note.key,
        priority: value,
      });
    },
    [uiController, note, setPriority]
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
    if (priorityStat === null || note === undefined) {
      return;
    }
    const newPririty = priorityStat[key as PriorityMenuKeys];
    setPriority(note.key, newPririty);
    uiController.modifyNote({
      key: note.key,
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

  return (
    <>
      {note && <span style={{ marginRight: '5px' }}>
        <span style={{ marginRight: '5px' }}>Priority:</span>
        {!note.trash && (
          <Dropdown menu={{ items: menuItems, onClick: handleClickMenu }}>
            <InputNumber
              disabled
              min={0}
              size="small"
              value={note.priority}
              onChange={handleChangePriority}
            />
          </Dropdown>
        )}
        {note.trash && <Text strong>{note.priority}</Text>}
      </span>}
    </>
  );
}
