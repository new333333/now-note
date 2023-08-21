import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Collapse, Tooltip } from 'antd';
import { Note as NoteDataModel } from 'main/modules/DataModels';
import { UIControllerContext } from 'renderer/UIControllerContext';
import { UIController } from 'types';
import NoteBreadCrumb from './NoteBreadCrumb';

const { Panel } = Collapse;

interface Props {
  noteKey: string;
  initValue?: NoteDataModel[] | undefined;
}

export default function NoteBreadCrumbCollapse({ noteKey, initValue }: Props) {
  const [parents, setParent] = useState<NoteDataModel[] | undefined>([]);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchParents = useCallback(async () => {
    setParent(await uiController.getParents(noteKey));
  }, [uiController, noteKey]);

  useEffect(() => {
    if (initValue !== undefined) {
      setParent(initValue);
    } else {
      fetchParents();
    }
  }, [fetchParents, initValue]);

  return (
    <div>
      {parents && (
        <Collapse
          bordered={false}
          ghost
          style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
          <Panel
            key={noteKey}
            header={
              <Tooltip
                placement="bottomLeft"
                title={parents.map((parent, index) => {
                  return (
                    <span key={parent.key}>
                      {parent.title}{' '}
                      {index < parents.length - 1 ? <>&nbsp;/&nbsp;</> : <></>}
                    </span>
                  );
                })}
              >
                <span className="nn-breadCrumb-collapsed">
                  {parents.map((parent, index) => {
                    return (
                      <span key={parent.key}>
                        {parent.title}{' '}
                        {index < parents.length - 1 ? (
                          <span style={{ padding: '0 5px' }}>/</span>
                        ) : (
                          <></>
                        )}
                      </span>
                    );
                  })}
                </span>
              </Tooltip>
            }
          >
            <NoteBreadCrumb initValue={parents} noteKey={noteKey} />
          </Panel>
        </Collapse>
      )}
    </div>
  );
}

NoteBreadCrumbCollapse.defaultProps = {
  initValue: undefined,
};
