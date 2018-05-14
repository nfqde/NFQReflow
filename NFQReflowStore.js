import objectPath from 'object-path';

class NFQReflowStoreClass {
    constructor() {
        this.registeredComponents = {};
        this.stores = {};
    }

    createStore(name, tmp) {
        let store;

        if (!this.stores.hasOwnProperty(name)) {
            this.stores[name] = {};
            this.stores[name].tmp = tmp;
        }

        if (!tmp) {
            store = localStorage;
        } else {
            store = sessionStorage;
        }

        if (store.getItem(name) !== null) {
            this.stores[name] = JSON.parse(store.getItem(name));
        } else {
            store.setItem(name, '{}');
        }
    }

    load(storeName, storePath) {
        return objectPath.get(this.stores[storeName], storePath) || null;
    }

    registerForUpdates(component, callbackName, storeName, storePath) {
        if (!this.registeredComponents.hasOwnProperty(storeName)) {
            this.registeredComponents[storeName] = [];
        }

        if (this.registeredComponents[storeName].indexOf({comp: component, callback: callbackName, path: storePath}) === -1) {
            this.registeredComponents[storeName].push({comp: component, callback: callbackName, path: storePath});
        }
    }

    saveToStore(storeName, storePath, storeValue) {
        let index;

        objectPath.set(this.stores[storeName], storePath, storeValue);

        if (!this.stores[storeName].tmp) {
            localStorage.setItem(storeName, JSON.stringify(this.stores[storeName]));
        } else {
            sessionStorage.setItem(storeName, JSON.stringify(this.stores[storeName]));
        }

        for (index in this.registeredComponents[storeName]) {
            if (this.registeredComponents[storeName][index].path === storePath) {
                this.registeredComponents[storeName][index].comp[this.registeredComponents[storeName][index].callback]();
            }
        }
    }

    clean(hash) {
        let store, index, indizes = [], i;

        for (store in this.registeredComponents) {
            for (index in this.registeredComponents[store]) {
                if (this.registeredComponents[store][index].comp.hash === hash) {
                    indizes.push(index);
                }
            }
        }

        for (i = indizes.length - 1; i >= 0; i--) {
            this.registeredComponents[store].splice(indizes[i], 1);
        }
    }
}

const NFQReflowStore = new NFQReflowStoreClass();

export default NFQReflowStore;