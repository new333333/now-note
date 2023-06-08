import log from 'electron-log';
import {
  useRef,
  useState,
  useEffect,
  useContext,
  useCallback,
  KeyboardEvent,
} from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip, AutoComplete } from 'antd';
import { Tag as TagDataModel } from 'main/modules/DataModels';
import { DataServiceContext } from 'renderer/DataServiceContext';
import { TagService } from 'types';

declare type AutoCompleteOption = {
  label: string;
  value: string;
};

interface Props {
  readOnly: boolean;
  noteKey: string;
}

export default function DetailsTagsComponent({ readOnly, noteKey }: Props) {
  const inputRefAutoComplete = useRef<AutoComplete>(null);
  const [tags, setTags] = useState<TagDataModel[]>([]);

  const [inputAutoCompleteVisible, setInputAutoCompleteVisible] =
    useState<boolean>(false);
  const [valueAutoComplete, setValueAutoComplete] = useState<string>('');
  const [optionsAutoComplete, setOptionsAutoComplete] = useState<
    AutoCompleteOption[]
  >([]);

  const { dataService }: { dataService: TagService } =
    useContext(DataServiceContext);

  const fetchTags = useCallback(async () => {
    setTags(await dataService.getTags(noteKey));
  }, [dataService, noteKey]);

  // listen to tag's changes
  const tagChangeListener = useCallback(
    async (key: string) => {
      log.debug(`I'm listener to tag changes on note(key: ${key})`);
      if (key === noteKey) {
        await fetchTags();
      }
    },
    [fetchTags, noteKey]
  );

  useEffect(() => {
    dataService.subscribe('addTag', 'after', tagChangeListener);
    dataService.subscribe('removeTag', 'after', tagChangeListener);
    return () => {
      dataService.unsubscribe('addTag', 'after', tagChangeListener);
      dataService.unsubscribe('removeTag', 'after', tagChangeListener);
    };
  }, [tagChangeListener, dataService]);

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

  const onSelectAutoComplete = useCallback(
    async (newTag: string) => {
      await dataService.addTag(noteKey, newTag);

      setInputAutoCompleteVisible(false);
      setValueAutoComplete('');
      setOptionsAutoComplete([]);
      if (inputRefAutoComplete.current) {
        inputRefAutoComplete.current.focus();
      }
    },
    [dataService, noteKey]
  );

  const onSearchAutoComplete = useCallback(
    async (searchText: string) => {
      const matchingTags: TagDataModel[] = await dataService.findTag(searchText);
      let found = false;
      const options: AutoCompleteOption[] = matchingTags.map((currentTag) => {
        if (currentTag.dataValues.tag === searchText) {
          found = true;
        }
        return {
          label: currentTag.dataValues.tag,
          value: currentTag.dataValues.tag,
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
    [dataService]
  );

  const onChangeAutoComplete = useCallback(async (data: string) => {
    setValueAutoComplete(data);
  }, []);

  async function handleCloseTag(tag: string) {
    await dataService.removeTag(noteKey, tag);
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
