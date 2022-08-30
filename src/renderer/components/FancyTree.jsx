import React from 'react';

import { AudioOutlined } from '@ant-design/icons';
import { Input, Space } from 'antd';
const { Search } = Input;

import {createTree} from 'jquery.fancytree';

import 'jquery.fancytree/dist/skin-win8/ui.fancytree.min.css';  // CSS or LESS
import 'jquery.fancytree/dist/modules/jquery.fancytree.table';
import 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5';
import 'jquery.fancytree/dist/modules/jquery.fancytree.filter';


class FancyTree extends React.Component {

    constructor() {
        super();
        this.domRef = React.createRef();
        this.onSearch = this.onSearch.bind(this);

    }

    componentDidMount() {
        this.init();
    }

    onSearch(event) {
        console.log("search", event.target.value);
        console.log("this.fancytree", this.fancytree);

        let self = this;

        let searchText = event.target.value;
        window.electronAPI.search(searchText, -1, false).then(function(searchResults) {

            let foundNoteKeys = [];

			if (searchResults.length > 0) {
				foundNoteKeys = searchResults.map(function(searchResult) {
					return searchResult.key;
				});
			}

            self.fancytree.filterNodes(function(node) {
                let show = true;

                console.log("filterNodes", node);

                if (searchText.trim().length > 0) {
					show = show && foundNoteKeys.includes(node.key);
				}

                return show;

            });

        });
    }

    init() {
        const $domNode = $(this.domRef.current);

        $domNode.fancytree({
            extensions: ["dnd5", "filter", "table"],
			checkbox: true,
			icon: false,
			escapeTitles: true,
            nodata: false,
            source: this.props.loadTree,
            lazyLoad: this.props.loadTree,
            filter: {
				autoApply: true,   // Re-apply last filter if lazy data is loaded
				autoExpand: false, // Expand all branches that contain matches while filtered
				counter: false,     // Show a badge with number of matching child nodes near parent icons
				fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
				hideExpandedCounter: true,  // Hide counter badge if parent is expanded
				hideExpanders: true,       // Hide expanders if all child nodes are hidden by filter
				highlight: false,   // Highlight matches by wrapping inside <mark> tags
				leavesOnly: false, // Match end nodes only
				nodata: true,      // Display a 'no data' status node if result is empty
				mode: "hide"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
			},

            // Load all lazy/unloaded child nodes
			// (which will trigger `loadChildren` recursively)
            loadChildren: function(event, data) {
				data.node.visit(function(subNode) {
					if (subNode.isUndefined() && subNode.isExpanded()) {
						subNode.load();
					}
				});
			},
        });
        this.fancytree = $.ui.fancytree.getTree($domNode);
    }

    render() {
        return (
            <div className='n3-bar-vertical'>
                <div>
                    <Search placeholder="filter nodes" allowClear onChange={this.onSearch} style={{ width: '100%' }} />
                </div>
                <div className='n3-bar-grow'>
                    <div className='n3-tree'>
                        <table ref={this.domRef}>
                            <colgroup>
                                <col width="*"></col>
                            </colgroup>
                            <thead>
                                <tr>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

export {FancyTree};