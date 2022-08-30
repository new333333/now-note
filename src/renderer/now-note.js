/*

TODO

- TODO LAYOUT: cool: https://www.inkdrop.app
- idee: 3 panels: tree, list, editor (https://www.inkdrop.app/)
	- list shows full list of all stuff in current tree node mit filter sorting
			nur next level oder alles
- task option - "Move To Top" - maybe ein ranking bei tasks? ein integer - task bekommen ein wert nach prio und manuelle einfluss
- task queue - was als nächstes todo, Button: do als mächstes - dann kommt liste von task und kann be plaziert dazwoischen
- button "What to do?" such ein task zu machen
- select repository - initialisation - choose folder, save userSettings
- migration store!
- react
- view: list, tree, list+tree-gointo
- search in trash/not in trash - momenta wird igoriert - 2 indexes? 
- drag drop files and other things in editor
 - icons in tree!! and note
 - task/note - as dropdown, the buttons are irrtating
 - move type and tags over title?
 - add note button somewhere, über/unten tree?
 - vdashborad - konfigurable...
 - add demo/desription on start 
 - fix add screenshot/ drop file
 - file upload implmentieren - erst Drag & Drop in tree
 - list view with sorting 
 - bilder gallery/slides
 - search index trash - zweiten index?
 - new feature: change to typ (task, note) on (date)
 - trash
 - import/export
 - versionen
 - search trash and versions
 - all files encryption
 - google drive storage
 - plan 3 tasks for today - choose from list (https://www.youtube.com/watch?v=oJTiq-Pqp9k)
 - file strucure ändern - bei Google
 - Suche opcje: szukaj historie, szukaj skasowane
 - Tags colors
 - changes log - welche nodes/tasks wurden geändert für nachverfolgung von Arbeit
 - better filters - save, add, remove 
 - recuring tasks? reopen? deadline? date - kann eine Woche/Monat/Jahr sein (von - bis) 	  
 - Ocr with tesseractjs
 - export als ZIP (semantic UI first)
 - choose folder list (semantic UI first)
 - list assets + info if in use and where
 - close all nodes/expande all nodes utton fpr tree
 - consolidate store events - gleiche events mit gleich wparameter müssen nicht wiederhol1t werden! - veielleicht brauche ich merhere asyncqueues? 
 - daten strzuktur version einbauen --! - bei start konvertierung zum neue struktur!
	  --> noch besser: foldere mit versionnummer und in xml version nummer
	  --> nowy plik conf.json
 - timer - worjlking on Task/Node - wird in Journal siechtbar - mit kommentar option - wenn man nur auf kjunde starten und keine unteraufagbe angibt ->erst log 
 - https://yuku.takahashi.coffee/textcomplete/
 - files
 - drag and drop files in tinymce
 - performance tests
 - import local images from local - fpr copy/pdate from Outlook - it's not possible to access local files (security: Access to image at 'file:///E:/Projekte/n3todo-local/public/img/n3todo-logo_200_58.png' from origin 'null' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, chrome-untrusted, https.)
   Tried all Approaches from: https://stackoverflow.com/questions/6150289/how-can-i-convert-an-image-into-base64-string-using-javascript
 - trash implementieren
  
***********************************************
 @warten es reicht wenn die erst von liste verschwinden, und wieder kommen, aber als done zu setzen ist falsch...
 nicht DONE, DONE, Warten bis(Datum)/auf, 
 
 - task.due date vs task.scheduled vs deadline
 verschiedne sttaus? entwiucklungstatus: 
 installation sttaus: dev, qs, prod
  - warten auf ereignis (zb produktivsitzung) was damit ????
  - warten auf die Person 
					-> task nachfragen bei am ....

 - warten als Flag? damit es auf der liste nicht stört		
   - group/stack - workingon, waiting, ... ODER WORKFLOW??? man konnte mehrere haben... soger gleichzeitig für ein task odre node (merkierung das node ist produktiv..)
				eher STATUS...
	- attributen für notes??? ich brauche marke das die sache produktiv ist (oder nixht) etwas wie status...

	Kategoriesierung Tasks Beispeile:
		* kann nich selber machen
		* umgestztet
			* auf DEV/QS installiert
				* muss von adrer Person getestet werden
					* an die Person schreiben ---------------- OK kann ich selber machen
					* muss mit Person absprechen
				* wartet auf installation PROD
					* ich muss termin abstimmen
						* nur anschreiben  ------------- OK kann ich selber machen
						* muss absprechen
					* ich warte an ein Termin
		
		
	Kategories:
		* kann ich jeder Zeit machen
		* kann ich an einem bestimmten Termin machen
			- Termin ist bekannt
			- Termin ist noch nicht bekannt - ich warte auf ein Erreignis
		* kann ich mit bestimmte Person machen
		* ist noch nicht freigegeben
			* wartet auf ein Erreignis


ähnliche Apps:
	https://github.com/anita-app/anita


*/

window.nn = window.nn || {};
// TODO: old remove
window.n3 = window.n3 || {};

window.nn.priorities = [
	{
		id: 3,
		text: "Urgent &amp; Important",
		selected: false
	},
	{
		id: 2,
		text: "Urgent",
		selected: false
	},
	{
		id: 1,
		text: "Important",
		selected: false
	},
	{
		id: 0,
		text: "No priority",
		selected: true
	}
];

window.n3.tags = [];


window.n3.node = window.n3.node || {
	"tinymce": false
};
window.n3.modal = window.n3.modal || {};
window.n3.ui = window.n3.ui || {};
window.n3.action = window.n3.action || {
	"handlers": {}
};


