import $ from 'jquery';
import {TweenMax} from 'gsap/TweenMax';
import NFQReflowTree from './NFQReflowTree';
import NFQReflowTemplateParser from './NFQReflowTemplateParser';

/**
 * Reflow Basis Component.
 */
class NFQReflowComponent {
    /**
    * Constructor.
    *
    * @param {Object} props All child properties.
    */
    constructor(props) {
        /* eslint-disable no-magic-numbers */
        this.parent = null;
        this.template;
        this.props = props || {};
        this.hash = null;
        this.eventList = {};
        this.parentHash = this.props.parentHash || null;
        this.parentIndex = this.props.parentIndex || 0;
        this.children = {};
        /* eslint-enable no-magic-numbers */
    }

    /**
    * Adds itself to the tree.
    */
    addToTree() {
        let parser = new NFQReflowTemplateParser(this.props, this.children, this.template);
        let renderedTemplate = parser.parse();

        this.usedChildren = parser.getUsedChilds();

        this.hash = NFQReflowTree.addNode(this, renderedTemplate);
    }

    /**
    * Renders the component.
    *
    * @return {String} Hash of component.
    */
    render() {
        let parent;

        if (NFQReflowTree.checkNode(this)) {
            this.addToTree();

            if (this.parent === null) {
                parent = this.createParentNode();
                parent.html(NFQReflowTree.find(this.hash).rendered);

                $('body').prepend(parent);

                this.parent = parent;
            } else {
                $(this.parent).css('opacity', '0');
                $(this.parent).html(NFQReflowTree.find(this.hash).rendered);
            }

            requestAnimationFrame(this.onInternalRendered.bind(this));
            requestAnimationFrame(this.onRendered.bind(this));
            this.renderChildren();
        }

        requestAnimationFrame(this.onRegisterEvents.bind(this));

        return this.hash;
    }

    /**
    * Creates the parent node.
    *
    * @return {jQuery} Parent node.
    */
    createParentNode() {
        return $(`<div class="${this.constructor.name}" style="opacity: 0"></div>`);
    }

    /**
    * Sets its own parent node.
    *
    * @param {jQuery} parent Parent node.
    */
    setParent(parent) {
        this.parent = parent;
    }

    /**
    * Renders child components.
    */
    renderChildren() {
        let param, child, regex, component, usableProperties, parentNode, i = 0;

        NFQReflowTree.clean(this, this.usedChildren);

        for ([param, child] of Object.entries(this.children)) {
            if (this.usedChildren.indexOf(param) === -1) {
                continue;
            }

            regex = new RegExp(`\\$\\{${this.escapeRegex(param)}\\}`);

            usableProperties = this.addSpecialProps(child, i);

            component = (NFQReflowTree.find(child.hash))
                ? NFQReflowTree.find(child.hash).node
                : new child.component(usableProperties, child.children || {});

            if (component.parent === null) {
                parentNode = component.createParentNode();
            } else {
                parentNode = component.parent;
            }

            this.parent.find(':not(iframe)').addBack().contents().filter(this.findTextNode).each(
                this.replaceComponent.bind($(this), regex, param, parentNode)
            );

            component.setParent(parentNode);
            child.hash = component.render();

            i++;
        }

        requestAnimationFrame(this.onChildsRendered.bind(this));
    }

    /**
    * Replaces textnodes with components.
    *
    * @param {RegExp}  regex      Regex to filter for.
    * @param {String}  param      Param name to look for in text nodes.
    * @param {jQuery}  parentNode Parent node to replace the text with.
    * @param {Number}  index      Found element index.
    * @param {DOMNode} value      DOM node.
    *
    * @return {Boolean} Found or not.
    */
    replaceComponent(regex, param, parentNode, index, value) {
        let replaceWith;
        let ret = true;

        if (regex.test(value.textContent)) {
            replaceWith = value.textContent.replace(regex, `<span id="${param}"></span>`);
            $(value).replaceWith(replaceWith);
            $(`#${param}`).replaceWith(parentNode);

            ret = false;
        }

        return ret;
    }

