import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip, AutoComplete } from 'antd';
import { times } from 'lodash';
import React from 'react';

class SearchNotes extends React.Component {

    constructor() {
        super();

        this.onSelectAutoComplete = this.onSelectAutoComplete.bind(this);
        this.onSearchAutoComplete = this.onSearchAutoComplete.bind(this);
        this.onChangeAutoComplete = this.onChangeAutoComplete.bind(this);
        this.state = {
            valueAutoComplete: "",
            optionsAutoComplete: [],
        };
    }

    async onSelectAutoComplete(key) {
        console.log("onSelectAutoComplete", key);
       
        this.setState({
            valueAutoComplete: "",
            optionsAutoComplete: []
        });

        await this.props.openNoteInTree(key);
    }

    async onSearchAutoComplete(searchText) {
        let notes = await this.props.dataSource.search(searchText, 20, false);

        let options = notes.map(function(note) {
			return {
                label: (
                    <>
                        <div>
                            {note.title}
                        </div>
                        <div style={{color: "#bbb", fontSize: "12px"}}>
                            {note.path}
                        </div>
                    </>
                  ),
                value: note.key,
            };
		});

        this.setState({
            optionsAutoComplete: options
        });
    }

    onChangeAutoComplete(data) {
        this.setState({
            valueAutoComplete: data
        });
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
                >
                    <Input.Search placeholder="Search" />
                </AutoComplete>
            </>
        );
    }
}

export {SearchNotes};


