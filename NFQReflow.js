import $ from 'jquery';
import MD5 from './md5.js';

class NFQReflowComponent {
    constructor(params) {
        this.parent = 'body';
        this.template = '';
        this.children = {};
        this.params = params || {};
        this.self = this;

        this.nodes = {
            childs: [],
            params: []
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
        this.parseParams();
    }

    loadNodes() {
        let childRegex = /\$\{children.(.*?)\}/g;
        let paramRegex = /\$\{params.(.*?)\}/g;
        let childMatches;
        let paramMatches;

        while (childMatches = childRegex.exec(this.template)) {
            this.nodes.childs.push(childMatches[1]);

            if (!this.children.hasOwnProperty(childMatches[1])
                || (this.children.hasOwnProperty(childMatches[1])
                && !this.children[childMatches[1]].component.prototype instanceof NFQReflowComponent)
            ) {
                throw 'Error all Children have to be defined and must extend from NFQComponent';
            }
        }

        while (paramMatches = paramRegex.exec(this.template)) {
            this.nodes.params.push(paramMatches[1]);
        }
    }

    parseParams() {
        let param, regex;

        for (param of this.nodes.params) {
            regex = new RegExp(`\\$\\{params\\.${param}\\}`, 'g');

            this.template = this.template.replace(regex, this.params[param]);
        }
    }

    renderChildren() {
        let child, component, parent, regex, md5String;

        for (child of this.nodes.childs) {
            component = new this.children[child].component(this.children[child].props);
            this.children[child].component = component;
            parent = component.createParentNode();
            regex = new RegExp(`\\$\\{children\\.${child}\\}`);

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
            component = this.children[child].component;
            regex = new RegExp(`\\$\\{children\\.${child}\\}`);

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

        this.loadNodes();
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