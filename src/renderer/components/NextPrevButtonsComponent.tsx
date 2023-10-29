import { useState } from 'react';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface Props {
  // eslint-disable-next-line react/no-unused-prop-types
  handlePrev: Function;
  // eslint-disable-next-line react/no-unused-prop-types
  handleNext: Function;
}

export default function NextPrevButtonsComponent({
  handlePrev,
  handleNext,
}: Props) {
  const [openHistoryId, setOpenHistoryId] = useState<number | undefined>(
    undefined
  );

  const handleClick = async (direction: string) => {
    if (direction === 'next') {
      const newOpenHistoryId = await handleNext(openHistoryId);
      setOpenHistoryId(newOpenHistoryId);
    } else {
      const newOpenHistoryId = await handlePrev(openHistoryId);
      setOpenHistoryId(newOpenHistoryId);
    }
  };

  return (
    <div
      style={{
        marginTop: -8,
      }}
    >
      <Button
        shape="default"
        icon={<ArrowLeftOutlined />}
        size="small"
        onClick={() => handleClick('previous')}
      />
      <Button
        shape="default"
        icon={<ArrowRightOutlined />}
        size="small"
        onClick={() => handleClick('next')}
      />
    </div>
  );
}
