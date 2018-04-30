import MD5 from './md5.js';

/**
 * Reflow Tree Singleton.
 */
class NFQReflowTreeClass {
    /**
     * Constructs the Reflow Tree.
     */
    constructor() {
        this.md5 = new MD5();
        this.nodeTree = {};
        this.numberOfValues = 0;
    }

    /**
     * Adds an Node with Hash to the Table.
     *
     * @param {NFQReflowComponent} node             Component node.
     * @param {String}             renderedTemplate Components rendered html.
     *
     * @returns {String} MD5 Hash for this Component.
     */
    addNode(node, renderedTemplate) {
        const hash = this.md5.transpile(node.constructor.name + JSON.stringify(node.props) + Date.now());

        this.nodeTree[hash] = {
            node: node,
            rendered: renderedTemplate
        };

        this.numberOfValues++;

        return hash;
    }

    /**
     * Removes Item from Tree.
     *
     * @param {String} hash Hash of item.
     */
    removeNode(hash) {
        delete this.nodeTree[hash];
        this.numberOfValues--;
    }

    /**
     * Finds a component with hash.
     *
     * @param {String} hash Hash of item.
     *
     * @returns {Object|NFQReflowComponent} Returns null or found item.
     */
    find(hash) {
        let ret;

        if (this.nodeTree.hasOwnProperty(hash)) {
            ret = this.nodeTree[hash];
        } else {
            ret = null;
        }

        return ret;
    }

    /**
     * Shows length of Tree.
     *
     * @returns {Number} Returns number of items.
     */
    length() {
        return this.numberOfValues;
    }
}

const NFQReflowTree = new NFQReflowTreeClass();

export default NFQReflowTree;