    /**
    * Filters only Textnodes.
    *
    * @return {Boolean} Is it text.
    */
    findTextNode() {
        const textNodeId = 3;

        return this.nodeType === textNodeId;
    }

    /**
    * Adds special parent Hash property.
    *
    * @param {Object} child Property Object.
    * @param {Object} index Render index of child.
    *
    * @return {Object} Returns the object with new properties.
    */
    addSpecialProps(child, index) {
        const component = Object.assign({}, child);

        if (typeof component.props === 'undefined') {
            component.props = {};
        }

        component.props.parentHash = this.hash;
        component.props.parentIndex = index;

        return component.props;
    }

    /**
    * Escapes an regex.
    *
    * @param {string} s String to escape.
    *
    * @return {string} Escaped regex.
    */
    escapeRegex(s) {
        /* eslint-disable no-useless-escape */
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        /* eslint-enable no-useless-escape */
    }

    /**
    * Finds DOM elements in module context.
    *
    * @param {string} selector Selector string.
    *
    * @return {jQuery} Found jQuery DOM object.
    */
    find(selector) {
        return this.parent.find(selector);
    }

    /**
    * Adds an double Save eventHandler.
    *
    * @param {jQuery}   selector DOM selection.
    * @param {string}   event    Event Type.
    * @param {string}   eventId  Event Id.
    * @param {function} callback Event Handler.
    */
    on(selector, event, eventId, callback) {
        let hashEvent = `${event}.${eventId}${this.hash}`;

        selector.off(hashEvent).on(hashEvent, callback);

        if (!this.eventList.hasOwnProperty(eventId)) {
            this.eventList[eventId] = {
                selector: selector,
                hash: hashEvent,
                callback: callback
            };
        }
    }

    /**
    * Removes an double Save eventHandler.
    *
    * @param {String} eventId ID for the Event to kill.
    */
    off(eventId) {
        let selector, hash, callback;

        if (this.eventList.hasOwnProperty(eventId)) {
            selector = this.eventList[eventId].selector;
            hash = this.eventList[eventId].hash;
            callback = this.eventList[eventId].callback;

            selector.off(hash, callback);

            delete(this.eventList[eventId]);
        }
    }

    /**
     * Sets the value of an property and renders the component.
     *
     * @param {Mixed} props The property object to set.
     */
    setProp(props) {
        let prop, val, oldProps = this.props;

        if (typeof props === 'object') {
            this.props = Object.assign(oldProps, props);
        } else {
            throw new Error('"props" has to be an Object with key value pairs');
        }

        this.render();
    }

    /**
     * Sets the value of all properties.
     *
     * @param {Mixed} props The property object to set.
     */
    setProps(props) {
        let oldProps = this.props;

        this.props = Object.assign(oldProps, props);
    }

    cleanSelf() {
        NFQReflowTree.killChildren(this.hash);
    }

    /**
     * Sets the value of an property and renders the component.
     *
     * @param {Mixed} childs The child object to set.
     */
    setChild(childs) {
        let child, val;

        if (typeof childs === 'object') {
            for ([child, val] of Object.entries(childs)) {
                if (val === null) {
                    delete(this.children[child]);
                } else {
                    this.children[child] = val;
                }
            }
        } else {
            throw new Error('"childs" has to be an Object with key value pairs');
        }

        this.render();
    }

    onInternalRendered() {
        TweenMax.to($(this.parent), 0.2, {opacity: 1});
    }

    /**
    * Gets called after component render.
    */
    onRendered() {
        /* For convenience. */
    }

    /**
    * Gets called if it is possible to register Events safetly.
    */
    onRegisterEvents() {
        /* For convenience. */
    }

    /**
    * Gets called after all childs got rendered.
    */
    onChildsRendered() {
        /* For convenience. */
    }
}

export default NFQReflowComponent;