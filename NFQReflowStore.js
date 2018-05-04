class NFQReflowStoreClass {
    constructor() {
        this.registeredComponents = {};
    }

    createStore(name) {
        if (localStorage.getItem(name) === null) {
            localStorage.setItem(name, '{}');
            sessionStorage.setItem(name, '{}');
        }
    }

    getStore(name) {
        let ret;

        if (localStorage.getItem(name) === null) {
            ret = null;

            throw new Error('Create store first before requirering it.');
        } else {
            ret = localStorage.getItem(name);
        }

        return ret;
    }

    registerForUpdates(componentFunction, storeName, storeValue) {
        if (!this.registeredComponents.hasOwnProperty(storeName)) {
            this.registeredComponents[storeName] = {};
        }

        if (!this.registeredComponents[storeName].hasOwnProperty(storeValue)) {
            this.registeredComponents[storeName][storeValue] = [];
        }

        this.registeredComponents[storeName][storeValue].push(componentFunction);
    }

    saveToStore(storeName, storeValue, param) {
        let index;
        let store = JSON.parse(localStorage.getItem(storeName));

        store[storeValue] = param;

        localStorage.setItem(storeName, JSON.stringify(store));

        for (index in this.registeredComponents[storeName][storeValue]) {
            this.registeredComponents[storeName][storeValue][index]();
        }
    }
}

const NFQReflowStore = new NFQReflowStoreClass();

export default NFQReflowStore;