import { Progress } from 'antd';
import { useState, useEffect, useCallback, useRef } from 'react';
import { jsx } from 'react/jsx-runtime';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

const useReindexingRepository = (): [
  number,
  () => Promise<void>,
  () => void,
  jsx.Element | null
] => {
  const [reindexingProgress, setReindexingProgress] = useState(100);
  const reindexingTimerRef = useRef<string | number | Timeout | undefined>(
    undefined
  );

  const updateReindexingProgress = useCallback(async () => {
    const reindexingProg: number = await nowNoteAPI.getReindexingProgress();
    console.log('reindexingProg=', reindexingProg);
    setReindexingProgress(reindexingProg);
    if (reindexingProg < 100) {
      setTimeout(() => {
        console.log('This will run after 1 second!');
        updateReindexingProgress();
      }, 1000);
    }
  }, []);

  const reindexRepository = useCallback(async () => {
    setReindexingProgress(0);

    // index asynchron
    nowNoteAPI.reindex(undefined);

    reindexingTimerRef.current = setTimeout(() => {
      console.log('This will run after 1 second!');
      updateReindexingProgress();
    }, 1000);
  }, [updateReindexingProgress]);

  const getReindexingProgress = useCallback(async (): Promise<number> => {
    const reindexingProg: number = await nowNoteAPI.getReindexingProgress();
    setReindexingProgress(reindexingProg);
    return reindexingProg;
  }, []);

  const reindexIfNeeded = useCallback(async (): Promise<void> => {
    const reindexingProg: number = await getReindexingProgress();
    if (reindexingProg < 100) {
      reindexRepository();
    }
  }, [getReindexingProgress, reindexRepository]);

  const reindexIngProgressComponent =
    reindexingProgress !== 100 ? (
      <div
        style={{
          justifyContent: 'center',
          display: 'flex',
          height: '100%',
          alignItems: 'center',
        }}
      >
        <Progress
          type="circle"
          percent={reindexingProgress}
          size={400}
          format={(percent) => `Reindexing repository ${percent}%`}
        />
      </div>
    ) : null;

  useEffect(() => {
    setReindexingProgress(100);
    return () => clearTimeout(reindexingTimerRef.current);
  }, []);

  return [
    reindexingProgress,
    reindexIfNeeded,
    reindexRepository,
    reindexIngProgressComponent,
  ];
};

export default useReindexingRepository;
