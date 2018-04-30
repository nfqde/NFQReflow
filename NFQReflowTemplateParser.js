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
     *
     * @returns {String} Parsed template.
     */
    constructor(props, children, template) {
        this.props = props;
        this.children = children;
        this.template = template;

        return this.parse();
    }

    /**
     * Parses an Component Template.
     */
    parse() {
        let regex = /\$\{(.*?)\}/g;
        let matches, match;

        while ((matches = regex.exec(this.template)) !== null) {
            match = matches[1];

            if (this.props.hasOwnProperty(match) || this.children.hasOwnProperty(match)) {
                if (typeof this.props[match] === 'function') {
                    this.nodes.functions.push(match);
                } else {
                    this.parseParams(match);
                }
            } else {
                this.parseEmpty(match);
            }
        }
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
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
}