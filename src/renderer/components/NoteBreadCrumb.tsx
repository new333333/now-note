import React from 'react';
import { Breadcrumb } from 'antd';

// class NoteBreadCrumb extends React.Component {
interface Props {
  noteKey: string;
  initValue: string;
}

export default function NoteBreadCrumb({
  noteKey,
  initValue,
}: Props) {

    return (
        <Breadcrumb>
            {initValue &&
                (initValue.map((parentNote, i) =>
                    <Breadcrumb.Item
                        key={parentNote.key}
                        href="#"
                        onClick={(event)=> this.props.handleClickNote(parentNote.key)}>
                            {parentNote.type == "link" && parentNote.linkedNote.title}
                            {parentNote.type != "link" && parentNote.title}
                    </Breadcrumb.Item>))
            }
        </Breadcrumb>
    );
}

