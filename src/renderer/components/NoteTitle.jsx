import React from 'react';

import {Input} from 'antd';
const { TextArea } = Input;

class NoteTitle extends React.Component {

    constructor(props) {
        super(props);

        this.titleDomRef = React.createRef();

        this.handleChangeTitle = this.handleChangeTitle.bind(this);
        this.handleEditTitle = this.handleEditTitle.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);

        this.state = {
            title: this.props.note.title,
        };
    }
    
    handleKeydown(e) {
        if (e.key === "s" && e.ctrlKey) {
            this.props.handleChangeTitle(this.props.note.key, this.state.title);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.titleDomRef.current && this.props.editableTitle) {
            this.titleDomRef.current.focus();
        }
     
        if (prevProps && prevProps.note && this.props.note && prevProps.note.key != this.props.note.key) {
            this.setState({
                title: this.props.note.title,
            });
        }
    }


    handleChangeTitle(value) {
        this.props.handleChangeTitle(this.props.note.key, value);
    }

    handleEditTitle(value) {
        this.setState({
            title: value,
        });
    }

    render() {
        return (
            <>
                {
                    this.props.note.trash &&
                    <Paragraph strong style={{marginBottom: 0}}>{this.props.note.title}</Paragraph>
                }
                {
                    !this.props.note.trash &&
                    <TextArea
                        onKeyDown={(event)=> this.handleKeydown(event)}
                        onBlur={(event)=> this.handleChangeTitle(event.target.value)}
                        size="large"
                        bordered={false}
                        ref={this.titleDomRef}
                        value={this.state.title}
                        onChange={(event)=> this.handleEditTitle(event.target.value)}
                        autoSize={{
                            minRows: 1,
                        }}
                    />
                }
            </>
        );
    }
}

export {NoteTitle};