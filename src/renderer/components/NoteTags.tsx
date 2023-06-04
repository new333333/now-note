import { useRef, useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip, AutoComplete } from 'antd';
import { Tag as TagDataModel } from 'main/modules/DataModels';
import { TagService } from 'types';

declare type AutoCompleteOption = {
  label: string;
  value: string;
};

interface Props {
  readOnly: boolean;
  noteKey: string;
  tagService: TagService;
}

export default function NoteTags({ readOnly, noteKey, tagService }: Props) {
  const inputRefAutoComplete = useRef<AutoComplete>(null);

  const [tags, setTags] = useState<TagDataModel[]>([]);

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
      if (event.key === 'Escape') {
        onBlurAutoComplete();
      }
    },
    [onBlurAutoComplete]
  );

  const fetchTags = useCallback(async () => {
    setTags(await tagService.getTags(noteKey));
  }, [noteKey, tagService]);

  const onSelectAutoComplete = useCallback(
    async (newTag: string) => {
      await tagService.addTag(noteKey, newTag);
      await fetchTags();

      setInputAutoCompleteVisible(false);
      setValueAutoComplete('');
      setOptionsAutoComplete([]);
      if (inputRefAutoComplete.current) {
        inputRefAutoComplete.current.focus();
      }
    },
    [tagService, fetchTags, noteKey]
  );

  const onSearchAutoComplete = useCallback(
    async (searchText: string) => {
      const matchingTags: TagDataModel[] = await tagService.findTag(searchText);

      let found = false;
      const options: AutoCompleteOption[] = matchingTags.map((currentTag) => {
        if (currentTag.tag === searchText) {
          found = true;
        }
        return {
          label: currentTag.tag,
          value: currentTag.tag,
        };
      });

      if (!found && searchText) {
        options.unshift({
          label: `New tag: ${searchText}`,
          value: searchText,
        });
      }
      setOptionsAutoComplete(options);
    },
    [tagService]
  );

  const onChangeAutoComplete = useCallback(async (data: string) => {
    setValueAutoComplete(data);
  }, []);

  async function handleCloseTag(tag: string) {
    await tagService.removeTag(noteKey, tag);
    await fetchTags();
  }

  const showInputAutoComplete = useCallback(async () => {
    setInputAutoCompleteVisible(true);
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return (
    <>
      {tags.map((tag) => {
        const isLongTag = tag.dataValues.tag.length > 20;
        const tagElem = (
          <Tag
            className="nn-edit-tag"
            key={tag.dataValues.tag}
            closable={!readOnly}
            onClose={() => handleCloseTag(tag.dataValues.tag)}
          >
            <span>
              {isLongTag
                ? `${tag.dataValues.tag.slice(0, 20)}...`
                : tag.dataValues.tag}
            </span>
          </Tag>
        );

        return isLongTag ? (
          <Tooltip title={tag.dataValues.tag} key={tag.dataValues.tag}>
            {tagElem}
          </Tooltip>
        ) : (
          tagElem
        );
      })}

      {!readOnly &&
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
