import {
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import log from 'electron-log';
import useNoteStore from 'renderer/NoteStore';


export default function Tree2() {
  const [trash] = useNoteStore((state) => [state.trash]);

  const loadTree = useCallback(
    async (event: string | undefined, data) => {
      log.debug(`Tree2.loadTree() trash=${trash}`);
      return [];
    },
    [trash]
  );

  const initTree = useCallback(async () => {
    log.debug('Tree2.initTree())');
    loadTree(undefined, undefined);
  }, [loadTree]);

  useEffect(() => {
    log.debug(`Tree2->useEffect on initTree trash=${trash}`);
    initTree();
  }, [initTree, trash]);


  return <div className="n3-tree">tree2</div>;
}
