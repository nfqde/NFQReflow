import $ from 'jquery';
import MD5 from './md5.js';

class NFQReflowComponent {
    constructor(parent) {
        this.parent = parent || 'body';
        this.template = '';
        this.children = {};
        this.params = {};

        this.nodes = {
            childs: [],
            params: []
        };

        this.firstRender = true;
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

        this.template = $(this.template);
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
                && !this.children[childMatches[1]].prototype instanceof NFQReflowComponent)
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
        let md5 = new MD5();
        let timeString = new Date().getUTCDate();

        for (child of this.nodes.childs) {
            component = new this.children[child]();
            md5String = md5.transpile(timeString + child);
            parent = component.createParentNode();
            regex = new RegExp(`\\$\\{children\\.${child}\\}`);

            this.parent.html(this.parent.html().replace(regex, `<div id="${md5String}"></div>`));
            this.parent.filter(`#${md5String}`).add(this.parent.find(`#${md5String}`)).replaceWith(parent);

            component.setParent($(parent));
            component.render();
        }
    }

    escapeRegex(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };
}

export default NFQReflowComponent;