/*
** Copyright (c) 2012 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

declare function nonKhronosFrameworkNotifyDone(): void;
declare function reportTestResultsToHarness(success, msg: string): void;
declare function notifyFinishedToHarness(): void
declare function bufferedLogToConsole(msg): void;
declare function enableJSTestPreVerboseLogging(): void;
declare function description(msg: string): void;
declare function debug(msg: string): void;
declare function escapeHTML(text: string): string;
/*declare function TestFailedException(message) {
   this.message = message;
   this.name = "TestFailedException";
}*/
declare function TestFailedException(message: string): {};
declare function testPassed(msg);
declare function testFailed(msg)
declare function setCurrentTestName(name: string);
declare function getCurrentTestName(): string;
declare function testPassedOptions(msg: string, addSpan: boolean);
declare function testFailedOptions(msg: string, exthrow: boolean);
declare function areArraysEqual<T, U>(_a: Array<T>, _b: Array<U>): boolean;
declare function isMinusZero(n): boolean;
declare function isResultCorrect(_actual, _expected): boolean;
declare function stringify(v): string;
declare function evalAndLog(_a: string);
declare function shouldBe(_a: string, _b: string, quiet:boolean): void;
declare function shouldNotBe(_a: string, _b: string, quiet: boolean): void;
declare function shouldBeTrue(_a: string): void;
declare function shouldBeFalse(_a: string): void;
declare function shouldBeNaN(_a: string): void;
declare function shouldBeNull(_a: string): void;
declare function shouldBeEqualToString(a: string, b: string): boolean;
declare function shouldEvaluateTo(actual: string, expected:string): void
declare function shouldBeNonZero(_a);
declare function shouldBeNonNull(_a);
declare function shouldBeUndefined(_a);
declare function shouldBeDefined(_a);
declare function shouldBeGreaterThanOrEqual(_a, _b): void;
declare function expectTrue(v, msg): void;
declare function shouldThrow(_a, _e): void;
declare function shouldBeType(_a, _type): void
declare function assertMsg(assertion: boolean, msg: string): void;
declare function assertMsgOptions(assertion: boolean, msg: string, verbose: boolean, exthrow: boolean): void;
declare function webglHarnessCollectGarbage():void;
declare function finishTest(): void;

