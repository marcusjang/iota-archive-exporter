class Exporter {
  constructor() {
    console.log('Initializing IOTA Archive Exporter...');
    this.isInitialized = false;
  }
  
  init() {
    console.log('IOTA Archive Exporter successfully initialized');
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
      console.log('Exporting: ', tx);
    } else {
      console.log('Exporting: ', index, tx);
    }    
  }
  
  close() {
    console.log('IOTA Archive Exporter successfully closed');
    this.isInitialized = false;
  }
}

module.exports = Exporter;
