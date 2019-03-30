import Mmenu from '../../core/oncanvas/mmenu.oncanvas';
import options from './_options';
import configs from './_configs';
import translate from './translations/translate';
import * as DOM from '../../core/_dom';
import * as events from '../../core/_eventlisteners';
import { extendShorthandOptions } from './_options';
import { type, extend } from '../../core/_helpers';
//  Add the translations.
translate();
//  Add the options and configs.
Mmenu.options.searchfield = options;
Mmenu.configs.searchfield = configs;
export default function () {
    var options = extendShorthandOptions(this.opts.searchfield);
    this.opts.searchfield = extend(options, Mmenu.options.searchfield);
    var configs = this.conf.searchfield;
    if (!options.add) {
        return;
    }
    //	Blur searchfield
    this.bind('close:start', () => {
        DOM.find(this.node.menu, '.mm-searchfield').forEach(input => {
            input.blur();
        });
    });
    this.bind('initPanels:after', (panels) => {
        var searchpanel = null;
        //	Add the search panel
        if (options.panel.add) {
            searchpanel = initSearchPanel.call(this, panels);
        }
        //	Add the searchfield
        var addTo = null;
        switch (options.addTo) {
            case 'panels':
                addTo = panels;
                break;
            case 'panel':
                addTo = [searchpanel];
                break;
            default:
                if (typeof options.addTo == 'string') {
                    addTo = DOM.find(this.node.menu, options.addTo);
                }
                else if (type(options.addTo) == 'array') {
                    addTo = options.addTo;
                }
                break;
        }
        addTo.forEach(form => {
            form = initSearchfield.call(this, form);
            if (options.search && form) {
                initSearching.call(this, form);
            }
        });
        //	Add the no-results message
        if (options.noResults) {
            (options.panel.add ? [searchpanel] : panels).forEach(panel => {
                initNoResultsMsg.call(this, panel);
            });
        }
    });
    //	Add click behavior.
    //	Prevents default behavior when clicking an anchor
    this.clck.push((anchor, args) => {
        if (args.inMenu) {
            if (anchor.matches('.mm-searchfield__btn')) {
                //	Clicking the clear button
                if (anchor.matches('.mm-btn_close')) {
                    let form = anchor.closest('.mm-searchfield'), input = DOM.find(form, 'input')[0];
                    input.value = '';
                    this.search(input);
                    return true;
                }
                //	Clicking the submit button
                if (anchor.matches('.mm-btn_next')) {
                    let form = anchor.closest('form');
                    if (form) {
                        form.submit();
                    }
                    return true;
                }
            }
        }
    });
}
const initSearchPanel = function (panels) {
    var options = this.opts.searchfield, configs = this.conf.searchfield;
    //	Only once
    if (DOM.children(this.node.pnls, '.mm-panel_search').length) {
        return null;
    }
    var searchpanel = DOM.create('div.mm-panel_search'), listview = DOM.create('ul');
    searchpanel.append(listview);
    this.node.pnls.append(searchpanel);
    if (options.panel.id) {
        searchpanel.id = options.panel.id;
    }
    if (options.panel.title) {
        searchpanel.setAttribute('data-mm-title', options.panel.title);
    }
    switch (options.panel.fx) {
        case false:
            break;
        case 'none':
            searchpanel.classList.add('mm-panel_noanimation');
            break;
        default:
            searchpanel.classList.add('mm-panel_fx-' + options.panel.fx);
            break;
    }
    //	Add splash content
    if (options.panel.splash) {
        let splash = DOM.create('div.mm-panel__searchsplash');
        splash.innerHTML = options.panel.splash;
        searchpanel.append(splash);
    }
    this._initPanels([searchpanel]);
    return searchpanel;
};
const initSearchfield = function (wrapper) {
    var options = this.opts.searchfield, configs = this.conf.searchfield;
    //	No searchfield in vertical submenus
    if (wrapper.parentElement.matches('.mm-listitem_vertical')) {
        return null;
    }
    //	Only one searchfield per panel
    var form = DOM.find(wrapper, '.mm-searchfield')[0];
    if (form) {
        return form;
    }
    function addAttributes(element, attr) {
        if (attr) {
            for (var a in attr) {
                element.setAttribute(a, attr[a]);
            }
        }
    }
    var form = DOM.create((configs.form ? 'form' : 'div') + '.mm-searchfield'), field = DOM.create('div.mm-searchfield__input'), input = DOM.create('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.placeholder = this.i18n(options.placeholder);
    field.append(input);
    form.append(field);
    wrapper.prepend(form);
    if (wrapper.matches('.mm-panel')) {
        wrapper.classList.add('mm-panel_has-searchfield');
    }
    //	Add attributes to the input
    addAttributes(input, configs.input);
    //	Add the clear button
    if (configs.clear) {
        let anchor = DOM.create('a.mm-btn.mm-btn_close.mm-searchfield__btn');
        anchor.setAttribute('href', '#');
        field.append(anchor);
    }
    //	Add attributes and submit to the form
    addAttributes(form, configs.form);
    if (configs.form && configs.submit && !configs.clear) {
        let anchor = DOM.create('a.mm-btn.mm-btn_next.mm-searchfield__btn');
        anchor.setAttribute('href', '#');
        field.append(anchor);
    }
    if (options.cancel) {
        let anchor = DOM.create('a.mm-searchfield__cancel');
        anchor.setAttribute('href', '#');
        anchor.textContent = this.i18n('cancel');
        form.append(anchor);
    }
    return form;
};
const initSearching = function (form) {
    var options = this.opts.searchfield, configs = this.conf.searchfield;
    var data = {};
    //	In the searchpanel.
    if (form.closest('.mm-panel_search')) {
        data.panels = DOM.find(this.node.pnls, '.mm-panel');
        data.noresults = [form.closest('.mm-panel')];
        //	In a panel
    }
    else if (form.closest('.mm-panel')) {
        data.panels = [form.closest('.mm-panel')];
        data.noresults = data.panels;
        //	Not in a panel, global
    }
    else {
        data.panels = DOM.find(this.node.pnls, '.mm-panel');
        data.noresults = [this.node.menu];
    }
    //	Filter out vertical submenus
    data.panels = data.panels.filter(panel => !panel.parentElement.matches('.mm-listitem_vertical'));
    //	Filter out search panel
    data.panels = data.panels.filter(panel => !panel.matches('.mm-panel_search'));
    var listitems = [];
    data.panels.forEach(panel => {
        listitems.push(...DOM.find(panel, '.mm-listitem'));
    });
    data.listitems = listitems.filter(listitem => !listitem.matches('.mm-listitem_divider'));
    data.dividers = listitems.filter(listitem => listitem.matches('.mm-listitem_divider'));
    var searchpanel = DOM.children(this.node.pnls, '.mm-panel_search')[0], input = DOM.find(form, 'input')[0], cancel = DOM.find(form, '.mm-searchfield__cancel')[0];
    input['mmSearchfield'] = data;
    //	Open the splash panel when focussing the input.
    if (options.panel.add && options.panel.splash) {
        events.off(input, 'focus.splash');
        events.on(input, 'focus.splash', evnt => {
            this.openPanel(searchpanel);
        });
    }
    if (options.cancel) {
        //	Show the cancel button when focussing the input.
        events.off(input, 'focus.cancel');
        events.on(input, 'focus.cancel', evnt => {
            cancel.classList.add('mm-searchfield__cancel-active');
        });
        //	Close the splash panel when clicking the cancel button.
        events.off(cancel, 'click.splash');
        events.on(cancel, 'click.splash', evnt => {
            evnt.preventDefault();
            cancel.classList.remove('mm-searchfield__cancel-active');
            if (searchpanel.matches('.mm-panel_opened')) {
                let parents = DOM.children(this.node.pnls, '.mm-panel_opened-parent');
                if (parents.length) {
                    this.openPanel(parents[parents.length - 1]);
                }
            }
        });
    }
    //	Focus the input in the searchpanel when opening the searchpanel.
    if (options.panel.add && options.addTo == 'panel') {
        this.bind('openPanel:finish', (panel) => {
            if (panel === searchpanel) {
                input.focus();
            }
        });
    }
    //	Search while typing.
    events.off(input, 'input.search');
    events.on(input, 'input.search', (evnt) => {
        switch (evnt.keyCode) {
            case 9: //	tab
            case 16: //	shift
            case 17: //	control
            case 18: //	alt
            case 37: //	left
            case 38: //	top
            case 39: //	right
            case 40: //	bottom
                break;
            default:
                this.search(input);
                break;
        }
    });
    //	Search initially.
    this.search(input);
};
const initNoResultsMsg = function (wrapper) {
    if (!wrapper) {
        return;
    }
    var options = this.opts.searchfield, configs = this.conf.searchfield;
    //	Not in a panel
    if (!wrapper.closest('.mm-panel')) {
        wrapper = DOM.children(this.node.pnls, '.mm-panel')[0];
    }
    //	Only once
    if (DOM.children(wrapper, '.mm-panel__noresultsmsg').length) {
        return;
    }
    //	Add no-results message
    var message = DOM.create('div.mm-panel__noresultsmsg.mm-hidden');
    message.innerHTML = this.i18n(options.noResults);
    wrapper.prepend(message);
};
Mmenu.prototype.search = function (input, query) {
    var options = this.opts.searchfield, configs = this.conf.searchfield;
    query = query || '' + input.value;
    query = query.toLowerCase().trim();
    var data = input['mmSearchfield'];
    var form = input.closest('.mm-searchfield'), buttons = DOM.find(form, '.mm-btn'), searchpanel = DOM.children(this.node.pnls, '.mm-panel_search')[0];
    var panels = data.panels, noresults = data.noresults, listitems = data.listitems, dividers = data.dividers;
    //	Reset previous results
    listitems.forEach(listitem => {
        listitem.classList.remove('mm-listitem_nosubitems');
    });
    //	TODO: dit klopt niet meer
    // Mmenu.$(listitems).find( '.mm-btn_fullwidth-search' )
    // .removeClass( 'mm-btn_fullwidth-search mm-btn_fullwidth' );
    if (searchpanel) {
        DOM.children(searchpanel, '.mm-listview')[0].innerHTML = '';
    }
    panels.forEach(panel => {
        panel.scrollTop = 0;
    });
    //	Search
    if (query.length) {
        //	Initially hide all listitems
        listitems.forEach(listitem => {
            listitem.classList.add('mm-hidden');
        });
        dividers.forEach(divider => {
            divider.classList.add('mm-hidden');
        });
        //	Re-show only listitems that match
        listitems.forEach(listitem => {
            var _search = '.mm-listitem__text'; // 'a'
            if (options.showTextItems ||
                (options.showSubPanels &&
                    listitem.querySelector('.mm-btn_next'))) {
                // _search = 'a, span';
            }
            else {
                _search = 'a' + _search;
            }
            let text = DOM.children(listitem, _search)[0];
            if (text && text.textContent.toLowerCase().indexOf(query) > -1) {
                listitem.classList.remove('mm-hidden');
            }
        });
        //	Show all mached listitems in the search panel
        if (options.panel.add) {
            //	Clone all matched listitems into the search panel
            let allitems = [];
            panels.forEach(panel => {
                let listitems = Mmenu.filterListItems(DOM.find(panel, '.mm-listitem'));
                if (listitems.length) {
                    if (options.panel.dividers) {
                        let divider = DOM.create('li.mm-listitem.mm-listitem_divider');
                        divider.innerHTML = panel.querySelector('.mm-navbar__title').innerHTML;
                        listitems.push(divider);
                    }
                    listitems.forEach(listitem => {
                        allitems.push(listitem.cloneNode(true));
                    });
                }
            });
            //	Remove toggles, checks and open buttons
            allitems.forEach(listitem => {
                listitem
                    .querySelectorAll('.mm-toggle, .mm-check, .mm-btn')
                    .forEach(element => {
                    element.remove();
                });
            });
            //	Add to the search panel
            DOM.children(searchpanel, '.mm-listview')[0].append(...listitems);
            //	Open the search panel
            this.openPanel(searchpanel);
        }
        else {
            //	Also show listitems in sub-panels for matched listitems
            if (options.showSubPanels) {
                panels.forEach(panel => {
                    let listitems = DOM.find(panel, '.mm-listitem');
                    Mmenu.filterListItems(listitems).forEach(listitem => {
                        let child = listitem['mmChild'];
                        if (child) {
                            DOM.find(child, '.mm-listitem').forEach(listitem => {
                                listitem.classList.remove('mm-hidden');
                            });
                        }
                    });
                });
            }
            //	Update parent for sub-panel
            panels.reverse().forEach((panel, p) => {
                let parent = panel['mmParent'];
                if (parent) {
                    //	The current panel has mached listitems
                    let listitems = DOM.find(panel, '.mm-listitem');
                    if (Mmenu.filterListItems(listitems).length) {
                        //	Show parent
                        if (parent.matches('.mm-hidden')) {
                            parent.classList.remove('mm-hidden');
                            //	TODO: dit klopt niet meer...
                            //	Het idee was een btn tijdelijk fullwidth te laten zijn omdat het zelf geen resultaat is, maar zn submenu wel.
                            // Mmenu.$(parent)
                            // 	.children( '.mm-btn_next' )
                            // 	.not( '.mm-btn_fullwidth' )
                            // 	.addClass( 'mm-btn_fullwidth' )
                            // 	.addClass( 'mm-btn_fullwidth-search' );
                        }
                    }
                    else if (!input.closest('.mm-panel')) {
                        if (panel.matches('.mm-panel_opened') ||
                            panel.matches('.mm-panel_opened-parent')) {
                            //	Compensate the timeout for the opening animation
                            setTimeout(() => {
                                this.openPanel(parent.closest('.mm-panel'));
                            }, (p + 1) * (this.conf.openingInterval * 1.5));
                        }
                        parent.classList.add('mm-listitem_nosubitems');
                    }
                }
            });
            //	Show first preceeding divider of parent
            panels.forEach(panel => {
                let listitems = DOM.find(panel, '.mm-listitem');
                Mmenu.filterListItems(listitems).forEach(listitem => {
                    let divider = DOM.prevAll(listitem, '.mm-listitem_divider')[0];
                    if (divider) {
                        divider.classList.remove('mm-hidden');
                    }
                });
            });
        }
        //	Show submit / clear button
        buttons.forEach(button => button.classList.remove('mm-hidden'));
        //	Show/hide no results message
        noresults.forEach(wrapper => {
            DOM.find(wrapper, '.mm-panel__noresultsmsg').forEach(message => message.classList[listitems.filter(listitem => !listitem.matches('.mm-hidden')).length
                ? 'add'
                : 'remove']('mm-hidden'));
        });
        if (options.panel.add) {
            //	Hide splash
            if (options.panel.splash) {
                DOM.find(searchpanel, '.mm-panel__searchsplash').forEach(splash => splash.classList.add('mm-hidden'));
            }
            //	Re-show original listitems when in search panel
            listitems.forEach(listitem => listitem.classList.remove('mm-hidden'));
            dividers.forEach(divider => divider.classList.remove('mm-hidden'));
        }
        //	Don't search
    }
    else {
        //	Show all items
        listitems.forEach(listitem => listitem.classList.remove('mm-hidden'));
        dividers.forEach(divider => divider.classList.remove('mm-hidden'));
        //	Hide submit / clear button
        buttons.forEach(button => button.classList.add('mm-hidden'));
        //	Hide no results message
        noresults.forEach(wrapper => {
            DOM.find(wrapper, '.mm-panel__noresultsmsg').forEach(message => message.classList.add('mm-hidden'));
        });
        if (options.panel.add) {
            //	Show splash
            if (options.panel.splash) {
                DOM.find(searchpanel, '.mm-panel__searchsplash').forEach(splash => splash.classList.remove('mm-hidden'));
                //	Close panel
            }
            else if (!input.closest('.mm-panel_search')) {
                let opened = DOM.children(this.node.pnls, '.mm-panel_opened-parent');
                this.openPanel(opened.slice(-1)[0]);
            }
        }
    }
    //	Update for other addons
    this.trigger('updateListview');
};
