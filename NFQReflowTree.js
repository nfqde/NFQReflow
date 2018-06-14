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
        this.callStack = [];
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
        if (node.hash === null) {
            node.hash = this.generateUUID();
            this.numberOfValues++;
        }

        this.nodeTree[node.hash] = {
            node: node,
            rendered: renderedTemplate,
            nodeTmp: this.circleSaveStringify(node)
        };

        this.updateParent(node);

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
            parent.nodeTmp = this.circleSaveStringify(parent.node);
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
        const nodeString = this.circleSaveStringify(node);
        const tmpNode = this.find(node.hash);

        return (tmpNode === null) ? true : !(nodeString === tmpNode.nodeTmp);
    }

    /**
     * Removes Item from Tree.
     *
     * @param {String} hash Hash of item.
     */
    removeNode(hash) {
        this.unsetEvents(this.nodeTree[hash]);
        delete this.nodeTree[hash];
        this.numberOfValues--;
    }

    /**
     * Unsets all Events for this Component
     *
     * @param {NFQReflowTreeComponent} node Node Branch.
     */
    unsetEvents(node) {
        let eventList = node.node.eventList, event;

        for (event in eventList) {
            node.node.off(event);
        }
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
     * @param {NFQReflowComponent} node       Component node.
     * @param {mixed}              usedChilds Childs used at the moment.
     */
    clean(node, usedChilds) {
        /* eslint-disable no-magic-numbers */
        let index;
        let children = this.findChildren(node.hash);
        let nodeChilds = this.getChilds(node, usedChilds);
        let diff = children.filter(
            function(i) {
                return nodeChilds.indexOf(i) < 0;
            }
        );
        /* eslint-enable no-magic-numbers */

        for (index in diff) {
            this.killChildren(diff[index]);
        }
    }

    /**
     * Recursively deletes all Children.
     *
     * @param {string} hash Node Hash.
     */
    killChildren(hash) {
        let children = this.findChildren(hash);
        let index;

        NFQReflowStore.clean(hash);
        this.removeNode(hash);

        for (index in children) {
            this.killChildren(children[index]);
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
     * @param {NFQReflowComponent} node       Component node.
     * @param {mixed}              usedChilds Childs used at the moment.
     *
     * @return {Array} Array of child hashes.
     */
    getChilds(node, usedChilds) {
        /* eslint-disable no-unused-vars */
        let param, child, ret = [];

        for ([param, child] of Object.entries(node.children)) {
            if (usedChilds.indexOf(param) !== -1) {
                ret.push(child.hash);
            }
        }

        return ret;
        /* eslint-enable no-unused-vars */
    }

    /**
     * Adds an node to the CallStack
     *
     * @param {String} hash Hash of the Component.
     */
    addToCallStack(hash) {
        this.callStack.push(hash);
    }

    /**
     * Gets CallStack position
     *
     * @param {String} hash Hash of the Component.
     */
    getCallStackPosition(hash) {
        let index = this.callStack.indexOf(hash);

        if (index > -1) {
            return index;
        }

        return null
    }

    /**
     * Removes an node from the CallStack
     *
     * @param {String} hash Hash of the Component.
     */
    removeFromCallStack(hash) {
        let index = this.callStack.indexOf(hash);

        if (index > -1) {
            this.callStack.splice(index, 1);
        }
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

    /**
     * JSON Stringify Circular save.
     *
     * @param {NFQReflowComponent} obj Component.
     *
     * @returns {String} JSON of given Object.
     */
    circleSaveStringify(obj) {
        const cache = new Map();

        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.get(value)) {
                    return;
                }

                cache.set(value, true);
            }

            return value;
        });
    }
}

const NFQReflowTree = new NFQReflowTreeClass();

export default NFQReflowTree;