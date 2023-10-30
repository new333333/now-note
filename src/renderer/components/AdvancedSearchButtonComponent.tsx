import { Button, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { gray } from '@ant-design/colors';

interface Props {
  onClick: Function;
}

export default function AdvancedSearchButtonComponent({ onClick }: Props) {
  return (
    <Button
      icon={<SearchOutlined />}
      style={{
        color: gray[0],
      }}
      onClick={onClick}
    >
      Search
      <Tag
        style={{
          marginLeft: 5,
        }}
      >
        Ctrl+K
      </Tag>
    </Button>
  );
}
