import $ from 'jquery';
import MD5 from './md5.js';

class NFQReflowComponent {
    constructor(props) {
        this.parent = 'body';
        this.template = '';
        this.children = {};
        this.props = props || {};
        this.self = this;

        this.nodes = {
            childs: [],
            functions: [],
            params: [],
            empty: []
        };
    }

    render() {
        let parentNode;

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

    loadNodes(template) {
        let paramsRegex = /\$\{(.*?)\}/g;
        let paramsMatches;

        while (paramsMatches = paramsRegex.exec(this.template)) {
            if (this.self.props.hasOwnProperty(paramsMatches[1])) {
                if (typeof this.self.props[paramsMatches[1]] === 'object') {
                    if (
                        this.self.props[paramsMatches[1]].hasOwnProperty('component')
                        && this.self.props[paramsMatches[1]].component.prototype instanceof NFQReflowComponent
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

    renderChildren() {
        let child, component, parent, regex, md5String;

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
                }
            });

            component.setParent(parent);
            component.render();
        }

        this.self.onChildsRendered();
        this.self.onRegisterEvents();
    }

    reflowChildren() {
        let child, component, parent, regex, md5String;

        for (child of this.nodes.childs) {
            component = this.self.props[child].component;
            regex = new RegExp(`\\$\\{${child}\\}`);

            this.parent.find(':not(iframe)').addBack().contents().filter(function() {
                return this.nodeType === 3;
            }).each(function() {
                if (regex.test($(this)[0].textContent)) {
                    $(this).replaceWith(parent);
                }
            });

            component.reflow();
        }

        this.self.onChildsRendered();
        this.self.onRegisterEvents();
    }

    escapeRegex(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    reflow() {
        $(this.parent).empty();

        this.parseTemplate();
        $(this.parent).append(this.template);

        this.reflowChildren();

        this.self.onReflow();
    }

    onRendered() {

    };

    onChildsRendered() {

    };

    onRegisterEvents() {

    };
}

export default NFQReflowComponent;