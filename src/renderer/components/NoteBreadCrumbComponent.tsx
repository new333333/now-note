import log from 'electron-log';
import { Breadcrumb } from 'antd';
import { ItemType } from 'antd/es/breadcrumb/Breadcrumb';

const noteBreadCrumbLog = log.scope('NoteBreadCrumbComponent');

interface Props {
  keyPath: string;
  titlePath: string;
  handleOnClick: Function;
}

export default function NoteBreadCrumbComponent({
  keyPath,
  titlePath,
  handleOnClick,
}: Props) {
  if (
    keyPath === null ||
    keyPath === undefined ||
    keyPath.length === 0 ||
    titlePath === null ||
    titlePath === undefined ||
    titlePath.length === 0
  ) {
    return null;
  }

  const items: ItemType[] = [];
  const keys = keyPath.substring(2, keyPath.length - 2).split('/');
  const titles = titlePath.substring(2, titlePath.length - 2).split('/');
  keys.forEach((key, index) => {
    items.push({
      title: titles[index],
      href: '#',
      onClick: () => {
        handleOnClick(key);
        // openNote(key);
      },
    });
  });

  return <Breadcrumb items={items} />;
}
