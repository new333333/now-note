import log from 'electron-log';
import {
  useRef,
  useState,
  useContext,
  useCallback,
  KeyboardEvent,
} from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip, AutoComplete } from 'antd';
import useDetailsNoteStore from 'renderer/DetailsNoteStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

declare type AutoCompleteOption = {
  label: string;
  value: string;
};

const DetailsNoteTagsComponentLog = log.scope('DetailsNoteTagsComponent');

export default function DetailsNoteTagsComponent() {
  const detailsNoteKey = useDetailsNoteStore((state) => state.noteKey);
  const detailsNoteTags = useDetailsNoteStore((state) => state.tags);
  const detailsNoteTrash = useDetailsNoteStore((state) => state.trash);
  const detailsNoteUpdateTags = useDetailsNoteStore(
    (state) => state.updateTags
  );

  const inputRefAutoComplete = useRef<AutoComplete>(null);
  const [inputAutoCompleteVisible, setInputAutoCompleteVisible] =
    useState<boolean>(false);
  const [valueAutoComplete, setValueAutoComplete] = useState<string>('');
  const [optionsAutoComplete, setOptionsAutoComplete] = useState<
    AutoCompleteOption[]
  >([]);

  const onBlurAutoComplete = useCallback(async () => {
    setInputAutoCompleteVisible(false);
    setValueAutoComplete('');
    setOptionsAutoComplete([]);
  }, []);

  const onKeyDownAutoComplete = useCallback(
    async (event: KeyboardEvent) => {
      if (event.key === '|') {
        // prevent onChange
        event.preventDefault();
      }
      if (event.key === 'Escape') {
        onBlurAutoComplete();
      }
    },
    [onBlurAutoComplete]
  );

  const onSelectAutoComplete = useCallback(
    async (newTag: string) => {
      if (detailsNoteKey === null) {
        return;
      }
      const newTags = await nowNoteAPI.addTag(detailsNoteKey, newTag);
      DetailsNoteTagsComponentLog.debug(`addTag() => newTags=${newTags}`);
      detailsNoteUpdateTags(detailsNoteKey, newTags);
      setInputAutoCompleteVisible(false);
      setValueAutoComplete('');
      setOptionsAutoComplete([]);
      if (inputRefAutoComplete.current) {
        inputRefAutoComplete.current.focus();
      }
    },
    [detailsNoteKey, detailsNoteUpdateTags]
  );

  const onSearchAutoComplete = useCallback(async (searchText: string) => {
    const matchingTags: string[] = await nowNoteAPI.findTag(searchText);
    let found = false;
    const options: AutoCompleteOption[] = matchingTags.map((nextTag) => {
      if (nextTag === searchText) {
        found = true;
      }
      return {
        label: nextTag,
        value: nextTag,
      };
    });

    if (!found && searchText) {
      options.unshift({
        label: `New tag: ${searchText}`,
        value: searchText,
      });
    }
    setOptionsAutoComplete(options);
  }, []);

  const onChangeAutoComplete = useCallback(async (data: string) => {
    setValueAutoComplete(data);
  }, []);

  const handleCloseTag = useCallback(
    async (tag: string) => {
      if (detailsNoteKey === null) {
        return;
      }
      const newTags = await nowNoteAPI.removeTag(detailsNoteKey, tag);
      DetailsNoteTagsComponentLog.debug(`removeTag() => newTags=${newTags}`);
      detailsNoteUpdateTags(detailsNoteKey, newTags);
    },
    [detailsNoteKey, detailsNoteUpdateTags]
  );

  const showInputAutoComplete = useCallback(async () => {
    setInputAutoCompleteVisible(true);
  }, []);

  DetailsNoteTagsComponentLog.debug(
    `render detailsNoteTags=${detailsNoteTags}`
  );

  const tags =
    detailsNoteTags !== null &&
    detailsNoteTags !== undefined &&
    detailsNoteTags.length > 0
      ? detailsNoteTags.substring(2, detailsNoteTags.length - 2).split('|')
      : [];

  return (
    <>
      {tags.map((tag) => {
        const isLongTag = tag.length > 20;
        const tagElem = (
          <Tag
            className="nn-edit-tag"
            key={tag}
            closable={!detailsNoteTrash}
            onClose={() => handleCloseTag(tag)}
          >
            <span>
              {isLongTag
                ? `${tag.slice(0, 20)}...`
                : tag}
            </span>
          </Tag>
        );

        return isLongTag ? (
          <Tooltip title={tag} key={tag}>
            {tagElem}
          </Tooltip>
        ) : (
          tagElem
        );
      })}

      {!detailsNoteTrash &&
        <>
          {inputAutoCompleteVisible && (
            <AutoComplete
              autoFocus
              ref={inputRefAutoComplete}
              defaultActiveFirstOption
              value={valueAutoComplete}
              options={optionsAutoComplete}
              style={{ width: 200 }}
              onSelect={onSelectAutoComplete}
              onBlur={onBlurAutoComplete}
              onKeyDown={onKeyDownAutoComplete}
              onSearch={onSearchAutoComplete}
              onChange={onChangeAutoComplete}
            >
              <Input.Search size="small" placeholder="" />
            </AutoComplete>
          )}
          {!inputAutoCompleteVisible && (
            <Tag className="nn-site-tag-plus" onClick={showInputAutoComplete}>
              <PlusOutlined /> New Tag
            </Tag>
          )}
        </>
      }
    </>
  );
}
