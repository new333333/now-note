(function (factory) {
	if (typeof define === "function" && define.amd) {
		// AMD. Register as an anonymous module.
		define(["jquery"], factory);
	} else if (typeof module === "object" && module.exports) {
		// Node/CommonJS
		module.exports = factory(require("jquery"));
	} else {
		// Browser globals
		factory(jQuery);
	}
})(function ($, document) {
	"use strict";

	var initContextMenu = function (tree, selector, menu, actions) {
		tree.$container.on("mousedown.contextMenu", function (event) {
			var node = $.ui.fancytree.getNode(event);

			if (node) {
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
});
