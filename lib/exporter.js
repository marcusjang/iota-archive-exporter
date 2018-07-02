class Exporter {
  constructor() {
    this.isInitialized = false;
  }
  
  init() {
    this.isInitialized = true;
  }
  
  export(tx, trytes, index, isIncluded) {
    if (typeof tx !== 'string' || !/[A-Z9]{81}/.test(tx)) {
      throw new Error('Invalid transaction provided');
    }
    
    if (typeof trytes !== 'string' || !/[A-Z9]{2673}/.test(trytes)) {
      throw new Error('Invalid trytes provided');
    }
    
    if (typeof index === 'boolean') {
      console.log(tx);
    } else {
      console.log(index, tx);
    }    
  }
}

module.exports = Exporter;