$(function() {
	
	window.n3.init();

	window.n3.action.handlers["activate-node"] = window.n3.action.activateNode;
	window.n3.action.handlers["add-node"] = window.n3.node.add;
	window.n3.action.handlers["delete-node-confirm"] = window.n3.node.delete;

	window.n3.action.handlers["open-modal"] = window.n3.ui.openModal;
	window.n3.action.handlers["close-dialog"] = window.n3.action.closeDialog;

	window.n3.getActiveNode = function() {
		return $.ui.fancytree.getTree("[data-tree]").getActiveNode();
	}

	window.n3.tagInput = $("[data-sarch-tag]").search({
		minCharacters: 0,
		onSelect: function(result, response) {
			let newTag = result.title;

			// need these three lines to remove value and close search results
			window.n3.tagInput.search("set value", "");
			window.n3.tagInput.search("query");

			let currentNode = window.n3.getActiveNode();
			currentNode.data.tags = currentNode.data.tags || [];

			if (!currentNode.data.tags.includes(newTag)) {
				window.n3.tagInput.before(window.n3.getTagHTML(newTag));
				window.electronAPI.addTag(currentNode.key, newTag).then(function(tags) { 
					currentNode.data.tags = tags;
				});
			}
			return false;
		},	
		showNoResults: false,
		cache: false,
		apiSettings: {
			responseAsync: function(settings, callback) {	
				let noteKey = undefined;
				let $ticketDataOwner = this.closest("[data-owner='node']");
				if ($ticketDataOwner && $ticketDataOwner.dataset.notekey) {
					noteKey = $ticketDataOwner.dataset.notekey;
				}

				let node = window.n3.getNoteByKey(noteKey);
				node.data.tags = node.data.tags || [];
				let filterettags = window.n3.tags.filter(function(tag) {
					return !node.data.tags.includes(tag.title);
				});
				
				callback({
					success: true,
					results: filterettags
				});
			}
		}
	}).on('keypress',function(e) {
		if(e.which == 13) {
			let newTag = window.n3.tagInput.search("get value").trim();
			if (newTag.length > 0) {
				
				window.n3.tagInput.search("set value", "");

				let noteKey = undefined;
				let $ticketDataOwner = this.closest("[data-owner='node']");
				if ($ticketDataOwner && $ticketDataOwner.dataset.notekey) {
					noteKey = $ticketDataOwner.dataset.notekey;
				}

				let currentNode = window.n3.getNoteByKey(noteKey);
				if (!currentNode.data.tags.includes(newTag)) {
					window.n3.tagInput.before(window.n3.getTagHTML(newTag));
				
					currentNode.data.tags = currentNode.data.tags || [];
					window.electronAPI.addTag(currentNode.key, newTag).then(function(tags) { 
						currentNode.data.tags = tags;
						window.n3.tags = window.n3.tags || [];
						window.n3.tags.push({
							title: newTag
						});
					});

				}
			}
		}
	});

	$(document).on("click", "[data-delete-tag]", function(event) {
		let deleteTag = this.dataset.tag;
		$("[data-tag='" + deleteTag + "']").remove();
		let noteKey = undefined;
		let $ticketDataOwner = $("[data-owner='node']")[0];
		if ($ticketDataOwner && $ticketDataOwner.dataset.notekey) {
			noteKey = $ticketDataOwner.dataset.notekey;
		}

		let currentNode = window.n3.getNoteByKey(noteKey);
		window.electronAPI.removeTag(currentNode.key, deleteTag).then(function(tags) { 
			currentNode.data.tags = tags;
		});


	});

	$(document).on("mouseover", "span.fancytree-node", function(event) {
		$(this).addClass("n3-mouseover");
	});
	$(document).on("mouseout", "span.fancytree-node", function(event) {
		$(this).removeClass("n3-mouseover");
	});

	$(document).on("click", "[data-node-add]", function(event) {
		window.n3.node.add();
	});

	$(document).on("click", "[data-breadcrumbs] [data-link-note]", function() {
		if (this.dataset && this.dataset.linkNote) {
			window.n3.action.activateNode(this.dataset.linkNote);
		}
	});

	$(document).on("click", "[data-backlinks-title]", function() {
		if ($(this).hasClass("active")) {
			$("[data-backlinks-title]").removeClass("active");
			$("[data-backlinks-content]").removeClass("active");
		} else {
			$("[data-backlinks-title]").addClass("active");
			$("[data-backlinks-content]").addClass("active");
		}
	});

	$(document).on("click", "[data-action]", function(event) {
		let targetElement = event.target || event.srcElement;
		let $trigger = this;
		let noteKey = undefined;
		
		//let $nodeDataOwner = targetElement.closest("[data-owner='node']");
		//if ($nodeDataOwner && $nodeDataOwner.dataset.notekey) {
		//	noteKey = $nodeDataOwner.dataset.notekey;
		//}

		let $ticketDataOwner = targetElement.closest("[data-owner='node']");
		if ($ticketDataOwner && $ticketDataOwner.dataset.notekey) {
			noteKey = $ticketDataOwner.dataset.notekey;
		}
	


		let action = $trigger.dataset.action;
		if (window.n3.action.handlers[action]) {
			if (window.n3.action.handlers[action](noteKey, $trigger)) {
				let $modal = $trigger.closest(".modal");
				if ($modal) {
					window.n3.modal.close($modal, true);
				}
			}
		}

	});  

	$(document).on("change", "[data-noteeditor] [name='title']", function() {
		let $nodeDataOwner = this.closest("[data-owner='node']");
		let noteKey = false;
		if ($nodeDataOwner && $nodeDataOwner.dataset.notekey) {
			noteKey = $nodeDataOwner.dataset.notekey;
		}
		if (noteKey) {
			let currentNode = window.n3.getNoteByKey(noteKey);

			let newTitle = $(this).val();
			if (currentNode.title != newTitle) {

				currentNode.setTitle(newTitle);
				
				window.electronAPI.modifyNote({
					key: currentNode.key, 
					title: newTitle	
				}).then(function(note) {
					console.log("write back title", note);
					
				});

			}
		}
	});


	$(document).on("click", "[data-type]", function() {
		const newType = this.dataset.type;

		if (newType === "task") {
			$("[data-done]").show();
		} else {
			$("[data-done]").hide();
		}
	
		$("[data-type='" + newType + "']").addClass("active");
		$("[data-type='" + newType + "']").addClass("primary");
		$("[data-type='" + (newType === "task" ? "note" : "task") + "']").removeClass("active");
		$("[data-type='" + (newType === "task" ? "note" : "task") + "']").removeClass("primary");

		let $nodeDataOwner = this.closest("[data-owner]");
		let noteKey = false;
		if ($nodeDataOwner && $nodeDataOwner.dataset.notekey) {
			noteKey = $nodeDataOwner.dataset.notekey;
		}
		if (noteKey) {
			let currentNode = window.n3.getNoteByKey(noteKey);
			if (!currentNode.data.type || currentNode.data.type !== newType) {
				currentNode.data.type = newType;
				currentNode.checkbox = currentNode.data.type === "task";

				// rerander titles to top: updates task count on parent nodes
				let parentNode = currentNode;
				while (parentNode) {
					parentNode.renderTitle();
					parentNode = parentNode.parent;
				}

				window.electronAPI.modifyNote({
					key: currentNode.key, 
					type: currentNode.data.type	
				}).then(function(note) {
					console.log("write back type", note);
				});
			}
		}
	});

	$(document).on("change", "[data-done] [name='done']", function() {
		let $nodeDataOwner = this.closest("[data-owner='node']");
		let noteKey = false;
		if ($nodeDataOwner && $nodeDataOwner.dataset.notekey) {
			noteKey = $nodeDataOwner.dataset.notekey;
		}
		if (noteKey) {
			let currentNode = window.n3.getNoteByKey(noteKey);

			currentNode.data.done = $(this).prop("checked");
			currentNode.selected = currentNode.data.done;

			let parentNode = currentNode;
			while (parentNode) {
				parentNode.renderTitle();
				parentNode = parentNode.parent;
			}

			console.log("currentNode.data.done",currentNode.data.done);
			window.electronAPI.modifyNote({
				key: currentNode.key,
				done: currentNode.data.done
			}).then(function(note) { 
				console.log("write back done", note);
			});
		}
	});

	$(document).on("keyup", "[data-search] input", function() {

		if ($(this).val().trim().length > 0) {
			$("[data-search] i").removeClass("search");
			$("[data-search] i").addClass("delete");
		} else {
			$("[data-search] i").removeClass("delete");
			$("[data-search] i").addClass("search");
		}

		window.n3.filterTree();
	});
	
	$(document).on("click", "[data-search] i.delete", function() {
		$("[data-search] input").val("");
		$("[data-search] input").trigger("keyup");
	});

	$(document).on("click", "[data-backlink-note]", function() {
		if (this &&  this.dataset && this.dataset.backlinkNote) {
			window.n3.action.activateNode(this.dataset.backlinkNote);
		}
	});
	


	let filterDropDown = $("[data-filter]").dropdown({
		onShow: function(a, b, c) {
			let $list = $("[data-menu]", this);
			$("[data-filter-tag]", $list).remove();
			window.n3.tags.forEach(function(tag) {
				$list.append(`<div class='item' data-filter-tag data-value='tag-${tag.title}'>
				<div class="ui green empty circular label"></div>${tag.title}</div>`);
			});
		}
	});

	filterDropDown.dropdown("setting", "onChange", function(value, text, $choice) {
		$("[data-filter]").dropdown("hide");
		window.n3.filterTree();
	});


	window.addEventListener("beforeunload", function(event) {

		// save current note before closing app
		// this will *prevent* the closing electron.js no matter what value is passed
		event.returnValue = false;

		try {

			console.trace("beforeunload");
			let $nodeDataOwner = $("[data-owner='node']");
			let noteKey = $nodeDataOwner[0].dataset.notekey;
		
			let newTitle = $("[data-noteeditor] [name='title']").val();
			let currentNode = window.n3.getNoteByKey(noteKey);
		
			let noteToUpdate = {
				key: currentNode.key
			};
		
			if (newTitle != currentNode.title) {
				noteToUpdate.title = newTitle;
			}
		
			let form = $("[data-noteeditor]");
			window.n3.node.getNodeHTMLEditor(form).then(function(htmlEditor) {
		
				let editorContent = htmlEditor.getContent();
				if (currentNode.data.description !== editorContent) {
					noteToUpdate.description = editorContent;
				}
				console.log("beforeunload noteToUpdate", noteToUpdate);
				return window.electronAPI.modifyNote(noteToUpdate).then(function(note) { 
					console.log("note saved, now close electron", note);
					window.electronAPI.shutdown();
				});
			}).catch(function(error) {
				console.log(error);
				window.electronAPI.shutdown();
			});

		} catch (error) {
			console.log(error);
			window.electronAPI.shutdown();
		}
	});

});


