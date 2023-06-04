import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip, AutoComplete } from 'antd';
import React from 'react';

class SearchNotes extends React.Component {

    constructor(props) {
        super(props);

        this.onSelectAutoComplete = this.onSelectAutoComplete.bind(this);
        this.onSearchAutoComplete = this.onSearchAutoComplete.bind(this);
        this.onChangeAutoComplete = this.onChangeAutoComplete.bind(this);
        this.onPopupScroll = this.onPopupScroll.bind(this);

        this.state = {
            valueAutoComplete: "",
            optionsAutoComplete: [],
            startSearchPosition: 0,
        };
    }

    async onSelectAutoComplete(key) {
        console.log("onSelectAutoComplete", key);

        this.setState({
            valueAutoComplete: "",
            optionsAutoComplete: [],
            startSearchPosition: 0,
        }, () => {
            this.props.openNoteInTreeAndDetails(key);
        });
    }


    resultToListOption(results) {

        return results.map(function(note) {
            return {
                label:
                    <div className="nn-search-option">
                        <div className="nn-search-title">
                            {note.title}
                        </div>
                        <div className="nn-search-breadCrumb">
                            {note.path}
                        </div>
                    </div>,
                value: note.key,
            };
        });

    }

    async onSearchAutoComplete(searchText) {
        let self = this;

        const searchResultOptions: SearchResultOptions = {
          parentNotesKey: [],
          types: [],
          dones: [],
          sortBy: '',
          offset: 0,
        };

        self.props.dataService.search(searchText, 20, self.props.trash, searchResultOptions).then(function(searchResult) {
            let options = self.resultToListOption(searchResult.results);

            self.setState((previousState) => {
                return {
                    optionsAutoComplete: options,
                    startSearchPosition: 20,
                }
            });
        });

    }

    onChangeAutoComplete(data) {
        this.setState({
            valueAutoComplete: data,
        });
    }



    onPopupScroll(event) {
        let self = this;
        let target = event.target;
        if (!this.state.loading && (event.target.scrollTop + event.target.offsetHeight + 1 >= event.target.scrollHeight)) {

            self.setState({loading: true}, ()=>{

                target.scrollTo(0, target.scrollHeight);

                const searchResultOptions: SearchResultOptions = {
                  parentNotesKey: [],
                  types: [],
                  dones: [],
                  sortBy: '',
                  offset: self.state.startSearchPosition + 20,
                };

                self.props.dataService.search(self.state.valueAutoComplete, 20, self.props.trash, searchResultOptions).then(function(searchResult) {
                    let newState = {
                        loading: false,
                    };

                    if (searchResult.results.length > 0) {
                        let options = self.resultToListOption(searchResult.results);

                        let newOptions = [...self.state.optionsAutoComplete, ...options];

                        newState.optionsAutoComplete = newOptions;
                        newState.startSearchPosition = self.state.startSearchPosition + options.length;
                    }

                    self.setState(newState);

                });
            });
        }
    }

    render() {
        return (
            <>
                <AutoComplete
                    dropdownMatchSelectWidth={500}
                    value={this.state.valueAutoComplete}
                    options={this.state.optionsAutoComplete}
                    style={{ width: "100%" }}
                    onSelect={this.onSelectAutoComplete}
                    onSearch={this.onSearchAutoComplete}
                    onChange={this.onChangeAutoComplete}
                    onPopupScroll={this.onPopupScroll}
                >
                    <Input.Search size="small" placeholder="Search" />
                </AutoComplete>
            </>
        );
    }
}

export {SearchNotes};



