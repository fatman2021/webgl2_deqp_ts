/**
 * @param {Grunt} grunt
 */
module.exports = function(grunt) {
    "use strict";
    grunt.initConfig({
        ts: {
            options: {
                comments: true,
                target: 'es6',
                module: 'amd'
            },
            default: {
                src: ["framework/**/*.ts", "functional/**/*.ts"]
            }
        }
    });
    grunt.loadNpmTasks("grunt-ts");
    grunt.registerTask("default", ["ts"]);
};