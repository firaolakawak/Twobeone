// Compatibility entry point for older TwoBeOne installations.
// Keep a single service-worker implementation so both historical registration
// URLs receive the same network-first HTML and JavaScript update behavior.
importScripts('/service-worker.js');
