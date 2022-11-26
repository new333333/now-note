import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip, AutoComplete } from 'antd';
import { times } from 'lodash';
import React from 'react';

class NoteTags extends React.Component {

    constructor() {
        super();

        this.inputRefAutoComplete = React.createRef();

        this.showInputAutoComplete = this.showInputAutoComplete.bind(this);
        this.onSelectAutoComplete = this.onSelectAutoComplete.bind(this);
        this.onSearchAutoComplete = this.onSearchAutoComplete.bind(this);
        this.onChangeAutoComplete = this.onChangeAutoComplete.bind(this);
        this.onKeyDownAutoComplete = this.onKeyDownAutoComplete.bind(this);
        this.onBlurAutoComplete = this.onBlurAutoComplete.bind(this);


        this.state = {
            inputAutoCompleteVisible: false,
            valueAutoComplete: "",
            optionsAutoComplete: [],
        };
    }

    onKeyDownAutoComplete(event) {
        console.log("onKeyDownAutoComplete", event);
        if (event.key === 'Escape') {
            this.onBlurAutoComplete();
        }
    }

    onBlurAutoComplete() {
        this.setState({
            inputAutoCompleteVisible: false,
            valueAutoComplete: "",
            optionsAutoComplete: []
        });
    }

    async onSelectAutoComplete(tag) {
        console.log("onSelectAutoComplete", tag);

        if (tag && this.props.tags.indexOf(tag) === -1) {
            await this.props.addTag(this.props.noteKey, tag);
        }
        
        this.setState({
            inputAutoCompleteVisible: false,
            valueAutoComplete: "",
            optionsAutoComplete: []
        });
    }

    async onSearchAutoComplete(searchText) {
        let tags = await this.props.dataSource.findTag(searchText);

        let found = false;
        let options = tags.map(function(currentTag) {
            if (currentTag == searchText) {
                found = true;
            }
			return {
                label: currentTag,
                value: currentTag,
            };
		});

        if (!found && searchText) {
            options.unshift({
                label: "New tag: " + searchText,
                value: searchText,
            });
        }

        this.setState({
            optionsAutoComplete: options
        });
    }

    onChangeAutoComplete(data) {
        this.setState({
            valueAutoComplete: data
        });
    }

    handleCloseTag(tag) {
        this.props.deleteTag(this.props.noteKey, tag);
    }

    showInputAutoComplete(event) {
        this.setState({
            inputAutoCompleteVisible: true
        });
    }

    componentDidUpdate() {
        if (this.inputRefAutoComplete.current) {
            this.inputRefAutoComplete.current.focus();
        }
    }

    render() {
        return (
            <>
                {this.props.tags.map((tag, index) => {

                    const isLongTag = tag.length > 20;
                    const tagElem = (
                        <Tag
                            className="nn-edit-tag"
                            key={tag}
                            closable={!this.props.trash}
                            onClose={(event)=> this.handleCloseTag(tag)}
                        >
                            <span>
                            {isLongTag ? `${tag.slice(0, 20)}...` : tag}
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

                {
                    !this.props.trash && 
                    <>
                        {this.state.inputAutoCompleteVisible && (
                            <AutoComplete
                                ref={this.inputRefAutoComplete}
                                defaultActiveFirstOption={true}
                                value={this.state.valueAutoComplete}
                                options={this.state.optionsAutoComplete}
                                style={{ width: 200 }}
                                onSelect={this.onSelectAutoComplete}
                                onBlur={this.onBlurAutoComplete}
                                onKeyDown={this.onKeyDownAutoComplete}
                                onSearch={this.onSearchAutoComplete}
                                onChange={this.onChangeAutoComplete}
                            >
                                <Input.Search size="small" placeholder="" />
                            </AutoComplete>
                        )}
                        {!this.state.inputAutoCompleteVisible && (
                            <Tag className="nn-site-tag-plus" onClick={this.showInputAutoComplete}>
                                <PlusOutlined /> New Tag
                            </Tag>
                        )}
                    </>
                }
            </>
        );
    }
}

export {NoteTags};



