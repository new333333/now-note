import React from 'react';
import { Breadcrumb, Dropdown, Menu, Space, Input, InputNumber, Button, Select } from 'antd';
import { HomeOutlined, DownOutlined } from '@ant-design/icons';
import { Checkbox } from 'pretty-checkbox-react';
import '@djthoms/pretty-checkbox';

class NotePriority extends React.Component {

    constructor() {
        super();
        this.setPriority = this.setPriority.bind(this);
    }

    setPriority(value) {
      this.props.setPriority(this.props.noteKey, value );
    }

    setPriorityMenu(event) {
        this.props.setPriority(this.props.noteKey, this.props.priorityStat[event.key] );
    }

    render() {

        let minimumPriority = 0;
        if (this.props.priorityStat) {
            minimumPriority = this.props.priorityStat.minimum;
        }

        let maximumPriority = 0;
        if (this.props.priorityStat) {
            maximumPriority = this.props.priorityStat.maximum;
        }

        let averagePriority = 0;
        if (this.props.priorityStat) {
            averagePriority = this.props.priorityStat.average;
        }

        let medianaPriority = 0;
        if (this.props.priorityStat) {
            medianaPriority = this.props.priorityStat.mediana;
        }


        const priorityMenu = (
            <Menu
                onClick={(event)=> this.setPriorityMenu(event)}
                items={[
                    {
                        key: 'minimum',
                        label: "Set: " + minimumPriority + " (Minimum)",
                    },
                    {
                        key: 'average',
                        label: "Set: " + averagePriority + " (Average)",
                    },
                    {
                        key: 'mediana',
                        label: "Set: " + medianaPriority + " (Mediana)",
                    },
                    {
                        key: 'maximum',
                        label: "Set: " + maximumPriority + " (Maximum)",
                    },
                ]}
            />
          );

        return (
            <>
                Priority:
                <Dropdown overlay={priorityMenu}>
                    <InputNumber 
                        min={0} 
                        size="small"
                        value={this.props.priority} 
                        onChange={(event)=> this.setPriority(event)} 
                        /> 
                </Dropdown>
            </>
        );
    }
}

export {NotePriority};