 (function ($, document) {
	"use strict";

	var initContextMenu = function (tree, selector, menu, actions) {
		// console.log("initContextMenu context menu, selector", selector);


		tree.$container.on("mouseenter", ".fancytree-node", function(event){
			var node = $.ui.fancytree.getNode(event);
			// console.log("mouseenter", event, node);

			if (node) {
				if (node.nnContextMenuTrigger) {
					node.nnContextMenuTrigger.css({display: "inline"});
				} else {
					let contextMenuTrigger = $("<span class='nn-fancytree-node-context-menu-trigger'><i class='fa-solid fa-bars'></i></span>")
					contextMenuTrigger.on("click", function() {
						// console.log(">>> click context menu");

						$.contextMenu("destroy", ".nn-fancytree-node-context-menu-trigger");
						// console.log(">>> click context menu, contextMenu destroyed");
						// node.setFocus(true);
						//node.setActive(true);

						$.contextMenu({
							zIndex: 100,
							selector: ".nn-fancytree-node-context-menu-trigger",
							trigger: "left",
							events: {
								show: function (options) {
									node.nnIsOpenContextMenu = true;
									options.prevKeyboard = tree.options.keyboard;
									tree.options.keyboard = false;
								},
								hide: function (options) {
									node.nnIsOpenContextMenu = false;
									if (node.nnContextMenuTrigger) {
										node.nnContextMenuTrigger.remove()
										node.nnContextMenuTrigger = false;
									}
									tree.options.keyboard = options.prevKeyboard;
									node.setFocus(true);
								},
							},
							build: function ($trigger, e) {
								node = $.ui.fancytree.getNode($trigger);

								var menuItems = {};
								if ($.isFunction(menu)) {
									menuItems = menu(node);
								} else if ($.isPlainObject(menu)) {
									menuItems = menu;
								}

								return {
									callback: function (action, options) {
										if ($.isFunction(actions)) {
											actions(node, action, options);
										} else if ($.isPlainObject(actions)) {
											if (
												Object.prototype.hasOwnProperty.call(
													actions,
													action
												) &&
												$.isFunction(actions[action])
											) {
												actions[action](node, options);
											}
										}
									},
									items: menuItems,
								};
							},
						});
						// console.log(">>> click context menu, contextMenu created");
					});
					contextMenuTrigger.prependTo(node.span);
					node.nnContextMenuTrigger = contextMenuTrigger;
				}
			}
		});

		tree.$container.on("mouseleave", ".fancytree-node", function(event){
			// Add a hover handler to all node titles (using event delegation)
			var node = $.ui.fancytree.getNode(event);
			// console.log("mouseleave", event, node);

			if (node) {
				if (node.nnContextMenuTrigger && !node.nnIsOpenContextMenu) {
					node.nnContextMenuTrigger.remove()
					node.nnContextMenuTrigger = false;
				}
			}

		});

		/*
		tree.$container.on("mousedown.contextMenu", function (event) {
			var node = $.ui.fancytree.getNode(event);

			if (node) {
				console.log("CONTEXT MENU DESTROY create");
				$.contextMenu("destroy", "." + selector);

				// node.setFocus(true);
				node.setActive(true);

				$.contextMenu({
					zIndex: 100,
					selector: "." + selector,
					events: {
						show: function (options) {
							options.prevKeyboard = tree.options.keyboard;
							tree.options.keyboard = false;
						},
						hide: function (options) {
							tree.options.keyboard = options.prevKeyboard;
							node.setFocus(true);
						},
					},
					build: function ($trigger, e) {
						node = $.ui.fancytree.getNode($trigger);

						var menuItems = {};
						if ($.isFunction(menu)) {
							menuItems = menu(node);
						} else if ($.isPlainObject(menu)) {
							menuItems = menu;
						}

						return {
							callback: function (action, options) {
								if ($.isFunction(actions)) {
									actions(node, action, options);
								} else if ($.isPlainObject(actions)) {
									if (
										Object.prototype.hasOwnProperty.call(
											actions,
											action
										) &&
										$.isFunction(actions[action])
									) {
										actions[action](node, options);
									}
								}
							},
							items: menuItems,
						};
					},
				});
			}
		});
		*/
	};
	

	$.ui.fancytree.registerExtension({
		name: "contextMenu",
		version: "@VERSION",
		contextMenu: {
			selector: "fancytree-title",
			menu: {},
			actions: {},
		},
		treeInit: function (ctx) {
			this._superApply(arguments);
			initContextMenu(
				ctx.tree,
				ctx.options.contextMenu.selector || "fancytree-title",
				ctx.options.contextMenu.menu,
				ctx.options.contextMenu.actions
			);
		},
	});
})(jQuery, document);