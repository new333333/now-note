import { useState, useCallback } from 'react';
import { Input, AutoComplete } from 'antd';
import { NoteDTO, SearchResultOptions } from 'types';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import { gray6 } from 'renderer/css/Styles';

interface Props {
  trash: boolean;
  onSelect: Function;
  excludeParentNotesKeyProp: string[];
}

export default function SearchNotes({
  trash,
  onSelect,
  excludeParentNotesKeyProp,
}: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const [valueAutoComplete, setValueAutoComplete] = useState<string>('');
  const [optionsAutoComplete, setOptionsAutoComplete] = useState([]); // TODO: type
  const [startSearchPosition, setStartSearchPosition] = useState<number>(0);

  function resultToListOption(results: NoteDTO[]) {
    return results.map((note: NoteDTO) => {
      return {
        label: (
          <div>
            <div>{note.title}</div>
            <div style={{ color: gray6, whiteSpace: 'break-spaces' }}>
              {note.titlePath
                ?.substring(2, note.titlePath.length - 2)
                .replaceAll('/', ' / ')}
            </div>
          </div>
        ),
        value: note.key,
      };
    });
  }

  const onSelectAutoComplete = useCallback(
    async (noteKey: string) => {
      setValueAutoComplete('');
      setOptionsAutoComplete([]);
      setStartSearchPosition(0);
      onSelect(noteKey);
    },
    [onSelect]
  );

  const onChangeAutoComplete = useCallback(async (data: string) => {
    setValueAutoComplete(data);
  }, []);

  const onSearchAutoComplete = useCallback(
    async (searchText: string) => {
      const searchResultOptions: SearchResultOptions = {
        parentNotesKey: [],
        excludeParentNotesKey: excludeParentNotesKeyProp,
        types: [],
        dones: [],
        sortBy: '',
        offset: 0,
      };

      const searchResult = await nowNoteAPI.search(
        searchText,
        20,
        trash,
        searchResultOptions
      );

      const options = resultToListOption(searchResult.results);

      setOptionsAutoComplete(options);
      setStartSearchPosition(20);
    },
    [trash]
  );

  const onPopupScroll = useCallback(
    async (event) => {
      if (
        !loading &&
        event.target.scrollTop + event.target.offsetHeight + 1 >=
          event.target.scrollHeight
      ) {
        setLoading(true);
        event.target.scrollTo(0, event.target.scrollHeight);
        const searchResultOptions: SearchResultOptions = {
          parentNotesKey: [],
          types: [],
          dones: [],
          sortBy: '',
          offset: startSearchPosition + 20,
        };

        const searchResult = await nowNoteAPI.search(
          valueAutoComplete,
          20,
          trash,
          searchResultOptions
        );

        if (searchResult.results.length > 0) {
          const options = resultToListOption(searchResult.results);
          const newOptions = [...optionsAutoComplete, ...options];

          setOptionsAutoComplete(newOptions);
          setStartSearchPosition(startSearchPosition + options.length);
        }

        setLoading(false);
      }
    },
    [
      loading,
      optionsAutoComplete,
      startSearchPosition,
      trash,
      valueAutoComplete,
    ]
  );

  return (
    <AutoComplete
      dropdownMatchSelectWidth={500}
      value={valueAutoComplete}
      options={optionsAutoComplete}
      style={{ width: 200 }}
      onSelect={onSelectAutoComplete}
      onSearch={onSearchAutoComplete}
      onChange={onChangeAutoComplete}
      onPopupScroll={onPopupScroll}
    >
      <Input.Search size="small" placeholder="Search" />
    </AutoComplete>
  );
}
