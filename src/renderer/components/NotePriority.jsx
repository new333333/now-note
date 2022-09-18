import React from 'react';
import { Breadcrumb, Dropdown, Menu, Space, Input, InputNumber, Button, Select } from 'antd';
import { HomeOutlined, DownOutlined } from '@ant-design/icons';
import { Checkbox } from 'pretty-checkbox-react';
import '@djthoms/pretty-checkbox';

class NotePriority extends React.Component {

    constructor() {
        super();
    }

    setPriority(event) {
        this.props.setPriority( event.target.value );
    }

    setPriorityMenu(event) {
        this.props.setPriority( this.props.priority[event.key] );
    }

    handleChangePriority(val) {
        this.props.handleChangePriority( val );
    }

    render() {

        let minimumPriority = 0;
        if (this.props.priority) {
            minimumPriority = this.props.priority.minimum;
        }

        let maximumPriority = 0;
        if (this.props.priority) {
            maximumPriority = this.props.priority.maximum;
        }

        let averagePriority = 0;
        if (this.props.priority) {
            averagePriority = this.props.priority.average;
        }

        let medianaPriority = 0;
        if (this.props.priority) {
            medianaPriority = this.props.priority.mediana;
        }


        const priorityMenu = (
            <Menu
                onClick={(event)=> this.setPriorityMenu(event)}
                items={[
                    {
                        key: 'minimum',
                        label: "Minimum: " + minimumPriority,
                    },
                    {
                        key: 'average',
                        label: "Average: " + averagePriority,
                    },
                    {
                        key: 'mediana',
                        label: "Mediana: " + medianaPriority,
                    },
                    {
                        key: 'maximum',
                        label: "Maximum: " + maximumPriority,
                    },
                ]}
            />
          );

        return (
            <>
                <Dropdown overlay={priorityMenu}>
                    <InputNumber 
                        min={0} 
                        value={this.props.note.priority} 
                        onChange={(event)=> this.handleChangePriority(event)} 
                        onBlur={(event)=> this.setPriority(event)} /> 
                </Dropdown>
            </>
        );
    }
}

export {NotePriority};