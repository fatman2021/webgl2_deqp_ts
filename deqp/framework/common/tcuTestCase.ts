/// <reference path="../../typings/reference.d.ts" />
/*-------------------------------------------------------------------------
 * drawElements Quality Program OpenGL ES Utilities
 * ------------------------------------------------
 *
 * Copyright 2014 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/**
 * This class allows one to create a hierarchy of tests and iterate over them.
 * It replaces TestCase and TestCaseGroup classes.
 */
'use strict';

/**
 * A simple state machine.
 * The purpose of this this object is to break
 * long tests into small chunks that won't cause a timeout
 */

interface State {
    filter?;
    currentTest;
    testCases
}

var stateMachine = (function () {
    'use strict';

    /**
     * Indicates the state of an iteration operation.
     */
    var IterateResult = {
        STOP: 0,
        CONTINUE: 1
    };

    /**
     * A general purpose bucket for string current execution state
     * stateMachine doesn't modify this container.
     */
    var state = {currentTest: null, testCases: null};

    /**
     * Returns the state
     */
    var getState = function ():State {
        return state;
    };

    /**
     * Schedule the callback to be run ASAP
     * @param {function()} callback Callback to schedule
     */
    var runCallback = function (callback) {
        setTimeout(callback.bind(this), 0);
    };

    /**
     * Call this function at the end of the test
     */
    var terminate = function () {
        finishTest();
    };

    return {
        runCallback: runCallback,
        getState: getState,
        terminate: terminate,
        IterateResult: IterateResult,
        none: false
    };
}());

export var runner = stateMachine;

export class DeqpTest {

    name:string;
    description:string;
    spec:DeqpTest[];
    currentTest:number;
    parentTest:DeqpTest;

    /** @type {stateMachine.IterateResult} static property */
    static lastResult = stateMachine.IterateResult.STOP;

    /**
     * Assigns name, description and specification to test
     * @param {string} name
     * @param {string} description
     * @param {string} spec
     */
    constructor(name:string, description:string, spec?:DeqpTest[]) {
        this.name = name;
        this.description = description;
        this.spec = spec;
        this.currentTest = 0;
        this.parentTest = null;
    }

    addChild(test:DeqpTest) {
        test.parentTest = this;

        if (!this.spec) {
            this.spec = [];
        }

        if (this.spec.length === undefined) {
            testFailedOptions('The spec object contains something besides an array', true);
        }

        this.spec.push(test);
    }

    /**
     * Returns the next 'leaf' test in the hierarchy of tests
     *
     * @param {string} pattern Optional pattern to search for
     * @return {Object} Test specification
     */
    next(pattern?:string):DeqpTest {
        if (pattern)
            return this.find(pattern);

        var test:DeqpTest = null;
        if (this.spec && this.spec.length) {
            while (!test) {
                if (this.currentTest < this.spec.length) {
                    test = this.spec[this.currentTest].next();
                    if (!test)
                        this.currentTest += 1;
                }
                else {
                    break;
                }
            }
        }
        else if (this.currentTest === 0) {
            this.currentTest += 1;
            test = this;
        }
        return test;
    }

    /**
     * Returns the full name of the test
     *
     * @return {string} Full test name.
     */
    fullName():string {
        if (this.parentTest)
            var parentName = this.parentTest.fullName();
        if (parentName)
            return parentName + '.' + this.name;
        return this.name;
    }

    /**
     * Find a test with a matching name
     * Fast-forwards to a test whose full name matches the given pattern
     *
     * @param {string} pattern Regular expression to search for
     * @return {Object} Found test or null.
     */
    find(pattern:string):DeqpTest {
        var test = null;
        while (true) {
            test = this.next();
            if (!test)
                break;
            if (test.fullName().match(pattern))
                break;
        }
        return test;
    }

    /**
     * Reset the iterator.
     */
    reset():void {
        this.currentTest = 0;

        if (this.spec && this.spec.length)
            for (var i = 0; i < this.spec.length; i++)
                this.spec[i].reset();
    }
}

/**
 * Defines a new test
 *
 * @param {string} name Short test name
 * @param {string} description Description of the test
 * @param {(Array.<DeqpTest>|Object)} spec Test specification or an array of DeqpTests
 *
 * @return {DeqpTest} The new test
 */
export function newTest(name:string, description:string, spec?:DeqpTest[]):DeqpTest {
    var test = new DeqpTest(name, description, spec);

    if (spec && spec.length) {
        for (var i = 0; i < spec.length; i++)
            spec[i].parentTest = test;
    }

    return test;
}

/**
 * Reads the filter parameter from the URL to filter tests.
 */
function getFilter():string {
    var queryVars = window.location.search.substring(1).split('&');

    for (var i = 0; i < queryVars.length; i++) {
        var value = queryVars[i].split('=');
        if (decodeURIComponent(value[0]) === 'filter')
            return decodeURIComponent(value[1]);
    }
    return null;
}

/**
 * Run through the test cases giving time to system operation.
 */
export function runTestCases() {
    var state = stateMachine.getState();
    if (state.filter === undefined)
        state.filter = getFilter();

    //Should we proceed with the next test?
    if (DeqpTest.lastResult == stateMachine.IterateResult.STOP)
        state.currentTest = state.testCases.next(state.filter);

    if (state.currentTest) {
        try {
            //If proceeding with the next test, prepare it.
            if (DeqpTest.lastResult == stateMachine.IterateResult.STOP) {
                //Update current test name
                var fullTestName = state.currentTest.fullName();
                setCurrentTestName(fullTestName);
                debug('Start testcase: ' + fullTestName);

                //TODO: Improve this
                //Initialize particular test if it exposes an init method
                if (state.currentTest.init !== undefined)
                    state.currentTest.init();
                else if (state.currentTest.spec !== undefined && state.currentTest.spec.init !== undefined)
                    state.currentTest.spec.init();
            }

            //TODO: Improve this
            //Run the test, save the result.
            if (state.currentTest.iterate !== undefined)
                DeqpTest.lastResult = state.currentTest.iterate();
            else if (state.currentTest.spec !== undefined && state.currentTest.spec.iterate !== undefined)
                DeqpTest.lastResult = state.currentTest.spec.iterate();
        }
        catch (err) {
            //If the exception was not thrown by a test check, log it, but don't throw it again
            if (!(err instanceof TestFailedException))
                testFailedOptions(err.message, false);
            bufferedLogToConsole(err);
        }

        // If the test is finished (signalled by lastResult == STOP), clean up.
        if (DeqpTest.lastResult == stateMachine.IterateResult.STOP) {
            if (state.currentTest.deinit !== undefined)
                state.currentTest.deinit();
        }

        // Schedule next iteration
        stateMachine.runCallback(runTestCases);
    }
    else {
        // No more tests. All done.
        stateMachine.terminate();
    }
}

