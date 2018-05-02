import $ from 'jquery';
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
        this.parent = null;
        this.template;
        this.props = props || {};
        this.hash = null;
        this.parentHash = this.props.parentHash || null;
        this.children = {};

        this.nodes = {
            childs: [],
            multiChilds: [],
            functions: [],
            params: [],
            empty: []
        };
    }

    /**
    * Adds itself to the tree.
    */
    addToTree() {
        let renderedTemplate = new NFQReflowTemplateParser(this.props, this.children, this.template).parse();

        this.hash = NFQReflowTree.addNode(this, renderedTemplate);
    }

    /**
    * Renders the component.
    */
    render() {
        let parent;

        this.addToTree();

        if (this.parent === null) {
            parent = this.createParentNode();
            parent.append(NFQReflowTree.find(this.hash).rendered);

            $('body').prepend(parent);

            this.parent = parent;
        } else {
            $(this.parent).append(NFQReflowTree.find(this.hash).rendered);
        }

        this.onRendered();
        this.renderChildren();
    }

    /**
    * Creates the parent node.
    *
    * @return {jQuery} Parent node.
    */
    createParentNode() {
        return $(`<div class="${this.constructor.name}"></div>`);
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
        let param, child, component, parentNode, regex, replaceWith;

        for ([param, child] of Object.entries(this.children)) {
            regex = new RegExp(`\\$\\{${this.escapeRegex(param)}\\}`);

            child = this.addSpecialProps(child);

            component = new child.component(child.props);
            parentNode = component.createParentNode();

            this.parent.find(':not(iframe)').addBack().contents().filter(function() {
                return this.nodeType === 3;
            }).each(function() {
                if (regex.test($(this)[0].textContent)) {
                    replaceWith = $(this)[0].textContent.replace(regex, `<span id="${param}"></span>`);
                    $(this).replaceWith(replaceWith);
                    $(`#${param}`).replaceWith(parentNode);

                    return false;
                }
            });

            component.setParent(parentNode);
            component.render();
        }
    }

    /**
    * Adds special parent Hash property.
    *
    * @param {Object} child Property Object.
    *
    * @return {Object} Returns the object with new properties.
    */
    addSpecialProps(child) {
        const component = child;

        if (typeof component.props === 'undefined') {
            component.props = {};
        }

        component.props.parentHash = this.hash;

        return component;
    }

    //
    //    /**
    //    * Renders Child Components.
    //    */
    //    renderChildren() {
    //        let child, component, parent, regex;
    //
    //        for (child of this.nodes.childs) {
    //            component = new this.props[child].component(this.props[child].props);
    //            this.props[child].component = component;
    //            parent = component.createParentNode();
    //            regex = new RegExp(`\\$\\{${child}\\}`);
    //
    //            this.parent.find(':not(iframe)').addBack().contents().filter(function() {
    //                return this.nodeType === 3;
    //            }).each(function() {
    //                if (regex.test($(this)[0].textContent)) {
    //                    $(this).replaceWith(parent);
    //
    //                    return false;
    //                }
    //            });
    //
    //            component.setParent(parent);
    //            component.render();
    //        }
    //
    //        this.onChildsRendered();
    //        this.onRegisterEvents();
    //    }
    //
    //    /**
    //    * Rerenders child Components.
    //    */
    //    reflowChildren() {
    //        let child, component, regex;
    //
    //        for (child of this.nodes.childs) {
    //            component = this.props[child].component;
    //            regex = new RegExp(`\\$\\{${child}\\}`);
    //
    //            this.parent.find(':not(iframe)').addBack().contents().filter(function() {
    //                return this.nodeType === 3;
    //            }).each(function() {
    //                if (regex.test($(this)[0].textContent)) {
    //                    $(this).replaceWith(component.parent);
    //
    //                    return false;
    //                }
    //            });
    //
    //            component.reflow();
    //        }
    //
    //        this.onChildsRendered();
    //        this.onRegisterEvents();
    //    }

    /**
    * Escapes an regex.
    *
    * @param {string} s String to escape.
    *
    * @return {string} Escaped regex.
    */
    escapeRegex(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    /**
    * Triggers an reflow.
    */
    reflow() {
        $(this.parent).empty();

        this.parseTemplate();
        $(this.parent).append(this.template);

        this.reflowMultiChildren();
        this.reflowChildren();

        this.onReflow();
    }

    onRendered() {
        /* For convenience. */
    }

    onRegisterEvents() {
        /* For convenience. */
    }

    onChildsRendered() {
        /* For convenience. */
    }

    onReflow() {
        /* For convenience. */
    }
}

export default NFQReflowComponent;