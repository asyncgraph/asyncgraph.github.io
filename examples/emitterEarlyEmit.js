const EventEmitter = require('events');

const myEmitter = new EventEmitter();

myEmitter.emit('event');

myEmitter.on('event', () => {
    //
});
