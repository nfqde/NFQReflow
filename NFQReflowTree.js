import NFQReflowStore from './NFQReflowStore';

/**
 * Reflow Tree Singleton.
 */
class NFQReflowTreeClass {
    /**
     * Constructs the Reflow Tree.
     */
    constructor() {
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
        node.hash = (node.hash !== null) ? node.hash : this.generateUUID();

        this.nodeTree[node.hash] = {
            node: node,
            rendered: renderedTemplate,
            nodeTmp: JSON.stringify(node)
        };

        this.updateParent(node);

        this.numberOfValues++;

        return node.hash;
    }

    /**
     * Updates parent node with child hashes.
     *
     * @param {NFQReflowComponent} node Component node.
     */
    updateParent(node) {
        let parent;

        if (node.parentHash !== null) {
            parent = this.find(node.parentHash);
            parent.nodeTmp = JSON.stringify(parent.node);
        }
    }

    /**
     * Checks if it must render or not.
     *
     * @param {NFQReflowComponent} node Component node.
     *
     * @return {Boolean} Same or not.
     */
    checkNode(node) {
        const nodeString = JSON.stringify(node);
        const tmpNode = this.find(node.hash);

        return (tmpNode === null) ? true : !(nodeString === tmpNode.nodeTmp);
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

    /**
     * Cleans up hashmap tree.
     *
     * @param {NFQReflowComponent} node Component node.
     */
    clean(node) {
        /* eslint-disable no-magic-numbers */
        let index;
        let children = this.findChildren(node.hash);
        let nodeChilds = this.getChilds(node);
        let diff = children.filter(
            function(i) {
                return nodeChilds.indexOf(i) < 0;
            }
        );
        /* eslint-enable no-magic-numbers */

        for (index in diff) {
            NFQReflowStore.clean(node.hash);
            this.removeNode(diff[index]);
        }
    }

    /**
     * Finds childs of an hash indexed parent node.
     *
     * @param {String} parentHash Parent component hash.
     *
     * @return {Array} Array of child hashes.
     */
    findChildren(parentHash) {
        let hash, branch, ret = [];

        for ([hash, branch] of Object.entries(this.nodeTree)) {
            if (branch.node.parentHash === parentHash) {
                ret.push(hash);
            }
        }

        return ret;
    }

    /**
     * Gets all child hashes of the actual node.
     *
     * @param {NFQReflowComponent} node Component node.
     *
     * @return {Array} Array of child hashes.
     */
    getChilds(node) {
        /* eslint-disable no-unused-vars */
        let param, child, ret = [];

        for ([param, child] of Object.entries(node.children)) {
            ret.push(child.hash);
        }

        return ret;
        /* eslint-enable no-unused-vars */
    }

    /**
     * Generates an UUID for Hashing.
     *
     * @returns {Sting} An one in a million collision UUID.
     */
    generateUUID() {
        const Uint8ArrayKey = 1;
        const Uint8ArraySalt = 15;
        const StringBit = 16;
        const divider = 4;
        const replaceString = '10000000-1000-4000-8000-100000000000';

        /* eslint-disable max-len */
        return replaceString.replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(Uint8ArrayKey))[0] & Uint8ArraySalt >> c / divider).toString(StringBit)
        );
        /* eslint-enable max-len */
    }
}

const NFQReflowTree = new NFQReflowTreeClass();

export default NFQReflowTree;