window.n3.getTagHTML = function(tag) {
	let newTagTemplate = `<a class="ui tiny tag label" data-tag="${tag}">${tag}</a>		
	<button class="ui transparent icon mini button n3-tag-remove" data-tooltip="Remove tag '${tag}'" data-tag="${tag}" data-delete-tag="${tag}">
		<i class="icon trash"></i>
	</button>`;

	return newTagTemplate;
}

window.n3.getNoteByKey = function(noteKey) {
	let note = $.ui.fancytree.getTree("[data-tree]").getNodeByKey(noteKey);
	return note;
}

window.n3.filterTree = function() {

	let filterValue = $("[data-filter]").dropdown("get value");
	let filters = [];
	if (filterValue.trim().length > 0) {
		filters = filterValue.trim().split(",");
	}

	let searchText = $("[data-search] input").val();


	if (filters.length == 0 && searchText.trim().length == 0) {
		$.ui.fancytree.getTree("[data-tree]").clearFilter();
	} else {

		window.electronAPI.search(searchText, -1, false).then(function(searchResults) {

			let foundNoteKeys = [];

			if (searchResults.length > 0) {
				foundNoteKeys = searchResults[0].result.map(function(searchResult) {
					return searchResult.id;
				});
			}

			let filterByTags = filters.reduce(function(tags, filter) {
				if (filter.indexOf("tag-") == 0) {
					tags.push(filter.substring(4));
				}
				return tags;
			}, []);

			$.ui.fancytree.getTree("[data-tree]").filterNodes(function(node) {			
				let show = true;

				let showTypes = [];
				if (filters.includes("tasks")) {
					showTypes.push("task");
				}
				if (filters.includes("notes")) {
					showTypes.push("note");
				}
				if (showTypes.length > 0) {
					show = show && showTypes.includes(node.data.type);
				}
				

				let showDone = [];
				if (filters.includes("done")) {
					showDone.push(true);
				}
				if (filters.includes("not-done")) {
					showDone.push(false);
				}
				if (showDone.length > 0) {
					show = show && node.data.type === "task" && showDone.includes(node.data.done);
				}
				
				let showPriority = [];
				if (filters.includes("priority-3")) {
					showPriority.push("3");
				}
				if (filters.includes("priority-2")) {
					showPriority.push("2");
				}
				if (filters.includes("priority-1")) {
					showPriority.push("1");
				}
				if (filters.includes("priority-0")) {
					showPriority.push("0");
				}
				if (showPriority.length > 0) {
					show = show && showPriority.includes(node.data.priority + "");
				}

				if (searchText.trim().length > 0) {
					show = show && foundNoteKeys.includes(node.key);
				}

				if (filterByTags.length > 0) {
					node.data.tags = node.data.tags || {};
					let tagMatch = node.data.tags.some(function(tag) {
						return filterByTags.includes(tag);
					});

					show = show && tagMatch;
				}

				return show;
			});
		});

	}
}



