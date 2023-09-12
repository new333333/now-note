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
import { Note } from 'main/modules/DataModels';
import { UIControllerContext } from 'renderer/UIControllerContext';
import { UIController } from 'types';
import useNoteStore from 'renderer/NoteStore';

declare type AutoCompleteOption = {
  label: string;
  value: string;
};

interface Props {
  note: Note;
}

export default function DetailsTagsComponent({ note }: Props) {
  const [setTags] = useNoteStore((state) => [state.setTags]);

  const inputRefAutoComplete = useRef<AutoComplete>(null);
  const [inputAutoCompleteVisible, setInputAutoCompleteVisible] =
    useState<boolean>(false);
  const [valueAutoComplete, setValueAutoComplete] = useState<string>('');
  const [optionsAutoComplete, setOptionsAutoComplete] = useState<
    AutoCompleteOption[]
  >([]);

  const { uiController }: { uiController: UIController } =
    useContext(UIControllerContext);

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
      if (note !== undefined) {
        const newTags = await uiController.addTag(note.key, newTag);
        log.debug(`DetailsTagsComponent addTag() => newTags=${newTags}`);
        setTags(note.key, newTags);
        setInputAutoCompleteVisible(false);
        setValueAutoComplete('');
        setOptionsAutoComplete([]);
        if (inputRefAutoComplete.current) {
          inputRefAutoComplete.current.focus();
        }
      }
    },
    [note, uiController, setTags]
  );

  const onSearchAutoComplete = useCallback(
    async (searchText: string) => {
      const matchingTags: string[] = await uiController.findTag(searchText);
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
    },
    [uiController]
  );

  const onChangeAutoComplete = useCallback(async (data: string) => {
    setValueAutoComplete(data);
  }, []);

  const handleCloseTag = useCallback(
    async (tag: string) => {
      if (note !== undefined) {
        const newTags = await uiController.removeTag(note.key, tag);
        log.debug(`DetailsTagsComponent removeTag() => newTags=${newTags}`);
        setTags(note.key, newTags);
      }
    },
    [note, setTags, uiController]
  );

  const showInputAutoComplete = useCallback(async () => {
    setInputAutoCompleteVisible(true);
  }, []);

  log.debug(`DetailsTagsComponent note.tags=${note.tags}`);

  const tags =
    note.tags !== null && note.tags !== undefined && note.tags.length > 0
      ? note.tags.substring(2, note.tags.length - 2).split('|')
      : [];

  return (
    <>
      {note && <>
        {tags.map((tag) => {
          const isLongTag = tag > 20;
          const tagElem = (
            <Tag
              className="nn-edit-tag"
              key={tag}
              closable={!note.trash}
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
