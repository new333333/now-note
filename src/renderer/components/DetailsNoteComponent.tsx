import log from 'electron-log';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Divider } from 'antd';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import DetailsNotePriorityComponent from './DetailsNotePriorityComponent';
import DetailsNoteTitleComponent from './DetailsNoteTitleComponent';
import DetailsNoteDescriptionComponent from './DetailsNoteDescriptionComponent';
import DetailsNoteDoneComponent from './DetailsNoteDoneComponent';
import DetailsNoteTypeComponent from './DetailsNoteTypeComponent';
import DetailsNoteTagsComponent from './DetailsNoteTagsComponent';
import DetailsNoteBacklinksComponent from './DetailsNoteBacklinksComponent';
import DetailsNoteBreadCrumbComponent from './DetailsNoteBreadCrumbComponent';
import DetailsNoteMenuComponent from './DetailsNoteMenuComponent';

const noteLog = log.scope('DetailsNoteComponent');

const DetailsNoteComponent = forwardRef(function DetailsNoteComponent(
  props,
  ref
) {
  const detailsNoteTitleComponentRef = useRef(null);
  const noteKey = useDetailsNoteStore((state) => state.noteKey);

  noteLog.debug(`noteKey=${noteKey}`);

  useImperativeHandle(
    ref,
    () => {
      return {
        setFocus: async (): Promise<void> => {
          console.log(`DetailsNoteComponent.setFocus()`);
          if (detailsNoteTitleComponentRef.current === null) {
            return;
          }
          await detailsNoteTitleComponentRef.current.setFocus();
        },
      };
    },
    []
  );

  if (noteKey === undefined || noteKey === null) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: 5,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          marginBottom: 3,
        }}
      >
        <DetailsNoteBreadCrumbComponent />
      </div>
      <div
        className="scroll-block"
        style={{
          paddingLeft: 5,
          paddingRight: 5,
          flex: 1,
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <DetailsNoteDoneComponent />
          <div style={{ flexBasis: '100%' }}>
            <DetailsNoteTitleComponent ref={detailsNoteTitleComponentRef} />
          </div>
          <div>
            <DetailsNoteMenuComponent />
          </div>
        </div>
        <div style={{ padding: '5px 0' }}>
          <DetailsNoteTypeComponent />
          <DetailsNotePriorityComponent />
          <DetailsNoteTagsComponent />
        </div>
        <div style={{ flex: 1 }}>
          <DetailsNoteDescriptionComponent />
        </div>
      </div>
      <div>
        <DetailsNoteBacklinksComponent />
      </div>
    </div>
  );
});

export default DetailsNoteComponent;
