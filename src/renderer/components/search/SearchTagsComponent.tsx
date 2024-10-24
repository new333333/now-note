import log from 'electron-log';
import { useRef, useState, useCallback, KeyboardEvent } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip, AutoComplete } from 'antd';
import { nowNoteAPI } from 'renderer/NowNoteAPI';

interface Props {
  // eslint-disable-next-line react/no-unused-prop-types
  tags: string[];
  handleAddTag: Function;
  handleRemoveTag: Function;
}

declare type AutoCompleteOption = {
  label: string;
  value: string;
};

const SearchTagsComponentLog = log.scope('SearchTagsComponent');

export default function SearchTagsComponent({
  tags,
  handleAddTag,
  handleRemoveTag,
}: Props) {
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
      handleAddTag(newTag);
      setInputAutoCompleteVisible(false);
      setValueAutoComplete('');
      setOptionsAutoComplete([]);
      if (inputRefAutoComplete.current) {
        inputRefAutoComplete.current.focus();
      }
    },
    [handleAddTag]);

  const onSearchAutoComplete = useCallback(async (searchText: string) => {
    const matchingTags: string[] = await nowNoteAPI.findTag(searchText);
    const options: AutoCompleteOption[] = matchingTags.map((nextTag) => {
      return {
        label: nextTag,
        value: nextTag,
      };
    });
    setOptionsAutoComplete(options);
  }, []);

  const onChangeAutoComplete = useCallback(async (data: string) => {
    setValueAutoComplete(data);
  }, []);

  const handleCloseTag = useCallback(
    async (tag: string) => {
      handleRemoveTag(tag);
    },
    [handleRemoveTag]
  );

  const showInputAutoComplete = useCallback(async () => {
    setInputAutoCompleteVisible(true);
  }, []);

  return (
    <>
      {tags.map((tag) => {
        const isLongTag = tag.length > 20;
        const tagElem = (
          <Tag
            className="nn-edit-tag"
            key={tag}
            closable
            onClose={() => handleCloseTag(tag)}
          >
            <span>{isLongTag ? `${tag.slice(0, 20)}...` : tag}</span>
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
            <PlusOutlined /> Select Tag
          </Tag>
        )}
      </>
    </>
  );
}