window.n3.action.closeDialog = function(noteKey, $trigger) {
	let $modal = $trigger.closest('.modal');
	window.n3.modal.close($modal, true);
}


window.n3.action.activateNode = function(noteKey) {

	window.electronAPI.getNote(noteKey).then(function(noteFromStore) {

		if (!noteFromStore) {
					
			$.uiAlert({
				textHead: "Cannot finde note! Probably it's permanantly removed.",
				text: '',
				bgcolor: '#F2711C', // background-color
				textcolor: '#fff', // color
				position: 'bottom-right', // top And bottom ||  left / center / right
				icon: 'warning sign',
				time: 3
			});

			return;

		} else if (noteFromStore.trash) {
				
			$.uiAlert({
				textHead: 'Note is in trash. ',
				text: '',
				bgcolor: '#F2711C', // background-color
				textcolor: '#fff', // color
				position: 'bottom-right', // top And bottom ||  left / center / right
				icon: 'warning sign',
				time: 3
			});

			return;
		
		} else {

			let node = window.n3.getNoteByKey(noteKey);

			if (!node) {
				window.electronAPI.getParents(noteKey).then(function(parents) {

					openTreeToNote(parents.parents).then(function() {
	
						let node = window.n3.getNoteByKey(noteKey);
	
						if (!node) {
							$.uiAlert({
								textHead: "Cannot finde note! Probably it's permanantly removed.",
								text: '',
								bgcolor: '#F2711C', // background-color
								textcolor: '#fff', // color
								position: 'bottom-right', // top And bottom ||  left / center / right
								icon: 'warning sign',
								time: 3
							});
						} else {

							let treeData = window.n3.dataToTreeData([noteFromStore]);
							node.data = treeData[0].data;
							node.setActive();
						}
	
					});
	
					function openTreeToNote(parents) {
	
						if (parents.length == 0) {
							return Promise.resolve();
						}
	
						return new Promise(function(resolve, reject) {
	
							let openNote = parents.shift();
							let node = window.n3.getNoteByKey(openNote.key);
							if (node) {
								node.setExpanded().then(function() {
									openTreeToNote(parents);
									resolve();
								});
							} else {
								console.log("Note not found!", openNote);
								reject("Note not found!");
							}
	
	
						});
					}
	
	
				});
	
				
			} else {
				let treeData = window.n3.dataToTreeData([noteFromStore]);
				node.data = treeData[0].data;
				node.setActive();
			}
		}
	});
};


window.n3.ui.openModal = function(noteKey, $trigger) {
	let modal = $trigger.dataset.target;
	let $target = document.getElementById(modal);

	let $nodeDataOwner = $trigger.closest("[data-owner='node']");
	if ($nodeDataOwner && $nodeDataOwner.dataset.notekey) {
		$target.dataset.notekey = $nodeDataOwner.dataset.notekey;
	}

	window.n3.modal.open($target);

	if ($target.dataset.hasOwnProperty("closeonesc")) {

		$(document).on("keydown.closemodal", function(event) {
			let e = event || window.event;

			if (e.keyCode === 27) { // Escape key
				window.n3.modal.close($target, true);
			}
		});

	}
}

function executeFunctionByName(functionName, context /*, args */) {
	let args = Array.prototype.slice.call(arguments, 2);
	let namespaces = functionName.split(".");
	let func = namespaces.pop();
	for (let i = 0; i < namespaces.length; i++) {
		context = context[namespaces[i]];
	}
	return context[func].apply(context, args);
}


window.n3.node.delete = function(noteKey, $trigger) {
	var that = this;
	return new Promise(function(resolve, reject) {
		let node = window.n3.getNoteByKey(noteKey);
		if (node.title === "root") {
			return;
		}
		let parentNode = node.parent;

		if (parentNode.key.startsWith("root_") && parentNode.children.length < 2) {


			$.uiAlert({
				textHead: 'Cannot delete only one root node!',
				text: '',
				bgcolor: '#F2711C', // background-color
				textcolor: '#fff', // color
				position: 'bottom-right', // top And bottom ||  left / center / right
				icon: 'warning sign',
				time: 3
			});

		} else {

			window.electronAPI.moveNoteToTrash(node.key, parentNode.key).then(function() {
				node.remove();

				if (parentNode.title != "root") {
					parentNode.setActive();
				} else if (parentNode.children && parentNode.children.length > 0) {
					parentNode.children[0].setActive();
				}
			});

		}

	});
};


window.n3.init = function() {

	window.electronAPI.getUserSettings().then(function(userSettings) {
		// console.log("userSettings", userSettings);
		window.nn.userSettings = userSettings;
		
		window.electronAPI.getRepository().then(function(repository) {
			// console.log("repository", repository);
			
			window.nn.repository = repository;
									
			window.n3.loadNotes().then(function(tree) {

				// console.log("loadNotes", tree);
			
				let form = $("[data-noteeditor]");
				window.n3.node.getNodeHTMLEditor(form).then(function(data) {
					window.n3.initFancyTree(tree).then(function() {
						// console.log("App initialized...");
					});
				});
			});
		});
	});
}



// Functions to open and close a modal
window.n3.modal.open = function($el) {
	let el = $el;
	if ($el instanceof jQuery) {
		el = $el[0];
	}
	
	let preventclosemodal = el.dataset.preventclosemodal === "";
	$($el).modal({
		autofocus: false,
		closable: !preventclosemodal
	}).modal("show");
	
	if (el.dataset.onopen) {
		if (window.n3.action.handlers[el.dataset.onopen]) {
			window.n3.action.handlers[el.dataset.onopen](undefined, undefined, el);
		}
	}

}

window.n3.modal.close = function($el, force) {
	if ($el.dataset.preventclosemodal || force) {
		$($el).modal("hide");
	}
	$(document).off("keydown.closemodal");
}

