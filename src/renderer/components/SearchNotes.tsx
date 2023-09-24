import { useState, useContext, useCallback } from 'react';
import { Input, AutoComplete } from 'antd';
import { SearchResultOptions } from 'types';
import useNoteStore from 'renderer/GlobalStore';
import { nowNoteAPI } from 'renderer/NowNoteAPI';
import UIApiDispatch from 'renderer/UIApiDispatch';

export default function SearchNotes() {
  const [trash] = useNoteStore((state) => [state.trash]);

  const uiApi = useContext(UIApiDispatch);

  const [loading, setLoading] = useState<boolean>(false);
  const [valueAutoComplete, setValueAutoComplete] = useState<string>('');
  const [optionsAutoComplete, setOptionsAutoComplete] = useState([]); // TODO: type
  const [startSearchPosition, setStartSearchPosition] = useState<number>(0);

  function resultToListOption(results) {
    return results.map((note) => {
      return {
        label: (
          <div className="nn-search-option">
            <div className="nn-search-title">{note.title}</div>
            <div className="nn-search-breadCrumb">{note.path}</div>
          </div>
        ),
        value: note.key,
      };
    });
  }

  const openNote = useCallback(
    async (noteKey: string) => {
      const note = await nowNoteAPI.getNoteWithDescription(noteKey);
      uiApi.openDetailNote(note);
    },
    [uiApi]
  );

  const onSelectAutoComplete = useCallback(
    async (noteKey: string) => {
      setValueAutoComplete('');
      setOptionsAutoComplete([]);
      setStartSearchPosition(0);

      openNote(noteKey);
    },
    [openNote]
  );

  const onChangeAutoComplete = useCallback(async (data: string) => {
    setValueAutoComplete(data);
  }, []);

  const onSearchAutoComplete = useCallback(
    async (searchText: string) => {
      const searchResultOptions: SearchResultOptions = {
        parentNotesKey: [],
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
    <div
      style={{
        padding: 5,
        backgroundColor: '#eeeeee',
        borderBottom: '1px solid #dddddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
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
    </div>
  );
}
