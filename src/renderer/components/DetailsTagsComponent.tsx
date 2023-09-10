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
import { UIControllerContext } from 'renderer/UIControllerContext';
import { UIController } from 'types';
import useNoteStore from 'renderer/NoteStore';

declare type AutoCompleteOption = {
  label: string;
  value: string;
};


export default function DetailsTagsComponent() {
  const [note] = useNoteStore((state) => [state.detailsNote]);

  const inputRefAutoComplete = useRef<AutoComplete>(null);
  const [tags, setTags] = useState<TagDataModel[]>([]);

  const [inputAutoCompleteVisible, setInputAutoCompleteVisible] =
    useState<boolean>(false);
  const [valueAutoComplete, setValueAutoComplete] = useState<string>('');
  const [optionsAutoComplete, setOptionsAutoComplete] = useState<
    AutoCompleteOption[]
  >([]);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

  const fetchTags = useCallback(async () => {
    if (note !== undefined) {
      setTags(await uiController.getTags(note.key));
    }
  }, [uiController, note]);

  // listen to note's tag changes
  const tagChangeListener = useCallback(
    async (key: string) => {
      log.debug(`I'm listener to tag changes on note(key: ${key})`);
      if (note !== undefined && key === note.key) {
        await fetchTags();
      }
    },
    [fetchTags, note]
  );

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
      if (note !== undefined) {
        await uiController.addTag(note.key, newTag);
        setTags(await uiController.getTags(note.key));

        setInputAutoCompleteVisible(false);
        setValueAutoComplete('');
        setOptionsAutoComplete([]);
        if (inputRefAutoComplete.current) {
          inputRefAutoComplete.current.focus();
        }
      }
    },
    [uiController, note]
  );

  const onSearchAutoComplete = useCallback(
    async (searchText: string) => {
      const matchingTags: TagDataModel[] = await uiController.findTag(
        searchText
      );
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
    [uiController]
  );

  const onChangeAutoComplete = useCallback(async (data: string) => {
    setValueAutoComplete(data);
  }, []);

  async function handleCloseTag(tag: string) {
    if (note !== undefined) {
      await uiController.removeTag(note.key, tag);
    }
  }

  const showInputAutoComplete = useCallback(async () => {
    setInputAutoCompleteVisible(true);
  }, []);


  useEffect(() => {
    fetchTags();
  }, [note]);

  return (
    <>
      {note && <>
        {tags.map((tag) => {
          const isLongTag = tag.tag.length > 20;
          const tagElem = (
            <Tag
              className="nn-edit-tag"
              key={tag.tag}
              closable={!note.trash}
              onClose={() => handleCloseTag(tag.tag)}
            >
              <span>
                {isLongTag
                  ? `${tag.tag.slice(0, 20)}...`
                  : tag.tag}
              </span>
            </Tag>
          );

          return isLongTag ? (
            <Tooltip title={tag.tag} key={tag.tag}>
              {tagElem}
            </Tooltip>
          ) : (
            tagElem
          );
        })}

        {!note.trash &&
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
      </>}
    </>
  );
}
