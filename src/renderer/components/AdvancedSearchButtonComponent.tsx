import { Button, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { gray } from '@ant-design/colors';

interface Props {
  onClick: Function;
}

export default function AdvancedSearchButtonComponent({ onClick }: Props) {
  return (
    <Button
      size="small"
      icon={<SearchOutlined />}
      onClick={onClick}
    />
  );
}
