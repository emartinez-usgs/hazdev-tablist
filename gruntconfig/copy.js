'use strict';

var config = require('./config');

var copy = {
  dist: {
    cwd: config.build + '/' + config.example,
    dest: config.dist,
    expand: true,
    src: [
      '*.html'
    ]
  },
  example: {
    cwd: config.example,
    dest: config.build + '/' + config.example,
    expand: true,
    src: [
      '*.html'
    ]
  },
  test: {
    cwd: config.test,
    dest: config.build + '/' + config.test,
    expand: true,
    src: '*.html'
  }
};

module.exports = copy;