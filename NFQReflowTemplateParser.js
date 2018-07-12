import $ from 'jquery';

/**
 * Reflow Template Parser.
 */
export default class NFQReflowTemplateParser {
    /**
     * Reflow Template Parser Constructor.
     *
     * @param {Object} props    All properties.
     * @param {Object} children All child definitions.
     * @param {String} template Template string to parse.
     */
    constructor(props, children, template) {
        this.props = props;
        this.children = children;
        this.template = template;
        this.foundChildren = [];
    }

    /**
     * Parses an Component Template.
     *
     * @return {String} Rendered Template.
     */
    parse() {
        this.functionStep();
        this.paramsStep();
        this.childStep();
        this.cleanEmpty();

        return this.template;
    }

    functionStep() {
        let regex = /\$\{(.*?)\}/g;
        let matches, match, functionNodes = [];

        while ((matches = regex.exec(this.template)) !== null) {
            match = matches[1];

            if (this.props.hasOwnProperty(match)) {
                if (typeof this.props[match] === 'function') {
                    functionNodes.push(match);
                }
            }
        }

        for (const functions of functionNodes) {
            this.parseFunctions(functions);
        }
    }

    paramsStep() {
        let regex = /\$\{(.*?)\}/g;
        let matches, match, params = [];

        while ((matches = regex.exec(this.template)) !== null) {
            match = matches[1];

            if (this.props.hasOwnProperty(match)) {
                if (typeof this.props[match] !== 'function') {
                    params.push(match);
                }
            }
        }

        for (const param of params) {
            this.parseParams(param);
        }
    }

    childStep() {
        let regex = /\$\{(.*?)\}/g;
        let matches, match;

        while ((matches = regex.exec(this.template)) !== null) {
            match = matches[1];

            if (this.children.hasOwnProperty(match)) {
                this.foundChildren.push(match);
            }
        }

        for (const child of this.foundChildren) {
            this.parseChildren(child);
        }
    }

    cleanEmpty() {
        let regex = /\$\{(.*?)\}/g;
        let matches, match, emptys = [];

        while ((matches = regex.exec(this.template)) !== null) {
            match = matches[1];

            emptys.push(match)
        }

        for (const empty of emptys) {
            this.parseEmpty(empty);
        }
    }

    /**
     * Parses an Component Template for Childs.
     *
     * @return {mixed} Rendered Template childs.
     */
    getUsedChilds() {
        return this.foundChildren;
    }

    /**
     * Parses child text Nodes to Template tags.
     *
     * @param {String} child Child param.
     */
    parseChildren(child) {
        const regex = new RegExp(`\\$\\{${this.escapeRegex(child)}\\}`);

        this.template = this.template.replace(regex, `<template id="${child}"></template>`);

        /*$(this.template).find(':not(iframe)').addBack().contents().filter(this.findTextNode).each(
            this.replaceComponent.bind($(this), regex, child)
        );*/
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
    replaceComponent(regex, param, index, value) {
        let replaceWith;
        let ret = true;

        if (regex.test(value.textContent)) {
            replaceWith = value.textContent.replace(regex, `<template id="${param}"></template>`);
            $(value).replaceWith(replaceWith);

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
     * Parses empty Nodes.
     *
     * @param {String} param Param match.
     */
    parseEmpty(param) {
        const regex = new RegExp(`\\$\\{${this.escapeRegex(param)}\\}`, 'g');

        this.template = this.template.replace(regex, '');
    }

    /**
     * Parses params.
     *
     * @param {String} param Param match.
     */
    parseParams(param) {
        const regex = new RegExp(`\\$\\{${this.escapeRegex(param)}\\}`, 'g');

        this.template = this.template.replace(regex, this.props[param]);
    }

    /**
     * Parses Template functions.
     *
     * @param {String} param Param match.
     */
    parseFunctions(param) {
        let ret = this.props[param]();
        const regex = new RegExp(`\\$\\{${this.escapeRegex(param)}\\}`, 'g');

        if (typeof ret === 'undefined') {
            ret = '';
        }

        this.template = this.template.replace(regex, ret);
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
}