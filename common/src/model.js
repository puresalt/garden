class Manager {
  constructor(initialData) {
    this._initial = null;
    this._data = null;
  },
  
  init(data) {
    this._initial = {};
    return this;
  },
  
  setInitialData(data) {
    this._initial = data;
    return this;
  },
  
  set(key, data) {
    
  },
  
  get(key) {
    
  }
}

export default Manager;
