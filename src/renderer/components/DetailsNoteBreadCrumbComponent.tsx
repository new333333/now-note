import log from 'electron-log';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import NoteBreadCrumbComponent from './NoteBreadCrumbComponent';

const BreadCrumbElementNoteLog = log.scope('BreadCrumbElementNote');

export default function DetailsNoteBreadCrumbComponent() {
  const keyPath = useDetailsNoteStore((state) => state.keyPath);
  const titlePath = useDetailsNoteStore((state) => state.titlePath);

  if (keyPath === null || titlePath === null) {
    return null;
  }

  return <NoteBreadCrumbComponent keyPath={keyPath} titlePath={titlePath} />;
}
