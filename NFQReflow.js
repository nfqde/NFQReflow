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
        this.template = '';
        this.props = props || {};
        this.hash = null;
        this.parentHash = this.props.parentHash || null;
        this.children = {};

        this.addToTree();

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
        let renderedTemplate = new NFQReflowTemplateParser(this.props, this.children, this.template);

        this.hash = NFQReflowTree.addNode(this, renderedTemplate);
    }

    /**
    * Renders the component.
    */
    render() {
        let parent;

        if (this.parent === null) {
            parent = this.createParentNode();
            parent.append(NFQReflowTree.find(this.hash).rendered);

            $('body').prepend(parent);

            this.parent = parent;
        } else {
            $(this.parent).append(NFQReflowTree.find(this.hash).rendered);
        }

        this.onRendered();
        console.log('test');
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
        let param, child, regex;

        for ([param, child] of Object.entries(this.children)) {
            regex = new RegExp(`\\$\\{${this.escapeRegex(param)}\\}`);

            if (Array.isArray(child)) {

            } else {

            }
        }
    }

    /**
    * Builds component.
    */
    buildComponent() {

    }

    //    /**
    //    * Renders child arrays.
    //    */
    //    renderMultiChildren() {
    //            regex = new RegExp(`\\$\\{${children}\\}`);
    //            component = new this.props[children][0].component(this.props[children][0].props);
    //            this.props[children][0].component = component;
    //            parent = component.createParentNode();
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
    //
    //            for (i = 1; i < this.props[children].length; i++) {
    //                component = new this.props[children][i].component(this.props[children][i].props);
    //                this.props[children][i].component = component;
    //                newParent = component.createParentNode();
    //
    //                parent.after(newParent);
    //                component.setParent(newParent);
    //                component.render();
    //
    //                parent = newParent;
    //            }
    //        }
    //    }
    //
    //    /**
    //    * Rerenders Child arrays.
    //    */
    //    reflowMultiChildren() {
    //        let children, regex, i, component, parent, newParent;
    //
    //        for (children of this.nodes.multiChilds) {
    //            regex = new RegExp(`\\$\\{${children}\\}`);
    //            component = this.props[children][0].component;
    //            parent = component.parent;
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
    //            component.reflow();
    //
    //            for (i; i < this.props[children].length; i++) {
    //                component = this.props[children][i].component;
    //                newParent = component.parent;
    //
    //                parent.after(newParent);
    //                component.reflow();
    //
    //                parent = newParent;
    //            }
    //        }
    //    }
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