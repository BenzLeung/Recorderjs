(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Recorder = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var WORKER_PATH = './recorderWorker.js';

var Recorder = function(source, cfg){
  var config = cfg || {};
  var bufferLen = config.bufferLen || 4096;
  this.context = source.context;
  this.node = (this.context.createScriptProcessor ||
               this.context.createJavaScriptNode).call(this.context,
                                                       bufferLen, 2, 2);
  var worker = new Worker((window.URL || window.webkitURL).createObjectURL(new Blob(['(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module \'"+i+"\'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){\nvar recLength = 0,\r\n  recBuffersL = [],\r\n  recBuffersR = [],\r\n  sampleRate;\r\n\r\n\r\nself.onmessage = function(e) {\r\n  switch(e.data.command){\r\n    case \'init\':\r\n      init(e.data.config);\r\n      break;\r\n    case \'record\':\r\n      record(e.data.buffer);\r\n      break;\r\n    case \'exportWAV\':\r\n      exportWAV(e.data.type);\r\n      break;\r\n    case \'getBuffer\':\r\n      getBuffer();\r\n      break;\r\n    case \'clear\':\r\n      clear();\r\n      break;\r\n  }\r\n};\r\n\r\nfunction init(config){\r\n  sampleRate = config.sampleRate;\r\n}\r\n\r\nfunction record(inputBuffer){\r\n  recBuffersL.push(inputBuffer[0]);\r\n  recBuffersR.push(inputBuffer[1]);\r\n  recLength += inputBuffer[0].length;\r\n}\r\n\r\nfunction exportWAV(type){\r\n  var bufferL = mergeBuffers(recBuffersL, recLength);\r\n  var bufferR = mergeBuffers(recBuffersR, recLength);\r\n  var interleaved = interleave(bufferL, bufferR);\r\n  var dataview = encodeWAV(interleaved);\r\n  var audioBlob = new Blob([dataview], { type: type });\r\n\r\n  self.postMessage(audioBlob);\r\n}\r\n\r\nfunction getBuffer() {\r\n  var buffers = [];\r\n  buffers.push( mergeBuffers(recBuffersL, recLength) );\r\n  buffers.push( mergeBuffers(recBuffersR, recLength) );\r\n  self.postMessage(buffers);\r\n}\r\n\r\nfunction clear(){\r\n  recLength = 0;\r\n  recBuffersL = [];\r\n  recBuffersR = [];\r\n}\r\n\r\nfunction mergeBuffers(recBuffers, recLength){\r\n  var result = new Float32Array(recLength);\r\n  var offset = 0;\r\n  for (var i = 0; i < recBuffers.length; i++){\r\n    result.set(recBuffers[i], offset);\r\n    offset += recBuffers[i].length;\r\n  }\r\n  return result;\r\n}\r\n\r\nfunction interleave(inputL, inputR){\r\n  var length = inputL.length + inputR.length;\r\n  var result = new Float32Array(length);\r\n\r\n  var index = 0,\r\n    inputIndex = 0;\r\n\r\n  while (index < length){\r\n    result[index++] = inputL[inputIndex];\r\n    result[index++] = inputR[inputIndex];\r\n    inputIndex++;\r\n  }\r\n  return result;\r\n}\r\n\r\nfunction floatTo16BitPCM(output, offset, input){\r\n  for (var i = 0; i < input.length; i++, offset+=2){\r\n    var s = Math.max(-1, Math.min(1, input[i]));\r\n    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);\r\n  }\r\n}\r\n\r\nfunction writeString(view, offset, string){\r\n  for (var i = 0; i < string.length; i++){\r\n    view.setUint8(offset + i, string.charCodeAt(i));\r\n  }\r\n}\r\n\r\nfunction encodeWAV(samples){\r\n  var buffer = new ArrayBuffer(44 + samples.length * 2);\r\n  var view = new DataView(buffer);\r\n\r\n  /* RIFF identifier */\r\n  writeString(view, 0, \'RIFF\');\r\n  /* RIFF chunk length */\r\n  view.setUint32(4, 36 + samples.length * 2, true);\r\n  /* RIFF type */\r\n  writeString(view, 8, \'WAVE\');\r\n  /* format chunk identifier */\r\n  writeString(view, 12, \'fmt \');\r\n  /* format chunk length */\r\n  view.setUint32(16, 16, true);\r\n  /* sample format (raw) */\r\n  view.setUint16(20, 1, true);\r\n  /* channel count */\r\n  view.setUint16(22, 2, true);\r\n  /* sample rate */\r\n  view.setUint32(24, sampleRate, true);\r\n  /* byte rate (sample rate * block align) */\r\n  view.setUint32(28, sampleRate * 4, true);\r\n  /* block align (channel count * bytes per sample) */\r\n  view.setUint16(32, 4, true);\r\n  /* bits per sample */\r\n  view.setUint16(34, 16, true);\r\n  /* data chunk identifier */\r\n  writeString(view, 36, \'data\');\r\n  /* data chunk length */\r\n  view.setUint32(40, samples.length * 2, true);\r\n\r\n  floatTo16BitPCM(view, 44, samples);\r\n\r\n  return view;\r\n}\r\n\n},{}]},{},[1]);\n'],{type:"text/javascript"})));
  worker.onmessage = function(e){
    var blob = e.data;
    currCallback(blob);
  }

  worker.postMessage({
    command: 'init',
    config: {
      sampleRate: this.context.sampleRate
    }
  });
  var recording = false,
    currCallback;

  this.node.onaudioprocess = function(e){
    if (!recording) return;
    worker.postMessage({
      command: 'record',
      buffer: [
        e.inputBuffer.getChannelData(0),
        e.inputBuffer.getChannelData(1)
      ]
    });
  }

  this.configure = function(cfg){
    for (var prop in cfg){
      if (cfg.hasOwnProperty(prop)){
        config[prop] = cfg[prop];
      }
    }
  }

  this.record = function(){
    recording = true;
  }

  this.stop = function(){
    recording = false;
  }

  this.clear = function(){
    worker.postMessage({ command: 'clear' });
  }

  this.getBuffer = function(cb) {
    currCallback = cb || config.callback;
    worker.postMessage({ command: 'getBuffer' })
  }

  this.exportWAV = function(cb, type){
    currCallback = cb || config.callback;
    type = type || config.type || 'audio/wav';
    if (!currCallback) throw new Error('Callback not set');
    worker.postMessage({
      command: 'exportWAV',
      type: type
    });
  }

  source.connect(this.node);
  this.node.connect(this.context.destination);    //this should not be necessary
};

Recorder.forceDownload = function(blob, filename){
  var url = (window.URL || window.webkitURL).createObjectURL(blob);
  var link = window.document.createElement('a');
  link.href = url;
  link.download = filename || 'output.wav';
  var click = document.createEvent("Event");
  click.initEvent("click", true, true);
  link.dispatchEvent(click);
}

module.exports = Recorder;

},{}]},{},[1])(1)
});
