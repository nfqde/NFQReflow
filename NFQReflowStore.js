import objectPath from 'object-path';
import merge from 'deepmerge';

class NFQReflowStoreClass {
    constructor() {
        this.registeredComponents = {};
        this.stores = {};
    }

    initStores(storeObject) {
        let store;

        for (store in storeObject) {
            if (!this.createStore(store, storeObject[store].perm)) {
                this.save(store, null, storeObject[store]);
            }
        }
    }

    createStore(name, perm) {
        let store;
        let exists = false;

        if (!this.stores.hasOwnProperty(name)) {
            this.stores[name] = {};
            this.stores[name].perm = perm;
        }

        if (perm) {
            store = localStorage;
        } else {
            store = sessionStorage;
        }

        if (store.getItem(name) !== null) {
            this.stores[name] = JSON.parse(store.getItem(name));
            exists = true;
        } else {
            store.setItem(name, '{}');
            exists = false;
        }

        return exists;
    }

    load(storeName, storePath) {
        if (typeof storePath === 'undefined') {
            return objectPath.get(this.stores, storeName);
        }

        return objectPath.get(this.stores[storeName], storePath);
    }

    registerForUpdates(component, callbackName, storeName, storePath) {
        if (!this.registeredComponents.hasOwnProperty(storeName)) {
            this.registeredComponents[storeName] = [];
        }

        if (this.registeredComponents[storeName].indexOf({comp: component, callback: callbackName, path: storePath}) === -1) {
            this.registeredComponents[storeName].push({comp: component, callback: callbackName, path: storePath});
        }
    }

    save(storeName, storePath, storeValue) {
        if ((typeof storeValue === 'object' && storeValue !== null) || typeof storeValue === 'function') {
            storeValue = merge({}, storeValue, {arrayMerge: (dest, source) => source});
        }

        if (storePath === null) {
            this.stores[storeName] = storeValue;
        } else {
            objectPath.set(this.stores[storeName], storePath, storeValue);
        }

        if (this.stores[storeName].perm) {
            localStorage.setItem(storeName, JSON.stringify(this.stores[storeName]));
        } else {
            sessionStorage.setItem(storeName, JSON.stringify(this.stores[storeName]));
        }
    }

    saveToStore(storeName, storePath, storeValue) {
        if ((typeof storeValue === 'object' && storeValue !== null) || typeof storeValue === 'function') {
            storeValue = merge({}, storeValue, {arrayMerge: (dest, source) => source});
        }

        if (storePath === null) {
            this.stores[storeName] = storeValue;
        } else {
            objectPath.set(this.stores[storeName], storePath, storeValue);
        }

        if (this.stores[storeName].perm) {
            localStorage.setItem(storeName, JSON.stringify(this.stores[storeName]));
        } else {
            sessionStorage.setItem(storeName, JSON.stringify(this.stores[storeName]));
        }

        for (let index in this.registeredComponents[storeName]) {
            if (
                this.registeredComponents[storeName][index].path === storePath
                || this.registeredComponents[storeName][index].path === 'all'
            ) {
                this.registeredComponents[storeName][index].comp[this.registeredComponents[storeName][index].callback]();
            }
        }
    }

    saveToStoreBulk(arr) {
        let batch = {};

        arr.forEach((item) => {
            if (typeof batch[item.storeName] === 'undefined') {
                batch[item.storeName] = [];
            }

            if ((typeof item.storeValue === 'object' && item.storeValue !== null) || typeof item.storeValue === 'function') {
                item.storeValue = merge({}, item.storeValue, {arrayMerge: (dest, source) => source});
            }

            if (item.storePath === null) {
                this.stores[item.storeName] = item.storeValue;
            } else {
                objectPath.set(this.stores[item.storeName], item.storePath, item.storeValue);
            }

            if (this.stores[item.storeName].perm) {
                localStorage.setItem(item.storeName, JSON.stringify(this.stores[item.storeName]));
            } else {
                sessionStorage.setItem(item.storeName, JSON.stringify(this.stores[item.storeName]));
            }
        });

        arr.forEach((item) => {
            for (let index in this.registeredComponents[item.storeName]) {
                if (
                    this.registeredComponents[item.storeName][index].path === item.storePath
                    || (
                        this.registeredComponents[item.storeName][index].path === 'all'
                        && !batch[item.storeName].find(x => x === this.registeredComponents[item.storeName][index].comp)
                    )
                ) {
                    if (this.registeredComponents[item.storeName][index].path === 'all') {
                        batch[item.storeName].push(this.registeredComponents[item.storeName][index].comp);
                    }

                    this.registeredComponents[item.storeName][index].comp[this.registeredComponents[item.storeName][index].callback]();
                }
            }
        });
    }

    clean(hash) {
        let store, index, indizes = [], i;

        for (store in this.registeredComponents) {
            for (index in this.registeredComponents[store]) {
                if (this.registeredComponents[store][index].comp.hash === hash) {
                    indizes.push(index);
                }
            }

            for (i = indizes.length - 1; i >= 0; i--) {
                this.registeredComponents[store].splice(indizes[i], 1);
            }
        }
    }
}

const NFQReflowStore = new NFQReflowStoreClass();

export default NFQReflowStore;