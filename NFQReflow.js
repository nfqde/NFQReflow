import $ from 'jquery';
import MD5 from './md5.js';

class NFQReflowComponent {
    constructor(props) {
        this.parent = 'body';
        this.template = '';
        this.children = {};
        this.defprops = props || {};
        this.self = this;
        this.props = {};

        this.nodes = {
            childs: [],
            multiChilds: [],
            functions: [],
            params: [],
            empty: []
        };
    }

    render() {
        let parentNode;
        this.props = Object.assign({}, this.defprops, this.props);

        this.parseTemplate();

        if (this.parent === 'body') {
            parentNode = this.createParentNode();
            parentNode.append(this.template);

            $(this.parent).prepend(parentNode);

            this.parent = parentNode;
        } else {
            $(this.parent).append(this.template);
        }

        this.self.onRendered();
        this.renderMultiChildren();
        this.renderChildren();
    }

    createParentNode() {
        return $('<div class="' + this.constructor.name + '"></div>');
    }

    setParent(parent) {
        this.parent = parent;
    }

    parseTemplate() {
        this.loadNodes();
        this.parseFunctions();
        this.parseEmpty();
        this.parseParams();
    }

    loadNodes() {
        let paramsRegex = /\$\{(.*?)\}/g;
        let paramsMatches;

        this.resetNodes();

        while (paramsMatches = paramsRegex.exec(this.template)) {
            if (this.self.props.hasOwnProperty(paramsMatches[1])) {
                if (Array.isArray(this.self.props[paramsMatches[1]])) {
                    this.nodes.multiChilds.push(paramsMatches[1]);
                } else if (typeof this.self.props[paramsMatches[1]] === 'object') {
                    if (
                        this.self.props[paramsMatches[1]].hasOwnProperty('component')
                        && (this.self.props[paramsMatches[1]].component.prototype instanceof NFQReflowComponent
                        || this.self.props[paramsMatches[1]].component.__proto__ instanceof NFQReflowComponent)
                    ) {
                        this.nodes.childs.push(paramsMatches[1]);
                    } else {
                        throw 'Error all Children have to be defined and must extend from NFQComponent';
                    }
                } else if (typeof this.self.props[paramsMatches[1]] === 'function') {
                    this.nodes.functions.push(paramsMatches[1]);
                } else {
                    this.nodes.params.push(paramsMatches[1]);
                }
            } else {
                this.nodes.empty.push(paramsMatches[1]);
            }
        }
    }

    resetNodes() {
        this.nodes = {
            childs: [],
            multiChilds: [],
            functions: [],
            params: [],
            empty: []
        };
    }

    parseFunctions() {
        let func, regex, ret;

        for (func of this.nodes.functions) {
            ret = this.self.props[func]();
            regex = new RegExp(`\\$\\{${func}\\}`, 'g');

            if (typeof ret === 'undefined') {
                ret = '';
            }

            this.template = this.template.replace(regex, ret);
        }
    }

    parseParams() {
        let param, regex;

        for (param of this.nodes.params) {
            regex = new RegExp(`\\$\\{${param}\\}`, 'g');

            this.template = this.template.replace(regex, this.self.props[param]);
        }
    }

    parseEmpty() {
        let param, regex;

        for (param of this.nodes.empty) {
            regex = new RegExp(`\\$\\{${param}\\}`, 'g');

            this.template = this.template.replace(regex, '');
        }
    }

    renderMultiChildren() {
        let children, regex, i, component, parent, newParent;

        for (children of this.nodes.multiChilds) {
            regex = new RegExp(`\\$\\{${children}\\}`);
            component = new this.self.props[children][0].component(this.self.props[children][0].props);
            this.self.props[children][0].component = component;
            parent = component.createParentNode();

            this.parent.find(':not(iframe)').addBack().contents().filter(function() {
                return this.nodeType === 3;
            }).each(function() {
                if (regex.test($(this)[0].textContent)) {
                    $(this).replaceWith(parent);
                    return false;
                }
            });

            component.setParent(parent);
            component.render();

            for (i = 1; i < this.self.props[children].length; i++) {
                component = new this.self.props[children][i].component(this.self.props[children][i].props);
                this.self.props[children][i].component = component;
                newParent = component.createParentNode();

                parent.after(newParent);
                component.setParent(newParent);
                component.render();

                parent = newParent;
            }
        }
    }

    reflowMultiChildren() {
        let children, regex, i, component, parent, newParent;

        for (children of this.nodes.multiChilds) {
            regex = new RegExp(`\\$\\{${children}\\}`);
            component = this.self.props[children][0].component;
            parent = component.parent;

            this.parent.find(':not(iframe)').addBack().contents().filter(function() {
                return this.nodeType === 3;
            }).each(function() {
                if (regex.test($(this)[0].textContent)) {
                    $(this).replaceWith(parent);
                    return false;
                }
            });

            component.reflow();

            for (i = 1; i < this.self.props[children].length; i++) {
                component = this.self.props[children][i].component;
                newParent = component.parent;

                parent.after(newParent);
                component.reflow();

                parent = newParent;
            }
        }
    }

    renderChildren() {
        let child, component, parent, regex;

        for (child of this.nodes.childs) {
            component = new this.self.props[child].component(this.self.props[child].props);
            this.self.props[child].component = component;
            parent = component.createParentNode();
            regex = new RegExp(`\\$\\{${child}\\}`);

            this.parent.find(':not(iframe)').addBack().contents().filter(function() {
                return this.nodeType === 3;
            }).each(function() {
                if (regex.test($(this)[0].textContent)) {
                    $(this).replaceWith(parent);
                    return false;
                }
            });

            component.setParent(parent);
            component.render();
        }

        this.self.onChildsRendered();
        this.self.onRegisterEvents();
    }

    reflowChildren() {
        let child, component, regex;

        for (child of this.nodes.childs) {
            component = this.self.props[child].component;
            regex = new RegExp(`\\$\\{${child}\\}`);

            this.parent.find(':not(iframe)').addBack().contents().filter(function() {
                return this.nodeType === 3;
            }).each(function() {
                if (regex.test($(this)[0].textContent)) {
                    $(this).replaceWith(component.parent);
                    return false;
                }
            });

            component.reflow();
        }

        this.self.onChildsRendered();
        this.self.onRegisterEvents();
    }

    escapeRegex(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    reflow() {
        $(this.parent).empty();

        this.parseTemplate();
        $(this.parent).append(this.template);

        this.reflowMultiChildren();
        this.reflowChildren();

        this.self.onReflow();
    }

    onRendered() {}
    onChildsRendered() {}
    onRegisterEvents() {}
    onReflow() {}
}

export default NFQReflowComponent;