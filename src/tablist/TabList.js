/* global define */
define([], function () {
	'use strict';


	// sequence for assigning unique element ids, for aria roles
	var ID_SEQUENCE = 0;


	/**
	 * Construct a new ItemList.
	 *
	 * Sub-classes may override the methods getTabContent() and
	 * getPanelContent() to change list formatting.
	 *
	 * @param options {Object}
	 * @param options.el {DOMElement}
	 *        Optional, default is new section element.
	 * @param options.header {String}
	 *        Optional, markup placed in header for tab list.
	 * @param options.tabs {Array<Object>}
	 *        Optional, any items are passed to addItem().
	 * @param options.tabPosition {String}
	 *        Optional, default "left".
	 *        "left", "right", "top" are only supported options.
	 */
	var TabList = function (options) {
		var backward, forward, _this = this;

		this.el = options.el || document.createElement('section');
		this.el.classList.add('tablist');

		// add tab position class, if needed
		if (options.tabPosition === 'right') {
			this.el.classList.add('tablist-right');
		} else if (options.tabPosition === 'top') {
			this.el.classList.add('tablist-top');
		} else {
			this.el.classList.add('tablist-left');
		}

		// add header
		if (options.header) {
			this._header = this.el.appendChild(document.createElement('header'));
			this._header.innerHTML = options.header;
		}

		// create tab container
		this._nav = this.el.appendChild(document.createElement('nav'));
		this._nav.setAttribute('role', 'tablist');

		// add tab back/next buttons
		backward = this._backward = document.createElement('div');
		backward.className = 'tablist-backward-button';
		backward.innerHTML = '<div class="image"></div>';

		forward = this._forward = document.createElement('div');
		forward.className = 'tablist-forward-button';
		forward.innerHTML = '<div class="image"></div>';

		this.el.appendChild(backward);
		this.el.appendChild(forward);

		this._clickNavScrolling = this._clickNavScrolling.bind(this);
		this._touchNavScrolling = this._touchNavScrolling.bind(this);
		//this._handleNavScrolling = this._handleNavScrolling.bind(this);
		this._onDragStart = this._onDragStart.bind(this);
		this._onDragEnd = this._onDragEnd.bind(this);
		this._onDragLeave = this._onDragLeave.bind(this);

		// mouse (desktop) interactions
		this._backward.addEventListener('click', function () {
				_this._clickButton({'increment' : -1});
			});

		this._forward.addEventListener('click', function () {
				_this._clickButton({'increment' : 1});
			});

		this._nav.addEventListener('mousedown', function (event) {
			//_this._handleNavScrolling(event);
			_this._onDragStart(event);
		});

		this._nav.addEventListener('mouseup', function (event) {
			//_this._handleNavScrolling(event);
			_this._onDragEnd(event);
		});


		// touch (mobile) interactions
		this._nav.addEventListener('touchstart', function (event) {
			//_this._handleNavScrolling(event);
			_this._onDragStart(event);
		});

		this._nav.addEventListener('touchend', function (event) {
			//_this._handleNavScrolling(event);
			_this._onDragEnd(event);
		});


		// keyboard interactions
		this.el.addEventListener('keyup', function (e) {
			_this._keyPressHandler(e);
		});


		// array of tab objects
		this._tabs = [];

		// add any items provided when constructing
		if (options.tabs) {
			for (var i=0, len=options.tabs.length; i<len; i++) {
				this.addTab(options.tabs[i], true);
			}
			this._ensureSelected();
		}

		// initial state
		this._updateButtonState();
	};

	/**
	 * Called on "keypress", handles changing the selected tab from the
	 * tablist-tab navigation when a enter is clicked on a tab with focus,
	 * or the left/right directional pad is clicked. 
	 * 
	 * @param  {object} e,
	 *         "keypress" event
	 */
	TabList.prototype._keyPressHandler = function (e) {
		var keyCode = e.keyCode,
		    tab, index;

		if (keyCode === 37) {
			// d-pad left key
			this._clickButton({'increment':-1});
		} else if (keyCode === 39) {
			// d-pad right key
			this._clickButton({'increment':1});
		} else if (keyCode === 13) {
			// enter key
			tab = document.activeElement;
			index = tab.getAttribute('tabindex');

			// make sure it is a tab element with focus
			if (index) {
				this._selectTabByIndex(index);
			}
		}
	};

/**
 * Select a tab based on the tab index. Used by keyPressHandler,
 * this is useful when multiple tab lists exist.
 *
 * @param  {integer} index,
 *         tab index of the tab element
 * 
 */
	TabList.prototype._selectTabByIndex = function(index) {
		var tabs = this._tabs,
		    id = 'tablist-tab-' + index;

		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i].tabEl.id === id) {
				// select tab and exit loop
				tabs[i].select();
				return;
			}
		}
	};

	/**
	 * Called on "touchstart" or "mousedown", tracks the drag start position
	 * and adds event listeners for mouse events or touch events that update
	 * the position of the tablist-tab navigation.
	 * 
	 * @param  {object} e,
	 *         "mousedown" event OR "touchstart" event
	 */
	TabList.prototype._onDragStart = function (e) {

		this._navPosition = e.currentTarget.scrollLeft;

		if (e.type === 'mousedown') {
			console.log('mousedown');
			this._startPosition = e.clientX;
			document.addEventListener('mousemove', this._clickNavScrolling);
			this._nav.addEventListener('mouseleave', this._onDragLeave);
		} else if (e.type === 'touchstart') {
			console.log('touchstart');
			this._startPosition = e.touches[0].clientX;
			document.addEventListener('touchmove', this._touchNavScrolling);
			//this._nav.addEventListener('touchleave', this._onDragLeave);
		}
	};


	/**
	 * Called on "touchend" or "mouseup", removes event listeners
	 * for mouse events or touch events that update the position 
	 * of the tablist-tab navigation.
	 * 
	 * @param  {object} e,
	 *         "mouseup" event OR "touchend" event
	 */
	TabList.prototype._onDragEnd = function (e) {

		if (e.type === 'mouseup') {
			console.log('mouseup');
			document.removeEventListener('mousemove', this._clickNavScrolling);
			this._nav.removeEventListener('mouseleave', this._onDragLeave);
		} else if (e.type === 'touchend') {
			console.log('touchend');
			document.removeEventListener('touchmove', this._clickNavScrolling);
			//this._nav.removeEventListener('touchleave', this._onDragLeave);
		}
	};

	/**
	 * Called on "touchleave" or "mouseleave", removes event listeners
	 * for mouse events or touch events that update the position 
	 * of the tablist-tab navigation.
	 * 
	 * @param  {object} e,
	 *         "mouseleave" event OR "touchleave" event
	 */
	TabList.prototype._onDragLeave = function (/*e*/) {

		// if (e.type === 'mouseleave') {
			console.log('mouseleave');
			document.removeEventListener('mousemove', this._clickNavScrolling);
			this._nav.removeEventListener('mouseleave', this._onDragLeave);
		// } else if (e.type === 'touchleave') {
		// 	console.log('touchleave');
		// 	document.removeEventListener('touchmove', this._touchNavScrolling);
		// 	this._nav.removeEventListener('touchleave', this._onDragLeave);
		// }
	};


	/**
	 * Called on "mousemove", updates the scrollLeft position
	 * on the nav slider that contains the tab elements.
	 * 
	 * @param  {object} e,
	 *         "mousemove" event
	 */
	TabList.prototype._clickNavScrolling = function (e) {
		var scroll = this._startPosition - e.clientX;
		console.log(scroll);
		this._nav.scrollLeft = this._navPosition + scroll;
	};

	/**
	 * Called on "touchmove", updates the scrollLeft position
	 * on the nav slider that contains the tab elements.
	 * 
	 * @param  {object} e,
	 *         "touchmove" event
	 */
	TabList.prototype._touchNavScrolling = function (e) {
		var scroll = this._startPosition - e.touches[0].clientX;
		console.log(scroll);
		this._nav.scrollLeft = this._navPosition + scroll;
	};

	/**
	 * Called on "forward"/"backward" button click, and also
	 * left/right d-pad keyboard click. Changes the tab panel
	 * position if the slide exists.
	 * 
	 * @param  {object} options,
	 *         options.increment, increment/decrement the position by 1
	 */
	TabList.prototype._clickButton = function (options) {
		var increment = options.increment || null,
		    currentIndex = this._tabs.indexOf(this._selected),
		    maxTabIndex = this._tabs.length - 1,
		    minTabIndex = 0;

		if (increment) {
			currentIndex = currentIndex + increment;
			// check bounds to find the end of the tablist
			if (currentIndex > maxTabIndex || currentIndex < minTabIndex) {
				return;
			}
			this._tabs[(currentIndex)].select();
			this._updateButtonState();
			//this._slideTabNavigation();
			this._smoothTabNavigation();
		}
	};

	/**
	 * Hides the corresponding 'forward' and 'backward' button
	 * when the selected tab is either the first or last tab in
	 * the list, respectively. 
	 */
	TabList.prototype._updateButtonState = function () {
		var currentIndex = this._tabs.indexOf(this._selected),
		    maxIndex = this._tabs.length - 1,
		    minIndex = 0;

		if (currentIndex === minIndex) {
			// first tab selected, hide back button
			this._backward.classList.add('tablist-button-hide');
			this._forward.classList.remove('tablist-button-hide');
		} else if (currentIndex === maxIndex) {
			// last tab selected, hide forward button
			this._forward.classList.add('tablist-button-hide');
			this._backward.classList.remove('tablist-button-hide');
		} else {
			// other button selected, show back and forward button
			this._forward.classList.remove('tablist-button-hide');
			this._backward.classList.remove('tablist-button-hide');
		}
	};

	/**
	 * Called on a tab.select(), updates the position of the
	 * tablist navigation to center the selected tab (when possible).
	 */
	TabList.prototype._slideTabNavigation = function () {
		var tab = this._selected.tabEl, // selected tab
		    tabWidth = tab.clientWidth, // width of selected tab
		    offsetLeft = tab.offsetLeft, // left offset of selected tab
		    navSlider = tab.offsetParent, // nav element
		    navSliderWidth,
		    scrollNav;

		if (navSlider) {
			// width of nav element
			navSliderWidth = navSlider.clientWidth;
			// compute offset for centering the tab
			scrollNav = offsetLeft - ((navSliderWidth - tabWidth) / 2);
			// center the tab
			navSlider.scrollLeft = scrollNav;
		}
	};

	TabList.prototype._getScrollOffset = function () {
		var tab = this._selected.tabEl, // selected tab
		    tabWidth = tab.clientWidth, // width of selected tab
		    offsetLeft = tab.offsetLeft, // left offset of selected tab
		    navSlider = tab.offsetParent, // nav element
		    navSliderWidth,
		    scrollNav = null;

		if (navSlider) {
			// width of nav element
			navSliderWidth = navSlider.clientWidth;
			// compute offset for centering the tab
			scrollNav = offsetLeft - ((navSliderWidth - tabWidth) / 2);
		}

		// return center x-coordinate position
		return scrollNav;
	};

	TabList.prototype._smoothTabNavigation = function() {
		var tab = this._selected.tabEl,
		    navSlider = tab.offsetParent,
		    startPosition = navSlider.scrollLeft,
		    endPosition = this._getScrollOffset(),
		    diff = startPosition - endPosition,
		    time = 300, // 250ms
		    steps = 10,
		    i = steps,
		    shift,
		    scrollInterval;

		// amount to shift each step
		shift = diff / steps;

		clearInterval(scrollInterval);
		scrollInterval = window.setInterval(function () {
			i -= 1;
			startPosition = startPosition - shift;
			navSlider.scrollLeft = startPosition;

			// last step
			if (0 === i) {
				clearInterval(scrollInterval);
				navSlider.scrollLeft = endPosition;
			}
		}, time / steps);
};

	/**
	 * Format tab (summary) content for a list item.
	 *
	 * @param obj {Object}
	 *        object being added to the list.
	 * @return {String|DOMElement}
	 *         This implementation returns obj.title.
	 */
	TabList.prototype.getTabContent = function(obj) {
		return obj.title;
	};

	/**
	 * Format panel (detail) content for a list item.
	 *
	 * @param obj {Object}
	 *        object being added to the list.
	 * @return {String|DOMElement}
	 *         If obj.content is a function, its return value is returned.
	 *         Otherwise, this implementation returns obj.content.
	 */
	TabList.prototype.getPanelContent = function(obj) {
		if (typeof obj.content === 'function') {
			return obj.content();
		} else {
			return obj.content;
		}
	};

	/**
	 * Add an item to this list.
	 *
	 * @param options {Object}
	 *        item being added to list.
	 * @param options.onSelect {Function}
	 *        Optional.
	 *        Called when tab is selected.
	 * @see getTabContent(), getPanelContent()
	 *      these methods format content shown in tabs and panels,
	 *      and use the following parameters by default.
	 * @param options.title {String|DOMElement}
	 *        Used by getTabContent() to generate tab content.
	 * @param options.content {String|DOMElement|Function}
	 *        Used by getPanelContent() to generate panel content.
	 * @return object with select() method that can be used to show the tab.
	 */
	TabList.prototype.addTab = function (options, dontEnsureSelected) {
		// assign unique ids to this items elements
		var id = ++ID_SEQUENCE;
		var tabId = 'tablist-tab-' + id;
		var panelId = 'tablist-panel-' + id;

		// summary element
		var tabEl = document.createElement('section');
		tabEl.id = tabId;
		tabEl.className = 'tablist-tab';
		tabEl.setAttribute('role', 'tab');
		tabEl.setAttribute('tabindex', id);
		tabEl.setAttribute('aria-controls', panelId);
		var tabContent = this.getTabContent(options);
		if (typeof tabContent === 'string') {
			tabEl.innerHTML = tabContent;
		} else {
			tabEl.appendChild(tabContent);
		}

		// detail element
		var panelEl = document.createElement('section');
		panelEl.id = panelId;
		panelEl.className = 'tablist-panel';
		panelEl.setAttribute('role', 'tabpanel');
		panelEl.setAttribute('aria-labelledby', tabId);
		// content added by _selectTab()

		var _this = this;
		// save reference to tab and elements
		var tab = {
			options: options,
			tabEl: tabEl,
			panelEl: panelEl,
			select: function (e) {
				// if the drag <= 5px, consider it a click
				if (e && Math.abs(_this._startPosition - e.clientX) > 5) {
					e.stopPropagation();
				} else {
					_this._selectTab(tab);
				}
				return false;
			},
			contentReady: false
		};
		this._tabs.push(tab);

		// click handler for tab
		tabEl.addEventListener('click', tab.select);

		// select the first, or specified item
		if (options.selected === true) {
			tab.select();
		} else if (dontEnsureSelected !== true) {
			this._ensureSelected();
		}

		// add elements to dom
		this._nav.appendChild(tabEl);
		this.el.appendChild(panelEl);

		// return reference to tab for selecting
		return tab;
	};

	/**
	 * Select a tab in this list.
	 *
	 * @param  toSelect {Object}
	 *         the tab to select, as returned by addTab().
	 */
	TabList.prototype._selectTab = function (toSelect) {
		for (var i=0, len=this._tabs.length; i<len; i++) {
			var tab = this._tabs[i],
			    options = tab.options,
			    tabEl = tab.tabEl,
			    panelEl = tab.panelEl;
			if (tab === toSelect) {
				// load tab content, if needed...
				if (!tab.contentReady) {
					var panelContent = this.getPanelContent(options);
					if (typeof panelContent === 'string') {
						tab.panelEl.innerHTML = panelContent;
					} else {
						tab.panelEl.appendChild(panelContent);
					}
					tab.contentReady = true;
				}
				// update state classes
				tabEl.classList.add('tablist-tab-selected');
				panelEl.classList.add('tablist-panel-selected');
				panelEl.focus();
				// notify tab it is visible, if needed...
				if (typeof options.onSelect === 'function') {
					options.onSelect();
				}
				// update selected tab
				this._selected = tab;
				this._updateButtonState();
				//this._slideTabNavigation();
				this._smoothTabNavigation();
			} else {
				tabEl.classList.remove('tablist-tab-selected');
				panelEl.classList.remove('tablist-panel-selected');
			}
		}
	};

	TabList.prototype._ensureSelected = function () {
		var selectedPanel = this.el.querySelector('.tablist-panel-selected'),
		    tabs;
		if (selectedPanel === null) {
			tabs = this._tabs;
			if (tabs.length > 0) {
				// select first tab by default
				tabs[0].select();
			}
		}
	};

	TabList.tabbifyOne = function (el) {
		var tabs = [],
		    panels,
		    panel,
		    i, len,
		    tablist;

		panels = el.querySelectorAll('.panel');
		for (i = 0, len = panels.length; i < len; i++) {
			panel = panels[i];
			tabs.push({
				'title': panel.getAttribute('data-title') ||
						panel.querySelector('header').innerHTML,
				'content': panel.innerHTML,
				'selected': panel.getAttribute('data-selected') === 'true'
			});
		}

		tablist = new TabList({
			'tabPosition': el.getAttribute('data-tabposition') || 'left',
			'tabs': tabs
		});

		el.parentNode.replaceChild(tablist.el, el);
	};

	TabList.tabbifyAll = function () {
		var lists,
		    i;
		lists = document.querySelectorAll('.tablist');
		for (i = lists.length - 1; i >= 0; i--) {
			TabList.tabbifyOne(lists[i]);
		}
	};


	return TabList;
});

