import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip } from 'antd';
import { times } from 'lodash';
import React from 'react';

class NoteTags extends React.Component {

    constructor() {
        super();

        this.inputRef = React.createRef();
        this.editInputRef = React.createRef();

        this.showInput = this.showInput.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleInputConfirm = this.handleInputConfirm.bind(this);
        this.handleEditInputChange = this.handleEditInputChange.bind(this);
        this.handleEditInputConfirm = this.handleEditInputConfirm.bind(this);
        this.state = {
            inputVisible: false,
            inputValue: "",
            editInputIndex: -1,
            editInputValue: ""
        };
    }

    handleCloseTag(event) {
        console.log("handleCloseTag event", event);
    }

    showInput(event) {
        this.setState({
            inputVisible: true
        });
    }

    handleEditInputChange(event) {
        this.setState({
            editInputValue: event.target.value
        });
    };

    handleEditInputConfirm(event) {
        //const newTags = [...tags];
        //newTags[editInputIndex] = editInputValue;
        //setTags(newTags);
        this.setState({
            editInputIndex: -1,
            editInputValue: ""
        });

    }

    handleInputChange(event) {
        this.setState({
            inputValue: event.target.value
        });
    }

    handleInputConfirm(event) {
        if (this.state.inputValue && this.props.tags.indexOf(this.state.inputValue) === -1) {
            this.props.addTag(this.state.inputValue);
        }
      
        this.setState({
            inputVisible: false,
            inputValue: ""
        });
    }
  
    componentDidUpdate() {
        if (this.inputRef.current) {
            this.inputRef.current.focus();
        }
        if (this.editInputRef.current) {
            this.editInputRef.current.focus();
        }
    }

    render() {
        console.log("NoteTags render");
        return (
            <>
                {this.props.tags.map((tag, index) => {

                    if (this.state.editInputIndex === index) {
                        return (
                        <Input
                            ref={this.editInputRef}
                            key={tag}
                            size="small"
                            className="nn-tag-input"
                            value={this.state.editInputValue}
                            onChange={this.handleEditInputChange}
                            onBlur={this.handleEditInputConfirm}
                            onPressEnter={this.handleEditInputConfirm}
                        />
                        );
                    }

                    const isLongTag = tag.length > 20;
                    const tagElem = (
                        <Tag
                            className="nn-edit-tag"
                            key={tag}
                            closable={true}
                            onClose={(event)=> this.handleCloseTag(tag)}
                        >
                            <span
                                onClick={(e) => {
                                    this.setState({
                                        editInputIndex: index,
                                        editInputValue: tag
                                    });
                                    e.preventDefault();
                            }}
                            >
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

                {this.state.inputVisible && (
                    <Input
                        ref={this.inputRef}
                        type="text"
                        size="small"
                        className="nn-tag-input"
                        value={this.state.inputValue}
                        onChange={this.handleInputChange}
                        onBlur={this.handleInputConfirm}
                        onPressEnter={this.handleInputConfirm}
                    />
                )}
                {!this.state.inputVisible && (
                    <Tag className="nn-site-tag-plus" onClick={this.showInput}>
                        <PlusOutlined /> New Tag
                    </Tag>
                )}
            </>
        );
    }
}

export {NoteTags};



