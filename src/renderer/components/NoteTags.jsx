import { PlusOutlined } from '@ant-design/icons';
import { Input, Tag, Tooltip } from 'antd';
import { times } from 'lodash';
import React from 'react';

class NoteTags extends React.Component {

    constructor() {
        super();

        this.inputRef = React.createRef();

        this.showInput = this.showInput.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleInputConfirm = this.handleInputConfirm.bind(this);
        this.state = {
            inputVisible: false,
            inputValue: "",
        };
    }

    handleCloseTag(tag) {
        this.props.deleteTag(this.props.noteKey, tag);
    }

    showInput(event) {
        this.setState({
            inputVisible: true
        });
    }

    handleInputChange(event) {
        this.setState({
            inputValue: event.target.value
        });
    }

    handleInputConfirm(event) {
        if (this.state.inputValue && this.props.tags.indexOf(this.state.inputValue) === -1) {
            this.props.addTag(this.props.noteKey, this.state.inputValue);
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
    }

    render() {
        console.log("NoteTags render");
        return (
            <>
                {this.props.tags.map((tag, index) => {

                    const isLongTag = tag.length > 20;
                    const tagElem = (
                        <Tag
                            className="nn-edit-tag"
                            key={tag}
                            closable={true}
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



