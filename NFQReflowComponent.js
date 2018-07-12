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

            NFQReflowTree.addToCallStack(this.hash);

            if (this.parent === null) {
                parent = $(NFQReflowTree.find(this.hash).rendered);

                $('body').prepend(parent);

                this.parent = parent;
            } else {
                parent = $(NFQReflowTree.find(this.hash).rendered);
                parent.css('opacity', '0');
                $(this.parent).replaceWith(parent);

                this.parent = parent;
            }

            requestAnimationFrame(this.onInternalRendered.bind(this));
            requestAnimationFrame(this.onRendered.bind(this));
            this.renderChildren();

            NFQReflowTree.removeFromCallStack(this.hash);
        } else {
            if (this.parent === null) {
                parent = $(NFQReflowTree.find(this.hash).rendered);

                $('body').prepend(parent);

                this.parent = parent;
            } else {
                parent = $(NFQReflowTree.find(this.hash).rendered);
                $(this.parent).replaceWith(parent);

                this.parent = parent;

                this.renderChildren();
            }
        }

        requestAnimationFrame(this.onRegisterEvents.bind(this));

        return this.hash;
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
        let param, child, component, usableProperties, i = 0;

        NFQReflowTree.clean(this, this.usedChildren);

        for ([param, child] of Object.entries(this.children)) {
            if (this.usedChildren.indexOf(param) === -1) {
                continue;
            }

            usableProperties = this.addSpecialProps(child, i);

            component = (NFQReflowTree.find(child.hash))
                ? NFQReflowTree.find(child.hash).node
                : new child.component(usableProperties, child.children || {});

            component.setParent(this.parent.find(`#${param}`));
            child.hash = component.render();

            i++;
        }

        this.propagadeChildsRendered();
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
    * Propagades onChildsRendered Event up.
    *
    * @param {NFQReflowComponent} target Originated Target.
    */
    propagadeChildsRendered(target = null) {
        if (NFQReflowTree.getCallStackPosition(this.hash) === null) {
            if (this.parentHash !== null) {
                NFQReflowTree.find(this.parentHash).node.propagadeChildsRendered(target);
            }
        } else if (NFQReflowTree.getCallStackPosition(this.hash) === 0) {
            if (this.parentHash !== null) {
                NFQReflowTree.find(this.parentHash).node.propagadeChildsRendered(this);
            }
        }

        requestAnimationFrame(this.onChildsRendered.bind(this, target));
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

    /**
     * Cleans up Component from Tree.
     */
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
                    if (
                        this.children.hasOwnProperty(child)
                        && this.children[child].component === val.component
                        && typeof this.children[child].hash !== 'undefined'
                    ) {
                        NFQReflowTree.find(this.children[child].hash).node.setProp(val.props);
                    } else {
                        this.children[child] = val;
                        this.render();
                    }
                }
            }
        } else {
            throw new Error('"childs" has to be an Object with key value pairs');
        }
    }

    onInternalRendered() {
        if (this.props.customClass) {
            this.parent.addClass(this.props.customClass);
        }

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