window.n3.modal.closeAll = function(force) {
	(document.querySelectorAll(".modal.visible") || []).forEach(($modal) => {
		window.n3.modal.close($modal, force);
	});
}

window.n3.node.getNewNodeData = function() {
	return {
		checkbox: false,
		title: JSJoda.LocalDateTime.now().format(JSJoda.DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")),
		type: "note",
		priority: 0,
		done: false,
		expanded: false
	};
}

window.n3.node.add = function() {
	var that = this;
	return new Promise(function(resolve, reject) {
			
		let hasFocus = $.ui.fancytree.getTree("[data-tree]").hasFocus();
		let node = $.ui.fancytree.getTree("[data-tree]").getActiveNode();
		if (!node) {
			node = $.ui.fancytree.getTree("[data-tree]").getRootNode();
		}

		let newNodeData = window.n3.node.getNewNodeData();

		let hitMode = "over";
		let relativeToKey = node.key;

		// TODO: add root?
		//if (newNode.parent && newNode.parent.children && newNode.parent.children.length > 1) {
		//	hitMode = "before";
		//	relativeToKey = newNode.parent.children[0].key;
		//}

		console.trace(">>>> window.nn.userSettings", window.nn.userSettings.settings.userName);
		window.electronAPI.addNote(node.key, {
			title: newNodeData.title,
			type: newNodeData.type,
			priority: newNodeData.priority,
			done: newNodeData.done,
			expanded: false,
			createdBy: window.nn.userSettings.settings.userName
		}, "firstChild", relativeToKey).then(function(newNodeData) {
			console.log("write back added", newNodeData);
			let treeData = window.n3.dataToTreeData([newNodeData]);
			let newNode = node.addNode(treeData[0], "firstChild");
			newNode.setActive();
			resolve();
		});
	});

}

window.n3.REX_HTML = /[&<>"'/]/g; // Escape those characters
window.n3.ENTITY_MAP = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
	"/": "&#x2F;",
};


window.n3.escapeHtml = function (s) {
	return ("" + s).replace(window.n3.REX_HTML, function (s) {
		return window.n3.ENTITY_MAP[s];
	});
}

window.n3.node.activateNode = function(node) {

	return new Promise(function(resolve) {

		let $nodeDataOwner = $("[data-owner='node']");
		$nodeDataOwner[0].dataset.notekey = node.key;

		let form = $("[data-noteeditor]");

		window.electronAPI.getNote(node.key).then(function(noteFromStore) {

			let treeData = window.n3.dataToTreeData([noteFromStore]);
			node.data = treeData[0].data;

			let rootNodeKey = undefined;
			let noteIt = node;
			let breadcrumbs = "";
			let sep = "";
			while (noteIt && !noteIt.key.startsWith("root_")) {
				breadcrumbs = "<a href='#" + noteIt.key +"' data-link-note='" + noteIt.key + "'>" + window.n3.escapeHtml(noteIt.title) + "</a>" + sep + breadcrumbs;
				sep = " / ";
				rootNodeKey = noteIt.key;
				noteIt = noteIt.parent;
			}
			$("[data-breadcrumbs]").html(`<button class="ui transparent mini icon button" data-link-note='${rootNodeKey}'>
												<i class="blue home icon"></i>
											</button>` + breadcrumbs);
			

			$("[name='title']", form).val(node.title);
			var description = ((node || {}).data || {}).description || "";
			
			window.n3.node.getNodeHTMLEditor(form).then(function(htmlEditor) {
				// moved to store let htmlText = window.n3.node.updateInternalLinks(description);
				htmlEditor.setContent(description || "");
				htmlEditor.setDirty(false);

				if (node.data.backlinks) {
					let htmlBacklinks = "<ul class='ui list'>";
					let countBacklinks = 0;
					node.data.backlinks.forEach(function(backlinkNoteKey) {
						let backlinkNote = window.n3.getNoteByKey(backlinkNoteKey);

						let noteIt = backlinkNote;
						let links = "";
						let sep = "";
						while (noteIt && noteIt.key !== "root_1") {
							links = "<a href='#" + noteIt.key +"' data-backlink-note='" + noteIt.key + "'>" + noteIt.title + "</a>" + sep + links;
							sep = " / ";
							noteIt = noteIt.parent;
						}
						countBacklinks++;
						htmlBacklinks += "<li>[ " + links + " ]</li>";
					});
					htmlBacklinks += "</ul>";
					$("[data-backlinks-content]").html(htmlBacklinks);
					$("[data-backlinks-count]").html(countBacklinks);
					$("[data-backlinks-count]").addClass("blue");
				} else {
					$("[data-backlinks-content]").html("");
					$("[data-backlinks-count]").html("0");
					$("[data-backlinks-count]").removeClass("blue");
				}

				
				resolve();
			});



			if (node.data.type === "task") {
				$("[data-done]").show();
			} else {
				$("[data-done]").hide();
			}
			$("[data-done] [name='done']").prop("checked", node.data.done !== undefined && node.data.done);

			//////////////////////////////

			let priorityDropDownValues = window.nn.priorities.map(function(priority) {
				return {
					name: priority.text,
					value: priority.id + "",
					selected: node.data.priority !== undefined && (priority.id + "") === (node.data.priority + "")
				}
			});
			let priorityDropdown = $("[data-priority]", form).dropdown({
				values: priorityDropDownValues
			});
			let selectedPriority = window.nn.priorities.find(function(priority) {
				return node.data.priority !== undefined && (priority.id + "") === (node.data.priority + "");
			});
			if (!selectedPriority) {
				selectedPriority = 0;
			}
			priorityDropdown.dropdown("set selected", selectedPriority.id + "");
			priorityDropdown.dropdown("setting", "onChange", function(value, text, $choice) {
				node.data.priority = value;
				
				window.electronAPI.modifyNote({
					key: node.key,
					priority: node.data.priority
				}).then(function(note) { 
					console.log("write back priority?", note);
				});


				node.renderTitle();
			});

			//////////////////////////////

			$("[data-type='" + node.data.type + "']").addClass("active");
			$("[data-type='" + node.data.type + "']").addClass("primary");
			$("[data-type='" + (node.data.type === "task" ? "note" : "task") + "']").removeClass("active");
			$("[data-type='" + (node.data.type === "task" ? "note" : "task") + "']").removeClass("primary");

			//////////////////////////////

			$("[data-tag]").remove();
			node.data.tags = node.data.tags || [];

			node.data.tags.forEach(function(tag) {
				
				let indexExistingTag = window.n3.tags.findIndex(function(existingTag) {
					return existingTag.title === tag;
				});

				if (indexExistingTag == -1) {
					window.n3.tags.push({
						title: tag
					});
				}

				window.n3.tagInput.before(window.n3.getTagHTML(tag));
			});
		});

	});
}



window.n3.node.getNodeHTMLEditor = function(form) {

	return new Promise(function(resolve) {
		if (window.n3.node.tinymce) {
			resolve(window.n3.node.tinymce);
			return;
		}

		tinymce.init({
			target: $("[name='description']", form)[0],
			menubar: false,
			toolbar_sticky: true,
			toolbar_sticky_offset: 0,
			min_height: 400,
			inline_boundaries: false,
			plugins: [
				"advlist", "autolink", "lists", "link", "image", "charmap", "preview",
				"anchor", "searchreplace", "visualblocks", "code", "fullscreen",
				"insertdatetime", "media", "table", "code", "help", "wordcount",
				"autoresize"
			],
			toolbar: "undo redo | blocks | " +
				"bold italic underline strikethrough  backcolor | alignleft aligncenter " +
				"alignright alignjustify | bullist numlist outdent indent | " +
				"removeformat | code",
			powerpaste_word_import: "clean",
			powerpaste_html_import: "clean",
			block_unsupported_drop: false,
			setup: function(editor) {

				editor.addShortcut("ctrl+s", "Save note", function () {
					modifyNote();
				});

				editor.on("blur", function(e) {
					modifyNote();
				});

				function modifyNote() {
					let $nodeDataOwner = $(editor.getContainer()).closest("[data-owner='node']");
					let noteKey = $nodeDataOwner[0].dataset.notekey;
					let currentNode = window.n3.getNoteByKey(noteKey);
					
					let editorContent = editor.getContent();
					if (currentNode.data.description !== editorContent) {
						currentNode.data.description = editorContent;

						window.electronAPI.modifyNote({
							key: currentNode.key, 
							description: editorContent,
						}).then(function(note) {
							console.log("write back description", note);
							// currentNode.data.description = note.description;
							// editor.setContent(currentNode.data.description || "");
						});
						
					}
				}

				editor.on("drop", function(event) {
					console.log("drop in editor", event);
					event.stopPropagation && event.stopPropagation();
					event.preventDefault && event.preventDefault();
				});

				// Drag&Drop
				/*	
				TODO 
				drop on body or something like this...
				editor.on("drop", function(event) {
					 console.log("drop", event);
				})*/

				editor.on('click', function(e) {
					if (e.srcElement &&  e.srcElement.dataset && e.srcElement.dataset.gotoNote) {
						console.log("activateNode", e.srcElement.dataset.gotoNote);
						window.n3.action.activateNode(e.srcElement.dataset.gotoNote);
					}
					
					if (e.srcElement &&  e.srcElement.dataset && e.srcElement.dataset.n3asset) {
						console.log("open attachment in ew tab", e.srcElement.href);
						window.electronAPI.downloadAttachment(e.srcElement.href);
					}
				});
						
				editor.ui.registry.addAutocompleter("specialchars", {
					ch: '[',
					minChars: 0,
					columns: 1,
					onAction: function(autocompleteApi, rng, key) {
						editor.selection.setRng(rng);

						window.electronAPI.getNote(key).then(function(linkToNote) {

							console.log("getNote", key, linkToNote);
							window.electronAPI.getParents(key).then(function(parents) {
								let path = "";
								let sep = "";
								if (parents) {
									parents.forEach(function(parentNote) {
										path = `${path}${sep}<a href='#${parentNote.key}' data-goto-note='${parentNote.key}'>${parentNote.title}</a>`;
										sep = " / ";
									});
								}
								editor.insertContent("<span data-n3link-node='" + key +"' contenteditable='false'>[ " + path + " ]</span>");
								autocompleteApi.hide();
							});
						});
						// TODO: on reject ? no note found or other errors...
					},
					fetch: function(pattern) {
						console.log("addAutocompleter fetch pattern", pattern);
						return new Promise(function(resolve) {
							let searchResults = [];

							window.electronAPI.search(pattern, 20, false).then(function(searchResults) {
								showAutocomplete(searchResults, resolve);
							});

							function showAutocomplete(searchResults, resolve) {
								console.log("addAutocompleter searchResults", searchResults);

								if (searchResults.length > 0) {
									let results = searchResults.map(function(searchResult) {
										return {
											type: 'cardmenuitem',
											value: searchResult.key,
											label: searchResult.path ? searchResult.path + " / " + searchResult.title : searchResult.title,
											items: [
												{
													type: 'cardcontainer',
													direction: 'vertical',
													items: [
														{
															type: 'cardtext',
															text: searchResult.path ? searchResult.path + " / " + searchResult.title : searchResult.title,
															name: 'char_name'
														}
													]
												}
											]
										}
									});
									resolve(results);
								} else {
									resolve([]);
								}
							}
							
						});
					}
				});
				
				
			}
		}).then(function(editor) {
			window.n3.node.tinymce = editor[0];
			resolve(window.n3.node.tinymce);
		});
	});
}


window.n3.loadNotes = function(key) {
	return new Promise(function(resolve) {
		return window.electronAPI.getChildren(key).then(function(tree) {
			resolve(window.n3.dataToTreeData(tree));
		});
	});
}

window.n3.dataToTreeData = function(tree) {
	tree = convertNotesToTreeNodes(tree);
	tree = setCheckBoxFromTyp(tree);
	// TODO: refactor: nodes are lazy read!
	tree = setGlobalTags(tree);
	return tree;


	function convertNotesToTreeNodes(tree) {
		if (!tree) {
			return tree;
		}

		for (let i = 0; i < tree.length; i++) {

			tree[i].data = tree[i].data || {};
			tree[i].data.description = tree[i].description;
			tree[i].data.modifiedBy = tree[i].modifiedBy;
			tree[i].data.modifiedOn = tree[i].modifiedOn;
			tree[i].data.createdBy = tree[i].createdBy;
			tree[i].data.createdOn = tree[i].createdOn;
			tree[i].data.done = tree[i].done;
			tree[i].data.priority = tree[i].priority;
			tree[i].data.type = tree[i].type;
			tree[i].data.tags = tree[i].tags;

			delete tree[i].parent;
			delete tree[i].modifiedOn;
			delete tree[i].modifiedBy;
			delete tree[i].description;
			delete tree[i].createdOn;
			delete tree[i].createdBy;
			delete tree[i].done;
			delete tree[i].priority;
			delete tree[i].type;
			delete tree[i].tags;

			tree[i].lazy = true;
			
			if (!tree[i].hasChildren) {
				tree[i].children = [];
			}

			// without lazy loading do this
			// if (tree[i].children) {
			// 	tree[i].children = convertNotesToTreeNodes(tree[i].children);
			// }
			
		}

		return tree;
	}

	function setCheckBoxFromTyp(tree) {
		if (!tree) {
			return tree;
		}

		for (let i = 0; i < tree.length; i++) {
			tree[i].data = tree[i].data || {};
			tree[i].checkbox = tree[i].data.type !== undefined && tree[i].data.type === "task";
			tree[i].selected = tree[i].data.done !== undefined && tree[i].data.done;
			if (tree[i].children) {
				tree[i].children = setCheckBoxFromTyp(tree[i].children);
			}
			tree[i].data.tags = tree[i].data.tags || [];
			tree[i].data.tags.forEach(function(tag) {
				let indexExistingTag = window.n3.tags.findIndex(function(existingTag) {
					return existingTag.title === tag;
				});
	
				if (indexExistingTag == -1) {
					window.n3.tags.push({
						title: tag
					});
				}
			});
		}

		return tree;
	}

	// TODO: it MUST be changed! nodes are laze read!
	function setGlobalTags(tree) {
		if (!tree) {
			return tree;
		}

		for (let i = 0; i < tree.length; i++) {
			if (tree[i].children) {
				tree[i].children = setCheckBoxFromTyp(tree[i].children);
			}
			tree[i].data.tags = tree[i].data.tags || [];
			tree[i].data.tags.forEach(function(tag) {
				let indexExistingTag = window.n3.tags.findIndex(function(existingTag) {
					return existingTag.title === tag;
				});
	
				if (indexExistingTag == -1) {
					window.n3.tags.push({
						title: tag
					});
				}
			});
		}

		return tree;
	}
}


window.n3.initFancyTree = function(rootNodes) {
	var that = this;
	return new Promise(function(resolve, reject) {

		let LAST_EFFECT_DO = null,
			LAST_EFFECT_DD = null,
			lazyLogCache = {};

		/* Log if value changed, nor more than interval/sec.*/
		function logLazy(name, value, interval, msg) {
			/*let now = Date.now(),
				entry = lazyLogCache[name];
			if (!lazyLogCache[name]) { lazyLogCache[name] = { stamp: now } };
	
			if (value && value === entry.value) {
				return;
			}
			entry.value = value;
	
			if (interval > 0 && (now - entry.stamp) <= interval) {
				return;
			}
			entry.stamp = now;
			lazyLogCache[name] = entry;*/
			// console.log(msg);
		}

		let ff = $("[data-tree]").fancytree({
			extensions: ["dnd5", "filter"],
			checkbox: true,
			icon: false,
			escapeTitles: true,
			source: rootNodes,
			lazyLoad: function(event, data) {
				data.result = new Promise(function(resolve, reject) {
					window.n3.loadNotes(data.node.key).then(function(children) {
						resolve(children);
					});
				});
			},
			postProcess: function(event, data) {
				
				//logLazy(event, data);
				// either modify the Ajax response directly
				//data.response[0].title += " - hello from postProcess";
				// or setup and return a new response object
				//        data.result = [{title: "set by postProcess"}];
			},
			nodata: false,
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
			select: function(event, data) {
				console.log("select", data);
				data.node.data.done = data.node.selected;
				$("[data-done] [name='done']").prop("checked", data.node.data.done);
				
				let parentNode = data.node;
				while (parentNode) {
					parentNode.renderTitle();
					parentNode = parentNode.parent;
				}

				window.electronAPI.modifyNote({
					key: data.node.key, 
					done: data.node.data.done	
				}).then(function(note) {
					console.log("write back done", note);
				});

			},
			// doesn't work 'placeholder: "There's no tasks in this note.",
			edit: {
				// Available options with their default:
				adjustWidthOfs: 4,   // null: don't adjust input size to content
				inputCss: { minWidth: "3em" },
				triggerStart: ["clickActive", "f2", "dblclick", "shift+click", "mac+enter"],
				beforeEdit: $.noop,   // Return false to prevent edit mode
				edit: $.noop,         // Editor was opened (available as data.input)
				beforeClose: $.noop,  // Return false to prevent cancel/save (data.input is available)
				save: $.noop,         // Save data.input.val() or return false to keep editor open
				close: $.noop,        // Editor was removed
			},
			init: function(event, data) {
				/*if (data.tree.rootNode.children.length > 0) {
					$("[data-app]").removeClass("n3-no-nodes");
				} else {
					$("[data-app]").addClass("n3-no-nodes");
				}*/

				if (data.tree.rootNode.children.length > 0) {
					data.tree.activateKey(data.tree.rootNode.children[0].key);
				} else {
					$("[data-app]").addClass("n3-no-nodes");
				}
				data.tree.$container.addClass("fancytree-ext-childcounter");
			},
			modifyChild: function(event, data) {
				// bei remove - data.tree.rootNode.children is not yet actuall
				if (data.operation == "remove" && data.node.title == "root") {
					$("[data-app]").addClass("n3-no-nodes");
				}/* else if (data.operation != "remove" && data.tree.rootNode.children.length > 0) {
					// on add new node, when there is no statusNodeType !== "nodata" node
					$("[data-app]").removeClass("n3-no-nodes");
				}*/
			},
			// --- Node events -------------------------------------------------			
			activate: function(event, data) {
				$("[data-app]").removeClass("n3-no-nodes");
				if (data.node.key !== "_1") {
					window.n3.node.activateNode(data.node).then(function() { });
				}
			},
			expand: function(event, data, a, b) {
				window.electronAPI.modifyNote({
					key: data.node.key,
					expanded: true
				}).then(function(note) { 
					console.log("write back expanded?", note);
				});
			},
			collapse: function(event, data) {
				window.electronAPI.modifyNote({
					key: data.node.key,
					expanded: false
				}).then(function(note) { 
					console.log("write back expanded?", note);
				});
			},
			loadChildren: function(event, data) {
				data.node.visit(function(subNode) {
					// Load all lazy/unloaded child nodes
					// (which will trigger `loadChildren` recursively)
					if (subNode.isUndefined() && subNode.isExpanded()) {
						subNode.load();
					}
				});
			},
			enhanceTitle: function(event, data) {
				let tasksAmountOnNode = 0;
				let tasksAmount = 0;
				data.node.visit(function(subNode) {
					if (subNode.data.type === "task" && (subNode.data.done === undefined || !subNode.data.done)) {
						tasksAmount++;
						if (data.node.key === subNode.parent.key) {
							tasksAmountOnNode++;
						}
					}
				});

				$(data.node.span).append(
					`<div class="n3-childcounter ${ tasksAmount > 0 ? "n3-active" : "" }"> ${tasksAmount} </div>`
				);


				$(data.node.span).append(
					`<span class='n3-task-priority n3-task-priority-${data.node.data.priority}'></span>
					<button data-node-add data-node-key='${data.node.key}' class='ui compact n3-node-add icon button mini'>
						<i class='plus square outline icon'></i>
					</button>`
				);

			},
			dnd5: {
				// autoExpandMS: 400,
				// preventForeignNodes: true,
				// preventNonNodes: true,
				preventRecursion: true, // Prevent dropping nodes on own descendants
				// preventSameParent: true,
				preventVoidMoves: true, // Prevent moving nodes 'before self', etc.
				// effectAllowed: "all",
				dropEffectDefault: "move", // "auto",
				multiSource: false,  // drag all selected nodes (plus current node)

				// --- Drag-support:

				dragStart: function(node, data) {
					/* This function MUST be defined to enable dragging for the tree.
					  *
					  * Return false to cancel dragging of node.
					  * data.dataTransfer.setData() and .setDragImage() is available
					  * here.
					  */
					node.debug("T1: dragStart: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
						", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);

					// Set the allowed effects (i.e. override the 'effectAllowed' option)
					data.effectAllowed = "all";

					// Set a drop effect (i.e. override the 'dropEffectDefault' option)
					// data.dropEffect = "link";
					data.dropEffect = "copy";

					// We could use a custom image here:
					// data.dataTransfer.setDragImage($("<div>TEST</div>").appendTo("body")[0], -10, -10);
					// data.useDefaultImage = false;

					// Return true to allow the drag operation
					return true;
				},
				dragDrag: function(node, data) {
					//   logLazy("dragDrag", null, 2000,
					//     "T1: dragDrag: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
					//     ", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed );
				},
				dragEnd: function(node, data) {
					//   node.debug( "T1: dragEnd: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
					//     ", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);
					//     alert("T1: dragEnd")
				},

				// --- Drop-support:

				dragEnter: function(node, data) {
					node.debug("T1: dragEnter: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
						", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed, data);

					// data.dropEffect = "copy";
					return true;
				},
				dragOver: function(node, data) {
					logLazy("dragOver", null, 2000,
						"T1: dragOver: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
						", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed);

					// Assume typical mapping for modifier keys
					data.dropEffect = data.dropEffectSuggested;
					// data.dropEffect = "move";
				},
				dragLeave(node, data) {
					logLazy("dragLeave", null, 2000,
						"T1: dragOver: " + "data: " + data.dropEffect + "/" + data.effectAllowed +
						", dataTransfer: " + data.dataTransfer.dropEffect + "/" + data.dataTransfer.effectAllowed);

				},
				dragDrop: function(node, data) {

					let newNode,
						transfer = data.dataTransfer,
						sourceNodes = data.otherNodeList,
						mode = data.dropEffect;

					if (data.hitMode === "after" && sourceNodes) {
						// sourceNodes is undefined when dropping not node (file, text, etc.)
						// If node are inserted directly after target node one-by-one,
						// this would reverse them. So we compensate:
						sourceNodes.reverse();
					}
					if (data.otherNode) {
						// ignore mode, always move
						var oldParentNote = data.otherNode.parent;
						
						// hitMode === "after" || hitMode === "before" || hitMode === "over"
						console.log("data.hitMode", data.hitMode);
						
						window.electronAPI.moveNote(data.otherNode.key, oldParentNote.key, data.hitMode === "over" ? node.key : node.parent.key, data.hitMode, node.key).then(function() {
							console.log("moveNote done");
							data.otherNode.moveTo(node, data.hitMode);
						});
						
						data.tree.render(true, false);
					} else if (data.files.length) {
						
						console.log("transfer.items", transfer.items);
						for (let i = 0; i < transfer.items.length; i++) {
							let item = transfer.items[i];

							let entry = item.getAsFile();
							console.log("entry as file", entry);

							window.electronAPI.addFile(data.hitMode === "over" ? node.key : node.parent.key, entry.path, data.hitMode, node.key).then(function() {
								console.log("addFile done");

								if (data.hitMode == "over") {
									node.resetLazy();
									node.setExpanded(true);
								} else {
									if (node.parent.key.startsWith("root_")) {
										window.n3.loadNotes().then(function(tree) {
											$.ui.fancytree.getTree("[data-tree]").reload(tree);
										});
									} else {
										node.parent.resetLazy();
										node.parent.setExpanded(true);
									}
									
								}

							});
						}
						
					} else {
						// TODO: it's not ready yet
						// Drop a non-node
						let newNodeData = window.n3.node.getNewNodeData();
						console.log("transfer", transfer);
						let text = transfer.getData("text");
						newNodeData.data.description = text;

						console.log("transfer text", text);
						var firstLine = text.split('\n')[0] || "";
						newNodeData.title = firstLine.trim();
						

	
						window.electronAPI.addNote(data.hitMode === "over" ? node.key : node.parent.key, {
							title: newNodeData.title,
							type: newNodeData.type,
							priority: newNodeData.priority,
							done: newNodeData.done,
							description: newNodeData.description
						}, data.hitMode, data.hitMode === "over" ? node.key : node.parent.key).then(function(newNodeData) {
							console.log("write back added", note);

							let newNode = node.addNode(newNodeData, data.hitMode);

						});

					}
					node.setExpanded();
				}
			}
		});

		if (!rootNodes || rootNodes.length == 0) {
			window.n3.node.add().then(function() {
				resolve();
			});
		} else {
			resolve();
		}

		
	});

}
